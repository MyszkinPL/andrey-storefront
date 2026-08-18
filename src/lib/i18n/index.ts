import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"
import { en } from "@/lib/i18n/dictionaries/en"
import { ru } from "@/lib/i18n/dictionaries/ru"

import type { PluralForms, Widen } from "@/lib/i18n/shape"

export type Dictionary = Widen<typeof ru>

/**
 * Dot-separated paths to every leaf string in the dictionary, so a typo in a
 * translation key is a compile error rather than a blank label at runtime.
 */
export type TranslationKey<T = Dictionary> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? K
        : `${K}.${TranslationKey<T[K]>}`
    }[keyof T & string]

export type TranslationParams = Record<string, string | number>

const DICTIONARIES: Record<Locale, Dictionary> = { en, ru }

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let current: unknown = dictionary

  for (const segment of key.split(".")) {
    if (typeof current !== "object" || current === null) return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return typeof current === "string" ? current : undefined
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

/**
 * Translates a key. Falls back to the default locale and then to the key
 * itself, so a missing translation degrades to something identifiable instead
 * of an empty string.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const template =
    lookup(getDictionary(locale), key) ??
    lookup(getDictionary(DEFAULT_LOCALE), key)

  if (template === undefined) {
    console.warn(`Missing translation: ${key}`)
    return key
  }

  return interpolate(template, params)
}

/**
 * Picks the right plural form for the locale. Russian needs one/few/many where
 * English only distinguishes one/other, so the form is chosen by
 * `Intl.PluralRules` rather than by counting in the UI.
 */
export function translatePlural(
  locale: Locale,
  baseKey: PluralKey,
  count: number,
  params?: TranslationParams,
): string {
  const form = new Intl.PluralRules(locale).select(count)
  const dictionary = getDictionary(locale)
  const template =
    lookup(dictionary, `${baseKey}.${form}`) ??
    lookup(dictionary, `${baseKey}.other`) ??
    lookup(getDictionary(DEFAULT_LOCALE), `${baseKey}.other`)

  if (template === undefined) {
    console.warn(`Missing plural translation: ${baseKey}`)
    return baseKey
  }

  return interpolate(template, { count, ...params })
}

/** Dot paths whose leaf is a set of plural forms rather than a single string. */
export type PluralKey<T = Dictionary, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : T[K] extends PluralForms
      ? `${Prefix}${K}`
      : PluralKey<T[K], `${Prefix}${K}.`>
}[keyof T & string]

export type TranslateFn = (
  key: TranslationKey,
  params?: TranslationParams,
) => string

export type TranslatePluralFn = (
  key: PluralKey,
  count: number,
  params?: TranslationParams,
) => string

export function createTranslator(locale: Locale): TranslateFn {
  return (key, params) => translate(locale, key, params)
}

export function createPluralTranslator(locale: Locale): TranslatePluralFn {
  return (key, count, params) => translatePlural(locale, key, count, params)
}
