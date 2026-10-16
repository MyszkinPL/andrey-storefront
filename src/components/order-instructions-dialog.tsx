"use client"

import { useState } from "react"
import { Checkbox, Stack, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { ORDER_PAYMENT_WINDOW_MS } from "@/lib/order-timer"

const STORAGE_KEY = "andrey_order_instructions_dismissed"

/** The buyer asked not to see the instructions again. */
export function areOrderInstructionsDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function dismissOrderInstructions() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1")
  } catch {}
}

/**
 * Shown between "place order" and the order itself for a manual transfer.
 * The steps are the whole payment flow in three lines, and the buyer has to
 * tick that they read them before the order is created.
 */
export function OrderInstructionsDialog({
  open,
  onOpenChange,
  onProceed,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProceed: () => void
  loading?: boolean
}) {
  const { t } = useI18n()
  const [acknowledged, setAcknowledged] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const steps = [t("orderInstructions.step1"), t("orderInstructions.step2"), t("orderInstructions.step3")]

  return (
    <ResponsiveDialog
      confirmDisabled={!acknowledged}
      confirmLabel={t("orderInstructions.next")}
      description={t("orderInstructions.description")}
      loading={loading}
      onConfirm={() => {
        if (dontShowAgain) dismissOrderInstructions()
        onProceed()
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
      title={t("orderInstructions.title")}
    >
      <Stack gap="4">
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

        <div className="shop-note">
          <Text as="p" size="xs" tone="muted">
            {t("orderInstructions.timerNote", {
              minutes: Math.round(ORDER_PAYMENT_WINDOW_MS / 60_000),
            })}
          </Text>
        </div>

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
      </Stack>
    </ResponsiveDialog>
  )
}
