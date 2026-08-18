import { describe, expect, it } from "vitest"

import { getDictionary, translate, translatePlural } from "@/lib/i18n"
import { LOCALES, resolveLocale, resolveUserLocale } from "@/lib/i18n/config"
import { en } from "@/lib/i18n/dictionaries/en"
import { ru } from "@/lib/i18n/dictionaries/ru"

function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix]
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe("dictionaries", () => {
  it("define exactly the same keys in both languages", () => {
    expect(leafPaths(en).sort()).toEqual(leafPaths(ru).sort())
  })

  it("leave no empty strings", () => {
    for (const locale of LOCALES) {
      const dictionary = getDictionary(locale)
      for (const path of leafPaths(dictionary)) {
        expect(translate(locale, path as never).trim()).not.toBe("")
      }
    }
  })

  it("keep placeholders consistent across languages", () => {
    const placeholders = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()

    for (const path of leafPaths(ru)) {
      expect(
        placeholders(translate("en", path as never)),
        `placeholders differ for ${path}`,
      ).toEqual(placeholders(translate("ru", path as never)))
    }
  })
})

describe("translate", () => {
  it("interpolates named parameters", () => {
    expect(translate("en", "orderComplete.orderNumber", { number: 42 })).toBe(
      "Order #42",
    )
  })

  it("leaves unknown placeholders untouched rather than blanking them", () => {
    expect(translate("en", "orderComplete.orderNumber")).toBe("Order #{number}")
  })
})

describe("plurals", () => {
  it("uses the Russian one/few/many forms", () => {
    expect(translatePlural("ru", "catalog.keys", 1)).toBe("1 ключ")
    expect(translatePlural("ru", "catalog.keys", 3)).toBe("3 ключа")
    expect(translatePlural("ru", "catalog.keys", 7)).toBe("7 ключей")
    expect(translatePlural("ru", "catalog.keys", 11)).toBe("11 ключей")
    expect(translatePlural("ru", "catalog.keys", 21)).toBe("21 ключ")
  })

  it("uses the English singular/plural split", () => {
    expect(translatePlural("en", "catalog.keys", 1)).toBe("1 key")
    expect(translatePlural("en", "catalog.keys", 2)).toBe("2 keys")
    expect(translatePlural("en", "catalog.keys", 0)).toBe("0 keys")
  })
})

describe("locale resolution", () => {
  it("maps Telegram language codes", () => {
    expect(resolveLocale("ru")).toBe("ru")
    expect(resolveLocale("ru-RU")).toBe("ru")
    expect(resolveLocale("en-GB")).toBe("en")
    expect(resolveLocale("de")).toBe("en")
  })

  it("falls back to the shop default when Telegram says nothing", () => {
    expect(resolveLocale(null)).toBe("ru")
    expect(resolveLocale(undefined)).toBe("ru")
  })

  it("lets an explicit choice win over the Telegram code", () => {
    expect(resolveUserLocale({ language: "en", languageCode: "ru" })).toBe("en")
    expect(resolveUserLocale({ language: null, languageCode: "ru" })).toBe("ru")
  })

  it("ignores a stored value that is not a supported locale", () => {
    expect(resolveUserLocale({ language: "fr", languageCode: "en" })).toBe("en")
  })
})
