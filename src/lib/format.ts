import type { Locale } from "@/lib/i18n/config"

const NUMBER_LOCALES: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
}

export function intlLocale(locale: Locale) {
  return NUMBER_LOCALES[locale] ?? NUMBER_LOCALES.ru
}

/**
 * Prices are stored in roubles, so the currency is fixed while grouping and
 * symbol placement follow the reader's locale.
 */
export function formatPrice(value: number, locale: Locale) {
  return new Intl.NumberFormat(intlLocale(locale), {
    currency: "RUB",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

/**
 * Compact "time ago" for dense lists ("5 мин" / "5m"). Intl.RelativeTimeFormat
 * always appends "назад"/"ago", which is too long for a list row.
 */
export function relativeTimeParts(value: string | Date) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime())
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return { unit: "now" as const, count: 0 }
  if (diffMs < hour) {
    return { unit: "minutes" as const, count: Math.floor(diffMs / minute) }
  }
  if (diffMs < day) return { unit: "hours" as const, count: Math.floor(diffMs / hour) }
  return { unit: "days" as const, count: Math.floor(diffMs / day) }
}

export function formatDateTime(value: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
