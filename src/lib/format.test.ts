import { describe, expect, it } from "vitest"

import {
  formatCryptoAmount,
  formatInvoiceAmount,
  formatPrice,
  relativeTimeParts,
} from "@/lib/format"

describe("formatPrice", () => {
  it("formats roubles per locale", () => {
    expect(formatPrice(4990, "ru")).toMatch(/4\s990/)
    expect(formatPrice(4990, "en")).toMatch(/4,990/)
  })

  it("accepts another currency for invoices", () => {
    expect(formatPrice(12, "en", "USD")).toContain("12")
  })
})

describe("formatInvoiceAmount", () => {
  it("returns null when there is no invoice", () => {
    expect(formatInvoiceAmount(null, "RUB", "ru")).toBeNull()
  })

  it("formats a numeric string like any other price", () => {
    // Same shape as a catalogue price, not the raw "12 RUB" it arrives as.
    expect(formatInvoiceAmount("12", "RUB", "ru")).toBe(formatPrice(12, "ru"))
  })

  it("falls back to the raw value when it is not a number", () => {
    expect(formatInvoiceAmount("about ten", "RUB", "ru")).toBe("about ten RUB")
  })

  it("defaults a missing fiat to roubles", () => {
    expect(formatInvoiceAmount("12", null, "ru")).toBe(formatPrice(12, "ru"))
  })
})

describe("relativeTimeParts", () => {
  it("reports fresh timestamps as now", () => {
    expect(relativeTimeParts(new Date())).toEqual({ unit: "now", count: 0 })
  })

  it("counts minutes, hours and days", () => {
    const ago = (ms: number) => new Date(Date.now() - ms)
    expect(relativeTimeParts(ago(5 * 60_000))).toEqual({ unit: "minutes", count: 5 })
    expect(relativeTimeParts(ago(3 * 3_600_000))).toEqual({ unit: "hours", count: 3 })
    expect(relativeTimeParts(ago(2 * 86_400_000))).toEqual({ unit: "days", count: 2 })
  })

  it("never reports a negative age for a future timestamp", () => {
    expect(relativeTimeParts(new Date(Date.now() + 60_000))).toEqual({
      unit: "now",
      count: 0,
    })
  })
})

describe("formatCryptoAmount", () => {
  it("keeps USDT-sized estimates short", () => {
    expect(formatCryptoAmount(51.183)).toBe("51.2")
  })

  it("keeps BTC-sized estimates readable", () => {
    expect(formatCryptoAmount(0.00061523)).toBe("0.000615")
  })

  it("does not add grouping separators", () => {
    expect(formatCryptoAmount(33267)).not.toContain(",")
  })
})
