import { OrderStatus, Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"

export type TopProduct = {
  id: string
  title: string
  /** Card opens, mini app and bot together. */
  views: number
  /** How many different people opened it. */
  viewers: number
  orders: number
}

export type ShopStats = {
  users: {
    total: number
    botStarted: number
    activeLast7Days: number
    newLast7Days: number
    banned: number
    admins: number
  }
  orders: {
    total: number
    paid: number
    openLast7Days: number
    revenue: number
  }
  products: {
    total: number
    active: number
    totalViews: number
  }
  topViewed: TopProduct[]
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}

/**
 * One pass over the counters behind the admin's overview. Everything here is
 * an aggregate — no row ever leaves the database — so it stays cheap as the
 * shop grows.
 */
export async function getShopStats(topLimit = 5): Promise<ShopStats> {
  const since = daysAgo(7)

  const [
    totalUsers,
    botStarted,
    activeLast7Days,
    newLast7Days,
    banned,
    admins,
    totalOrders,
    paidOrders,
    ordersLast7Days,
    revenue,
    totalProducts,
    activeProducts,
    viewSum,
    topProducts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { botStartedAt: { not: null } } }),
    prisma.user.count({ where: { botLastSeenAt: { gte: since } } }),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.order.count(),
    prisma.order.count({ where: { isPaid: true } }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.order.aggregate({
      where: { isPaid: true },
      _sum: { priceRubSnapshot: true },
    }),
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.aggregate({ _sum: { viewCount: true } }),
    prisma.product.findMany({
      orderBy: { viewCount: "desc" },
      take: topLimit,
      select: {
        id: true,
        title: true,
        viewCount: true,
        _count: {
          select: {
            views: true,
            orders: { where: { status: { not: OrderStatus.CANCELLED } } },
          },
        },
      },
    }),
  ])

  return {
    users: {
      total: totalUsers,
      botStarted,
      activeLast7Days,
      newLast7Days,
      banned,
      admins,
    },
    orders: {
      total: totalOrders,
      paid: paidOrders,
      openLast7Days: ordersLast7Days,
      revenue: revenue._sum.priceRubSnapshot ?? 0,
    },
    products: {
      total: totalProducts,
      active: activeProducts,
      totalViews: viewSum._sum.viewCount ?? 0,
    },
    topViewed: topProducts
      .filter((product) => product.viewCount > 0)
      .map((product) => ({
        id: product.id,
        title: product.title,
        views: product.viewCount,
        viewers: product._count.views,
        orders: product._count.orders,
      })),
  }
}

/**
 * Records that someone opened a product card. The per-user row makes "opened
 * 40 times" distinguishable from "40 people looked", which a single counter
 * cannot do. Failures are swallowed by the caller: a view is never worth
 * failing the page it was counted on.
 */
export async function recordProductView(productId: string, userId: string) {
  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    }),
    prisma.productView.upsert({
      where: { productId_userId: { productId, userId } },
      update: { count: { increment: 1 }, lastAt: new Date() },
      create: { productId, userId },
    }),
  ])
}
