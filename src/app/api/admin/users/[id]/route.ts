import { Role } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { translate } from "@/lib/i18n"
import { resolveUserLocale } from "@/lib/i18n/config"
import { errorResponse } from "@/lib/api-error"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
}).refine(
  (payload) => payload.isBanned !== undefined || payload.role !== undefined,
  "No changes",
)

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin()
    const locale = resolveUserLocale(actor)
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
      return NextResponse.json({ error: translate(locale, "errors.userNotFound") }, { status: 404 })
    }

    const nextRole = payload.role || target.role

    if (payload.isBanned && nextRole === Role.ADMIN) {
      return NextResponse.json({ error: translate(locale, "errors.cantBanAdmin") }, { status: 400 })
    }

    if (payload.role === Role.USER && target.id === actor.id) {
      return NextResponse.json({ error: translate(locale, "errors.cantRevokeSelf") }, { status: 400 })
    }

    if (payload.role === Role.USER && target.role === Role.ADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } })

      if (adminCount <= 1) {
        return NextResponse.json({ error: translate(locale, "errors.cantRevokeLastAdmin") }, { status: 400 })
      }
    }

    const data = {
      ...(payload.role
        ? {
            role: payload.role,
            ...(payload.role === Role.ADMIN
              ? {
                  isBanned: false,
                  bannedAt: null,
                  banReason: null,
                }
              : {}),
          }
        : {}),
      ...(payload.isBanned !== undefined
        ? {
            isBanned: payload.isBanned,
            bannedAt: payload.isBanned ? new Date() : null,
            banReason: payload.isBanned ? payload.banReason || null : null,
          }
        : {}),
    }

    await prisma.user.update({
      where: { id },
      data,
    })

    if (payload.isBanned) {
      const activeOrders = await prisma.order.findMany({
        where: {
          createdById: id,
          status: { notIn: ["CLOSED", "CANCELLED"] },
          OR: [
            { productId: { not: null } },
            { productTitleSnapshot: { not: null } },
          ],
        },
        select: {
          id: true,
        },
      })

      if (activeOrders.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.order.updateMany({
            where: {
              createdById: id,
              status: { notIn: ["CLOSED", "CANCELLED"] },
              OR: [
                { productId: { not: null } },
                { productTitleSnapshot: { not: null } },
              ],
            },
            data: {
              status: "CANCELLED",
              closedAt: new Date(),
            },
          })
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireAdmin()
    const locale = resolveUserLocale(actor)
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          where: {
            OR: [
              { productId: { not: null } },
              { productTitleSnapshot: { not: null } },
            ],
          },
          include: {
            product: true,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 20,
        },
        _count: {
          select: {
            orders: {
              where: {
                status: { notIn: ["CLOSED", "CANCELLED"] },
                OR: [
                  { productId: { not: null } },
                  { productTitleSnapshot: { not: null } },
                ],
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: translate(locale, "errors.userNotFound") }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        role: user.role,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt?.toISOString() ?? null,
        activeOrderCount: user._count.orders,
        createdAt: user.createdAt.toISOString(),
        orders: user.orders.map((order) => ({
          id: order.id,
          number: order.number,
          status: order.status,
          isPaid: order.isPaid,
          updatedAt: order.updatedAt.toISOString(),
          productTitle: order.product?.title || order.productTitleSnapshot || null,
          productCategory: order.product?.category || order.productCategorySnapshot || null,
          priceRub: order.product?.priceRub ?? order.priceRubSnapshot ?? null,
        })),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
