"use client"

import { Check } from "lucide-react"
import { Fragment } from "react"

import { useTranslate } from "@/components/i18n-provider"
import type { Order } from "@/components/order-detail/types"
import type { TranslationKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type Step = { key: TranslationKey; state: "done" | "active" | "upcoming" }

/**
 * Where the order is on its way from "pay" to "key in hand". A manual
 * transfer passes through a human check, a Crypto Bot invoice does not, so
 * the row has three steps or two. Hidden for a cancelled order: there is no
 * "next" to point at.
 */
export function orderSteps(order: Order): Step[] {
  const isCrypto = order.paymentMethodType === "CRYPTO_PAY"
  const keys: TranslationKey[] = isCrypto
    ? ["orderProgress.payment", "orderProgress.delivery"]
    : ["orderProgress.payment", "orderProgress.review", "orderProgress.delivery"]

  const finished = Boolean(order.deliveredKey) || (order.status === "CLOSED" && order.isPaid)
  // Index of the step the buyer is on; past it everything is done.
  const activeIndex = finished
    ? keys.length
    : order.isPaid
      ? keys.length - 1
      : order.status === "PAYMENT_REVIEW"
        ? 1
        : 0

  return keys.map((key, index) => ({
    key,
    state: index < activeIndex ? "done" : index === activeIndex ? "active" : "upcoming",
  }))
}

export function OrderProgress({ order, className }: { order: Order; className?: string }) {
  const t = useTranslate()
  if (order.status === "CANCELLED") return null

  const steps = orderSteps(order)

  return (
    <ol aria-label={t("orderProgress.label")} className={cn("flex items-start", className)}>
      {steps.map((step, index) => (
        <Fragment key={step.key}>
          {index > 0 ? (
            <li
              aria-hidden="true"
              className={cn(
                // Sits at the vertical centre of the 28px circle.
                "mt-3.5 h-0.5 flex-1 rounded-full transition-colors",
                steps[index - 1].state === "done" ? "bg-primary" : "bg-border",
              )}
            />
          ) : null}
          <li
            aria-current={step.state === "active" ? "step" : undefined}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 font-semibold text-xs tabular-nums transition-colors",
                step.state === "done" && "border-primary bg-primary text-primary-foreground",
                step.state === "active" && "border-primary bg-primary/10 text-primary",
                step.state === "upcoming" && "border-border bg-muted text-muted-foreground",
              )}
            >
              {step.state === "done" ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                "text-xs leading-4",
                step.state === "upcoming" ? "text-muted-foreground" : "font-medium text-foreground",
              )}
            >
              {t(step.key)}
            </span>
          </li>
        </Fragment>
      ))}
    </ol>
  )
}
