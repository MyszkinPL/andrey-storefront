"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { CircleDashed, Clock3, Receipt, ShieldCheck } from "lucide-react"

import { getMe, getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

type FilterKey = "all" | "waiting" | "review" | "work" | "closed"

export function AdminTicketsScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tickets", "all"],
    queryFn: () => getTickets({ scope: "all" }),
    refetchInterval: 10_000,
  })
  const [filter, setFilter] = useState<FilterKey>("all")

  const tickets = useMemo(() => (data?.tickets ?? []).filter((ticket) => !isSupport(ticket)), [data?.tickets])
  const buckets = useMemo(() => {
    const waiting = tickets.filter(
      (ticket) =>
        !ticket.isPaid &&
        ticket.status !== "CLOSED" &&
        ticket.status !== "CANCELLED" &&
        ticket.status !== "PAYMENT_REVIEW",
    )
    const review = tickets.filter((ticket) => ticket.status === "PAYMENT_REVIEW")
    const work = tickets.filter(
      (ticket) =>
        ticket.isPaid &&
        !["CLOSED", "CANCELLED"].includes(ticket.status),
    )
    const closed = tickets.filter((ticket) => ["CLOSED", "CANCELLED"].includes(ticket.status))

    return {
      all: tickets,
      waiting,
      review,
      work,
      closed,
    }
  }, [tickets])

  const visibleTickets = buckets[filter]

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
      ) : tickets.length === 0 ? (
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

          {visibleTickets.length === 0 ? (
            <section className="ui-card px-4 py-10 text-center">
              <p className="text-sm font-medium text-[var(--color-text)]">Пусто</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Для этого фильтра сейчас ничего нет.
              </p>
            </section>
          ) : (
            <div className="grid gap-3">
              {visibleTickets.map((ticket) => (
                <Link key={ticket.id} href={`/orders/${ticket.id}`} className="ui-card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        !ticket.isPaid
                            ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                            : "bg-[var(--color-accent)]/16 text-[var(--color-accent)]",
                      )}
                    >
                      {ticket.productTitle?.slice(0, 1).toUpperCase() || "#"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold text-[var(--color-text)]">
                            {ticket.productTitle || ticket.subject}
                          </p>
                          <p className="mt-1 text-sm text-[var(--color-muted)]">
                            #{ticket.number}
                            {ticket.productCategory ? ` · ${ticket.productCategory}` : ""}
                            {ticket.paymentMethodTitle ? ` · ${ticket.paymentMethodTitle}` : ""}
                          </p>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          <StatusPill>{renderPrimaryState(ticket)}</StatusPill>
                          <StatusPill>{renderStatus(ticket.status)}</StatusPill>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                        {renderSummary(ticket)}
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

function isSupport(ticket: Awaited<ReturnType<typeof getTickets>>["tickets"][number]) {
  return !ticket.productTitle && !ticket.paymentMethodTitle
}

function renderStatus(status: string) {
  switch (status) {
    case "OPEN":
      return "Открыт"
    case "IN_PROGRESS":
      return "Выдача"
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

function renderPrimaryState(ticket: Awaited<ReturnType<typeof getTickets>>["tickets"][number]) {
  if (ticket.status === "PAYMENT_REVIEW") {
    return "На проверке"
  }
  if (ticket.status === "CANCELLED") return "Отменён"
  if (ticket.status === "CLOSED" && !ticket.isPaid) return "Не оплачен"
  if (!ticket.isPaid) return "Ждёт оплату"
  if (ticket.status === "IN_PROGRESS") return "Выдача"
  if (ticket.status === "CLOSED") return "Завершён"
  return "Оплачен"
}

function renderSummary(ticket: Awaited<ReturnType<typeof getTickets>>["tickets"][number]) {
  if (ticket.status === "PAYMENT_REVIEW") return "Платёж отмечен и ждёт проверки."
  if (ticket.status === "CANCELLED") return "Заказ отменён."
  if (ticket.status === "CLOSED" && !ticket.isPaid) return "Заказ закрыт без оплаты."
  if (!ticket.isPaid) {
    return ticket.paymentMethodTitle
      ? `Ожидает оплату через ${ticket.paymentMethodTitle}.`
      : "Ожидает оплату."
  }
  if (ticket.status === "IN_PROGRESS") return "Идёт выдача."
  if (ticket.status === "CLOSED") return "Заказ завершён."
  return "Оплата подтверждена."
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
      {children}
    </span>
  )
}
