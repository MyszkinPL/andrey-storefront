"use client"

import { useTranslate } from "@/components/i18n-provider"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { cn } from "@/lib/utils"

/** The product / payment / amount / created recap at the foot of the card. */
export function OrderReceipt({
  productTitle,
  paymentTitle,
  amountLabel,
  createdAtLabel,
  className,
}: {
  productTitle: string
  paymentTitle: string
  amountLabel: string | null
  createdAtLabel: string
  className?: string
}) {
  const t = useTranslate()

  return (
    <FieldGroup className={cn("gap-2", className)}>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.product")}</FieldLabel>
        <FieldDescription className="truncate text-right">{productTitle}</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.payment")}</FieldLabel>
        <FieldDescription className="text-right">{paymentTitle}</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.amount")}</FieldLabel>
        <FieldDescription className="text-right">{amountLabel || t("orderDetail.amountFallback")}</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.createdAt")}</FieldLabel>
        <FieldDescription className="text-right">{createdAtLabel}</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
