import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  body: z.string().min(1),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const payload = schema.parse(await request.json())

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (user.role !== "ADMIN" && ticket.createdById !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: user.id,
        body: payload.body,
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
