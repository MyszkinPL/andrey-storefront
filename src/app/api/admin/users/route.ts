import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    await requireAdmin()

    const users = await prisma.user.findMany({
      orderBy: [{ role: "desc" }, { isBanned: "desc" }, { createdAt: "desc" }],
      include: {
        tickets: {
          where: {
            productId: { not: null },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            number: true,
            status: true,
            isPaid: true,
            createdAt: true,
            updatedAt: true,
            product: {
              select: {
                title: true,
                category: true,
                priceRub: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        role: user.role,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt?.toISOString() || null,
        banReason: user.banReason,
        activeOrderCount: user.tickets.filter(
          (ticket) => !["CLOSED", "CANCELLED"].includes(ticket.status),
        ).length,
        createdAt: user.createdAt.toISOString(),
        orders: user.tickets.map((ticket) => ({
          id: ticket.id,
          number: ticket.number,
          status: ticket.status,
          isPaid: ticket.isPaid,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
          productTitle: ticket.product?.title || null,
          productCategory: ticket.product?.category || null,
          priceRub: ticket.product?.priceRub || null,
        })),
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Forbidden"
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 403 },
    )
  }
}
