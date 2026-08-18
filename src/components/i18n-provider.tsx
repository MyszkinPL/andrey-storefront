"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { getMe, updateLanguage } from "@/lib/api"
import { useTelegram } from "@/hooks/use-telegram"
import {
  createPluralTranslator,
  createTranslator,
  type TranslateFn,
  type TranslatePluralFn,
} from "@/lib/i18n"
import { DEFAULT_LOCALE, isLocale, resolveLocale, type Locale } from "@/lib/i18n/config"

type I18nContextValue = {
  locale: Locale
  /** The shop's fiat currency; every price label follows it. */
  currency: string
  t: TranslateFn
  /** Plural-aware translate, e.g. `tp("catalog.keys", 7)`. */
  tp: TranslatePluralFn
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = "andrey_locale"

/**
 * The saved choice lives in localStorage, which is an external store: reading
 * it through useSyncExternalStore keeps server and client renders consistent
 * and avoids a cascading setState on mount.
 */
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener("storage", listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", listener)
  }
}

function getStoredLocale(): Locale | null {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLocale(stored) ? stored : null
}

function getServerLocale(): Locale | null {
  return null
}

function storeLocale(locale: Locale) {
  window.localStorage.setItem(STORAGE_KEY, locale)
  emit()
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user } = useTelegram()
  const [currency, setCurrency] = useState("RUB")
  const storedLocale = useSyncExternalStore(
    subscribe,
    getStoredLocale,
    getServerLocale,
  )

  // An explicit choice saved on the account wins, so the language follows the
  // user across devices. Writing it to the store feeds the same code path as a
  // manual switch.
  useEffect(() => {
    getMe()
      .then(({ user: me, settings }) => {
        if (isLocale(me.language) && me.language !== getStoredLocale()) {
          storeLocale(me.language)
        }
        if (settings.currency) setCurrency(settings.currency.toUpperCase())
      })
      .catch(() => {})
  }, [])

  // Telegram reports the client language, so the first paint is already right
  // for users who never picked a language themselves.
  const telegramLocale =
    typeof user?.language_code === "string"
      ? resolveLocale(user.language_code)
      : DEFAULT_LOCALE

  const locale = storedLocale ?? telegramLocale

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    storeLocale(next)
    updateLanguage(next).catch(() => {})
  }, [])

  const value = useMemo<I18nContextValue>(
    () => ({
      currency,
      locale,
      setLocale,
      t: createTranslator(locale),
      tp: createPluralTranslator(locale),
    }),
    [currency, locale, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error("I18nProvider is missing")
  return context
}

/** Shorthand for components that only need the translate function. */
export function useTranslate() {
  return useI18n().t
}
