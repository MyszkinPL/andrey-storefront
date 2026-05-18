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
import { Button, Card, Textarea } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"
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

  if (!data) {
    return (
      <Screen noTabBar>
        <div className="flex min-h-dvh items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      </Screen>
    )
  }

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader
        title={`#${data.ticket.number} · ${data.ticket.subject}`}
        subtitle={data.ticket.productTitle || "Общий тикет"}
      />

      <div className="flex flex-1 flex-col gap-3 px-4">
        {data.ticket.isAdmin ? (
          <div className="flex flex-wrap gap-2">
            {!data.ticket.isPaid ? (
              <Button onClick={() => paymentMutation.mutate()}>Подтвердить оплату</Button>
            ) : null}
            <Button variant="secondary" onClick={() => statusMutation.mutate("IN_PROGRESS")}>
              В работу
            </Button>
            <Button variant="secondary" onClick={() => statusMutation.mutate("CLOSED")}>
              Закрыть
            </Button>
          </div>
        ) : null}

        {data.ticket.deliveredKey ? (
          <Card className="border-[var(--color-accent)]/20 bg-[var(--color-accent)]/12 p-5">
            <p className="text-sm font-semibold text-[var(--color-accent)]">Выданный ключ</p>
            <p className="mt-2 break-all font-mono text-sm">{data.ticket.deliveredKey}</p>
          </Card>
        ) : null}

        <div className="flex flex-1 flex-col gap-3">
          {data.ticket.messages.map((entry) => (
            <div key={entry.id} className={`flex ${entry.isMine ? "justify-end" : "justify-start"}`}>
              <Card className={`max-w-[88%] p-4 ${entry.isMine ? "bg-[var(--color-accent)]/14" : ""}`}>
                <p className="text-xs text-[var(--color-muted)]">
                  {entry.senderName} · {entry.senderRole === "ADMIN" ? "админ" : "клиент"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{entry.body}</p>
                <p className="mt-2 text-[11px] text-[var(--color-muted)]">
                  {format(new Date(entry.createdAt), "dd MMM · HH:mm", { locale: ru })}
                </p>
              </Card>
            </div>
          ))}
        </div>

        <Card className="p-3">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={isClosed ? "Тикет закрыт" : "Напиши сообщение"}
            disabled={isClosed}
            className="border-0 bg-transparent"
          />
          <div className="mt-3 flex justify-end">
            <Button onClick={() => sendMutation.mutate()} disabled={!canSend}>
              Отправить
            </Button>
          </div>
        </Card>
      </div>
    </Screen>
  )
}
