"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, CircleDashed } from "lucide-react"
import { Banner, DetailRow, EmptyState, Pill, Separator, Well, WellFooter } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import { CopyField } from "@/components/order-detail/copy-field"
import { Screen, ScreenBody, ScreenHeader, ScreenState } from "@/components/screen"
import { getOrder } from "@/lib/api"
import { formatDateTime, formatInvoiceAmount, formatPrice } from "@/lib/format"
import type { TranslationKey } from "@/lib/i18n"
import { isOrderExpired } from "@/lib/order-timer"

type Order = Awaited<ReturnType<typeof getOrder>>["order"]

export function OrderCompleteScreen({ orderId }: { orderId: string }) {
  const { t, locale, currency } = useI18n()
  const [copied, setCopied] = useState(false)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    refetchInterval: 10_000,
  })

  async function copyKey(value: string) {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  if (isLoading) {
    return (
      <ScreenState
        back={`/orders/${orderId}`}
        description={t("orderComplete.loadingDescription")}
        title={t("orderComplete.loadingTitle")}
      />
    )
  }

  if (!data?.order) {
    return (
      <ScreenState
        back={`/orders/${orderId}`}
        description={t("orderComplete.errorDescription")}
        onRetry={() => refetch()}
        title={t("orderComplete.errorTitle")}
      />
    )
  }

  const order = data.order
  const createdAtLabel = formatDateTime(order.createdAt, locale)
  const amountLabel =
    formatInvoiceAmount(order.cryptoInvoiceAmount, order.cryptoInvoiceFiat, locale) ??
    (order.priceRub ? formatPrice(order.priceRub, locale, currency) : "—")

  return (
    <Screen narrow noTabBar>
      <ScreenHeader
        back={`/orders/${orderId}`}
        subtitle={order.productTitle || order.subject}
        title={t("orderComplete.orderNumber", { number: order.number })}
        trailing={<Pill color={order.isPaid ? "green" : "gray"}>{amountLabel}</Pill>}
      />

      <ScreenBody grow>
        <Well>
          <EmptyState
            description={t(descriptionKey(order))}
            icon={order.isPaid ? <CheckCircle2 /> : <CircleDashed />}
            title={t(titleKey(order))}
          />

          {order.deliveredKey ? (
            <CopyField
              copied={copied}
              onCopy={() => copyKey(order.deliveredKey || "")}
              title={t("orderComplete.key")}
              value={order.deliveredKey}
            />
          ) : order.status === "CANCELLED" ? null : (
            <Banner
              description={
                order.isPaid ? t("orderComplete.deliveryPending") : t("orderComplete.paymentPending")
              }
              title={order.isPaid ? t("orderComplete.delivery") : t("orderComplete.payment")}
              variant="info"
            />
          )}

          <Separator />

          <div className="shop-lines">
            <DetailRow label={t("orderComplete.product")} value={order.productTitle || order.subject} />
            <DetailRow
              label={t("orderComplete.payment")}
              value={order.paymentMethodTitle || t("common.notSelected")}
            />
            <DetailRow label={t("orderComplete.amount")} value={amountLabel} />
            <DetailRow label={t("orderComplete.createdAt")} value={createdAtLabel} />
          </div>

          <WellFooter>
            <LinkButton fullWidth href={`/orders/${order.id}`} variant="secondary">
              {t("orderComplete.toOrder")}
            </LinkButton>
            <LinkButton fullWidth href="/catalog">
              {t("orderComplete.toCatalog")}
            </LinkButton>
          </WellFooter>
        </Well>
      </ScreenBody>
    </Screen>
  )
}

function titleKey(order: Order): TranslationKey {
  if (isOrderExpired(order)) return "orderComplete.titleExpired"
  if (order.status === "CANCELLED") return "orderComplete.titleCancelled"
  if (order.deliveredKey) return "orderComplete.titleKeyReady"
  if (order.isPaid) return "orderComplete.titlePaid"
  return "orderComplete.titleAwaiting"
}

function descriptionKey(order: Order): TranslationKey {
  if (isOrderExpired(order)) return "orderComplete.descriptionExpired"
  if (order.status === "CANCELLED") return "orderComplete.descriptionCancelled"
  if (order.deliveredKey) return "orderComplete.descriptionKeyReady"
  if (order.isPaid) return "orderComplete.descriptionPaid"
  return "orderComplete.descriptionAwaiting"
}
