import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  clearPending,
  PENDING_TTL_MS,
  setPending,
  takePending,
} from "@/lib/bot-pending"

const ADMIN = 111

describe("pending admin actions", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearPending(ADMIN)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the stored action", () => {
    setPending(ADMIN, { kind: "setPrice", productId: "p1" })
    expect(takePending(ADMIN)).toEqual({ kind: "setPrice", productId: "p1" })
  })

  it("consumes the action so the next message is not swallowed", () => {
    setPending(ADMIN, { kind: "newProductTitle" })
    takePending(ADMIN)
    expect(takePending(ADMIN)).toBeNull()
  })

  it("returns null when nothing is pending", () => {
    expect(takePending(ADMIN)).toBeNull()
  })

  it("expires after the TTL", () => {
    setPending(ADMIN, { kind: "deliverKey", orderId: "o1" })
    vi.advanceTimersByTime(PENDING_TTL_MS + 1)
    expect(takePending(ADMIN)).toBeNull()
  })

  it("still returns an action just inside the TTL", () => {
    setPending(ADMIN, { kind: "deliverKey", orderId: "o1" })
    vi.advanceTimersByTime(PENDING_TTL_MS - 1)
    expect(takePending(ADMIN)).toEqual({ kind: "deliverKey", orderId: "o1" })
  })

  it("keeps admins isolated from each other", () => {
    setPending(ADMIN, { kind: "addKeys", productId: "p1" })
    setPending(222, { kind: "newProductPrice", title: "Other" })

    expect(takePending(222)).toEqual({ kind: "newProductPrice", title: "Other" })
    expect(takePending(ADMIN)).toEqual({ kind: "addKeys", productId: "p1" })
  })

  it("forgets an action after cancel", () => {
    setPending(ADMIN, { kind: "setPrice", productId: "p1" })
    clearPending(ADMIN)
    expect(takePending(ADMIN)).toBeNull()
  })
})
