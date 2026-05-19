"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CheckCheck,
  CreditCard,
  ExternalLink,
  RefreshCcw,
  Shield,
  User2,
} from "lucide-react"

import {
  confirmTicketPayment,
  getTicket,
  refreshCryptoInvoice,
  sendTicketMessage,
  updateTicketStatus,
} from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

const HIDDEN_SYSTEM_PREFIXES = [
  "Выбран способ оплаты:",
  "Crypto invoice создан.",
  "Не удалось автоматически создать crypto invoice.",
  "Оплата подтверждена. Начинаю выдачу.",
]

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
    mutationFn: (status: "OPEN" | "IN_PROGRESS" | "CLOSED") =>
      updateTicketStatus(ticketId, status),
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
  const isAwaitingPayment = !data?.ticket?.isPaid
  const canSend = message.trim().length > 0 && !isClosed && !sendMutation.isPending
  const visibleMessages = useMemo(
    () =>
      (data?.ticket?.messages ?? []).filter(
        (entry) =>
          !HIDDEN_SYSTEM_PREFIXES.some((prefix) => entry.body.startsWith(prefix)),
      ),
    [data?.ticket?.messages],
  )

  const groupedMessages = useMemo(() => {
    const messages = visibleMessages

    return messages.map((entry, index) => ({
      ...entry,
      showAvatar:
        index === 0 ||
        messages[index - 1]?.isMine !== entry.isMine ||
        messages[index - 1]?.senderRole !== entry.senderRole,
    }))
  }, [visibleMessages])

  useBackButton(() => router.back())

  if (!data?.ticket) return null

  const ticket = data.ticket
  const shouldLockBuyerChat = !ticket.isAdmin && isAwaitingPayment
  const statusLabel = renderStatus(ticket.status)
  const createdAtLabel = format(new Date(ticket.createdAt), "dd MMMM · HH:mm", {
    locale: ru,
  })
  const paymentStateLabel = ticket.isPaid ? "Оплачено" : "Ожидает оплату"
  const invoiceMeta = [ticket.cryptoInvoiceStatus, ticket.cryptoInvoiceAmount, ticket.cryptoInvoiceAsset]
    .filter(Boolean)
    .join(" · ")
  const orderSteps = getOrderSteps(ticket)

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader
        title={ticket.productTitle || ticket.subject}
        subtitle={`#${ticket.number} · ${statusLabel}`}
      />

      <div className="grid gap-4 px-4 pb-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="order-2 grid gap-4 xl:order-1">
          <section className="ui-card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge kind={ticket.isPaid ? "paid" : "waiting"}>{paymentStateLabel}</StatusBadge>
                <StatusBadge>{statusLabel}</StatusBadge>
                {ticket.paymentMethodTitle ? (
                  <StatusBadge>{ticket.paymentMethodTitle}</StatusBadge>
                ) : null}
                <span className="ml-auto text-[11px] text-[var(--color-muted)]">{createdAtLabel}</span>
              </div>
            </div>

            <div className="grid gap-3 p-3 sm:p-4">
              {shouldLockBuyerChat ? (
                <div className="ui-card-soft p-5">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Сначала оплата, потом чат
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    Пока заказ не оплачен, переписка закрыта. Оплати invoice или реквизиты справа — после подтверждения откроется нормальный чат с продавцом и выдачей товара.
                  </p>
                  <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Запрос на покупку
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                      {ticket.messages[0]?.body || ticket.subject}
                    </p>
                  </div>
                </div>
              ) : ticket.messages.length === 0 ? (
                <ScreenEmpty
                  title="Сообщений пока нет"
                  subtitle="Напиши первым, чтобы открыть диалог."
                  icon={<CreditCard size={28} className="text-[var(--color-muted)]" />}
                />
              ) : (
                <div className="grid gap-2">
                  {groupedMessages.map((entry) => {
                    const isAdmin = entry.senderRole === "ADMIN"

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-end gap-2",
                          entry.isMine ? "justify-end" : "justify-start",
                        )}
                      >
                        {!entry.isMine ? (
                          <SenderAvatar isAdmin={isAdmin} visible={entry.showAvatar} />
                        ) : null}

                        <div
                          className={cn(
                            "max-w-[min(720px,86%)]",
                            entry.isMine && "flex flex-col items-end",
                          )}
                        >
                          {entry.showAvatar ? (
                            <div
                              className={cn(
                                "mb-1 flex items-center gap-2 px-1 text-[11px]",
                                entry.isMine ? "justify-end text-[var(--color-muted)]" : "text-[var(--color-muted)]",
                              )}
                            >
                              <span className="font-medium text-[var(--color-text)]">
                                {entry.isMine ? "Ты" : entry.senderName}
                              </span>
                              <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5">
                                {isAdmin ? "Админ" : "Покупатель"}
                              </span>
                            </div>
                          ) : null}

                          <div
                            className={cn(
                              "rounded-[22px] px-4 py-3 shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_4%,transparent)_inset]",
                              entry.isMine
                                ? "rounded-br-md bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                                : "rounded-bl-md bg-[var(--color-surface-2)] text-[var(--color-text)]",
                            )}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {entry.body}
                            </p>

                            <div
                              className={cn(
                                "mt-2 flex items-center justify-end gap-1 text-[11px]",
                                entry.isMine
                                  ? "text-[var(--color-accent-text)]/78"
                                  : "text-[var(--color-muted)]",
                              )}
                            >
                              <span>{format(new Date(entry.createdAt), "HH:mm", { locale: ru })}</span>
                              {entry.isMine ? <CheckCheck size={12} /> : null}
                            </div>
                          </div>
                        </div>

                        {entry.isMine ? (
                          <SenderAvatar isAdmin={isAdmin} visible={entry.showAvatar} />
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {!shouldLockBuyerChat ? (
            <section className="ui-card px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">Чат по заказу</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Переписка открыта после этапа оплаты.
                  </p>
                </div>
                <StatusBadge kind={ticket.isPaid ? "paid" : "waiting"}>
                  {ticket.isPaid ? "Оплачено" : "Ждёт оплату"}
                </StatusBadge>
              </div>
            </section>
          ) : null}

          {ticket.deliveredKey ? (
            <section className="ui-card p-4 sm:p-5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
              <p className="mt-3 break-all rounded-[18px] bg-[var(--color-bg)] p-4 font-mono text-sm text-[var(--color-text)]">
                {ticket.deliveredKey}
              </p>
            </section>
          ) : null}

          {!shouldLockBuyerChat ? (
            <section className="ui-card p-3 sm:p-4">
              <div className="rounded-[20px] bg-[var(--color-bg)] p-3">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={isClosed ? "Тикет закрыт" : "Напиши сообщение"}
                  disabled={isClosed}
                  className="min-h-24 w-full resize-none bg-transparent px-1 py-1 text-sm leading-6 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                />
                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={() => canSend && sendMutation.mutate()}
                    disabled={!canSend}
                    className={cn(
                      "rounded-[16px] px-4 py-2.5 text-sm font-semibold transition-colors",
                      canSend
                        ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                        : "bg-[var(--color-surface)] text-[var(--color-muted)]",
                    )}
                  >
                    {sendMutation.isPending ? "Отправка..." : "Отправить"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="order-1 grid content-start gap-4 xl:order-2 xl:sticky xl:top-4">
          <section className="ui-card p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Статус заказа</p>
            <div className="mt-4 grid gap-3">
              {orderSteps.map((step, index) => (
                <div key={step.title} className="flex gap-3">
                  <div className="flex w-6 flex-col items-center">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                        step.state === "done" &&
                          "bg-[var(--color-accent)] text-[var(--color-accent-text)]",
                        step.state === "current" &&
                          "border border-[var(--color-accent)] bg-[var(--color-bg)] text-[var(--color-text)]",
                        step.state === "upcoming" &&
                          "bg-[var(--color-bg)] text-[var(--color-muted)]",
                      )}
                    >
                      {index + 1}
                    </div>
                    {index < orderSteps.length - 1 ? (
                      <div
                        className={cn(
                          "mt-1 h-full min-h-6 w-px",
                          step.state === "done" ? "bg-[var(--color-accent)]/40" : "bg-[var(--color-border)]",
                        )}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 pb-3">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        step.state === "upcoming"
                          ? "text-[var(--color-muted)]"
                          : "text-[var(--color-text)]",
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{step.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {ticket.paymentMethodTitle ? (
            <section className="ui-card p-4">
              <div className="flex items-start gap-3">
                <PaymentMethodIcon
                  iconDataUrl={ticket.paymentMethodIconDataUrl}
                  title={ticket.paymentMethodTitle}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {ticket.paymentMethodTitle}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {ticket.paymentMethodType === "CRYPTO_PAY" ? "Crypto Pay" : "Ручные реквизиты"}
                  </p>
                </div>
                {ticket.paymentMethodType === "CRYPTO_PAY" ? (
                  <button
                    onClick={() => refreshMutation.mutate()}
                    className="flex size-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]"
                  >
                    <RefreshCcw
                      size={15}
                      className={refreshMutation.isPending ? "animate-spin" : ""}
                    />
                  </button>
                ) : null}
              </div>

              {ticket.paymentMethodDetails ? (
                <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                    {ticket.paymentMethodDetails}
                  </p>
                </div>
              ) : null}

              {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[18px] bg-[var(--color-bg)] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Invoice
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-text)]">
                      {invoiceMeta || "Ожидает обновление статуса"}
                    </p>
                    {ticket.cryptoInvoiceExpiresAt ? (
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        До {format(new Date(ticket.cryptoInvoiceExpiresAt), "dd MMM · HH:mm", { locale: ru })}
                      </p>
                    ) : null}
                  </div>

                  <a
                    href={ticket.cryptoInvoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                  >
                    Оплатить invoice
                    <ExternalLink size={15} />
                  </a>
                </div>
              ) : ticket.paymentMethodType === "CRYPTO_PAY" ? (
                <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Invoice
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-text)]">
                    Инвойс ещё не создан или не обновился. Можно обновить кнопкой справа сверху.
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          {ticket.isAdmin ? (
            <section className="ui-card p-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">Действия</p>
              <div className="mt-3 grid gap-2">
                {!ticket.isPaid ? (
                  <button
                    onClick={() => paymentMutation.mutate()}
                    className="rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                  >
                    Подтвердить оплату
                  </button>
                ) : null}
                <button
                  onClick={() => statusMutation.mutate("IN_PROGRESS")}
                  className="rounded-[18px] bg-[var(--color-bg)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
                >
                  В работу
                </button>
                <button
                  onClick={() => statusMutation.mutate("CLOSED")}
                  className="rounded-[18px] bg-[var(--color-bg)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
                >
                  Закрыть
                </button>
              </div>
            </section>
          ) : null}
        </aside>
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

function getOrderSteps(ticket: {
  status: string
  isPaid: boolean
  paymentMethodType: string | null
  cryptoInvoiceUrl: string | null
  cryptoInvoiceStatus: string | null
  deliveredKey: string | null
}) {
  const invoiceReady =
    ticket.paymentMethodType === "CRYPTO_PAY" ? Boolean(ticket.cryptoInvoiceUrl) : true
  const paymentDone = ticket.isPaid
  const workStarted = ticket.status === "IN_PROGRESS" || ticket.status === "CLOSED"
  const fulfilled = Boolean(ticket.deliveredKey) || ticket.status === "CLOSED"

  const stepStates = [
    "done",
    paymentDone ? "done" : invoiceReady ? "current" : "current",
    fulfilled ? "done" : workStarted ? "current" : "upcoming",
    fulfilled ? "done" : "upcoming",
  ] as const

  return [
    {
      title: "Тикет создан",
      subtitle: "Заказ открыт и привязан к товару.",
      state: stepStates[0],
    },
    {
      title: paymentDone ? "Оплата подтверждена" : "Ожидание оплаты",
      subtitle:
        ticket.paymentMethodType === "CRYPTO_PAY"
          ? invoiceReady
            ? ticket.cryptoInvoiceStatus === "paid"
              ? "Crypto Pay получил оплату."
              : "Инвойс готов к оплате."
            : "Инвойс ещё создаётся или требует обновления."
          : "Ожидается подтверждение по выбранным реквизитам.",
      state: stepStates[1],
    },
    {
      title: workStarted ? "Заказ в работе" : "Ожидает обработки",
      subtitle: fulfilled
        ? "Продавец завершил выдачу."
        : workStarted
          ? "Продавец обрабатывает заказ."
          : "Начнётся после подтверждения оплаты.",
      state: stepStates[2],
    },
    {
      title: fulfilled ? "Заказ завершён" : "Выдача / закрытие",
      subtitle: ticket.deliveredKey
        ? "Ключ уже выдан в этом тикете."
        : ticket.status === "CLOSED"
          ? "Тикет закрыт."
          : "Финальный этап после выдачи товара.",
      state: stepStates[3],
    },
  ]
}

function StatusBadge({
  children,
  kind = "default",
}: {
  children: React.ReactNode
  kind?: "default" | "paid" | "waiting"
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px]",
        kind === "paid" && "bg-[var(--color-accent)]/14 text-[var(--color-accent)]",
        kind === "waiting" && "bg-[var(--color-bg)] text-[var(--color-muted)]",
        kind === "default" && "bg-[var(--color-bg)] text-[var(--color-muted)]",
      )}
    >
      {children}
    </span>
  )
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
      <div className="relative size-12 overflow-hidden rounded-[18px]">
        <Image src={iconDataUrl} alt="" fill unoptimized sizes="48px" className="object-cover" />
      </div>
    )
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-[18px] bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}

function SenderAvatar({
  isAdmin,
  visible,
}: {
  isAdmin: boolean
  visible: boolean
}) {
  return (
    <div className="flex w-9 shrink-0 justify-center">
      {visible ? (
        <div className="flex size-9 items-center justify-center rounded-full bg-[var(--color-surface)]">
          {isAdmin ? (
            <Shield size={15} className="text-[var(--color-muted)]" />
          ) : (
            <User2 size={15} className="text-[var(--color-muted)]" />
          )}
        </div>
      ) : null}
    </div>
  )
}
