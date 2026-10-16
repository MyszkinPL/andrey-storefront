"use client"

import { Check } from "lucide-react"
import { useState } from "react"
import { Avatar, Checkbox, Stack, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ListGroup, ListRow } from "@/components/list-row"
import type { PaymentOption } from "@/components/order-detail/types"
import {
  areOrderInstructionsDismissed,
  dismissOrderInstructions,
} from "@/components/order-instructions-dialog"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { ORDER_PAYMENT_WINDOW_MS } from "@/lib/order-timer"

/**
 * The whole checkout in one sheet: pick how to pay, read the three lines
 * on how a manual transfer works, confirm. The product screen itself keeps
 * a single "Buy" button, the way a store app does.
 */
export function CheckoutSheet({
  open,
  onOpenChange,
  options,
  priceLabel,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  options: PaymentOption[]
  priceLabel: string
  loading?: boolean
  onConfirm: (option: PaymentOption) => void
}) {
  const { t } = useI18n()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const selected = options.find((option) => option.key === selectedKey) ?? options[0] ?? null
  // The how-to only matters for a transfer by hand, and only until the
  // buyer asked not to see it again.
  const needsInstructions = selected?.type === "MANUAL" && !areOrderInstructionsDismissed()
  const steps = [t("orderInstructions.step1"), t("orderInstructions.step2"), t("orderInstructions.step3")]

  return (
    <ResponsiveDialog
      confirmDisabled={!selected || (needsInstructions && !acknowledged)}
      confirmLabel={`${t("product.placeOrder")} · ${priceLabel}`}
      description={t("product.checkoutDescription")}
      loading={loading}
      onConfirm={() => {
        if (!selected) return
        if (needsInstructions && dontShowAgain) dismissOrderInstructions()
        onConfirm(selected)
      }}
      onOpenChange={(next) => {
        onOpenChange(next)
        // A reopened sheet starts unticked: the point is to read it again.
        if (!next) {
          setAcknowledged(false)
          setDontShowAgain(false)
        }
      }}
      open={open}
      title={t("product.checkoutTitle")}
    >
      <Stack gap="4">
        <ListGroup>
          {options.map((option) => {
            const isSelected = option.key === selected?.key
            return (
              <ListRow
                description={option.subtitle}
                key={option.key}
                media={<Avatar name={option.title} size="md" src={option.iconUrl} />}
                onClick={() => setSelectedKey(option.key)}
                title={option.title}
                trailing={
                  isSelected ? (
                    <Check aria-hidden size={18} style={{ color: "var(--seal-text-primary)" }} />
                  ) : (
                    <span aria-hidden style={{ width: 18 }} />
                  )
                }
              />
            )
          })}
        </ListGroup>

        {needsInstructions ? (
          <>
            <ol className="shop-steps">
              {steps.map((step, index) => (
                <li key={step}>
                  <span aria-hidden="true" className="shop-steps-num">
                    {index + 1}
                  </span>
                  <Text as="span" size="sm">
                    {step}
                  </Text>
                </li>
              ))}
            </ol>

            <Text as="p" size="xs" tone="muted">
              {t("orderInstructions.timerNote", {
                minutes: Math.round(ORDER_PAYMENT_WINDOW_MS / 60_000),
              })}
            </Text>

            <Stack gap="3">
              <Checkbox
                checked={acknowledged}
                label={t("orderInstructions.acknowledged")}
                onCheckedChange={setAcknowledged}
              />
              <Checkbox
                checked={dontShowAgain}
                label={t("orderInstructions.dontShowAgain")}
                onCheckedChange={setDontShowAgain}
              />
            </Stack>
          </>
        ) : null}
      </Stack>
    </ResponsiveDialog>
  )
}
