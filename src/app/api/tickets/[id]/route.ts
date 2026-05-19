import { PaymentMethodType, Role, TicketStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { createCryptoInvoice, getCryptoInvoice } from "@/lib/crypto-pay"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { confirmTicketPaymentFlow } from "@/lib/ticket-payment"

function normalizeAttachments(value: unknown) {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (attachment): attachment is { type: "image"; url: string } =>
        typeof attachment === "object" &&
        attachment !== null &&
        attachment.type === "image" &&
        typeof attachment.url === "string",
    )
    .map((attachment) => ({
      type: "image" as const,
      url: attachment.url,
    }))
}

const schema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  confirmPayment: z.boolean().optional(),
  refreshCryptoInvoice: z.boolean().optional(),
})

async function syncCryptoInvoice(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      number: true,
      isPaid: true,
      productId: true,
      paymentMethodType: true,
      paymentMethodTitle: true,
      cryptoInvoiceId: true,
      product: {
        select: {
          title: true,
          priceRub: true,
        },
      },
      paymentMethod: {
        select: {
          cryptoAcceptedAssets: true,
        },
      },
    },
  })

  if (!ticket) return

  if (
    !ticket.isPaid &&
    ticket.paymentMethodType === PaymentMethodType.CRYPTO_PAY &&
    !ticket.cryptoInvoiceId &&
    ticket.product
  ) {
    const createdInvoice = await createCryptoInvoice({
      amountRub: ticket.product.priceRub,
      description: `${ticket.product.title} · order #${ticket.number}`,
      acceptedAssets: ticket.paymentMethod?.cryptoAcceptedAssets,
    }).catch(() => null)

    if (createdInvoice) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          cryptoInvoiceId: createdInvoice.invoiceId,
          cryptoInvoiceUrl: createdInvoice.url,
          cryptoInvoiceStatus: createdInvoice.status,
          cryptoInvoiceAsset: createdInvoice.asset,
          cryptoInvoiceAmount: createdInvoice.amount,
          cryptoInvoiceExpiresAt: createdInvoice.expiresAt,
        },
      })
    }
  }

  const refreshedTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      isPaid: true,
      cryptoInvoiceId: true,
    },
  })

  if (!refreshedTicket?.cryptoInvoiceId) return

  const invoice = await getCryptoInvoice(refreshedTicket.cryptoInvoiceId)
  if (!invoice) return

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      cryptoInvoiceUrl: invoice.url,
      cryptoInvoiceStatus: invoice.status,
      cryptoInvoiceAsset: invoice.asset,
      cryptoInvoiceAmount: invoice.amount,
      cryptoInvoiceExpiresAt: invoice.expiresAt,
    },
  })

  if (invoice.status === "paid" && !refreshedTicket.isPaid) {
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

    if (admin) {
      await prisma.$transaction((tx) =>
        confirmTicketPaymentFlow(tx, ticketId, admin.id),
      )
    }
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  const { id } = await params

  await syncCryptoInvoice(id).catch(() => {})

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      product: true,
      deliveredKey: true,
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "ADMIN" && ticket.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      number: ticket.number,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      isPaid: ticket.isPaid,
      productTitle: ticket.product?.title || null,
      deliveredKey: ticket.deliveredKey?.value || null,
      isAdmin: user.role === "ADMIN",
      paymentMethodTitle: ticket.paymentMethodTitle || null,
      paymentMethodType: ticket.paymentMethodType || null,
      paymentMethodDetails: ticket.paymentMethodDetails || null,
      paymentMethodIconDataUrl: ticket.paymentMethodIconDataUrl || null,
      cryptoInvoiceUrl: ticket.cryptoInvoiceUrl || null,
      cryptoInvoiceStatus: ticket.cryptoInvoiceStatus || null,
      cryptoInvoiceAsset: ticket.cryptoInvoiceAsset || null,
      cryptoInvoiceAmount: ticket.cryptoInvoiceAmount || null,
      cryptoInvoiceExpiresAt: ticket.cryptoInvoiceExpiresAt?.toISOString() || null,
      messages: ticket.messages.map((message) => ({
        id: message.id,
        body: message.body,
        attachments: normalizeAttachments(message.attachments),
        createdAt: message.createdAt,
        isMine: message.senderId === user.id,
        senderName: message.sender.firstName,
        senderRole: message.sender.role,
      })),
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const payload = schema.parse(await request.json())

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
      },
    })

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (payload.refreshCryptoInvoice) {
      if (user.role !== "ADMIN" && ticket.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      await syncCryptoInvoice(id)
      return NextResponse.json({ ok: true })
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      if (payload.confirmPayment) {
        await confirmTicketPaymentFlow(tx, id, user.id)
      }

      if (payload.status) {
        await tx.ticket.update({
          where: { id },
          data: {
            status: payload.status,
            closedAt: payload.status === "CLOSED" ? new Date() : null,
            assignedToId: payload.status === "IN_PROGRESS" ? user.id : undefined,
          },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ticket update failed" },
      { status: 400 },
    )
  }
}
