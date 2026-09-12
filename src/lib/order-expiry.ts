import { OrderStatus } from "@prisma/client"

import { notifyOrderExpired } from "@/lib/order-notifications"
import { prisma } from "@/lib/prisma"

/**
 * Closes every unpaid order whose payment window has run out.
 *
 * Runs from a server-side interval and again on the paths that read orders,
 * so a screen never shows a live timer on an order the database already
 * considers dead. Only OPEN orders qualify: one on PAYMENT_REVIEW has a
 * buyer claiming they paid, and taking that away on a clock would be wrong.
 */
export async function expireStaleOrders(now: Date = new Date()) {
  const stale = await prisma.order.findMany({
    where: {
      status: OrderStatus.OPEN,
      isPaid: false,
      expiredAt: null,
      expiresAt: { lte: now },
    },
    select: { id: true },
  })

  if (stale.length === 0) return 0

  const ids = stale.map((order) => order.id)

  // The status filter is repeated so a payment confirmed between the read
  // and the write keeps its order.
  const { count } = await prisma.order.updateMany({
    where: {
      id: { in: ids },
      status: OrderStatus.OPEN,
      isPaid: false,
    },
    data: {
      status: OrderStatus.CANCELLED,
      closedAt: now,
      expiredAt: now,
    },
  })

  // Best effort: a Telegram hiccup must not roll back the close.
  await Promise.allSettled(ids.map((id) => notifyOrderExpired(id)))

  return count
}

const SWEEP_INTERVAL_MS = 60_000

const globalForSweep = globalThis as unknown as {
  orderExpirySweep?: ReturnType<typeof setInterval>
}

/**
 * Background sweep, started once per server process. Guarded on globalThis
 * because the dev server re-evaluates modules on every change and would
 * otherwise stack intervals.
 */
export function startOrderExpirySweep() {
  if (globalForSweep.orderExpirySweep) return

  const tick = () => {
    expireStaleOrders().catch((error) => {
      console.error("Order expiry sweep failed", error)
    })
  }

  globalForSweep.orderExpirySweep = setInterval(tick, SWEEP_INTERVAL_MS)
  // Let the process exit without waiting on the timer.
  globalForSweep.orderExpirySweep.unref?.()
  tick()
}
