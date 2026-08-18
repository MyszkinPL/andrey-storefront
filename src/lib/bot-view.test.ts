import { describe, expect, it } from "vitest"

import { CAPTION_LIMIT, clamp, dataUrlToBuffer, MESSAGE_LIMIT } from "@/lib/bot-view"

describe("clamp", () => {
  it("leaves short text alone", () => {
    expect(clamp("короткий", 100)).toBe("короткий")
  })

  it("never exceeds the limit", () => {
    const clamped = clamp("x".repeat(5000), MESSAGE_LIMIT)
    expect(clamped.length).toBeLessThanOrEqual(MESSAGE_LIMIT)
  })

  it("marks that text was cut", () => {
    expect(clamp("abcdef", 4)).toBe("abc…")
  })

  it("keeps a product caption within Telegram's caption limit", () => {
    expect(clamp("y".repeat(3000), CAPTION_LIMIT).length).toBeLessThanOrEqual(
      CAPTION_LIMIT,
    )
  })
})

describe("dataUrlToBuffer", () => {
  it("decodes a base64 data URL", () => {
    const source = Buffer.from("hello")
    const url = `data:image/png;base64,${source.toString("base64")}`
    expect(dataUrlToBuffer(url)?.toString()).toBe("hello")
  })

  it("returns nothing when there is no image", () => {
    expect(dataUrlToBuffer(null)).toBeUndefined()
    expect(dataUrlToBuffer(undefined)).toBeUndefined()
    expect(dataUrlToBuffer("")).toBeUndefined()
  })

  it("ignores a plain URL, which cannot be uploaded as bytes", () => {
    expect(dataUrlToBuffer("https://example.com/a.png")).toBeUndefined()
  })

  it("ignores a malformed data URL", () => {
    expect(dataUrlToBuffer("data:image/png;base64")).toBeUndefined()
  })
})
