"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CircleDashed, Clock3, Receipt, ShieldCheck } from "lucide-react"

import { getMe, getOrders } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

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
    const work = orders.filter(
      (order) =>
        order.isPaid &&
        !["CLOSED", "CANCELLED"].includes(order.status),
    )
    const closed = orders.filter((order) => ["CLOSED", "CANCELLED"].includes(order.status))

    return {
      all: orders,
      waiting,
      review,
      work,
      closed,
    }
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
      <ScreenHeader title="Заказы" subtitle="Одна очередь без пустых секций и мусора" />

      {isLoading ? (
        <ScreenEmpty
          title="Загружаю заказы"
          subtitle="Подтягиваю очередь продавца."
          icon={<Clock3 size={28} className="text-[var(--color-muted)]" />}
        />
      ) : isError ? (
        <ScreenEmpty
          title="Очередь не загрузилась"
          subtitle="Обнови экран или попробуй позже."
          icon={<Clock3 size={28} className="text-[var(--color-muted)]" />}
        />
      ) : orders.length === 0 ? (
        <ScreenEmpty
          title="Активных заказов нет"
          subtitle="Новые покупки появятся здесь."
          icon={<Clock3 size={28} className="text-[var(--color-muted)]" />}
        />
      ) : (
        <ScreenBody className="gap-4">
          <section className="ui-card p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              {[
                {
                  key: "all" as const,
                  label: "Все",
                  count: buckets.all.length,
                  icon: <Clock3 size={14} />,
                },
                {
                  key: "waiting" as const,
                  label: "Ждут оплату",
                  count: buckets.waiting.length,
                  icon: <Receipt size={14} />,
                },
                {
                  key: "review" as const,
                  label: "На проверке",
                  count: buckets.review.length,
                  icon: <CircleDashed size={14} />,
                },
                {
                  key: "work" as const,
                  label: "Выдача",
                  count: buckets.work.length,
                  icon: <ShieldCheck size={14} />,
                },
                {
                  key: "closed" as const,
                  label: "Закрытые",
                  count: buckets.closed.length,
                  icon: <Clock3 size={14} />,
                },
              ].map((item) => {
                const active = filter === item.key

                return (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                        : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                    )}
                  >
                    {item.icon}
                    {item.label}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px]",
                        active
                          ? "bg-[var(--color-accent-text)]/14 text-[var(--color-accent-text)]"
                          : "bg-[var(--color-surface)] text-[var(--color-text)]",
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {visibleOrders.length === 0 ? (
            <section className="ui-card px-4 py-10 text-center">
              <p className="text-sm font-medium text-[var(--color-text)]">Пусто</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Для этого фильтра сейчас ничего нет.
              </p>
            </section>
          ) : (
            <div className="grid gap-3">
              {visibleOrders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="ui-card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        !order.isPaid
                            ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                            : "bg-[var(--color-accent)]/16 text-[var(--color-accent)]",
                      )}
                    >
                      {order.productTitle?.slice(0, 1).toUpperCase() || "#"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[var(--color-text)]">
                            {order.productTitle || order.subject}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            #{order.number}
                            {order.productCategory ? ` · ${order.productCategory}` : ""}
                            {order.paymentMethodTitle ? ` · ${order.paymentMethodTitle}` : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <StatusPill>{renderPrimaryState(order)}</StatusPill>
                          <StatusPill>{renderStatus(order.status)}</StatusPill>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                        {renderSummary(order)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScreenBody>
      )}
    </Screen>
  )
}

function renderStatus(status: string) {
  switch (status) {
    case "OPEN":
      return "Открыт"
    case "CLOSED":
      return "Закрыт"
    case "PAYMENT_REVIEW":
      return "Проверка оплаты"
    case "CANCELLED":
      return "Отменён"
    default:
      return status
  }
}

function renderPrimaryState(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") {
    return "На проверке"
  }
  if (order.status === "CANCELLED") return "Отменён"
  if (order.status === "CLOSED" && !order.isPaid) return "Не оплачен"
  if (!order.isPaid) return "Ждёт оплату"
  if (order.status === "CLOSED") return "Завершён"
  return "Оплачен"
}

function renderSummary(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (order.status === "PAYMENT_REVIEW") return "Платёж отмечен и ждёт проверки."
  if (order.status === "CANCELLED") return "Заказ отменён."
  if (order.status === "CLOSED" && !order.isPaid) return "Заказ закрыт без оплаты."
  if (!order.isPaid) {
    return order.paymentMethodTitle
      ? `Ожидает оплату через ${order.paymentMethodTitle}.`
      : "Ожидает оплату."
  }
  if (order.status === "CLOSED") return "Заказ завершён."
  return "Оплата подтверждена."
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
      {children}
    </span>
  )
}
