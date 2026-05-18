"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { getTickets } from "@/lib/api"
import { Badge, Card } from "@/components/ui"
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

      <div className="flex flex-col gap-3 px-4 pb-5">
        {(data?.tickets || []).map((ticket) => (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <Card className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">
                    #{ticket.number} · {ticket.subject}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {ticket.productTitle || "Без товара"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge>{ticket.status}</Badge>
                  {ticket.isPaid ? <Badge className="text-[var(--color-accent)]">Оплачено</Badge> : null}
                </div>
              </div>
              <p className="line-clamp-2 text-sm text-[var(--color-muted)]">{ticket.lastMessage}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Screen>
  )
}
