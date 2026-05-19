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
      updatedAt: ticket.updatedAt,
      isPaid: ticket.isPaid,
      productTitle: ticket.product?.title || null,
      paymentMethodTitle: ticket.paymentMethodTitle || null,
      lastMessage: ticket.messages[0]?.body || null,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const payload = schema.parse(await request.json())

    const [product, paymentMethod] = await Promise.all([
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
    ])

    if (payload.productId && !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (payload.paymentMethodId && !paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    const ticket = await prisma.ticket.create({
      data: {
        subject: payload.subject,
        productId: payload.productId,
        paymentMethodId: paymentMethod?.id,
        paymentMethodType: paymentMethod?.type,
        paymentMethodTitle: paymentMethod?.title,
        paymentMethodDetails: paymentMethod?.details,
        paymentMethodIconDataUrl: paymentMethod?.iconDataUrl,
        createdById: user.id,
        messages: {
          create: {
            body: payload.message,
            senderId: user.id,
          },
        },
      },
    })

    if (paymentMethod?.type === PaymentMethodType.CRYPTO_PAY && product) {
      try {
        const invoice = await createCryptoInvoice({
          amountRub: product.priceRub,
          description: `${product.title} · ticket #${ticket.number}`,
          acceptedAssets: paymentMethod.cryptoAcceptedAssets,
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
