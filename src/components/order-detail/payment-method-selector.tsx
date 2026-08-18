"use client"

import { useState } from "react"

import { useTranslate } from "@/components/i18n-provider"
import { getAvatarFallback } from "@/components/order-detail/status"
import type { PaymentOption } from "@/components/order-detail/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PaymentMethodSelector({
  options,
  selectedKey,
  loading,
  onSelect,
}: {
  options: PaymentOption[]
  selectedKey: string | null
  loading: boolean
  onSelect: (key: string) => void
}) {
  const t = useTranslate()
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.key === selectedKey)

  return (
    <Field>
      <FieldLabel>{t("product.paymentMethod")}</FieldLabel>
      <Select
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        value={selectedKey || ""}
        onValueChange={(value) => {
          if (value) {
            onSelect(String(value))
            setOpen(false)
          }
        }}
        disabled={loading}
        items={options.map((option) => ({ value: option.key, label: option.title }))}
      >
        <SelectTrigger size="lg">
          {selectedOption ? (
            <Avatar className="size-6">
              {selectedOption.iconUrl ? (
                <AvatarImage src={selectedOption.iconUrl} alt={selectedOption.title} />
              ) : null}
              <AvatarFallback>{getAvatarFallback(selectedOption.title)}</AvatarFallback>
            </Avatar>
          ) : null}
          <SelectValue placeholder={t("product.choosePayment")} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.key} value={option.key} label={option.title}>
                <Avatar className="size-6">
                  {option.iconUrl ? <AvatarImage src={option.iconUrl} alt={option.title} /> : null}
                  <AvatarFallback>{getAvatarFallback(option.title)}</AvatarFallback>
                </Avatar>
                {option.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {loading ? (
        <FieldDescription>{t("orderDetail.changingPayment")}</FieldDescription>
      ) : null}
    </Field>
  )
}

export function PaymentMethodSummary({
  title,
  description,
  iconUrl,
}: {
  title: string
  description: string
  iconUrl: string | null
}) {
  return (
    <Field orientation="horizontal">
      <Avatar className="size-10">
        {iconUrl ? <AvatarImage src={iconUrl} alt={title} /> : null}
        <AvatarFallback>{getAvatarFallback(title)}</AvatarFallback>
      </Avatar>
      <FieldContent>
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription className="truncate">{description}</FieldDescription>
      </FieldContent>
    </Field>
  )
}
