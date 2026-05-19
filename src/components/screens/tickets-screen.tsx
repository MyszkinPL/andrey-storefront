"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { MessageSquarePlus, Ticket } from "lucide-react"

import { createTicket, getMe, getTickets } from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function TicketsScreen() {
  const queryClient = useQueryClient()
  const { data: ticketsData } = useQuery({ queryKey: ["tickets"], queryFn: getTickets })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })

  const quickTicket = useMutation({
    mutationFn: () =>
      createTicket({
        subject: "Нужна помощь",
        message: "Нужна консультация по товарам, оплате и выдаче.",
      }),
    onSuccess: async ({ ticketId }) => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      window.location.href = `/tickets/${ticketId}`
    },
  })

  const tickets = ticketsData?.tickets ?? []

  return (
    <Screen>
      <ScreenHeader
        title="Тикеты"
        subtitle={meData?.settings.supportIntro || "Связь с продавцом и покупки"}
        trailing={
          <button
            onClick={() => quickTicket.mutate()}
            className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-text)]"
          >
            Новый
          </button>
        }
      />

      {tickets.length === 0 ? (
        <ScreenEmpty
          icon={<MessageSquarePlus size={32} className="text-[var(--color-muted)]" />}
          title="Тикетов пока нет"
          subtitle="Открой товар и создай покупку или общий запрос."
        />
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
                    {ticket.productTitle || "Общий запрос"}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                  {renderStatus(ticket.status)}
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                {ticket.lastMessage || "Без сообщений"}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-muted)]">
                <span>
                  Обновлён{" "}
                  {formatDistanceToNow(new Date(ticket.updatedAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                {ticket.isPaid ? (
                  <span className="rounded-full bg-[var(--color-accent)]/12 px-2 py-1 text-[var(--color-accent)]">
                    Оплачено
                  </span>
                ) : (
                  <Ticket size={14} />
                )}
              </div>
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
