"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CheckCheck, CreditCard, RefreshCcw, Shield, User2 } from "lucide-react"

import {
  confirmTicketPayment,
  getTicket,
  refreshCryptoInvoice,
  sendTicketMessage,
  updateTicketStatus,
} from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

export function TicketDetailScreen({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const haptic = useHaptic()
  const queryClient = useQueryClient()
  const [message, setMessage] = useState("")
  const { data } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    refetchInterval: 10_000,
  })

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
    await queryClient.invalidateQueries({ queryKey: ["tickets"] })
  }

  const sendMutation = useMutation({
    mutationFn: () => sendTicketMessage(ticketId, message.trim()),
    onSuccess: async () => {
      setMessage("")
      haptic.success()
      await invalidate()
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: "OPEN" | "IN_PROGRESS" | "CLOSED") => updateTicketStatus(ticketId, status),
    onSuccess: invalidate,
  })

  const paymentMutation = useMutation({
    mutationFn: () => confirmTicketPayment(ticketId),
    onSuccess: invalidate,
  })

  const refreshMutation = useMutation({
    mutationFn: () => refreshCryptoInvoice(ticketId),
    onSuccess: invalidate,
  })

  const isClosed = data?.ticket.status === "CLOSED"
  const canSend = message.trim().length > 0 && !isClosed && !sendMutation.isPending

  useBackButton(() => router.back())
  useMainButton({
    text: sendMutation.isPending ? "Отправка..." : "Отправить",
    onClick: () => canSend && sendMutation.mutate(),
    visible: true,
    enabled: canSend,
    progress: sendMutation.isPending,
  })

  if (!data?.ticket) return null

  const ticket = data.ticket

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader
        title={ticket.productTitle || ticket.subject}
        subtitle={`#${ticket.number} · ${renderStatus(ticket.status)}`}
      />

      <div className="grid gap-3 px-4 pb-4">
        <section className="rounded-[24px] bg-[var(--color-surface)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
              {ticket.isPaid ? "Оплачено" : "Ожидает оплату"}
            </span>
            {ticket.paymentMethodTitle ? (
              <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
                {ticket.paymentMethodTitle}
              </span>
            ) : null}
            <span className="ml-auto text-[11px] text-[var(--color-muted)]">
              {format(new Date(ticket.createdAt), "dd MMM · HH:mm", { locale: ru })}
            </span>
          </div>

          {ticket.paymentMethodTitle ? (
            <div className="mt-3 rounded-[20px] bg-[var(--color-bg)] p-3">
              <div className="flex items-center gap-3">
                <PaymentMethodIcon
                  iconDataUrl={ticket.paymentMethodIconDataUrl}
                  title={ticket.paymentMethodTitle}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">{ticket.paymentMethodTitle}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {ticket.paymentMethodType === "CRYPTO_PAY" ? "Crypto Pay" : "Ручные реквизиты"}
                  </p>
                </div>
                {ticket.paymentMethodType === "CRYPTO_PAY" ? (
                  <button
                    onClick={() => refreshMutation.mutate()}
                    className="flex size-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]"
                  >
                    <RefreshCcw size={14} className={refreshMutation.isPending ? "animate-spin" : ""} />
                  </button>
                ) : null}
              </div>

              {ticket.paymentMethodDetails ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
                  {ticket.paymentMethodDetails}
                </p>
              ) : null}

              {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                <div className="mt-3 grid gap-2">
                  <div className="rounded-2xl bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-muted)]">
                    {ticket.cryptoInvoiceStatus || "invoice"}
                    {ticket.cryptoInvoiceAmount ? ` · ${ticket.cryptoInvoiceAmount}` : ""}
                    {ticket.cryptoInvoiceAsset ? ` · ${ticket.cryptoInvoiceAsset}` : ""}
                  </div>
                  <a
                    href={ticket.cryptoInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-accent-text)]"
                  >
                    Оплатить invoice
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}

          {ticket.isAdmin ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {!ticket.isPaid ? (
                <button
                  onClick={() => paymentMutation.mutate()}
                  className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-text)]"
                >
                  Подтвердить оплату
                </button>
              ) : null}
              <button
                onClick={() => statusMutation.mutate("IN_PROGRESS")}
                className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
              >
                В работу
              </button>
              <button
                onClick={() => statusMutation.mutate("CLOSED")}
                className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
              >
                Закрыть
              </button>
            </div>
          ) : null}
        </section>

        {ticket.deliveredKey ? (
          <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
            <p className="mt-3 break-all rounded-2xl bg-[var(--color-bg)] p-3 font-mono text-sm text-[var(--color-text)]">
              {ticket.deliveredKey}
            </p>
          </div>
        ) : null}

        {ticket.messages.length === 0 ? (
          <ScreenEmpty
            title="Сообщений пока нет"
            subtitle="Напиши первым, чтобы открыть диалог."
            icon={<CreditCard size={28} className="text-[var(--color-muted)]" />}
          />
        ) : (
          <div className="grid gap-3">
            {ticket.messages.map((entry) => {
              const isAdmin = entry.senderRole === "ADMIN"
              return (
                <div
                  key={entry.id}
                  className={cn("flex gap-2", entry.isMine ? "justify-end" : "justify-start")}
                >
                  {!entry.isMine ? (
                    <SenderAvatar isAdmin={isAdmin} />
                  ) : null}
                  <div
                    className={cn(
                      "max-w-[84%] rounded-[22px] px-4 py-3",
                      entry.isMine
                        ? "rounded-br-md bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                        : "rounded-bl-md bg-[var(--color-surface)] text-[var(--color-text)]",
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={cn("text-xs font-semibold", entry.isMine ? "text-[var(--color-accent-text)]/88" : "text-[var(--color-text)]")}>
                        {entry.isMine ? "Ты" : entry.senderName}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px]",
                          entry.isMine
                            ? "bg-white/12 text-[var(--color-accent-text)]/88"
                            : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                        )}
                      >
                        {isAdmin ? "Админ" : "Покупатель"}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "whitespace-pre-wrap text-sm leading-6",
                        entry.isMine ? "text-[var(--color-accent-text)]" : "text-[var(--color-text)]",
                      )}
                    >
                      {entry.body}
                    </p>
                    <div
                      className={cn(
                        "mt-2 flex items-center justify-end gap-1 text-[11px]",
                        entry.isMine ? "text-[var(--color-accent-text)]/78" : "text-[var(--color-muted)]",
                      )}
                    >
                      <span>{format(new Date(entry.createdAt), "HH:mm", { locale: ru })}</span>
                      {entry.isMine ? <CheckCheck size={12} /> : null}
                    </div>
                  </div>
                  {entry.isMine ? (
                    <SenderAvatar isAdmin={isAdmin} mine />
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isClosed ? "Тикет закрыт" : "Сообщение"}
            disabled={isClosed}
            className="min-h-24 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
          />
        </div>
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

function PaymentMethodIcon({
  iconDataUrl,
  title,
}: {
  iconDataUrl: string | null
  title: string
}) {
  if (iconDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={iconDataUrl} alt="" className="size-12 rounded-2xl object-cover" />
    )
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}

function SenderAvatar({ isAdmin, mine = false }: { isAdmin: boolean; mine?: boolean }) {
  return (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        mine ? "bg-[var(--color-surface)]" : "bg-[var(--color-surface)]",
      )}
    >
      {isAdmin ? (
        <Shield size={15} className={mine ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"} />
      ) : (
        <User2 size={15} className={mine ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]"} />
      )}
    </div>
  )
}
