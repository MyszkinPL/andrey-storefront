"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

import {
  confirmTicketPayment,
  getTicket,
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
      await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: "OPEN" | "IN_PROGRESS" | "CLOSED") => updateTicketStatus(ticketId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

  const paymentMutation = useMutation({
    mutationFn: () => confirmTicketPayment(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
    },
  })

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
        {ticket.isAdmin ? (
          <div className="rounded-2xl bg-[var(--color-surface)] p-4">
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
          <div className="rounded-2xl bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
            <p className="mt-3 break-all rounded-2xl bg-[var(--color-bg)] p-3 font-mono text-sm text-[var(--color-text)]">
              {ticket.deliveredKey}
            </p>
          </div>
        ) : null}

        {ticket.messages.length === 0 ? (
          <ScreenEmpty title="Сообщений пока нет" subtitle="Напиши первым, чтобы открыть диалог." icon={<span />} />
        ) : (
          <div className="grid gap-3">
            {ticket.messages.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl p-4"
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

        <div className="rounded-2xl bg-[var(--color-surface)] p-4">
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
