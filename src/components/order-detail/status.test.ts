import { describe, expect, it } from "vitest"

import {
  isClosedOrder,
  orderNoticeDescriptionKey,
  paymentStateKey,
} from "@/components/order-detail/status"
import type { Order } from "@/components/order-detail/types"

/** Only the fields these rules actually read. */
function order(overrides: Partial<Order>): Order {
  return {
    isPaid: false,
    status: "OPEN",
    deliveredKey: null,
    paymentMethodType: null,
    ...overrides,
  } as Order
}

describe("paymentStateKey", () => {
  it("prefers cancellation over everything else", () => {
    expect(paymentStateKey(order({ status: "CANCELLED", isPaid: true }))).toBe(
      "orderDetail.stateCancelled",
    )
  })

  it("reports a review even when unpaid", () => {
    expect(paymentStateKey(order({ status: "PAYMENT_REVIEW" }))).toBe(
      "orderDetail.stateReview",
    )
  })

  it("separates paid from awaiting", () => {
    expect(paymentStateKey(order({ isPaid: true }))).toBe("orderDetail.statePaid")
    expect(paymentStateKey(order({}))).toBe("orderDetail.stateAwaiting")
  })
})

describe("orderNoticeDescriptionKey", () => {
  it("puts a delivered key ahead of the payment state", () => {
    expect(
      orderNoticeDescriptionKey(order({ deliveredKey: "K-1", isPaid: true })),
    ).toBe("orderDetail.hintKeyReady")
  })

  it("explains a manual review", () => {
    expect(orderNoticeDescriptionKey(order({ status: "PAYMENT_REVIEW" }))).toBe(
      "orderDetail.hintReview",
    )
  })

  it("points a crypto order at its invoice", () => {
    expect(
      orderNoticeDescriptionKey(order({ paymentMethodType: "CRYPTO_PAY" })),
    ).toBe("orderDetail.hintCrypto")
  })

  it("falls back to bank details", () => {
    expect(orderNoticeDescriptionKey(order({}))).toBe("orderDetail.hintRequisites")
  })
})

describe("isClosedOrder", () => {
  it("counts both terminal states", () => {
    expect(isClosedOrder(order({ status: "CLOSED" }))).toBe(true)
    expect(isClosedOrder(order({ status: "CANCELLED" }))).toBe(true)
  })

  it("leaves live orders open", () => {
    expect(isClosedOrder(order({ status: "OPEN" }))).toBe(false)
    expect(isClosedOrder(order({ status: "PAYMENT_REVIEW" }))).toBe(false)
  })
})
