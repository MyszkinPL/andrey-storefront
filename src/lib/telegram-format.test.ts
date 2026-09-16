import { describe, expect, it } from "vitest"

import { entitiesToHtml, escapeHtml } from "@/lib/telegram-format"

describe("entitiesToHtml", () => {
  it("returns escaped text when there are no entities", () => {
    expect(entitiesToHtml("a < b & c", undefined)).toBe("a &lt; b &amp; c")
  })

  it("wraps bold and italic ranges", () => {
    expect(
      entitiesToHtml("Big sale now", [
        { type: "bold", offset: 0, length: 3 },
        { type: "italic", offset: 9, length: 3 },
      ]),
    ).toBe("<b>Big</b> sale <i>now</i>")
  })

  it("nests entities that share a range", () => {
    expect(
      entitiesToHtml("hot", [
        { type: "bold", offset: 0, length: 3 },
        { type: "italic", offset: 0, length: 3 },
      ]),
    ).toBe("<b><i>hot</i></b>")
  })

  it("turns text links into anchors and escapes the href", () => {
    expect(
      entitiesToHtml("open shop", [
        { type: "text_link", offset: 0, length: 4, url: "https://t.me/x?a=1&b=2" },
      ]),
    ).toBe('<a href="https://t.me/x?a=1&amp;b=2">open</a> shop')
  })

  it("counts offsets in UTF-16 units like Telegram does", () => {
    // The emoji is two code units, so "sale" starts at 3, not 2.
    expect(
      entitiesToHtml("🔥 sale", [{ type: "bold", offset: 3, length: 4 }]),
    ).toBe("🔥 <b>sale</b>")
  })

  it("keeps code blocks and spoilers", () => {
    expect(
      entitiesToHtml("key SNX-1 hidden", [
        { type: "code", offset: 4, length: 5 },
        { type: "spoiler", offset: 10, length: 6 },
      ]),
    ).toBe("key <code>SNX-1</code> <tg-spoiler>hidden</tg-spoiler>")
  })

  it("escapes markup typed inside a formatted range", () => {
    expect(
      entitiesToHtml("<b>fake</b>", [{ type: "bold", offset: 0, length: 11 }]),
    ).toBe("<b>&lt;b&gt;fake&lt;/b&gt;</b>")
  })
})

describe("escapeHtml", () => {
  it("escapes the three characters Telegram cares about", () => {
    expect(escapeHtml("<a & b>")).toBe("&lt;a &amp; b&gt;")
  })
})
