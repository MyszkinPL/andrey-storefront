"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CheckCheck,
  Clock3,
  ExternalLink,
  MessageSquarePlus,
  Receipt,
  Wallet,
} from "lucide-react"

import { getMe, getOrders } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

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
      (order) =>
        order.isPaid &&
        !["CLOSED", "CANCELLED"].includes(order.status),
    )
    const review = orders.filter((order) => order.status === "PAYMENT_REVIEW")
    const closed = orders.filter(
      (order) => ["CLOSED", "CANCELLED"].includes(order.status),
    )

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
        inlineTrailingMobile
        title={
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p>Заказы</p>
              <p className="mt-1 text-xs font-normal text-[var(--color-muted)]">
                {buckets.active.length} активных · {buckets.waiting.length} ждут оплату
              </p>
            </div>
          </div>
        }
        trailing={
          <a
            href={supportLink || "#"}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-transform duration-150 active:scale-[0.97]",
              supportLink
                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                : "bg-[var(--color-bg)] text-[var(--color-muted)] pointer-events-none",
            )}
          >
            <ExternalLink size={13} />
            Поддержка
          </a>
        }
      />

      {isLoading ? (
        <ScreenEmpty
          icon={<MessageSquarePlus size={32} className="text-[var(--color-muted)]" />}
          title="Загружаю заказы"
          subtitle="Подтягиваю историю покупок."
        />
      ) : isError ? (
        <ScreenEmpty
          icon={<MessageSquarePlus size={32} className="text-[var(--color-muted)]" />}
          title="Заказы не загрузились"
          subtitle="Обнови экран или попробуй позже."
        />
      ) : orders.length === 0 ? (
        <ScreenEmpty
          icon={<MessageSquarePlus size={32} className="text-[var(--color-muted)]" />}
          title="Заказов пока нет"
          subtitle="Открой товар и оформи покупку."
        />
      ) : (
        <ScreenBody className="gap-3">
          <section className="ui-card p-2.5">
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
                  label: "Проверка",
                  count: buckets.review.length,
                  icon: <Receipt size={14} />,
                },
                {
                  key: "active" as const,
                  label: "Активные",
                  count: buckets.active.length,
                  icon: <CheckCheck size={14} />,
                },
                {
                  key: "closed" as const,
                  label: "История",
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
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] sm:text-xs transition-colors duration-150 active:scale-[0.97]",
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
              {visibleOrders.map((order, index) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="ui-card enter-card p-3.5"
                  style={{ ["--stagger" as string]: `${Math.min(index, 8) * 28}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        !order.isPaid
                            ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                            : "bg-[var(--color-accent)]/16 text-[var(--color-accent)]",
                      )}
                    >
                      {!order.isPaid ? (
                        <Wallet size={16} />
                      ) : (
                        order.productTitle?.slice(0, 1).toUpperCase() || "#"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-[var(--color-text)]">
                            {order.productTitle || order.subject}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            #{order.number}
                            {order.productCategory ? ` · ${order.productCategory}` : ""}
                          </p>
                        </div>

                        <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                          {formatDistanceToNow(new Date(order.updatedAt), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <StatusPill emphasize={!order.isPaid}>
                          {renderPrimaryState(order)}
                        </StatusPill>
                        {showPaymentMethodPill(order) ? (
                          <StatusPill>{order.paymentMethodTitle}</StatusPill>
                        ) : null}
                      </div>
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

function showPaymentMethodPill(order: Awaited<ReturnType<typeof getOrders>>["orders"][number]) {
  if (!order.paymentMethodTitle) return false
  return !order.isPaid || order.status === "PAYMENT_REVIEW"
}

function StatusPill({
  children,
  emphasize = false,
}: {
  children: React.ReactNode
  emphasize?: boolean
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px]",
        emphasize
          ? "bg-[var(--color-accent)]/14 text-[var(--color-accent)]"
          : "bg-[var(--color-bg)] text-[var(--color-muted)]",
      )}
    >
      {children}
    </span>
  )
}
