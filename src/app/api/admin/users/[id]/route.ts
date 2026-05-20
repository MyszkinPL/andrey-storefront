import { Role } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  isBanned: z.boolean(),
  banReason: z.string().trim().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const payload = schema.parse(await request.json())

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    })

    if (!target) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    if (target.role === Role.ADMIN) {
      return NextResponse.json({ error: "Нельзя банить админа" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id },
      data: {
        isBanned: payload.isBanned,
        bannedAt: payload.isBanned ? new Date() : null,
        banReason: payload.isBanned ? payload.banReason || null : null,
      },
    })

    if (payload.isBanned) {
      const activeTickets = await prisma.ticket.findMany({
        where: {
          createdById: id,
          status: { notIn: ["CLOSED", "CANCELLED"] },
        },
        select: {
          id: true,
        },
      })

      if (activeTickets.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.ticket.updateMany({
            where: {
              createdById: id,
              status: { notIn: ["CLOSED", "CANCELLED"] },
            },
            data: {
              status: "CANCELLED",
              closedAt: new Date(),
            },
          })

          await tx.ticketMessage.createMany({
            data: activeTickets.map((ticket) => ({
              ticketId: ticket.id,
              senderId: admin.id,
              body: "Заказ отменён: аккаунт пользователя заблокирован.",
            })),
          })
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "User moderation failed" },
      { status: 400 },
    )
  }
}
