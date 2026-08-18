import type { Locale } from "@/lib/i18n/config"

const NUMBER_LOCALES: Record<Locale, string> = {
  en: "en-US",
  ru: "ru-RU",
}

export function intlLocale(locale: Locale) {
  return NUMBER_LOCALES[locale] ?? NUMBER_LOCALES.ru
}

/**
 * Catalogue prices are stored in roubles; Crypto Pay invoices carry their own
 * fiat code. Either way grouping and symbol placement follow the reader.
 */
export function formatPrice(value: number, locale: Locale, currency = "RUB") {
  return new Intl.NumberFormat(intlLocale(locale), {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value)
}

/**
 * Invoice amounts arrive as strings from Crypto Pay. Anything unparseable is
 * shown as-is rather than silently dropped.
 */
export function formatInvoiceAmount(
  amount: string | null,
  fiat: string | null,
  locale: Locale,
) {
  if (!amount) return null
  const value = Number(amount)
  if (!Number.isFinite(value)) return `${amount} ${fiat || "RUB"}`
  return formatPrice(value, locale, fiat || "RUB")
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

/**
 * Compact crypto amount for button labels: "51.2" for USDT-sized values,
 * "0.00062" for BTC-sized ones. Three significant digits is enough for an
 * estimate — the invoice itself quotes the exact amount.
 */
export function formatCryptoAmount(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 3,
    useGrouping: false,
  }).format(value)
}

export function formatDateTime(value: string | Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
