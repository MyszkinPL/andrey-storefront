import type { Order } from "@/components/order-detail/types"
import type { TranslateFn, TranslationKey } from "@/lib/i18n"

/**
 * What the order card says about itself. Kept apart from the screen because
 * it is the part with actual rules in it — everything else is layout.
 */
export function paymentStateKey(order: Order): TranslationKey {
  if (order.status === "CANCELLED") return "orderDetail.stateCancelled"
  if (order.status === "PAYMENT_REVIEW") return "orderDetail.stateReview"
  if (order.isPaid) return "orderDetail.statePaid"
  return "orderDetail.stateAwaiting"
}

export function orderNoticeTitle(
  order: Order,
  amountLabel: string | null,
  t: TranslateFn,
) {
  if (order.deliveredKey) return t("orderDetail.noticeKeyReady")
  if (order.status === "PAYMENT_REVIEW") return t("orderDetail.noticeReview")
  if (order.status === "CANCELLED") return t("orderDetail.noticeCancelled")
  if (order.isPaid) return t("orderDetail.noticePaid")
  // The invoice amount is the most useful headline when one exists.
  if (order.paymentMethodType === "CRYPTO_PAY") return amountLabel || "Invoice"
  return t("orderDetail.noticeRequisites")
}

export function orderNoticeDescriptionKey(order: Order): TranslationKey {
  if (order.deliveredKey) return "orderDetail.hintKeyReady"
  if (order.status === "PAYMENT_REVIEW") return "orderDetail.hintReview"
  if (order.status === "CANCELLED") return "orderDetail.hintCancelled"
  if (order.isPaid) return "orderDetail.hintPaid"
  if (order.paymentMethodType === "CRYPTO_PAY") return "orderDetail.hintCrypto"
  return "orderDetail.hintRequisites"
}

export function isClosedOrder(order: Order) {
  return order.status === "CLOSED" || order.status === "CANCELLED"
}

/** First two letters, used as an avatar fallback for payment methods. */
export function getAvatarFallback(title: string) {
  return title.slice(0, 2).toUpperCase()
}
