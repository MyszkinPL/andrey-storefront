"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Clock3 } from "lucide-react"

import { getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function AdminTicketsScreen() {
  const { data } = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    refetchInterval: 10_000,
  })

  const tickets = data?.tickets ?? []

  return (
    <Screen>
      <ScreenHeader title="Заказы" subtitle="Оплата, статусы, выдача и чат" />

      {tickets.length === 0 ? (
        <ScreenEmpty title="Активных заказов нет" subtitle="Новые покупки появятся здесь." icon={<Clock3 size={28} className="text-[var(--color-muted)]" />} />
      ) : (
        <ScreenBody>
          {tickets.map((ticket, index) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="ui-card enter-card p-4"
              style={{ ["--stagger" as string]: `${Math.min(index, 8) * 28}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-sm font-semibold text-[var(--color-text)]">
                  {ticket.productTitle?.slice(0, 1).toUpperCase() || "#"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                        {ticket.productTitle || ticket.subject}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        #{ticket.number}
                        {ticket.paymentMethodTitle ? ` · ${ticket.paymentMethodTitle}` : ""}
                      </p>
                    </div>
                    <span className="ui-pill">{renderStatus(ticket.status)}</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                    {ticket.lastMessage || "Без сообщений"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </ScreenBody>
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
