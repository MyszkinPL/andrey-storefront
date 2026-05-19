"use client"

import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Cell, Placeholder, Section, Subheadline, Title } from "@telegram-apps/telegram-ui"

import { createTicket, getMe, getTickets } from "@/lib/api"
import { Badge, Button } from "@/components/ui"
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
          <Button onClick={() => quickTicket.mutate()} variant="secondary">
            Новый
          </Button>
        }
      />

      <Section>
        {tickets.length === 0 ? (
          <Placeholder
            header="Пока нет тикетов"
            description="Открой карточку товара или создай общий тикет, если нужна консультация."
          />
        ) : null}

        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <Cell
              multiline
              subtitle={ticket.productTitle || "Общий запрос"}
              description={ticket.lastMessage || "Без сообщений"}
              after={
                <div className="flex flex-col items-end gap-1">
                  <Badge>{renderStatus(ticket.status)}</Badge>
                  {ticket.isPaid ? <Badge className="text-[var(--color-accent)]">Оплачено</Badge> : null}
                </div>
              }
            >
              <div className="min-w-0">
                <Title level="3">#{ticket.number} · {ticket.subject}</Title>
                <Subheadline level="2">
                  Обновлён{" "}
                  {formatDistanceToNow(new Date(ticket.updatedAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </Subheadline>
              </div>
            </Cell>
          </Link>
        ))}
      </Section>
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
