"use client"

import type { ReactNode } from "react"
import { Text } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { useCountdown } from "@/hooks/use-countdown"
import { isOrderOnTimer, remainingMinutes } from "@/lib/order-timer"

/**
 * "12 min left" for a list row. While the order is waiting to be paid the
 * clock is the fact that matters; once it is not, `fallback` (typically the
 * "5 min ago" the row used to show) takes the same slot.
 */
export function OrderTimeLeft({
  order,
  fallback = null,
}: {
  order: { status: string; isPaid: boolean; expiresAt: string | null }
  fallback?: ReactNode
}) {
  const t = useTranslate()
  const onTimer = isOrderOnTimer(order)
  const remaining = useCountdown(onTimer ? order.expiresAt : null)

  if (!onTimer || remaining === null) return <>{fallback}</>

  const minutes = remainingMinutes(remaining)

  return (
    // The last five minutes read as a warning, like an empty key pool.
    <Text as="span" size="xs" tabularNums tone={minutes <= 5 ? "warning" : "muted"}>
      {t("orders.timeLeft", { minutes })}
    </Text>
  )
}
