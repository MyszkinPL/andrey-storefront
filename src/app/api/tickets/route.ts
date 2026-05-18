import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  subject: z.string().min(2),
  message: z.string().min(2),
  productId: z.string().optional(),
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
      lastMessage: ticket.messages[0]?.body || null,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireUser()
    const payload = schema.parse(await request.json())

    const ticket = await prisma.ticket.create({
      data: {
        subject: payload.subject,
        productId: payload.productId,
        createdById: user.id,
        messages: {
          create: {
            body: payload.message,
            senderId: user.id,
          },
        },
      },
    })

    return NextResponse.json({ ticketId: ticket.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ticket create failed" },
      { status: 400 },
    )
  }
}
