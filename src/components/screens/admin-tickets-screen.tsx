"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Cell, Placeholder, Section, Subheadline, Title } from "@telegram-apps/telegram-ui"

import { getTickets } from "@/lib/api"
import { Badge } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"

export function AdminTicketsScreen() {
  const { data } = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    refetchInterval: 10_000,
  })

  return (
    <Screen>
      <ScreenHeader title="Тикеты" subtitle="Оплаты, статусы, ручная обработка и автовыдача" />

      <Section header="Очередь">
        {(data?.tickets || []).length === 0 ? (
          <Placeholder
            header="Активных тикетов нет"
            description="Когда кто-то создаст новый запрос на покупку или поддержку, он появится здесь."
          />
        ) : null}

        {(data?.tickets || []).map((ticket) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <Cell
              multiline
              subtitle={ticket.productTitle || "Без товара"}
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
                  {ticket.isPaid ? "Оплата подтверждена" : "Ожидает подтверждения оплаты"}
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
