export const LOCALES = ["ru", "en"] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "ru"

export const LOCALE_LABELS: Record<Locale, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  ru: { native: "Русский", flag: "🇷🇺" },
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value)
}

/**
 * Maps a Telegram `language_code` to a supported locale: Russian stays
 * Russian, everything else falls back to English. A missing code means we
 * have nothing to go on, so the shop default applies.
 */
export function resolveLocale(languageCode?: string | null): Locale {
  if (!languageCode) return DEFAULT_LOCALE
  return languageCode.toLowerCase().startsWith("ru") ? "ru" : "en"
}

/**
 * Picks the locale for a user: an explicit choice always wins over whatever
 * Telegram reports.
 */
export function resolveUserLocale(user: {
  language?: string | null
  languageCode?: string | null
}): Locale {
  if (isLocale(user.language)) return user.language
  return resolveLocale(user.languageCode)
}
