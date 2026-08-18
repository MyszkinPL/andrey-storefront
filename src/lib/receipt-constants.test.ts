import { describe, expect, it } from "vitest"

import {
  RECEIPT_MAX_BYTES,
  validateReceiptFile,
} from "@/lib/receipt-constants"

const pdf = { name: "check.pdf", size: 1024, type: "application/pdf" }

describe("validateReceiptFile", () => {
  it("accepts a normal PDF", () => {
    expect(validateReceiptFile(pdf)).toBeNull()
  })

  it("accepts a PDF whose mime type is missing but whose name says pdf", () => {
    expect(validateReceiptFile({ ...pdf, type: "" })).toBeNull()
    expect(validateReceiptFile({ ...pdf, name: "CHECK.PDF", type: "" })).toBeNull()
  })

  it("rejects other file types", () => {
    expect(validateReceiptFile({ name: "shot.png", size: 1024, type: "image/png" })).toBe("type")
  })

  it("rejects an empty file", () => {
    expect(validateReceiptFile({ ...pdf, size: 0 })).toBe("empty")
  })

  it("rejects a file over the limit", () => {
    expect(validateReceiptFile({ ...pdf, size: RECEIPT_MAX_BYTES + 1 })).toBe("size")
  })

  it("accepts a file exactly at the limit", () => {
    expect(validateReceiptFile({ ...pdf, size: RECEIPT_MAX_BYTES })).toBeNull()
  })
})
