"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CheckCheck,
  Clock3,
  Headset,
  MessageSquarePlus,
  Receipt,
  Wallet,
} from "lucide-react"

import { createTicket, getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

type FilterKey = "all" | "waiting" | "review" | "active" | "support" | "closed"

export function TicketsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: ticketsData } = useQuery({ queryKey: ["tickets"], queryFn: getTickets })
  const [filter, setFilter] = useState<FilterKey>("all")

  const quickSupport = useMutation({
    mutationFn: () =>
      createTicket({
        subject: "Обращение в поддержку",
        message: "Нужна консультация по товарам, оплате и выдаче.",
      }),
    onSuccess: async ({ ticketId }) => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      router.push(`/tickets/${ticketId}`)
    },
  })

  const tickets = useMemo(() => ticketsData?.tickets ?? [], [ticketsData?.tickets])
  const buckets = useMemo(() => {
    const waiting = tickets.filter(
      (ticket) =>
        !isSupport(ticket) &&
        !ticket.isPaid &&
        !["CLOSED", "CANCELLED", "PAYMENT_REVIEW"].includes(ticket.status),
    )
    const active = tickets.filter(
      (ticket) =>
        !isSupport(ticket) &&
        ticket.isPaid &&
        !["CLOSED", "CANCELLED"].includes(ticket.status),
    )
    const review = tickets.filter(
      (ticket) => !isSupport(ticket) && ticket.status === "PAYMENT_REVIEW",
    )
    const support = tickets.filter(isSupport)
    const closed = tickets.filter(
      (ticket) => !isSupport(ticket) && ["CLOSED", "CANCELLED"].includes(ticket.status),
    )

    return {
      all: [...waiting, ...review, ...active, ...support, ...closed],
      waiting,
      review,
      active,
      support,
      closed,
    }
  }, [tickets])

  const visibleTickets = buckets[filter]

  return (
    <Screen>
      <ScreenHeader
        title="Заказы"
        trailing={
          <button
            onClick={() => quickSupport.mutate()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-text)] transition-transform duration-150 active:scale-[0.97]"
          >
            <Headset size={14} />
            Поддержка
          </button>
        }
      />

      {tickets.length === 0 ? (
        <ScreenEmpty
          icon={<MessageSquarePlus size={32} className="text-[var(--color-muted)]" />}
          title="Заказов пока нет"
          subtitle="Открой товар и оформи покупку."
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
                  key: "support" as const,
                  label: "Поддержка",
                  count: buckets.support.length,
                  icon: <Headset size={14} />,
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
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors duration-150 active:scale-[0.97]",
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
              {visibleTickets.map((ticket, index) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="ui-card enter-card p-4"
                  style={{ ["--stagger" as string]: `${Math.min(index, 8) * 28}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                        isSupport(ticket)
                          ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                          : !ticket.isPaid
                            ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                            : "bg-[var(--color-accent)]/16 text-[var(--color-accent)]",
                      )}
                    >
                      {isSupport(ticket) ? (
                        <Headset size={16} />
                      ) : !ticket.isPaid ? (
                        <Wallet size={16} />
                      ) : (
                        ticket.productTitle?.slice(0, 1).toUpperCase() || "#"
                      )}
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
                          </p>
                        </div>

                        <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                          {formatDistanceToNow(new Date(ticket.updatedAt), {
                            addSuffix: true,
                            locale: ru,
                          })}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <StatusPill emphasize={!isSupport(ticket) && !ticket.isPaid}>
                          {renderPrimaryState(ticket)}
                        </StatusPill>
                        <StatusPill>{renderStatus(ticket.status)}</StatusPill>
                        {ticket.paymentMethodTitle ? (
                          <StatusPill>{ticket.paymentMethodTitle}</StatusPill>
                        ) : null}
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                        {renderPreview(ticket)}
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
    case "PAYMENT_REVIEW":
      return "Проверка оплаты"
    case "IN_PROGRESS":
      return "В работе"
    case "CLOSED":
      return "Закрыт"
    case "CANCELLED":
      return "Отменён"
    default:
      return status
  }
}

function renderPrimaryState(ticket: Awaited<ReturnType<typeof getTickets>>["tickets"][number]) {
  if (isSupport(ticket)) return "Поддержка"
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

function renderPreview(ticket: Awaited<ReturnType<typeof getTickets>>["tickets"][number]) {
  if (isSupport(ticket)) return ticket.lastMessage || "Открой обращение"
  if (ticket.status === "PAYMENT_REVIEW") {
    return "Платёж отмечен. Ждёт проверки админа."
  }
  if (ticket.status === "CANCELLED") return "Заказ отменён."
  if (!ticket.isPaid) {
    return ticket.paymentMethodTitle
      ? `Ожидает оплату через ${ticket.paymentMethodTitle}.`
      : "Ожидает оплату."
  }
  return ticket.lastMessage || "Открой заказ для выдачи и переписки."
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
