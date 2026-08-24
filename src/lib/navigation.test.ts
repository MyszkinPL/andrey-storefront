import { describe, expect, it } from "vitest"

import { isChannelGatedRoute } from "@/lib/navigation"

describe("isChannelGatedRoute", () => {
  it("gates browsing and buying", () => {
    expect(isChannelGatedRoute("/")).toBe(true)
    expect(isChannelGatedRoute("/catalog")).toBe(true)
    expect(isChannelGatedRoute("/product/abc")).toBe(true)
  })

  it("never gates an order a buyer may already have paid for", () => {
    expect(isChannelGatedRoute("/orders")).toBe(false)
    expect(isChannelGatedRoute("/orders/abc")).toBe(false)
    expect(isChannelGatedRoute("/orders/abc/complete")).toBe(false)
  })

  it("leaves the profile and the admin panel alone", () => {
    expect(isChannelGatedRoute("/profile")).toBe(false)
    expect(isChannelGatedRoute("/admin")).toBe(false)
    expect(isChannelGatedRoute("/admin/settings")).toBe(false)
  })
})
