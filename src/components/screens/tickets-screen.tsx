"use client"

import Link from "next/link"
import { MessageCirclePlus } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

import { createTicket, getMe, getTickets } from "@/lib/api"
import { Badge, Button, Card } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"

export function TicketsScreen() {
  const queryClient = useQueryClient()
  const { data: ticketsData } = useQuery({ queryKey: ["tickets"], queryFn: getTickets })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })

  const quickTicket = useMutation({
    mutationFn: () =>
      createTicket({
        subject: "Нужна помощь",
        message: "Нужна консультация по подпискам, ключам и оплате.",
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
        subtitle={meData?.settings.supportIntro}
        trailing={
          <Button
            onClick={() => quickTicket.mutate()}
            variant="secondary"
            className="flex items-center gap-2 px-3 py-2"
          >
            <MessageCirclePlus size={16} />
            Новый
          </Button>
        }
      />

      <div className="flex flex-col gap-3 px-4 pb-5">
        {tickets.length === 0 ? (
          <Card className="p-5">
            <p className="text-base font-medium">Пока нет тикетов</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Открой карточку товара или создай общий тикет, если нужна консультация.
            </p>
          </Card>
        ) : null}

        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <Card className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">
                    #{ticket.number} · {ticket.subject}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {ticket.productTitle || "Общий запрос"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge>{renderStatus(ticket.status)}</Badge>
                  {ticket.isPaid ? <Badge className="text-[var(--color-accent)]">Оплачено</Badge> : null}
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-[var(--color-muted)]">
                {ticket.lastMessage || "Без сообщений"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                Обновлён{" "}
                {formatDistanceToNow(new Date(ticket.updatedAt), {
                  addSuffix: true,
                  locale: ru,
                })}
              </p>
            </Card>
          </Link>
        ))}
      </div>
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
