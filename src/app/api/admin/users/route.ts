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
            status: { notIn: ["CLOSED", "CANCELLED"] },
          },
          select: {
            id: true,
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
        activeOrderCount: user.tickets.length,
        createdAt: user.createdAt.toISOString(),
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
