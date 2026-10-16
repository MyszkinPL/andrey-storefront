"use client"

import { Check } from "lucide-react"
import { Fragment } from "react"

import { useTranslate } from "@/components/i18n-provider"
import type { Order } from "@/components/order-detail/types"
import type { TranslationKey } from "@/lib/i18n"

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

export function OrderProgress({ order }: { order: Order }) {
  const t = useTranslate()
  if (order.status === "CANCELLED") return null

  const steps = orderSteps(order)

  return (
    <ol aria-label={t("orderProgress.label")} className="shop-stepper">
      {steps.map((step, index) => (
        <Fragment key={step.key}>
          {index > 0 ? (
            <li
              aria-hidden="true"
              className="shop-stepper-line"
              data-done={steps[index - 1].state === "done" ? "" : undefined}
            />
          ) : null}
          <li
            aria-current={step.state === "active" ? "step" : undefined}
            className="shop-stepper-step"
            data-state={step.state}
          >
            <span className="shop-stepper-dot">
              {step.state === "done" ? <Check aria-hidden /> : index + 1}
            </span>
            <span className="shop-stepper-label">{t(step.key)}</span>
          </li>
        </Fragment>
      ))}
    </ol>
  )
}
