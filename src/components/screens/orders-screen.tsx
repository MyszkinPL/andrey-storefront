"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { ExternalLink, Receipt } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
            <div className="flex flex-col gap-3">
              {visibleOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle className="truncate">{order.productTitle || order.subject}</CardTitle>
                      <CardDescription>
                        #{order.number}
                        {order.productCategory ? ` · ${order.productCategory}` : ""}
                      </CardDescription>
                      <CardAction className="max-w-28">
                        <span className="block truncate text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(order.updatedAt), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
                      </CardAction>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3">
                      <Badge variant={orderBadgeVariant(order)}>{renderPrimaryState(order)}</Badge>
                      {order.paymentMethodTitle && !order.isPaid ? (
                        <span className="min-w-0 truncate text-xs text-muted-foreground">
                          {order.paymentMethodTitle}
                        </span>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
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
