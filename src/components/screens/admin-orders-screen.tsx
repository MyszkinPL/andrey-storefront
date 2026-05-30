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
import { getMe, getOrders } from "@/lib/api"

type FilterKey = "all" | "waiting" | "review" | "work" | "closed"

export function AdminOrdersScreen() {
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
        <ScreenHeader title="Доступ закрыт" subtitle="Заказы продавца доступны только админу." />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="Заказы" subtitle="Очередь продавца" />

      {isLoading ? (
        <OrdersEmpty title="Загружаю заказы" description="Подтягиваю очередь продавца." />
      ) : isError ? (
        <OrdersEmpty title="Очередь не загрузилась" description="Обнови экран или попробуй позже." />
      ) : orders.length === 0 ? (
        <OrdersEmpty title="Заказов нет" description="Новые покупки появятся здесь." />
      ) : (
        <ScreenBody>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
            <TabsList className="grid w-full grid-cols-5">
              {[
                { key: "all" as const, label: "Все" },
                { key: "waiting" as const, label: "Оплата" },
                { key: "review" as const, label: "Проверка" },
                { key: "work" as const, label: "Выдача" },
                { key: "closed" as const, label: "История" },
              ].map((item) => (
                <TabsTrigger key={item.key} value={item.key} className="px-1 text-xs">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {visibleOrders.length === 0 ? (
            <OrdersEmpty title="Пусто" description="Для этого фильтра сейчас ничего нет." />
          ) : (
            <ItemGroup className="gap-2">
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
                      {renderSummary(order)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <OrderBadge order={order} />
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

function OrderBadge({
  order,
}: {
  order: Awaited<ReturnType<typeof getOrders>>["orders"][number]
}) {
  if (order.status === "PAYMENT_REVIEW") return <Badge>Проверка</Badge>
  if (order.status === "CANCELLED") return <Badge variant="destructive">Отменён</Badge>
  if (!order.isPaid) return <Badge variant="secondary">Оплата</Badge>
  return <Badge variant="outline">Оплачен</Badge>
}

function renderSummary(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") return "Покупатель отметил оплату."
  if (order.status === "CANCELLED") return "Заказ отменён."
  if (order.status === "CLOSED" && !order.isPaid) return "Закрыт без оплаты."
  if (!order.isPaid) return "Ожидает оплату."
  if (order.status === "CLOSED") return "Завершён."
  return "Оплачен, нужна выдача."
}
