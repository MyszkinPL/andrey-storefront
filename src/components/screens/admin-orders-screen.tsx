"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Badge, Cell, Placeholder, Section, SegmentedControl } from "@telegram-apps/telegram-ui"
import { Clock3, Receipt } from "lucide-react"

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
        <Placeholder header="Загружаю заказы" description="Подтягиваю очередь продавца.">
          <Clock3 size={32} />
        </Placeholder>
      ) : isError ? (
        <Placeholder header="Очередь не загрузилась" description="Обнови экран или попробуй позже.">
          <Clock3 size={32} />
        </Placeholder>
      ) : orders.length === 0 ? (
        <Placeholder header="Заказов нет" description="Новые покупки появятся здесь.">
          <Clock3 size={32} />
        </Placeholder>
      ) : (
        <ScreenBody className="gap-3">
          <SegmentedControl>
            {[
              { key: "all" as const, label: "Все" },
              { key: "waiting" as const, label: "Оплата" },
              { key: "review" as const, label: "Проверка" },
              { key: "work" as const, label: "Выдача" },
              { key: "closed" as const, label: "История" },
            ].map((item) => (
              <SegmentedControl.Item
                key={item.key}
                selected={filter === item.key}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl>

          {visibleOrders.length === 0 ? (
            <Placeholder header="Пусто" description="Для этого фильтра сейчас ничего нет." />
          ) : (
            <Section>
              {visibleOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Cell
                    multiline
                    before={<Receipt size={24} />}
                    titleBadge={<OrderBadge order={order} />}
                    subtitle={[
                      `#${order.number}`,
                      order.productCategory,
                      order.paymentMethodTitle,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    description={renderSummary(order)}
                  >
                    {order.productTitle || order.subject}
                  </Cell>
                </Link>
              ))}
            </Section>
          )}
        </ScreenBody>
      )}
    </Screen>
  )
}

function OrderBadge({
  order,
}: {
  order: Awaited<ReturnType<typeof getOrders>>["orders"][number]
}) {
  if (order.status === "PAYMENT_REVIEW") return <Badge type="number" mode="primary">!</Badge>
  if (order.status === "CANCELLED") return <Badge type="number" mode="critical">×</Badge>
  if (!order.isPaid) return <Badge type="number" mode="gray">₽</Badge>
  return <Badge type="number" mode="secondary">✓</Badge>
}

function renderSummary(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") return "Покупатель отметил оплату."
  if (order.status === "CANCELLED") return "Заказ отменён."
  if (order.status === "CLOSED" && !order.isPaid) return "Закрыт без оплаты."
  if (!order.isPaid) return "Ожидает оплату."
  if (order.status === "CLOSED") return "Завершён."
  return "Оплачен, нужна выдача."
}
