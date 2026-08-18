"use client"

import { useTranslate } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"

export function ConfirmDeleteDialog({
  open,
  loading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  loading: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const t = useTranslate()

  return (
    <ResponsiveDialog
      confirmLabel={t("common.delete")}
      confirmVariant="destructive"
      description={t("orderDetail.deleteDescription")}
      loading={loading}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
      title={t("orderDetail.deleteTitle")}
    />
  )
}
