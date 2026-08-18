import { PaymentMethodType } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireInteractiveUser, requireUser } from "@/lib/auth"
import { createOrder, OrderCreateError } from "@/lib/order-create"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  subject: z.string().min(2),
  productId: z.string().optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodType: z.nativeEnum(PaymentMethodType).optional(),
})

/** Caps an unbounded list so one busy shop cannot return its whole history. */
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function readLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get("limit"))
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_LIMIT
  return Math.min(Math.trunc(raw), MAX_LIMIT)
}

export async function GET(request: Request) {
  const user = await requireUser()
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get("scope")
  const limit = readLimit(searchParams)
  const where =
    user.role === "ADMIN" && scope === "all"
      ? {}
      : { createdById: user.id }

  // One extra row tells the client whether more exist without a count query.
  const rows = await prisma.order.findMany({
    where,
    include: {
      product: true,
    },
    orderBy: { updatedAt: "desc" },
    take: limit + 1,
  })

  const orders = rows.slice(0, limit)

  return NextResponse.json({
    hasMore: rows.length > limit,
    orders: orders.map((order) => ({
      id: order.id,
      number: order.number,
      subject: order.subject,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      isPaid: order.isPaid,
      productTitle: order.product?.title || order.productTitleSnapshot || null,
      productCategory: order.product?.category || order.productCategorySnapshot || null,
      paymentMethodTitle: order.paymentMethodTitle || null,
      paymentMethodType: order.paymentMethodType || null,
      manualPaymentRequestedAt: order.manualPaymentRequestedAt?.toISOString() || null,
    })),
  })
}

export async function POST(request: Request) {
  try {
    const user = await requireInteractiveUser()
    const payload = schema.parse(await request.json())

    const order = await createOrder({
      paymentMethodId: payload.paymentMethodId,
      paymentMethodType: payload.paymentMethodType,
      productId: payload.productId,
      subject: payload.subject,
      user,
    })

    return NextResponse.json({ orderId: order.id })
  } catch (error) {
    if (error instanceof OrderCreateError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Order create failed" },
      { status: 400 },
    )
  }
}
