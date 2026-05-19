"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { Headset, MessageSquarePlus, Wallet } from "lucide-react"

import { createTicket, getMe, getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

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
  const pendingPayment = tickets.filter(
    (ticket) => !isSupport(ticket) && !ticket.isPaid && ticket.status !== "CLOSED",
  )
  const activeOrders = tickets.filter(
    (ticket) => !isSupport(ticket) && (ticket.isPaid || ticket.status === "IN_PROGRESS"),
  )
  const supportOrders = tickets.filter(isSupport)
  const closedOrders = tickets.filter(
    (ticket) => !isSupport(ticket) && ticket.status === "CLOSED" && !activeOrders.includes(ticket),
  )

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
        <ScreenBody className="gap-4">
          <TicketSection
            title="Ждут оплаты"
            subtitle="Сначала оплата, потом выдача и чат."
            items={pendingPayment}
            emptyText="Неоплаченных заказов нет"
          />
          <TicketSection
            title="Активные"
            subtitle="Оплаченные и обрабатываемые заказы."
            items={activeOrders}
            emptyText="Сейчас ничего не обрабатывается"
          />
          <TicketSection
            title="Поддержка"
            subtitle="Отдельно от заказов, чтобы не мешать оплате."
            items={supportOrders}
            emptyText="Обращений в поддержку нет"
          />
          <TicketSection
            title="Завершённые"
            subtitle="Закрытые заказы и история."
            items={closedOrders}
            emptyText="Закрытых заказов пока нет"
          />
        </ScreenBody>
      )}
    </Screen>
  )
}

function TicketSection({
  title,
  subtitle,
  items,
  emptyText,
}: {
  title: string
  subtitle: string
  items: Awaited<ReturnType<typeof getTickets>>["tickets"]
  emptyText: string
}) {
  return (
    <section className="grid gap-3">
      <div className="px-1">
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[22px] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-muted)]">
          {emptyText}
        </div>
      ) : (
        items.map((ticket, index) => (
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
                    : ticket.isPaid
                      ? "bg-[var(--color-accent)]/16 text-[var(--color-accent)]"
                      : "bg-[var(--color-bg)] text-[var(--color-text)]",
                )}
              >
                {isSupport(ticket) ? (
                  <Headset size={17} />
                ) : !ticket.isPaid ? (
                  <Wallet size={17} />
                ) : (
                  ticket.productTitle?.slice(0, 1).toUpperCase() || "#"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {ticket.productTitle || ticket.subject}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
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

                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill>{isSupport(ticket) ? "Поддержка" : renderOrderState(ticket)}</StatusPill>
                  <StatusPill>{renderStatus(ticket.status)}</StatusPill>
                  {ticket.paymentMethodTitle ? <StatusPill>{ticket.paymentMethodTitle}</StatusPill> : null}
                </div>

                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--color-muted)]">
                  {ticket.lastMessage || "Без сообщений"}
                </p>
              </div>
            </div>
          </Link>
        ))
      )}
    </section>
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
      return "В работе"
    case "CLOSED":
      return "Закрыт"
    default:
      return status
  }
}

function renderOrderState(ticket: Awaited<ReturnType<typeof getTickets>>["tickets"][number]) {
  if (ticket.status === "CLOSED" && !ticket.isPaid) return "Не оплачен"
  if (!ticket.isPaid) return "Ждёт оплату"
  if (ticket.status === "CLOSED") return "Завершён"
  if (ticket.status === "IN_PROGRESS") return "Выдача"
  return "Оплачен"
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
      {children}
    </span>
  )
}
