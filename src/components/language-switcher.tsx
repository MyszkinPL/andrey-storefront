"use client"

import { useI18n } from "@/components/i18n-provider"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHaptic } from "@/hooks/use-telegram"
import { LOCALE_LABELS, LOCALES, isLocale } from "@/lib/i18n/config"

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()
  const haptic = useHaptic()

  return (
    <Select
      aria-label={t("language.label")}
      value={locale}
      onValueChange={(value) => {
        if (!isLocale(value) || value === locale) return
        haptic.select()
        setLocale(value)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue>
          {(value: string) => {
            const item = isLocale(value) ? LOCALE_LABELS[value] : null
            if (!item) return null
            return (
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{item.flag}</span>
                <span className="truncate">{item.native}</span>
              </span>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectPopup>
        {LOCALES.map((value) => (
          <SelectItem key={value} value={value}>
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">
                {LOCALE_LABELS[value].flag}
              </span>
              <span className="truncate">{LOCALE_LABELS[value].native}</span>
            </span>
          </SelectItem>
        ))}
      </SelectPopup>
    </Select>
  )
}
