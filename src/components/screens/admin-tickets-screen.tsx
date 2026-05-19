"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Clock3, Headset, Receipt, ShieldCheck } from "lucide-react"

import { getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function AdminTicketsScreen() {
  const { data } = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets,
    refetchInterval: 10_000,
  })

  const tickets = data?.tickets ?? []
  const support = tickets.filter(isSupport)
  const waitingPayment = tickets.filter(
    (ticket) => !isSupport(ticket) && !ticket.isPaid && ticket.status !== "CLOSED",
  )
  const inProgress = tickets.filter(
    (ticket) => !isSupport(ticket) && ticket.isPaid && ticket.status !== "CLOSED",
  )
  const closed = tickets.filter((ticket) => !isSupport(ticket) && ticket.status === "CLOSED")

  return (
    <Screen>
      <ScreenHeader title="Заказы" subtitle="Очередь оплаты, выдачи и поддержки" />

      {tickets.length === 0 ? (
        <ScreenEmpty
          title="Активных заказов нет"
          subtitle="Новые покупки появятся здесь."
          icon={<Clock3 size={28} className="text-[var(--color-muted)]" />}
        />
      ) : (
        <ScreenBody className="gap-4">
          <AdminTicketSection
            title="Ждут оплаты"
            subtitle="Сначала эти заказы."
            items={waitingPayment}
            icon={<Receipt size={16} />}
          />
          <AdminTicketSection
            title="В работе"
            subtitle="Оплачено, можно выдавать."
            items={inProgress}
            icon={<ShieldCheck size={16} />}
          />
          <AdminTicketSection
            title="Поддержка"
            subtitle="Отдельная линия обращений."
            items={support}
            icon={<Headset size={16} />}
          />
          <AdminTicketSection
            title="Закрытые"
            subtitle="История завершённых заказов."
            items={closed}
            icon={<Clock3 size={16} />}
          />
        </ScreenBody>
      )}
    </Screen>
  )
}

function AdminTicketSection({
  title,
  subtitle,
  items,
  icon,
}: {
  title: string
  subtitle: string
  items: Awaited<ReturnType<typeof getTickets>>["tickets"]
  icon: React.ReactNode
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center gap-3 px-1">
        <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[22px] bg-[var(--color-surface)] px-4 py-4 text-sm text-[var(--color-muted)]">
          Пусто
        </div>
      ) : (
        items.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="ui-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-sm font-semibold text-[var(--color-text)]">
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
                      {ticket.productCategory ? ` · ${ticket.productCategory}` : ""}
                      {ticket.paymentMethodTitle ? ` · ${ticket.paymentMethodTitle}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <StatusPill>{renderStatus(ticket.status)}</StatusPill>
                    <StatusPill>{ticket.isPaid ? "Оплачен" : "Без оплаты"}</StatusPill>
                  </div>
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

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
      {children}
    </span>
  )
}
