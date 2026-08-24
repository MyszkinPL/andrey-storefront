"use client"

import { Search, X } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useTranslate } from "@/components/i18n-provider"

/**
 * Every list search was its own InputGroup, and none of them offered a way to
 * clear the query except holding backspace. One component, one clear button.
 */
export function SearchInput({
  className,
  onValueChange,
  placeholder,
  value,
}: {
  className?: string
  onValueChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const t = useTranslate()

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={t("common.clear")}
            onClick={() => onValueChange("")}
            size="icon-xs"
            variant="ghost"
          >
            <X />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  )
}
