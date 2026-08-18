import { PaymentMethodType } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireInteractiveUser, requireUser } from "@/lib/auth"
import { createCryptoInvoice } from "@/lib/crypto-pay"
import { translate } from "@/lib/i18n"
import { resolveUserLocale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  subject: z.string().min(2),
  productId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodType: z.nativeEnum(PaymentMethodType).optional(),
})

export async function GET(request: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get("scope")
  const where =
    user.role === "ADMIN" && scope === "all"
      ? {}
      : { createdById: user.id }

  const orders = await prisma.order.findMany({
    where,
    include: {
      product: true,
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    orders: orders.map((order) => ({
      id: order.id,
      number: order.number,
      subject: order.subject,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isPaid: order.isPaid,
      productTitle: order.product?.title || order.productTitleSnapshot || null,
      productCategory: order.product?.category || order.productCategorySnapshot || null,
      paymentMethodTitle: order.paymentMethodTitle || null,
      paymentMethodType: order.paymentMethodType || null,
      manualPaymentRequestedAt: order.manualPaymentRequestedAt?.toISOString() || null,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireInteractiveUser()
    const payload = schema.parse(await request.json())

    if (payload.productId && user.role !== "ADMIN") {
      const activeOrdersCount = await prisma.order.count({
        where: {
          createdById: user.id,
          productId: { not: null },
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
      })

      if (activeOrdersCount >= 2) {
        return NextResponse.json(
          { error: translate(resolveUserLocale(user), "errors.orderLimit") },
          { status: 400 },
        )
      }
    }

    const [product, paymentMethod, settings] = await Promise.all([
      payload.productId
        ? prisma.product.findUnique({
            where: { id: payload.productId },
          })
        : Promise.resolve(null),
      payload.paymentMethodId
        ? prisma.paymentMethod.findFirst({
            where: { id: payload.paymentMethodId, isActive: true },
          })
        : Promise.resolve(null),
      payload.paymentMethodType === PaymentMethodType.CRYPTO_PAY
        ? prisma.shopSettings.findUnique({ where: { id: 1 } })
        : Promise.resolve(null),
    ])

    if (payload.productId && !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (payload.paymentMethodId && !paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    if (
      payload.paymentMethodType === PaymentMethodType.CRYPTO_PAY &&
      (!settings?.cryptoPayEnabled || !settings.cryptoPayToken)
    ) {
      return NextResponse.json({ error: "Crypto Pay disabled" }, { status: 400 })
    }

    const isCryptoPay = payload.paymentMethodType === PaymentMethodType.CRYPTO_PAY
    const selectedPaymentType = isCryptoPay
      ? PaymentMethodType.CRYPTO_PAY
      : paymentMethod?.type
    const selectedPaymentTitle = isCryptoPay ? "Crypto Bot" : paymentMethod?.title
    const selectedPaymentDetails = isCryptoPay
      ? translate(resolveUserLocale(user), "product.cryptoAuto")
      : paymentMethod?.details
    const selectedPaymentIcon = isCryptoPay
      ? "/crypto-bot-logo.svg"
      : paymentMethod?.iconDataUrl

    const order = await prisma.order.create({
      data: {
        subject: payload.subject,
        productId: payload.productId,
        productTitleSnapshot: product?.title,
        productCategorySnapshot: product?.category,
        priceRubSnapshot: product?.priceRub,
        paymentMethodId: paymentMethod?.id,
        paymentMethodType: selectedPaymentType,
        paymentMethodTitle: selectedPaymentTitle,
        paymentMethodDetails: selectedPaymentDetails,
        paymentMethodIconDataUrl: selectedPaymentIcon,
        createdById: user.id,
      },
    })

    if (selectedPaymentType === PaymentMethodType.CRYPTO_PAY && product) {
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

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order create failed" },
      { status: 400 },
    )
  }
}
