import { NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  q: z.string().optional(),
  filter: z.enum(["all", "buyers", "admins", "banned"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
})

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      q: searchParams.get("q") || undefined,
      filter: searchParams.get("filter") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    })

    const q = query.q?.trim()
    const searchFilters: Prisma.UserWhereInput[] = q
      ? [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          ...( /^[0-9]+$/.test(q) ? [{ telegramId: BigInt(q) }] : []),
        ]
      : []

    const where: Prisma.UserWhereInput = {
      ...(query.filter === "buyers" ? { role: "USER" as const } : {}),
      ...(query.filter === "admins" ? { role: "ADMIN" as const } : {}),
      ...(query.filter === "banned" ? { isBanned: true } : {}),
      ...(searchFilters.length > 0 ? { OR: searchFilters } : {}),
    }

    const [users, total, summary] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ role: "desc" }, { isBanned: "desc" }, { createdAt: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          orders: {
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
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ["role", "isBanned"],
        _count: { _all: true },
      }),
    ])

    const buyersCount = summary
      .filter((item) => item.role === "USER")
      .reduce((acc, item) => acc + item._count._all, 0)
    const adminsCount = summary
      .filter((item) => item.role === "ADMIN")
      .reduce((acc, item) => acc + item._count._all, 0)
    const bannedCount = summary
      .filter((item) => item.isBanned)
      .reduce((acc, item) => acc + item._count._all, 0)

    return NextResponse.json({
      pageInfo: {
        page: query.page,
        limit: query.limit,
        total,
        hasMore: query.page * query.limit < total,
      },
      summary: {
        total,
        buyers: buyersCount,
        admins: adminsCount,
        banned: bannedCount,
      },
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
        activeOrderCount: user.orders.filter(
          (order) => !["CLOSED", "CANCELLED"].includes(order.status),
        ).length,
        createdAt: user.createdAt.toISOString(),
        orders: user.orders.map((order) => ({
          id: order.id,
          number: order.number,
          status: order.status,
          isPaid: order.isPaid,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          productTitle: order.product?.title || null,
          productCategory: order.product?.category || null,
          priceRub: order.product?.priceRub || null,
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
