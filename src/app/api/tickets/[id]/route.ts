import { DeliveryType, TicketStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  confirmPayment: z.boolean().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  const { id } = await params

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
      messages: ticket.messages.map((message) => ({
        id: message.id,
        body: message.body,
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
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const payload = schema.parse(await request.json())

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { product: true, deliveredKey: true },
    })

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

    await prisma.$transaction(async (tx) => {
      if (payload.confirmPayment && !ticket.isPaid) {
        await tx.ticket.update({
          where: { id },
          data: {
            isPaid: true,
            paymentConfirmedAt: new Date(),
            status: ticket.status === "OPEN" ? TicketStatus.IN_PROGRESS : ticket.status,
            assignedToId: user.id,
          },
        })

        await tx.ticketMessage.create({
          data: {
            ticketId: id,
            senderId: user.id,
            body: "Оплата подтверждена. Начинаю выдачу.",
          },
        })

        if (
          ticket.product?.deliveryType === DeliveryType.AUTO_KEY &&
          !ticket.deliveredKey
        ) {
          const freeKey = await tx.productKey.findFirst({
            where: {
              productId: ticket.productId || undefined,
              issuedAt: null,
            },
            orderBy: { createdAt: "asc" },
          })

          if (freeKey) {
            await tx.productKey.update({
              where: { id: freeKey.id },
              data: {
                issuedAt: new Date(),
                issuedToTicketId: id,
              },
            })

            await tx.ticketMessage.create({
              data: {
                ticketId: id,
                senderId: user.id,
                body: `Автовыдача ключа:\n${freeKey.value}`,
              },
            })
          } else {
            await tx.ticketMessage.create({
              data: {
                ticketId: id,
                senderId: user.id,
                body: "Оплата подтверждена, но свободных ключей сейчас нет. Пополню остаток вручную.",
              },
            })
          }
        }
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
