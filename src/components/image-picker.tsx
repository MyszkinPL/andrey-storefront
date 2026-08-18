"use client"

import { ImageUp, Trash2 } from "lucide-react"
import { useRef } from "react"

import { useTranslate } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"

/**
 * A native file input renders the browser's own control, which ignores the
 * design system entirely. The input stays in the DOM for accessibility and
 * form semantics but is driven by a real button.
 */
export function ImagePicker({
  accept = "image/*",
  disabled,
  hasImage,
  id,
  onClear,
  onSelect,
}: {
  accept?: string
  disabled?: boolean
  hasImage?: boolean
  id?: string
  onClear?: () => void
  onSelect: (file: File | null) => void
}) {
  const t = useTranslate()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-2">
      <input
        accept={accept}
        className="sr-only"
        id={id}
        onChange={(event) => {
          const file = event.target.files?.[0] || null
          // Reset so choosing the same file twice still fires a change.
          event.target.value = ""
          onSelect(file)
        }}
        ref={inputRef}
        type="file"
      />

      <Button
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        size="sm"
        type="button"
        variant="outline"
      >
        <ImageUp data-icon="inline-start" />
        {hasImage ? t("imagePicker.replace") : t("imagePicker.choose")}
      </Button>

      {hasImage && onClear ? (
        <Button
          aria-label={t("imagePicker.remove")}
          disabled={disabled}
          onClick={onClear}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Trash2 />
        </Button>
      ) : null}
    </div>
  )
}
