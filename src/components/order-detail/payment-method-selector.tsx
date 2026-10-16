"use client"

import { Avatar, Field, SelectParts, Text } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import type { PaymentOption } from "@/components/order-detail/types"

/** The option row: icon, name, one-line hint. Shared by trigger and list. */
function OptionRow({ option, hint }: { option: PaymentOption; hint?: boolean }) {
  return (
    <span className="shop-inline">
      <Avatar name={option.title} size="sm" src={option.iconUrl} />
      <span className="shop-row-copy">
        <Text as="span" size="sm" truncate>
          {option.title}
        </Text>
        {hint && option.subtitle ? (
          <Text as="span" size="xs" tone="muted" truncate>
            {option.subtitle}
          </Text>
        ) : null}
      </span>
    </span>
  )
}

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
  const selected = options.find((option) => option.key === selectedKey) ?? null

  return (
    <Field
      description={loading ? t("orderDetail.changingPayment") : undefined}
      label={t("product.paymentMethod")}
      nativeLabel={false}
    >
      <SelectParts.Root
        disabled={loading}
        items={options.map((option) => ({ value: option.key, label: option.title }))}
        onValueChange={(value) => {
          if (typeof value === "string" && value) onSelect(value)
        }}
        value={selectedKey ?? ""}
      >
        <SelectParts.Trigger>
          {selected ? <OptionRow option={selected} /> : <SelectParts.Value placeholder={t("product.choosePayment")} />}
          <SelectParts.Icon />
        </SelectParts.Trigger>
        <SelectParts.Portal>
          <SelectParts.Positioner>
            <SelectParts.Popup>
              <SelectParts.List>
                {options.map((option) => (
                  <SelectParts.Item key={option.key} value={option.key}>
                    <SelectParts.ItemIndicator />
                    <SelectParts.ItemText>
                      <OptionRow hint option={option} />
                    </SelectParts.ItemText>
                  </SelectParts.Item>
                ))}
              </SelectParts.List>
            </SelectParts.Popup>
          </SelectParts.Positioner>
        </SelectParts.Portal>
      </SelectParts.Root>
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
    <div className="shop-row">
      <Avatar name={title} size="lg" src={iconUrl} />
      <div className="shop-row-copy">
        <Text as="span" size="sm">
          {title}
        </Text>
        <Text as="span" size="xs" tone="muted" truncate>
          {description}
        </Text>
      </div>
    </div>
  )
}
