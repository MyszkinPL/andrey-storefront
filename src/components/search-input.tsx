"use client"

import { Search, X } from "lucide-react"
import { Button, Input } from "sealui"

import { useTranslate } from "@/components/i18n-provider"

/** One search field for every list, with a clear button once there is text. */
export function SearchInput({
  onValueChange,
  placeholder,
  value,
}: {
  onValueChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const t = useTranslate()

  return (
    <Input
      aria-label={placeholder}
      onChange={(event) => onValueChange(event.target.value)}
      placeholder={placeholder}
      postSlot={
        value ? (
          <Button
            aria-label={t("common.clear")}
            onClick={() => onValueChange("")}
            size="icon"
            variant="ghost"
          >
            <X size={16} aria-hidden />
          </Button>
        ) : undefined
      }
      preSlot={<Search size={16} aria-hidden />}
      type="search"
      value={value}
    />
  )
}
