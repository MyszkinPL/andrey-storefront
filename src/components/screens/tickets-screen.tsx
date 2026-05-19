"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { MessageSquarePlus } from "lucide-react"

import { createTicket, getMe, getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function TicketsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: ticketsData } = useQuery({ queryKey: ["tickets"], queryFn: getTickets })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })

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

  const tickets = ticketsData?.tickets ?? []

  return (
    <Screen>
      <ScreenHeader
        title="Заказы"
        subtitle={meData?.settings.supportIntro || "Покупки, оплата, выдача и поддержка"}
        trailing={
          <button
            onClick={() => quickSupport.mutate()}
            className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-text)]"
          >
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
        <ScreenBody>
          {tickets.map((ticket, index) => {
            const isSupport = !ticket.productTitle && !ticket.paymentMethodTitle

            return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="ui-card enter-card p-3"
              style={{ ["--stagger" as string]: `${Math.min(index, 8) * 28}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-sm font-semibold text-[var(--color-text)]">
                  {ticket.productTitle?.slice(0, 1).toUpperCase() || "#"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {ticket.productTitle || ticket.subject}
                    </p>
                    <span className="shrink-0 text-[11px] text-[var(--color-muted)]">
                      {formatDistanceToNow(new Date(ticket.updatedAt), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="ui-pill">
                      #{ticket.number}
                    </span>
                    {isSupport ? <span className="ui-pill">Поддержка</span> : null}
                    <span className="ui-pill">
                      {renderStatus(ticket.status)}
                    </span>
                    {ticket.isPaid ? (
                      <span className="rounded-full bg-[var(--color-accent)]/14 px-2 py-1 text-[10px] text-[var(--color-accent)]">
                        Оплачено
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-5 text-[var(--color-muted)]">
                    {ticket.lastMessage || "Без сообщений"}
                  </p>
                  {(ticket.paymentMethodTitle || ticket.subject) && (
                    <p className="mt-2 truncate text-[11px] text-[var(--color-muted)]">
                      {ticket.paymentMethodTitle || ticket.subject}
                    </p>
                  )}
                </div>
              </div>
            </Link>
            )
          })}
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
