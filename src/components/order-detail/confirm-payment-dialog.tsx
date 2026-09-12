"use client"

import { useMutation } from "@tanstack/react-query"
import { FileCheck2, FileUp, Paperclip } from "lucide-react"
import { useRef, useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/components/ui/field"
import { useNotify } from "@/hooks/use-notify"
import { markManualOrderPaid, uploadOrderReceipt } from "@/lib/api"
import type { OrderReceiptInfo } from "@/lib/contracts"
import { RECEIPT_MAX_MB, validateReceiptFile } from "@/lib/receipt-constants"
import { formatBytes } from "@/lib/telegram-format"

/**
 * "I have paid" for a manual transfer. The receipt is not an optional extra
 * any more: the sheet asks for the PDF first and only then marks the order
 * for review, so an admin never opens a "paid" order with nothing to check.
 * A receipt attached earlier counts, and can be replaced here.
 */
export function ConfirmPaymentDialog({
  open,
  onOpenChange,
  orderId,
  receipt,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  receipt: OrderReceiptInfo | null
  onDone: () => void
}) {
  const { t } = useI18n()
  const notify = useNotify()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")

  const mutation = useMutation({
    mutationFn: async () => {
      if (file) await uploadOrderReceipt(orderId, file)
      await markManualOrderPaid(orderId)
    },
    onError: notify.failure,
    onSuccess: () => {
      notify.success("uiNotify.markedPaid")
      setFile(null)
      setError("")
      onOpenChange(false)
      onDone()
    },
  })

  function pick(next: File) {
    const validationError = validateReceiptFile({
      name: next.name,
      size: next.size,
      type: next.type,
    })
    if (validationError === "size") {
      setError(t("receipt.errorSize", { limit: RECEIPT_MAX_MB }))
    } else if (validationError === "empty") {
      setError(t("receipt.errorEmpty"))
    } else if (validationError === "type") {
      setError(t("receipt.errorType"))
    } else {
      setError("")
      setFile(next)
    }
  }

  const attached = file
    ? t("receipt.fileInfo", { name: file.name, size: formatBytes(file.size) })
    : receipt
      ? t("receipt.alreadyAttached", { name: receipt.fileName })
      : t("receipt.pending")
  const hasSomething = Boolean(file || receipt)

  return (
    <ResponsiveDialog
      confirmDisabled={!hasSomething}
      confirmLabel={t("orderDetail.confirmPaymentAction")}
      description={t("orderDetail.confirmPaymentDescription")}
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate()}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setFile(null)
          setError("")
        }
      }}
      open={open}
      title={t("orderDetail.confirmPaymentTitle")}
    >
      <input
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const next = event.target.files?.[0]
          // Reset so picking the same file twice still fires a change event.
          event.target.value = ""
          if (next) pick(next)
        }}
        ref={inputRef}
        type="file"
      />

      <Field className="rounded-xl border bg-muted/40 p-3">
        <div className="flex w-full items-center gap-3">
          {hasSomething ? (
            <FileCheck2 className="size-5 shrink-0 text-success-foreground" />
          ) : (
            <Paperclip className="size-5 shrink-0 text-muted-foreground" />
          )}
          <FieldContent>
            <FieldTitle>{t("receipt.title")}</FieldTitle>
            <FieldDescription
              className={error ? "text-destructive-foreground" : "truncate"}
            >
              {error || attached}
            </FieldDescription>
          </FieldContent>
        </div>
        <Button
          className="w-full"
          disabled={mutation.isPending}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant={hasSomething ? "outline" : "default"}
        >
          <FileUp data-icon="inline-start" />
          {hasSomething ? t("receipt.replace") : t("receipt.choose")}
        </Button>
      </Field>
    </ResponsiveDialog>
  )
}
