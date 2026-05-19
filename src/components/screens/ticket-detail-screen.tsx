"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { CreditCard, RefreshCcw } from "lucide-react"

import {
  confirmTicketPayment,
  getTicket,
  refreshCryptoInvoice,
  sendTicketMessage,
  updateTicketStatus,
} from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"

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

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
    await queryClient.invalidateQueries({ queryKey: ["tickets"] })
  }

  const isClosed = data?.ticket.status === "CLOSED"
  const canSend = message.trim().length > 0 && !isClosed && !sendMutation.isPending

  useBackButton(() => router.back())
  useMainButton({
    text: sendMutation.isPending ? "Отправка..." : "Отправить сообщение",
    onClick: () => canSend && sendMutation.mutate(),
    visible: true,
    enabled: canSend,
    progress: sendMutation.isPending,
  })

  if (!data?.ticket) return null

  const ticket = data.ticket

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader title={`#${ticket.number}`} subtitle={ticket.subject} />

      <div className="grid gap-3 px-4 pb-4">
        <section className="rounded-[24px] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {ticket.productTitle || "Общий запрос"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {ticket.isPaid ? "Оплачено" : "Ожидает оплату"} · {renderStatus(ticket.status)}
              </p>
            </div>
            <div className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-[11px] text-[var(--color-muted)]">
              {format(new Date(ticket.createdAt), "dd MMM · HH:mm", { locale: ru })}
            </div>
          </div>
        </section>

        {ticket.paymentMethodTitle ? (
          <section className="rounded-[24px] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-3">
              <PaymentMethodIcon
                iconDataUrl={ticket.paymentMethodIconDataUrl}
                title={ticket.paymentMethodTitle}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-text)]">{ticket.paymentMethodTitle}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {ticket.paymentMethodType === "CRYPTO_PAY" ? "Crypto Pay" : "Ручной способ оплаты"}
                </p>
              </div>
              {ticket.paymentMethodType === "CRYPTO_PAY" ? (
                <button
                  onClick={() => refreshMutation.mutate()}
                  className="flex size-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]"
                >
                  <RefreshCcw size={15} className={refreshMutation.isPending ? "animate-spin" : ""} />
                </button>
              ) : null}
            </div>

            {ticket.paymentMethodDetails ? (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
                {ticket.paymentMethodDetails}
              </p>
            ) : null}

            {ticket.paymentMethodType === "CRYPTO_PAY" ? (
              <div className="mt-3 grid gap-3">
                <div className="rounded-2xl bg-[var(--color-bg)] p-3 text-sm text-[var(--color-muted)]">
                  <p>Статус: {ticket.cryptoInvoiceStatus || "не создан"}</p>
                  {ticket.cryptoInvoiceAsset ? <p className="mt-1">Asset: {ticket.cryptoInvoiceAsset}</p> : null}
                  {ticket.cryptoInvoiceAmount ? <p className="mt-1">Amount: {ticket.cryptoInvoiceAmount}</p> : null}
                </div>
                {ticket.cryptoInvoiceUrl ? (
                  <a
                    href={ticket.cryptoInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-semibold text-[var(--color-accent-text)]"
                  >
                    Открыть invoice
                  </a>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {ticket.isAdmin ? (
          <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Действия</p>
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
          </div>
        ) : null}

        {ticket.deliveredKey ? (
          <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
            <p className="mt-3 break-all rounded-2xl bg-[var(--color-bg)] p-3 font-mono text-sm text-[var(--color-text)]">
              {ticket.deliveredKey}
            </p>
          </div>
        ) : null}

        {ticket.messages.length === 0 ? (
          <ScreenEmpty title="Сообщений пока нет" subtitle="Напиши первым, чтобы открыть диалог." icon={<CreditCard size={28} className="text-[var(--color-muted)]" />} />
        ) : (
          <div className="grid gap-3">
            {ticket.messages.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[24px] p-4"
                style={{ background: entry.isMine ? "var(--color-surface)" : "var(--color-bg)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {entry.isMine ? "Ты" : entry.senderName}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {format(new Date(entry.createdAt), "dd MMM · HH:mm", { locale: ru })}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
                  {entry.body}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isClosed ? "Тикет закрыт" : "Напиши сообщение"}
            disabled={isClosed}
            className="min-h-28 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
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
    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}
