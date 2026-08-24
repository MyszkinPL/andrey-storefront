import { OrderStatus } from "@prisma/client"
import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { errorResponse } from "@/lib/api-error"
import type { ClearedHistoryResponse } from "@/lib/contracts"
import { prisma } from "@/lib/prisma"

/**
 * Clears the caller's own order history in one go. Nothing is deleted: the
 * shop still needs every record, so the orders are only marked hidden for the
 * buyer who asked. Active orders are left alone — an order you still have to
 * pay for should not be able to vanish.
 */
export async function DELETE() {
  try {
    const user = await requireUser()

    const { count } = await prisma.order.updateMany({
      where: {
        createdById: user.id,
        hiddenByBuyerAt: null,
        status: { in: [OrderStatus.CLOSED, OrderStatus.CANCELLED] },
      },
      data: { hiddenByBuyerAt: new Date() },
    })

    return NextResponse.json({ cleared: count } satisfies ClearedHistoryResponse)
  } catch (error) {
    return errorResponse(error)
  }
}
