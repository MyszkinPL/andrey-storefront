"use client"

import { Select } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { LOCALE_LABELS, LOCALES, isLocale } from "@/lib/i18n/config"

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()
  const haptic = useHaptic()

  return (
    <Select
      aria-label={t("language.label")}
      onValueChange={(value) => {
        if (!isLocale(value) || value === locale) return
        haptic.select()
        setLocale(value)
      }}
      options={LOCALES.map((value) => ({
        value,
        label: `${LOCALE_LABELS[value].code} · ${LOCALE_LABELS[value].native}`,
      }))}
      value={locale}
    />
  )
}
