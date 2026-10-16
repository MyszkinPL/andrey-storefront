"use client"

import { DetailRow } from "sealui"

import { useTranslate } from "@/components/i18n-provider"

/** The product / payment / amount / created recap at the foot of the card. */
export function OrderReceipt({
  productTitle,
  paymentTitle,
  amountLabel,
  createdAtLabel,
}: {
  productTitle: string
  paymentTitle: string
  amountLabel: string | null
  createdAtLabel: string
}) {
  const t = useTranslate()

  return (
    <div className="shop-lines">
      <DetailRow label={t("orderComplete.product")} value={productTitle} />
      <DetailRow label={t("orderComplete.payment")} value={paymentTitle} />
      <DetailRow label={t("orderComplete.amount")} value={amountLabel || undefined} />
      <DetailRow label={t("orderComplete.createdAt")} value={createdAtLabel} />
    </div>
  )
}
