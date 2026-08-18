"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ExternalLink, Receipt } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { getMe, getOrders } from "@/lib/api"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { orderBadgeVariant, orderStatusKey } from "@/lib/order-status"

type FilterKey = "all" | "waiting" | "review" | "active" | "closed"

export function OrdersScreen() {
  const { t } = useI18n()
  const formatRelative = useRelativeTime()
  const { data: ordersData, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [filter, setFilter] = useState<FilterKey>("all")
  const supportLink = meData?.settings.supportUsername
    ? `https://t.me/${meData.settings.supportUsername.replace(/^@/, "")}`
    : null

  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData?.orders])
  const buckets = useMemo(() => {
    const waiting = orders.filter(
      (order) =>
        !order.isPaid &&
        !["CLOSED", "CANCELLED", "PAYMENT_REVIEW"].includes(order.status),
    )
    const active = orders.filter(
      (order) => order.isPaid && !["CLOSED", "CANCELLED"].includes(order.status),
    )
    const review = orders.filter((order) => order.status === "PAYMENT_REVIEW")
    const closed = orders.filter((order) => ["CLOSED", "CANCELLED"].includes(order.status))

    return {
      all: [...waiting, ...review, ...active, ...closed],
      waiting,
      review,
      active,
      closed,
    }
  }, [orders])

  const visibleOrders = buckets[filter]

  return (
    <Screen>
      <ScreenHeader
        title={t("orders.title")}
        subtitle={t("orders.subtitle", {
          active: buckets.active.length,
          waiting: buckets.waiting.length,
        })}
        trailing={
          supportLink ? (
            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ size: "sm", variant: "secondary" })}
            >
              {t("orders.support")}
              <ExternalLink data-icon="inline-end" />
            </a>
          ) : null
        }
      />

      {isLoading ? (
        <OrdersEmpty title={t("orders.loadingTitle")} description={t("orders.loadingDescription")} />
      ) : isError ? (
        <OrdersEmpty title={t("orders.errorTitle")} description={t("orders.errorDescription")} />
      ) : orders.length === 0 ? (
        <OrdersEmpty title={t("orders.emptyTitle")} description={t("orders.emptyDescription")} />
      ) : (
        <ScreenBody>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
            <TabsList className="grid w-full grid-cols-5">
              {[
                { key: "all" as const, label: t("orders.filterAll") },
                { key: "waiting" as const, label: t("orders.filterPayment") },
                { key: "review" as const, label: t("orders.filterReview") },
                { key: "active" as const, label: t("orders.filterDelivery") },
                { key: "closed" as const, label: t("orders.filterHistory") },
              ].map((item) => (
                <TabsTrigger key={item.key} value={item.key} className="px-1 text-xs">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visibleOrders.length === 0 ? (
            <OrdersEmpty title={t("orders.filterEmptyTitle")} description={t("orders.filterEmptyDescription")} />
          ) : (
            <ItemGroup className="gap-2 lg:grid lg:grid-cols-2">
              {visibleOrders.map((order) => (
                <Item key={order.id} render={<Link href={`/orders/${order.id}`} />} variant="muted" size="sm">
                  <ItemMedia variant="icon">
                    <Receipt />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>{order.productTitle || order.subject}</ItemTitle>
                    <ItemDescription>
                      #{order.number}
                      {order.productCategory ? ` · ${order.productCategory}` : ""}
                      {order.paymentMethodTitle && !order.isPaid ? ` · ${order.paymentMethodTitle}` : ""}
                      {" · "}
                      {formatRelative(order.updatedAt)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant={orderBadgeVariant(order)}>{t(orderStatusKey(order))}</Badge>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          )}
        </ScreenBody>
      )}
    </Screen>
  )
}

function OrdersEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

