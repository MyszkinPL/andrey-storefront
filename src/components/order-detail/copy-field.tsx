"use client"

import { Check, Copy } from "lucide-react"
import { Button, Field, Input } from "sealui"

import { useTranslate } from "@/components/i18n-provider"

/** Read-only value with a copy button: payment details, delivered keys. */
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
    <Field label={title}>
      <Input
        postSlot={
          <Button
            aria-label={copied ? t("common.copied") : t("common.copy")}
            onClick={onCopy}
            size="icon"
            variant="ghost"
          >
            {copied ? (
              <Check size={16} aria-hidden style={{ color: "var(--seal-text-success)" }} />
            ) : (
              <Copy size={16} aria-hidden />
            )}
          </Button>
        }
        readOnly
        value={value}
      />
    </Field>
  )
}
