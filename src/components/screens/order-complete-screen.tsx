"use client"

import Link from "next/link"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Check, CheckCircle2, CircleDashed, Copy } from "lucide-react"

import { useI18n } from "@/components/i18n-provider"
import type { TranslationKey } from "@/lib/i18n"
import { formatDateTime, formatInvoiceAmount, formatPrice } from "@/lib/format"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Screen, ScreenBody, ScreenHeader, ScreenState } from "@/components/screen"
import { getOrder } from "@/lib/api"

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
    <Screen noTabBar>
      <ScreenHeader
        back={`/orders/${orderId}`}
        title={t("orderComplete.orderNumber", { number: order.number })}
        subtitle={order.productTitle || order.subject}
        trailing={<Badge variant={order.isPaid ? "default" : "secondary"}>{amountLabel}</Badge>}
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <Card className="min-h-[calc(100dvh-8rem)]">
          <CardHeader>
            <Empty>
              <EmptyMedia variant="icon">
                {order.isPaid ? <CheckCircle2 /> : <CircleDashed />}
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t(titleKey(order))}</EmptyTitle>
                <EmptyDescription>{t(descriptionKey(order))}</EmptyDescription>
              </EmptyHeader>
            </Empty>

          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-3">
            {order.deliveredKey ? (
              <Field>
                <FieldLabel>{t("orderComplete.key")}</FieldLabel>
                <InputGroup>
                  <InputGroupInput readOnly value={order.deliveredKey} />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton onClick={() => copyKey(order.deliveredKey || "")}>
                      {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
                      {copied ? t("common.copied") : t("common.copy")}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            ) : order.status === "CANCELLED" ? null : (
              <Field>
                <FieldTitle>
                  {order.isPaid ? t("orderComplete.delivery") : t("orderComplete.payment")}
                </FieldTitle>
                <FieldDescription>
                  {order.isPaid
                    ? t("orderComplete.deliveryPending")
                    : t("orderComplete.paymentPending")}
                </FieldDescription>
              </Field>
            )}

            <FieldGroup className="mt-auto gap-2">
              <Field orientation="horizontal">
                <FieldLabel>{t("orderComplete.product")}</FieldLabel>
                <FieldDescription className="truncate text-right">
                  {order.productTitle || order.subject}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>{t("orderComplete.payment")}</FieldLabel>
                <FieldDescription className="text-right">
                  {order.paymentMethodTitle || t("common.notSelected")}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>{t("orderComplete.amount")}</FieldLabel>
                <FieldDescription className="text-right">{amountLabel}</FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>{t("orderComplete.createdAt")}</FieldLabel>
                <FieldDescription className="text-right">{createdAtLabel}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>

          <CardFooter className="mt-auto flex-col items-stretch gap-2">
            <Link href={`/orders/${order.id}`} className={buttonVariants({ variant: "secondary" })}>
              {t("orderComplete.toOrder")}
            </Link>
            <Link href="/catalog" className={buttonVariants()}>
              {t("orderComplete.toCatalog")}
            </Link>
          </CardFooter>
        </Card>
      </ScreenBody>
    </Screen>
  )
}

function titleKey(order: Order): TranslationKey {
  if (order.status === "CANCELLED") return "orderComplete.titleCancelled"
  if (order.deliveredKey) return "orderComplete.titleKeyReady"
  if (order.isPaid) return "orderComplete.titlePaid"
  return "orderComplete.titleAwaiting"
}

function descriptionKey(order: Order): TranslationKey {
  if (order.status === "CANCELLED") return "orderComplete.descriptionCancelled"
  if (order.deliveredKey) return "orderComplete.descriptionKeyReady"
  if (order.isPaid) return "orderComplete.descriptionPaid"
  return "orderComplete.descriptionAwaiting"
}

