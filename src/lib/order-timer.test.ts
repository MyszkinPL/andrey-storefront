import { describe, expect, it } from "vitest"

import {
  formatCountdown,
  isOrderExpired,
  isOrderOnTimer,
  isOrderPastDeadline,
  ORDER_PAYMENT_WINDOW_MS,
  paymentDeadline,
  remainingMinutes,
  remainingMs,
} from "@/lib/order-timer"

const NOW = new Date("2026-09-12T12:00:00.000Z")

describe("paymentDeadline", () => {
  it("gives the buyer thirty minutes", () => {
    expect(paymentDeadline(NOW).getTime() - NOW.getTime()).toBe(ORDER_PAYMENT_WINDOW_MS)
    expect(ORDER_PAYMENT_WINDOW_MS).toBe(30 * 60_000)
  })
})

describe("isOrderOnTimer", () => {
  it("counts only unpaid open orders with a deadline", () => {
    expect(isOrderOnTimer({ status: "OPEN", isPaid: false, expiresAt: NOW })).toBe(true)
    expect(isOrderOnTimer({ status: "OPEN", isPaid: true, expiresAt: NOW })).toBe(false)
    expect(isOrderOnTimer({ status: "PAYMENT_REVIEW", isPaid: false, expiresAt: NOW })).toBe(false)
    expect(isOrderOnTimer({ status: "OPEN", isPaid: false, expiresAt: null })).toBe(false)
  })
})

describe("isOrderPastDeadline", () => {
  it("fires exactly at the deadline, not before", () => {
    const order = { status: "OPEN", isPaid: false, expiresAt: NOW }
    expect(isOrderPastDeadline(order, new Date(NOW.getTime() - 1))).toBe(false)
    expect(isOrderPastDeadline(order, NOW)).toBe(true)
  })

  it("leaves a review or paid order alone however old", () => {
    const stale = new Date(NOW.getTime() - ORDER_PAYMENT_WINDOW_MS * 10)
    expect(isOrderPastDeadline({ status: "PAYMENT_REVIEW", isPaid: false, expiresAt: stale }, NOW)).toBe(false)
    expect(isOrderPastDeadline({ status: "OPEN", isPaid: true, expiresAt: stale }, NOW)).toBe(false)
  })
})

describe("isOrderExpired", () => {
  it("tells a timed-out order from a cancelled one", () => {
    expect(isOrderExpired({ status: "CANCELLED", isPaid: false, expiredAt: NOW })).toBe(true)
    expect(isOrderExpired({ status: "CANCELLED", isPaid: false, expiredAt: null })).toBe(false)
    expect(isOrderExpired({ status: "OPEN", isPaid: false, expiredAt: NOW })).toBe(false)
  })
})

describe("countdown formatting", () => {
  it("never goes negative", () => {
    expect(remainingMs(NOW, new Date(NOW.getTime() + 5000))).toBe(0)
    expect(formatCountdown(-100)).toBe("00:00")
  })

  it("rounds seconds up so the clock does not hit zero early", () => {
    expect(formatCountdown(29 * 60_000 + 59_400)).toBe("30:00")
    expect(formatCountdown(61_000)).toBe("01:01")
    expect(formatCountdown(999)).toBe("00:01")
    expect(formatCountdown(0)).toBe("00:00")
  })

  it("rounds minutes up for list rows", () => {
    expect(remainingMinutes(1)).toBe(1)
    expect(remainingMinutes(60_000)).toBe(1)
    expect(remainingMinutes(60_001)).toBe(2)
    expect(remainingMinutes(0)).toBe(0)
  })
})
