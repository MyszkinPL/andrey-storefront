"use client"

import { useCallback } from "react"

import { useI18n } from "@/components/i18n-provider"
import { relativeTimeParts } from "@/lib/format"

/** Compact localized "time ago" for list rows, e.g. "5 мин" / "5m". */
export function useRelativeTime() {
  const { t } = useI18n()

  return useCallback(
    (value: string | Date) => {
      const { unit, count } = relativeTimeParts(value)
      if (unit === "now") return t("time.now")
      return t(`time.${unit}`, { count })
    },
    [t],
  )
}
