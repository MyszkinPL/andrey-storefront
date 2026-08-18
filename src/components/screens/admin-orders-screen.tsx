"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Clock3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import type { TranslationKey } from "@/lib/i18n"
import { getMe, getOrders } from "@/lib/api"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { orderBadgeVariant, orderStatusKey } from "@/lib/order-status"

type FilterKey = "all" | "waiting" | "review" | "work" | "closed"

export function AdminOrdersScreen() {
  const { t } = useI18n()
  const formatRelative = useRelativeTime()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getOrders({ scope: "all" }),
    refetchInterval: 10_000,
  })
  const [filter, setFilter] = useState<FilterKey>("all")

  const orders = useMemo(() => data?.orders ?? [], [data?.orders])
  const buckets = useMemo(() => {
    const waiting = orders.filter(
      (order) =>
        !order.isPaid &&
        order.status !== "CLOSED" &&
        order.status !== "CANCELLED" &&
        order.status !== "PAYMENT_REVIEW",
    )
    const review = orders.filter((order) => order.status === "PAYMENT_REVIEW")
    const work = orders.filter((order) => order.isPaid && !["CLOSED", "CANCELLED"].includes(order.status))
    const closed = orders.filter((order) => ["CLOSED", "CANCELLED"].includes(order.status))

    return { all: orders, waiting, review, work, closed }
  }, [orders])

  const visibleOrders = buckets[filter]

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title={t("admin.deniedTitle")} subtitle={t("admin.deniedOrders")} />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title={t("admin.ordersTitle")} subtitle={t("admin.ordersSubtitle")} />

      {isLoading ? (
        <OrdersEmpty
          title={t("admin.ordersLoadingTitle")}
          description={t("admin.ordersLoadingDescription")}
        />
      ) : isError ? (
        <OrdersEmpty
          title={t("admin.ordersErrorTitle")}
          description={t("admin.ordersErrorDescription")}
        />
      ) : orders.length === 0 ? (
        <OrdersEmpty
          title={t("admin.ordersEmptyTitle")}
          description={t("admin.ordersEmptyDescription")}
        />
      ) : (
        <ScreenBody>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
            <TabsList className="grid w-full grid-cols-5">
              {[
                { key: "all" as const, label: t("orders.filterAll") },
                { key: "waiting" as const, label: t("orders.filterPayment") },
                { key: "review" as const, label: t("orders.filterReview") },
                { key: "work" as const, label: t("orders.filterDelivery") },
                { key: "closed" as const, label: t("orders.filterHistory") },
              ].map((item) => (
                <TabsTrigger key={item.key} value={item.key} className="px-1 text-xs">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visibleOrders.length === 0 ? (
            <OrdersEmpty
              title={t("orders.filterEmptyTitle")}
              description={t("orders.filterEmptyDescription")}
            />
          ) : (
            <ItemGroup className="gap-2 lg:grid lg:grid-cols-2">
              {visibleOrders.map((order) => (
                <Item key={order.id} render={<Link href={`/orders/${order.id}`} />} variant="muted" size="sm">
                  <ItemMedia variant="icon">
                    <Clock3 />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>{order.productTitle || order.subject}</ItemTitle>
                    <ItemDescription>
                      #{order.number}
                      {order.productCategory ? ` · ${order.productCategory}` : ""}
                      {order.paymentMethodTitle ? ` · ${order.paymentMethodTitle}` : ""}
                      {" · "}
                      {t(summaryKey(order))}
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
            <Clock3 />
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


function summaryKey(
  order: Awaited<ReturnType<typeof getOrders>>["orders"][number],
): TranslationKey {
  if (order.status === "PAYMENT_REVIEW") return "admin.hintReview"
  if (order.status === "CANCELLED") return "admin.hintCancelled"
  if (order.status === "CLOSED" && !order.isPaid) return "admin.hintClosedUnpaid"
  if (!order.isPaid) return "admin.hintAwaiting"
  if (order.status === "CLOSED") return "admin.hintDone"
  return "admin.hintNeedsDelivery"
}
