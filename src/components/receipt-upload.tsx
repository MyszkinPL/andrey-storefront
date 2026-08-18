"use client"

import { useMutation } from "@tanstack/react-query"
import { FileCheck2, FileUp, Paperclip } from "lucide-react"
import { useRef, useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field"
import { useNotify } from "@/hooks/use-notify"
import { uploadOrderReceipt } from "@/lib/api"
import { RECEIPT_MAX_MB, validateReceiptFile } from "@/lib/receipt-constants"

export type OrderReceipt = {
  fileName: string
  fileSize: number
  uploadedAt: string
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Admin-side view. The PDF itself is delivered to the admin's Telegram chat,
 * so the app only reports whether one arrived.
 */
export function ReceiptStatus({ receipt }: { receipt: OrderReceipt | null }) {
  const { t, locale } = useI18n()

  const uploadedAtLabel = receipt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(receipt.uploadedAt))
    : ""

  return (
    <Field orientation="horizontal">
      {receipt ? (
        <FileCheck2 className="size-4 text-muted-foreground" />
      ) : (
        <Paperclip className="size-4 text-muted-foreground" />
      )}
      <FieldContent>
        <FieldTitle>{t("receipt.title")}</FieldTitle>
        <FieldDescription className="truncate">
          {receipt
            ? `${t("receipt.fileInfo", {
                name: receipt.fileName,
                size: formatSize(receipt.fileSize),
              })} · ${uploadedAtLabel}`
            : t("receipt.pending")}
        </FieldDescription>
        {receipt ? (
          <FieldDescription className="truncate">
            {t("receipt.adminHint")}
          </FieldDescription>
        ) : null}
      </FieldContent>
    </Field>
  )
}

export function ReceiptUpload({
  orderId,
  receipt,
  onUploaded,
}: {
  orderId: string
  receipt: OrderReceipt | null
  onUploaded: () => void
}) {
  const { t, locale } = useI18n()
  const notify = useNotify()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: (file: File) => uploadOrderReceipt(orderId, file),
    onSuccess: () => {
      notify.success("uiNotify.receiptUploaded")
      setError("")
      onUploaded()
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : t("receipt.errorFailed"))
    },
  })

  const handleFile = (file: File) => {
    const validationError = validateReceiptFile({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (validationError === "size") {
      setError(t("receipt.errorSize", { limit: RECEIPT_MAX_MB }))
      return
    }
    if (validationError === "empty") {
      setError(t("receipt.errorEmpty"))
      return
    }
    if (validationError === "type") {
      setError(t("receipt.errorType"))
      return
    }

    setError("")
    mutation.mutate(file)
  }

  const uploadedAtLabel = receipt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(receipt.uploadedAt))
    : ""

  return (
    <Field orientation="horizontal">
      {receipt ? (
        <FileCheck2 className="size-4 text-muted-foreground" />
      ) : (
        <Paperclip className="size-4 text-muted-foreground" />
      )}

      <FieldContent>
        <FieldTitle>{t("receipt.title")}</FieldTitle>
        <FieldDescription className="truncate">
          {error
            ? error
            : receipt
              ? t("receipt.uploadedAt", { date: uploadedAtLabel })
              : t("receipt.description")}
        </FieldDescription>
      </FieldContent>

      <input
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Reset so picking the same file twice still fires a change event.
          event.target.value = ""
          if (file) handleFile(file)
        }}
        ref={inputRef}
        type="file"
      />

      <Button
        disabled={mutation.isPending}
        loading={mutation.isPending}
        onClick={() => inputRef.current?.click()}
        size="sm"
        variant={receipt ? "outline" : "default"}
      >
        <FileUp data-icon="inline-start" />
        {receipt ? t("receipt.replace") : t("receipt.upload")}
      </Button>
    </Field>
  )
}
