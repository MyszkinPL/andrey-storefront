import { describe, expect, it } from "vitest"

import { normalizeChannel } from "@/lib/channel-gate"

describe("normalizeChannel", () => {
  it("accepts the three ways a channel gets pasted", () => {
    expect(normalizeChannel("shop")).toBe("shop")
    expect(normalizeChannel("@shop")).toBe("shop")
    expect(normalizeChannel("https://t.me/shop")).toBe("shop")
    expect(normalizeChannel("http://t.me/shop")).toBe("shop")
  })

  it("drops whatever follows the channel in a link", () => {
    expect(normalizeChannel("https://t.me/shop/42")).toBe("shop")
  })

  it("treats blank input as no requirement", () => {
    expect(normalizeChannel("")).toBeNull()
    expect(normalizeChannel("   ")).toBeNull()
    expect(normalizeChannel("@")).toBeNull()
    expect(normalizeChannel(null)).toBeNull()
    expect(normalizeChannel(undefined)).toBeNull()
  })
})
