"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { getTickets } from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function AdminTicketsScreen() {
  const { data } = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    refetchInterval: 10_000,
  })

  const tickets = data?.tickets ?? []

  return (
    <Screen>
      <ScreenHeader title="Тикеты" subtitle="Оплата, статусы и выдача" />

      {tickets.length === 0 ? (
        <ScreenEmpty title="Активных тикетов нет" subtitle="Новые покупки появятся здесь." icon={<span />} />
      ) : (
        <div className="grid gap-3 px-4 pb-4">
          {tickets.map((ticket, index) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="enter-card rounded-2xl bg-[var(--color-surface)] p-4"
              style={{ ["--stagger" as string]: `${Math.min(index, 8) * 28}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    #{ticket.number} · {ticket.subject}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {ticket.productTitle || "Без товара"}
                    {ticket.paymentMethodTitle ? ` · ${ticket.paymentMethodTitle}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                  {renderStatus(ticket.status)}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                {ticket.lastMessage || "Без сообщений"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  )
}

function renderStatus(status: string) {
  switch (status) {
    case "OPEN":
      return "Открыт"
    case "IN_PROGRESS":
      return "В работе"
    case "CLOSED":
      return "Закрыт"
    default:
      return status
  }
}
