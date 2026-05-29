"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Badge,
  Button,
  Cell,
  Placeholder,
  Section,
  SegmentedControl,
} from "@telegram-apps/telegram-ui"
import { ExternalLink, Receipt } from "lucide-react"

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
            <Button size="s" mode="bezeled" Component="a" href={supportLink} target="_blank">
              <span className="inline-flex items-center gap-1.5">
                Поддержка <ExternalLink size={14} />
              </span>
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <Placeholder header="Загружаю заказы" description="Подтягиваю историю покупок.">
          <Receipt size={32} />
        </Placeholder>
      ) : isError ? (
        <Placeholder header="Заказы не загрузились" description="Обнови экран или попробуй позже.">
          <Receipt size={32} />
        </Placeholder>
      ) : orders.length === 0 ? (
        <Placeholder header="Заказов пока нет" description="Открой товар и оформи покупку.">
          <Receipt size={32} />
        </Placeholder>
      ) : (
        <ScreenBody className="gap-3">
          <SegmentedControl>
            {[
              { key: "all" as const, label: "Все" },
              { key: "waiting" as const, label: "Оплата" },
              { key: "review" as const, label: "Проверка" },
              { key: "active" as const, label: "Выдача" },
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
                    before={<OrderBadge order={order} />}
                    subtitle={[
                      `#${order.number}`,
                      order.productCategory,
                      order.paymentMethodTitle && !order.isPaid ? order.paymentMethodTitle : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    description={renderPrimaryState(order)}
                    after={formatDistanceToNow(new Date(order.updatedAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
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
  if (order.status === "PAYMENT_REVIEW") {
    return <Badge type="number" mode="primary">!</Badge>
  }
  if (!order.isPaid) {
    return <Badge type="number" mode="gray">₽</Badge>
  }
  if (order.status === "CANCELLED") {
    return <Badge type="number" mode="critical">×</Badge>
  }
  return <Badge type="number" mode="secondary">✓</Badge>
}

function renderPrimaryState(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") return "Платёж на проверке"
  if (order.status === "CANCELLED") return "Отменён"
  if (order.status === "CLOSED" && !order.isPaid) return "Не оплачен"
  if (!order.isPaid) return "Ожидает оплату"
  if (order.status === "CLOSED") return "Завершён"
  return "Оплачен"
}
