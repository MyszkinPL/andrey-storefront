"use client"

import { useState } from "react"

import { useI18n } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
 * tick that they read them before the order is created — the support chat
 * used to get the same "where do I send the money?" question every day.
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
      <div className="flex flex-col gap-5">
        <ol className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <li className="flex items-start gap-3" key={step}>
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs tabular-nums"
              >
                {index + 1}
              </span>
              <span className="text-sm leading-6">{step}</span>
            </li>
          ))}
        </ol>

        <p className="rounded-lg bg-muted px-3 py-2 text-muted-foreground text-xs">
          {t("orderInstructions.timerNote", {
            minutes: Math.round(ORDER_PAYMENT_WINDOW_MS / 60_000),
          })}
        </p>

        <div className="flex flex-col gap-3">
          <Label className="cursor-pointer items-center gap-3 font-normal">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
            />
            {t("orderInstructions.acknowledged")}
          </Label>
          <Label className="cursor-pointer items-center gap-3 font-normal text-muted-foreground">
            <Checkbox
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            {t("orderInstructions.dontShowAgain")}
          </Label>
        </div>
      </div>
    </ResponsiveDialog>
  )
}
