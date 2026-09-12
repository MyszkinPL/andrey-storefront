/**
 * The payment window, shared by the server that enforces it and the screens
 * that count it down. Pure functions only: no Prisma, no React.
 */

/** How long a buyer has to pay before the order closes on its own. */
export const ORDER_PAYMENT_WINDOW_MS = 30 * 60_000

export function paymentDeadline(from: Date = new Date()) {
  return new Date(from.getTime() + ORDER_PAYMENT_WINDOW_MS)
}

type TimedOrder = {
  status: string
  isPaid: boolean
  expiresAt?: string | Date | null
  expiredAt?: string | Date | null
}

/** Only an unpaid order still waiting for the buyer is on the clock. */
export function isOrderOnTimer(order: TimedOrder) {
  return order.status === "OPEN" && !order.isPaid && Boolean(order.expiresAt)
}

/** True once the deadline passed. Ignores orders that are not on the clock. */
export function isOrderPastDeadline(order: TimedOrder, now: Date = new Date()) {
  if (!isOrderOnTimer(order) || !order.expiresAt) return false
  return new Date(order.expiresAt).getTime() <= now.getTime()
}

/** The timer, not a person, closed this order. */
export function isOrderExpired(order: TimedOrder) {
  return order.status === "CANCELLED" && Boolean(order.expiredAt)
}

export function remainingMs(expiresAt: string | Date, now: Date = new Date()) {
  return Math.max(0, new Date(expiresAt).getTime() - now.getTime())
}

/** "29:59" style countdown. Rounds up so the display never reads 00:00 early. */
export function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

/** Whole minutes left, rounded up, for compact list rows and bot text. */
export function remainingMinutes(ms: number) {
  return Math.max(0, Math.ceil(ms / 60_000))
}
