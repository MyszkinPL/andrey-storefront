"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { Cell, Placeholder, Section, Spinner, Subheadline, Text, Title } from "@telegram-apps/telegram-ui"

import {
  confirmTicketPayment,
  getTicket,
  sendTicketMessage,
  updateTicketStatus,
} from "@/lib/api"
import { Button, Textarea } from "@/components/ui"
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
          <Spinner size="m" />
        </div>
      </Screen>
    )
  }

  const ticket = data.ticket

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader
        title={`#${ticket.number} · ${ticket.subject}`}
        subtitle={ticket.productTitle || "Общий тикет"}
      />

      {ticket.isAdmin ? (
        <Section header="Действия">
          {!ticket.isPaid ? (
            <Button stretched onClick={() => paymentMutation.mutate()} disabled={paymentMutation.isPending}>
              {paymentMutation.isPending ? "Подтверждаем..." : "Подтвердить оплату"}
            </Button>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => statusMutation.mutate("IN_PROGRESS")}>
              В работу
            </Button>
            <Button variant="secondary" onClick={() => statusMutation.mutate("CLOSED")}>
              Закрыть
            </Button>
          </div>
        </Section>
      ) : null}

      {ticket.deliveredKey ? (
        <Section header="Выданный ключ" footer="Ключ появляется здесь после подтверждения оплаты.">
          <Text className="break-all font-mono">{ticket.deliveredKey}</Text>
        </Section>
      ) : null}

      <Section header="Переписка">
        {ticket.messages.length === 0 ? (
          <Placeholder
            header="Сообщений пока нет"
            description="Напиши первым, чтобы открыть диалог по оплате и выдаче."
          />
        ) : null}

        {ticket.messages.map((entry) => (
          <Cell
            key={entry.id}
            multiline
            subtitle={`${entry.senderName} · ${entry.senderRole === "ADMIN" ? "админ" : "клиент"}`}
            description={format(new Date(entry.createdAt), "dd MMM · HH:mm", { locale: ru })}
            className={entry.isMine ? "bg-[var(--tg-theme-secondary-bg-color)]/70" : undefined}
          >
            <div className="min-w-0">
              <Title level="3">{entry.isMine ? "Ты" : entry.senderName}</Title>
              <Subheadline level="2" className="mt-1 whitespace-pre-wrap">
                {entry.body}
              </Subheadline>
            </div>
          </Cell>
        ))}
      </Section>

      <Section header="Новое сообщение">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={isClosed ? "Тикет закрыт" : "Напиши сообщение"}
          disabled={isClosed}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={() => sendMutation.mutate()} disabled={!canSend}>
            {sendMutation.isPending ? "Отправка..." : "Отправить"}
          </Button>
        </div>
      </Section>
    </Screen>
  )
}
