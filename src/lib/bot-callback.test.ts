import { describe, expect, it } from "vitest"

import {
  buildCallback,
  parseBuyToken,
  parseCallback,
  parseKeys,
  parsePrice,
} from "@/lib/bot-callback"

describe("parseCallback", () => {
  it("splits an action and an id", () => {
    expect(parseCallback("oc:abc123")).toEqual({ action: "oc", id: "abc123" })
  })

  it("treats data without a separator as a bare action", () => {
    expect(parseCallback("m")).toEqual({ action: "m", id: "" })
  })

  it("keeps colons that belong to the id", () => {
    expect(parseCallback("u:a:b")).toEqual({ action: "u", id: "a:b" })
  })

  it("round-trips through buildCallback", () => {
    const id = "clx0987654321abcdefghijkl"
    expect(parseCallback(buildCallback("ur", id))).toEqual({ action: "ur", id })
  })

  it("stays inside Telegram's 64-byte callback_data limit for a cuid", () => {
    const data = buildCallback("orj", "clx0987654321abcdefghijkl")
    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64)
  })
})

describe("parsePrice", () => {
  it("reads a plain number", () => {
    expect(parsePrice("4990")).toBe(4990)
  })

  it("ignores spaces, currency signs and separators", () => {
    expect(parsePrice("4 990 ₽")).toBe(4990)
    expect(parsePrice("4,990")).toBe(4990)
  })

  it("accepts zero", () => {
    expect(parsePrice("0")).toBe(0)
  })

  it("rejects input without digits", () => {
    expect(parsePrice("дорого")).toBeNull()
    expect(parsePrice("")).toBeNull()
    expect(parsePrice("   ")).toBeNull()
  })

  it("rejects numbers too large to be exact", () => {
    expect(parsePrice("9".repeat(20))).toBeNull()
  })
})

describe("parseKeys", () => {
  it("splits lines and drops blanks", () => {
    expect(parseKeys("A-1\n\n  B-2  \nC-3\n")).toEqual(["A-1", "B-2", "C-3"])
  })

  it("returns nothing for whitespace only", () => {
    expect(parseKeys("\n  \n")).toEqual([])
  })
})

describe("parseBuyToken", () => {
  it("splits a product id from a manual payment method id", () => {
    expect(parseBuyToken("clxproduct000000000000001:clxmethod0000000000000002")).toEqual({
      productId: "clxproduct000000000000001",
      methodToken: "clxmethod0000000000000002",
    })
  })

  it("recognises the crypto token", () => {
    expect(parseBuyToken("clxproduct000000000000001:c")).toEqual({
      productId: "clxproduct000000000000001",
      methodToken: "c",
    })
  })

  it("stays inside Telegram's 64-byte limit for two cuids", () => {
    const data = `sq:${"c".repeat(25)}:${"m".repeat(25)}`
    expect(Buffer.byteLength(data)).toBeLessThanOrEqual(64)
  })
})
