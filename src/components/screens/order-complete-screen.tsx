"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, CircleDashed } from "lucide-react"
import { EmptyState, Pill } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { KeyValueList } from "@/components/key-value"
import { LinkButton } from "@/components/link-button"
import { CopyField } from "@/components/order-detail/copy-field"
import {
  ActionStack,
  Screen,
  ScreenBody,
  ScreenHeader,
  ScreenState,
  Section,
} from "@/components/screen"
import { getOrder } from "@/lib/api"
import { formatDateTime, formatInvoiceAmount, formatPrice } from "@/lib/format"
import type { TranslationKey } from "@/lib/i18n"
import { isOrderExpired } from "@/lib/order-timer"

type Order = Awaited<ReturnType<typeof getOrder>>["order"]

/** The delivery screen: the key, big, with a copy button, and a way back. */
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
        ) : null}

        <Section title={t("orderDetail.details")}>
          <KeyValueList
            items={[
              { label: t("orderComplete.product"), value: order.productTitle || order.subject },
              { label: t("orderComplete.payment"), value: order.paymentMethodTitle || t("common.notSelected") },
              { label: t("orderComplete.amount"), value: amountLabel },
              { label: t("orderComplete.createdAt"), value: createdAtLabel },
            ]}
          />
        </Section>

        <ActionStack>
          <LinkButton fullWidth href="/catalog">
            {t("orderComplete.toCatalog")}
          </LinkButton>
          <LinkButton fullWidth href={`/orders/${order.id}`} variant="secondary">
            {t("orderComplete.toOrder")}
          </LinkButton>
        </ActionStack>
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
