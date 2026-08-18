import { PaymentMethodType, Role } from "@prisma/client"

import { ApiFailure, failure } from "@/lib/api-error"
import { createCryptoInvoice } from "@/lib/crypto-pay"
import { translate } from "@/lib/i18n"
import { resolveUserLocale, type Locale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"

export const ACTIVE_ORDER_LIMIT = 2

export type CreateOrderInput = {
  user: {
    id: string
    role: Role
    language?: string | null
    languageCode?: string | null
  }
  subject: string
  productId?: string
  paymentMethodId?: string
  paymentMethodType?: PaymentMethodType
}

/** Kept as a named alias so existing call sites read the same. */
export { ApiFailure as OrderCreateError }

/**
 * Shared by the API route and the bot so an order placed from a chat goes
 * through exactly the same rules — active-order limit, snapshots and invoice
 * creation — as one placed in the mini app.
 */
export async function createOrder({
  user,
  subject,
  productId,
  paymentMethodId,
  paymentMethodType,
}: CreateOrderInput) {
  const locale: Locale = resolveUserLocale(user)

  if (productId && user.role !== Role.ADMIN) {
    const activeOrders = await prisma.order.count({
      where: {
        createdById: user.id,
        productId: { not: null },
        status: { notIn: ["CLOSED", "CANCELLED"] },
      },
    })

    if (activeOrders >= ACTIVE_ORDER_LIMIT) {
      throw failure("ORDER_LIMIT", locale, "errors.orderLimit")
    }
  }

  const isCryptoPay = paymentMethodType === PaymentMethodType.CRYPTO_PAY

  const [product, paymentMethod, settings] = await Promise.all([
    productId ? prisma.product.findUnique({ where: { id: productId } }) : null,
    paymentMethodId
      ? prisma.paymentMethod.findFirst({
          where: { id: paymentMethodId, isActive: true },
        })
      : null,
    isCryptoPay ? prisma.shopSettings.findUnique({ where: { id: 1 } }) : null,
  ])

  if (productId && !product) {
    throw new ApiFailure("NOT_FOUND", "Product not found")
  }
  if (paymentMethodId && !paymentMethod) {
    throw new ApiFailure("NOT_FOUND", "Payment method not found")
  }
  if (isCryptoPay && (!settings?.cryptoPayEnabled || !settings.cryptoPayToken)) {
    throw new ApiFailure("PAYMENT_METHOD", "Crypto Pay disabled")
  }

  const order = await prisma.order.create({
    data: {
      subject,
      productId,
      productTitleSnapshot: product?.title,
      productCategorySnapshot: product?.category,
      priceRubSnapshot: product?.priceRub,
      paymentMethodId: paymentMethod?.id,
      paymentMethodType: isCryptoPay ? PaymentMethodType.CRYPTO_PAY : paymentMethod?.type,
      paymentMethodTitle: isCryptoPay ? "Crypto Bot" : paymentMethod?.title,
      paymentMethodDetails: isCryptoPay
        ? translate(locale, "product.cryptoAuto")
        : paymentMethod?.details,
      paymentMethodIconDataUrl: isCryptoPay
        ? "/crypto-bot-logo.svg"
        : paymentMethod?.iconDataUrl,
      createdById: user.id,
    },
  })

  if (isCryptoPay && product) {
    // A failed invoice must not lose the order: the buyer can retry from the
    // order screen, so the failure is swallowed deliberately.
    try {
      const invoice = await createCryptoInvoice({
        amountRub: product.priceRub,
        description: `${product.title} · order #${order.number}`,
        acceptedAssets: settings?.cryptoPayDefaultAssets,
      })

      if (invoice) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            cryptoInvoiceId: invoice.invoiceId,
            cryptoInvoiceUrl: invoice.url,
            cryptoInvoiceStatus: invoice.status,
            cryptoInvoiceAsset: invoice.asset,
            cryptoInvoiceAmount: invoice.amount,
            cryptoInvoiceExpiresAt: invoice.expiresAt,
          },
        })
      }
    } catch {}
  }

  return order
}
