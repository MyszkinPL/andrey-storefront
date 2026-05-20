import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  body: z.string().trim().optional().default(""),
  attachments: z
    .array(
      z.object({
        type: z.literal("image"),
        url: z.string().min(1),
      }),
    )
    .max(6)
    .optional()
    .default([]),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const payload = schema.parse(await request.json())
    const body = payload.body.trim()
    const attachments = payload.attachments.filter((attachment) =>
      attachment.url.startsWith("data:image/"),
    )

    if (!body && attachments.length === 0) {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (user.role !== "ADMIN" && ticket.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (
      user.role !== "ADMIN" &&
      ticket.productId &&
      !ticket.isPaid &&
      (
        ticket.paymentMethodType === "CRYPTO_PAY" ||
        (ticket.paymentMethodType === "MANUAL" && !ticket.manualPaymentRequestedAt)
      )
    ) {
      return NextResponse.json(
        { error: "Чат откроется после отметки об оплате или подтверждения." },
        { status: 400 },
      )
    }

    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        body,
        attachments,
      },
    })

    await prisma.ticket.update({
      where: { id },
      data: {
        status: ticket.status === "CLOSED" ? "OPEN" : ticket.status,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Message send failed" },
      { status: 400 },
    )
  }
}
