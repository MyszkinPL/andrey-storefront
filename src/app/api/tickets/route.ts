import { PaymentMethodType } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { createCryptoInvoice } from "@/lib/crypto-pay"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  subject: z.string().min(2),
  message: z.string().min(2),
  productId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodType: z.nativeEnum(PaymentMethodType).optional(),
})

export async function GET() {
  const user = await requireUser()
  const where = user.role === "ADMIN" ? {} : { createdById: user.id }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      product: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      number: ticket.number,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      isPaid: ticket.isPaid,
      productTitle: ticket.product?.title || null,
      productCategory: ticket.product?.category || null,
      paymentMethodTitle: ticket.paymentMethodTitle || null,
      paymentMethodType: ticket.paymentMethodType || null,
      manualPaymentRequestedAt: ticket.manualPaymentRequestedAt?.toISOString() || null,
      lastMessage: ticket.messages[0]?.body || null,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const payload = schema.parse(await request.json())

    if (payload.productId && user.role !== "ADMIN") {
      const activeOrdersCount = await prisma.ticket.count({
        where: {
          createdById: user.id,
          productId: { not: null },
          status: { not: "CLOSED" },
        },
      })

      if (activeOrdersCount >= 2) {
        return NextResponse.json(
          { error: "Лимит: не больше 2 активных заказов на аккаунт." },
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
      ? "Автоматическая оплата через invoice"
      : paymentMethod?.details
    const selectedPaymentIcon = isCryptoPay
      ? "/crypto-bot-logo.svg"
      : paymentMethod?.iconDataUrl

    const ticket = await prisma.ticket.create({
      data: {
        subject: payload.subject,
        productId: payload.productId,
        paymentMethodId: paymentMethod?.id,
        paymentMethodType: selectedPaymentType,
        paymentMethodTitle: selectedPaymentTitle,
        paymentMethodDetails: selectedPaymentDetails,
        paymentMethodIconDataUrl: selectedPaymentIcon,
        createdById: user.id,
        messages: {
          create: {
            body: payload.message,
            senderId: user.id,
          },
        },
      },
    })

    if (selectedPaymentType === PaymentMethodType.CRYPTO_PAY && product) {
      try {
        const invoice = await createCryptoInvoice({
          amountRub: product.priceRub,
          description: `${product.title} · ticket #${ticket.number}`,
          acceptedAssets: settings?.cryptoPayDefaultAssets,
        })

        if (invoice) {
          await prisma.ticket.update({
            where: { id: ticket.id },
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

    return NextResponse.json({ ticketId: ticket.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ticket create failed" },
      { status: 400 },
    )
  }
}
