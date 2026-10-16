"use client"

import { useMutation } from "@tanstack/react-query"
import { FileCheck2, FileUp, Paperclip } from "lucide-react"
import { useRef, useState } from "react"
import { Button, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { useNotify } from "@/hooks/use-notify"
import { uploadOrderReceipt } from "@/lib/api"
import { RECEIPT_MAX_MB, validateReceiptFile } from "@/lib/receipt-constants"

export type OrderReceipt = {
  fileName: string
  fileSize: number
  uploadedAt: string
}

function ReceiptIcon({ attached }: { attached: boolean }) {
  return attached ? (
    <FileCheck2 size={18} aria-hidden style={{ color: "var(--seal-text-success)" }} />
  ) : (
    <Paperclip size={18} aria-hidden style={{ color: "var(--seal-text-secondary)" }} />
  )
}

/** Buyer-side: replace the receipt while the order is under review. */
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
    const validationError = validateReceiptFile({ name: file.name, size: file.size, type: file.type })

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
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(receipt.uploadedAt),
      )
    : ""

  return (
    <div className="shop-slot">
      <div className="shop-row">
        <ReceiptIcon attached={Boolean(receipt)} />
        <div className="shop-row-copy">
          <Text as="span" size="sm">
            {t("receipt.title")}
          </Text>
          <Text as="span" size="xs" tone={error ? "danger" : "muted"}>
            {error
              ? error
              : receipt
                ? t("receipt.uploadedAt", { date: uploadedAtLabel })
                : t("receipt.description")}
          </Text>
        </div>
      </div>

      <input
        accept="application/pdf,.pdf"
        className="shop-visually-hidden"
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
        fullWidth
        icon={<FileUp size={16} aria-hidden />}
        loading={mutation.isPending}
        onClick={() => inputRef.current?.click()}
        size="sm"
        variant={receipt ? "outline" : "secondary"}
      >
        {receipt ? t("receipt.replace") : t("receipt.upload")}
      </Button>
    </div>
  )
}
