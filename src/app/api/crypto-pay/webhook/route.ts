import { Role } from "@prisma/client"
import { NextResponse } from "next/server"

import {
  mapCryptoInvoicePayload,
  type CryptoPayWebhookUpdate,
  verifyCryptoPaySignature,
} from "@/lib/crypto-pay"
import { notifyOrderPaid } from "@/lib/order-notifications"
import { prisma } from "@/lib/prisma"
import { confirmTicketPaymentFlow } from "@/lib/ticket-payment"

export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })

    if (!settings?.cryptoPayEnabled || !settings.cryptoPayToken) {
      return NextResponse.json({ error: "Crypto Pay disabled" }, { status: 400 })
    }

    const isValid = verifyCryptoPaySignature(
      settings.cryptoPayToken,
      rawBody,
      request.headers.get("crypto-pay-api-signature"),
    )

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const update = JSON.parse(rawBody) as CryptoPayWebhookUpdate
    if (update.update_type !== "invoice_paid") {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const invoice = mapCryptoInvoicePayload(update.payload)
    const ticket = await prisma.ticket.findFirst({
      where: { cryptoInvoiceId: invoice.invoiceId },
      select: { id: true, isPaid: true },
    })

    if (!ticket) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        cryptoInvoiceUrl: invoice.url,
        cryptoInvoiceStatus: invoice.status || "paid",
        cryptoInvoiceAsset: invoice.asset,
        cryptoInvoiceAmount: invoice.amount,
        cryptoInvoiceExpiresAt: invoice.expiresAt,
      },
    })

    if (!ticket.isPaid) {
      const admin = await prisma.user.findFirst({
        where: { role: Role.ADMIN },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      })

      if (admin) {
        await prisma.$transaction((tx) =>
          confirmTicketPaymentFlow(tx, ticket.id, admin.id),
        )
        await notifyOrderPaid(ticket.id)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook failed" },
      { status: 400 },
    )
  }
}
