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
import { getMe, getOrders } from "@/lib/api"

type FilterKey = "all" | "waiting" | "review" | "active" | "closed"

export function OrdersScreen() {
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
        title="Заказы"
        subtitle={`${buckets.active.length} активных · ${buckets.waiting.length} ждут оплату`}
        trailing={
          supportLink ? (
            <a
              href={supportLink}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ size: "sm", variant: "secondary" })}
            >
              Поддержка
              <ExternalLink data-icon="inline-end" />
            </a>
          ) : null
        }
      />

      {isLoading ? (
        <OrdersEmpty title="Загружаю заказы" description="Подтягиваю историю покупок." />
      ) : isError ? (
        <OrdersEmpty title="Заказы не загрузились" description="Обнови экран или попробуй позже." />
      ) : orders.length === 0 ? (
        <OrdersEmpty title="Заказов пока нет" description="Открой товар и оформи покупку." />
      ) : (
        <ScreenBody>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
            <TabsList className="grid w-full grid-cols-5">
              {[
                { key: "all" as const, label: "Все" },
                { key: "waiting" as const, label: "Оплата" },
                { key: "review" as const, label: "Проверка" },
                { key: "active" as const, label: "Выдача" },
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
                    <Receipt />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>{order.productTitle || order.subject}</ItemTitle>
                    <ItemDescription>
                      #{order.number}
                      {order.productCategory ? ` · ${order.productCategory}` : ""}
                      {order.paymentMethodTitle && !order.isPaid ? ` · ${order.paymentMethodTitle}` : ""}
                      {" · "}
                      {formatRelativeTimeShort(order.updatedAt)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant={orderBadgeVariant(order)}>{renderPrimaryState(order)}</Badge>
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

function orderBadgeVariant(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") return "default"
  if (order.status === "CANCELLED") return "destructive"
  if (!order.isPaid) return "secondary"
  if (order.status === "CLOSED") return "outline"
  return "default"
}

function renderPrimaryState(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") return "Проверка оплаты"
  if (order.status === "CANCELLED") return "Отменён"
  if (order.status === "CLOSED" && !order.isPaid) return "Не оплачен"
  if (!order.isPaid) return "Ждёт оплату"
  if (order.status === "CLOSED") return "Завершён"
  return "Оплачен"
}

function formatRelativeTimeShort(value: string | Date) {
  const diffMs = Math.max(0, Date.now() - new Date(value).getTime())
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return "сейчас"
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} мин`
  if (diffMs < day) return `${Math.floor(diffMs / hour)} ч`
  return `${Math.floor(diffMs / day)} д`
}
