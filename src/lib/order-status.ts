import type { TranslationKey } from "@/lib/i18n"

type OrderLike = {
  status: string
  isPaid: boolean
  /** Present when the payment timer, not a person, closed the order. */
  expiredAt?: string | Date | null
}

export type OrderBadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "info"
  | "success"
  | "warning"
  | "error"

/**
 * Status labels and badge colours live here because the buyer list, the order
 * card and the admin list all render the same states.
 */
export function orderStatusKey(order: OrderLike): TranslationKey {
  if (order.status === "PAYMENT_REVIEW") return "orderStatus.review"
  if (order.status === "CANCELLED" && order.expiredAt) return "orderStatus.expired"
  if (order.status === "CANCELLED") return "orderStatus.cancelled"
  if (order.status === "CLOSED" && !order.isPaid) return "orderStatus.unpaid"
  if (!order.isPaid) return "orderStatus.awaitingPayment"
  if (order.status === "CLOSED") return "orderStatus.done"
  return "orderStatus.paid"
}

/**
 * Tinted rather than solid: every list row used to carry a solid grey or
 * black pill, so "waiting for you" and "all done" looked the same weight.
 * Now amber means the buyer owes something, blue means the shop does,
 * green means money arrived, and red means it will not.
 */
export function orderBadgeVariant(order: OrderLike): OrderBadgeVariant {
  if (order.status === "PAYMENT_REVIEW") return "info"
  // A timed-out order is a fact, not a fault: it gets the quiet variant.
  if (order.status === "CANCELLED" && order.expiredAt) return "outline"
  if (order.status === "CANCELLED") return "error"
  if (order.status === "CLOSED" && !order.isPaid) return "outline"
  if (!order.isPaid) return "warning"
  return "success"
}
