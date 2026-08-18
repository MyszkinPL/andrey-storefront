"use client"

import { Check, Copy } from "lucide-react"

import { useTranslate } from "@/components/i18n-provider"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

/** Read-only value with a copy button — payment details, delivered keys. */
export function CopyField({
  title,
  value,
  copied,
  onCopy,
}: {
  title: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  const t = useTranslate()

  return (
    <Field>
      <FieldLabel>{title}</FieldLabel>
      <InputGroup>
        <InputGroupInput readOnly value={value} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={onCopy}>
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
            {copied ? t("common.copied") : t("common.copy")}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
