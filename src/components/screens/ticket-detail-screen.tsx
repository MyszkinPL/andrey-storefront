"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CircleDashed,
  ExternalLink,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react"

import {
  cancelOwnTicket,
  confirmTicketPayment,
  deleteAdminTicket,
  getMe,
  getTicket,
  markManualTicketPaid,
  rejectManualTicketPayment,
  refreshCryptoInvoice,
  updateTicketStatus,
} from "@/lib/api"
import { useMode } from "@/components/mode-provider"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { useBackButton } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

export function TicketDetailScreen({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  })
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    refetchInterval: 10_000,
  })

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
    await queryClient.invalidateQueries({ queryKey: ["tickets"] })
  }

  const statusMutation = useMutation({
    mutationFn: (status: "OPEN" | "IN_PROGRESS" | "CLOSED") =>
      updateTicketStatus(ticketId, status),
    onSuccess: invalidate,
  })
  const paymentMutation = useMutation({
    mutationFn: () => confirmTicketPayment(ticketId),
    onSuccess: invalidate,
  })
  const rejectManualPaymentMutation = useMutation({
    mutationFn: () => rejectManualTicketPayment(ticketId),
    onSuccess: invalidate,
  })
  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelOwnTicket(ticketId),
    onSuccess: invalidate,
  })
  const refreshMutation = useMutation({
    mutationFn: () => refreshCryptoInvoice(ticketId),
    onSuccess: invalidate,
  })
  const markManualPaidMutation = useMutation({
    mutationFn: () => markManualTicketPaid(ticketId),
    onSuccess: invalidate,
  })
  const deleteTicketMutation = useMutation({
    mutationFn: () => deleteAdminTicket(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      router.push("/admin/tickets")
    },
  })

  useBackButton(() => router.back())

  if (isLoading) {
    return (
      <Screen noTabBar>
        <ScreenEmpty
          icon={<CircleDashed size={28} className="text-[var(--color-muted)]" />}
          title="Загружаю заказ"
          subtitle="Подтягиваю оплату и статус."
        />
      </Screen>
    )
  }

  if (isError || !data?.ticket) {
    return (
      <Screen noTabBar>
        <ScreenEmpty
          icon={<CircleDashed size={28} className="text-[var(--color-muted)]" />}
          title="Заказ не загрузился"
          subtitle="Обнови экран или попробуй позже."
        />
      </Screen>
    )
  }

  const ticket = data.ticket
  const isSupportFlow = !ticket.productTitle && !ticket.paymentMethodTitle
  const isBuyerView = mode === "buyer"
  const isClosed = ["CLOSED", "CANCELLED"].includes(ticket.status)
  const isAwaitingPayment = !ticket.isPaid
  const isManualPayment = ticket.paymentMethodType === "MANUAL"
  const isManualPaymentRequested = Boolean(ticket.manualPaymentRequestedAt)
  const supportLink = meData?.settings.supportUsername
    ? `https://t.me/${meData.settings.supportUsername.replace(/^@/, "")}`
    : null
  const createdAtLabel = format(new Date(ticket.createdAt), "dd MMMM · HH:mm", {
    locale: ru,
  })
  const paymentStateLabel = ticket.isPaid
    ? "Оплачено"
    : ticket.status === "PAYMENT_REVIEW"
      ? "На проверке"
      : ticket.status === "CANCELLED"
        ? "Отменён"
        : "Ожидает оплату"
  const orderSteps = getOrderSteps(ticket)
  const adminToolsVisible = ticket.isAdmin && mode === "admin"

  const headerActions = adminToolsVisible ? (
    <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
      {!ticket.isPaid ? (
        <button
          onClick={() => paymentMutation.mutate()}
          disabled={ticket.status === "CANCELLED"}
          className="shrink-0 rounded-full bg-[var(--color-accent)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-accent-text)]"
        >
          Подтвердить оплату
        </button>
      ) : null}
      {ticket.status === "PAYMENT_REVIEW" ? (
        <button
          onClick={() => rejectManualPaymentMutation.mutate()}
          className="shrink-0 rounded-full bg-[var(--color-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text)]"
        >
          Отклонить
        </button>
      ) : null}
      <button
        onClick={() => statusMutation.mutate("IN_PROGRESS")}
        disabled={ticket.status === "CANCELLED"}
        className="shrink-0 rounded-full bg-[var(--color-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text)]"
      >
        В работу
      </button>
      <button
        onClick={() => statusMutation.mutate("CLOSED")}
        className="shrink-0 rounded-full bg-[var(--color-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-text)]"
      >
        Закрыть
      </button>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        disabled={deleteTicketMutation.isPending}
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-[var(--color-destructive)]/14 px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-destructive)] disabled:opacity-60"
      >
        <Trash2 size={12} />
        {deleteTicketMutation.isPending ? "Удаляю..." : "Удалить"}
      </button>
    </div>
  ) : null

  if (isSupportFlow) {
    return (
      <Screen noTabBar>
        <ScreenHeader title="Поддержка" subtitle="Поддержка перенесена в Telegram" />
        <div className="grid gap-3 px-4 pb-3">
          <section className="ui-card p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Поддержка в Telegram</p>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Для связи с продавцом используется Telegram.
            </p>
            {supportLink ? (
              <a
                href={supportLink}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-[18px] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-text)]"
              >
                Открыть Telegram
              </a>
            ) : null}
          </section>
        </div>
      </Screen>
    )
  }

  const showManualWaitingCard =
    ticket.paymentMethodType === "MANUAL" && ticket.manualPaymentRequestedAt && !ticket.isPaid

  return (
    <Screen noTabBar>
      <ScreenHeader
        title={ticket.productTitle || ticket.subject}
        subtitle={
          <HeaderMetaRow
            items={[
              `#${ticket.number}`,
              renderStatus(ticket.status),
              ticket.productCategory || null,
              ticket.paymentMethodTitle || null,
            ]}
          />
        }
      />

      {adminToolsVisible ? (
        <div className="px-4 pb-2.5">
          <div className="ui-card p-2.5">{headerActions}</div>
        </div>
      ) : null}

      <div className="grid gap-3 px-4 pb-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="ui-card p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge kind={ticket.isPaid ? "paid" : "waiting"}>{paymentStateLabel}</StatusBadge>
            <StatusBadge>{ticket.paymentMethodTitle || "Без способа оплаты"}</StatusBadge>
            <span className="ml-auto text-[11px] text-[var(--color-muted)]">{createdAtLabel}</span>
          </div>

          {ticket.paymentMethodTitle ? (
            <div className="mt-3 rounded-[20px] bg-[var(--color-bg)] p-3">
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
                    {ticket.paymentMethodType === "CRYPTO_PAY" ? "Автооплата" : "Ручная оплата"}
                  </p>
                </div>
                {ticket.paymentMethodType === "CRYPTO_PAY" ? (
                  <button
                    type="button"
                    onClick={() => refreshMutation.mutate()}
                    className="flex size-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]"
                  >
                    <RefreshCcw
                      size={14}
                      className={refreshMutation.isPending ? "animate-spin" : ""}
                    />
                  </button>
                ) : null}
              </div>

              {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-3 rounded-[16px] bg-[var(--color-surface)] px-3 py-2.5">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Статус
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                        {ticket.cryptoInvoiceStatus === "paid" ? "Оплачен" : "Ждёт оплату"}
                      </p>
                    </div>
                    {ticket.cryptoInvoiceAmount ? (
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                          Сумма
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                          {ticket.cryptoInvoiceAmount} {ticket.cryptoInvoiceFiat || "RUB"}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  {!ticket.isPaid ? (
                    <a
                      href={ticket.cryptoInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-[16px] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-text)]"
                    >
                      Открыть invoice
                      <ExternalLink size={14} />
                    </a>
                  ) : null}
                </div>
              ) : ticket.paymentMethodDetails ? (
                <div className="mt-3 rounded-[16px] bg-[var(--color-surface)] p-3">
                  <p className="whitespace-pre-wrap text-sm leading-5 text-[var(--color-text)]">
                    {ticket.paymentMethodDetails}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex items-center gap-2 overflow-x-auto rounded-[20px] bg-[var(--color-bg)] p-2.5 [scrollbar-width:none]">
            {[
              {
                title: "Оплата",
                active: true,
              },
              {
                title: ticket.deliveredKey ? "Ключ" : "Выдача",
                active: ticket.isPaid,
              },
              {
                title: "Готово",
                active: ticket.status === "CLOSED" || Boolean(ticket.deliveredKey),
              },
            ].map((step, index) => (
              <div
                key={step.title}
                className="flex shrink-0 items-center gap-2 rounded-full bg-[var(--color-surface)] px-2.5 py-1.5"
              >
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    step.active
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                  )}
                >
                  {index + 1}
                </div>
                <p className="text-xs font-medium text-[var(--color-text)]">{step.title}</p>
              </div>
            ))}
          </div>

          {ticket.deliveredKey ? (
            <div className="mt-3 rounded-[20px] bg-[var(--color-bg)] p-3.5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
              <p className="mt-2 break-all rounded-[16px] bg-[var(--color-surface)] p-3 font-mono text-sm text-[var(--color-text)]">
                {ticket.deliveredKey}
              </p>
            </div>
          ) : null}

          {showManualWaitingCard ? (
            <div className="mt-3 rounded-[20px] bg-[var(--color-bg)] p-3.5">
              <p className="text-sm font-semibold text-[var(--color-text)]">Платёж на проверке</p>
              <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">
                Продавец вручную проверит оплату и после подтверждения продолжит выдачу.
              </p>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {ticket.paymentMethodType === "MANUAL" &&
            !ticket.isPaid &&
            !ticket.manualPaymentRequestedAt &&
            isBuyerView &&
            !isClosed ? (
              <button
                type="button"
                onClick={() => markManualPaidMutation.mutate()}
                disabled={markManualPaidMutation.isPending}
                className="rounded-[18px] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-text)] disabled:opacity-60"
              >
                {markManualPaidMutation.isPending ? "Отмечаю..." : "Я оплатил"}
              </button>
            ) : null}

            {ticket.isPaid && supportLink && isBuyerView ? (
              <a
                href={supportLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-[18px] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-text)]"
              >
                Поддержка в Telegram
              </a>
            ) : null}

            {isBuyerView && !ticket.isPaid && !isClosed ? (
              <button
                type="button"
                onClick={() => cancelOrderMutation.mutate()}
                disabled={cancelOrderMutation.isPending}
                className="rounded-[18px] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-destructive)] disabled:opacity-60"
              >
                {cancelOrderMutation.isPending ? "Отменяю..." : "Отменить заказ"}
              </button>
            ) : null}
          </div>
        </section>

        <aside className="hidden xl:block xl:row-span-2 xl:space-y-3">
          <section className="ui-card p-3.5">
            <p className="text-sm font-semibold text-[var(--color-text)]">Статус заказа</p>
            <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] xl:grid xl:overflow-visible">
              {orderSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="min-w-[158px] rounded-[16px] bg-[var(--color-bg)] p-2.5 xl:min-w-0"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        step.state === "done" &&
                          "bg-[var(--color-accent)] text-[var(--color-accent-text)]",
                        step.state === "current" &&
                          "border border-[var(--color-accent)] bg-[var(--color-bg)] text-[var(--color-text)]",
                        step.state === "upcoming" &&
                          "bg-[var(--color-surface)] text-[var(--color-muted)]",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          step.state === "upcoming"
                            ? "text-[var(--color-muted)]"
                            : "text-[var(--color-text)]",
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-[10px] leading-4 text-[var(--color-muted)]">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {ticket.paymentMethodTitle ? (
            <section className="hidden ui-card p-3.5 xl:block">
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
                    {ticket.paymentMethodType === "CRYPTO_PAY" ? "Crypto Pay" : "Ручная оплата"}
                  </p>
                </div>
                {ticket.paymentMethodType === "CRYPTO_PAY" ? (
                  <button
                    type="button"
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

              {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                <div className="mt-3 grid gap-2.5">
                  <div className="rounded-[18px] bg-[var(--color-bg)] p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Статус
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                          {ticket.cryptoInvoiceStatus === "paid" ? "Оплачен" : "Ждёт оплату"}
                        </p>
                      </div>
                      {ticket.cryptoInvoiceAmount ? (
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Сумма
                          </p>
                          <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                            {ticket.cryptoInvoiceAmount} {ticket.cryptoInvoiceFiat || "RUB"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {!ticket.isPaid ? null : null}
                </div>
              ) : ticket.paymentMethodDetails ? (
                <div className="mt-3 rounded-[18px] bg-[var(--color-bg)] p-3.5">
                  <p className="whitespace-pre-wrap text-sm leading-5 text-[var(--color-text)]">
                    {ticket.paymentMethodDetails}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="ui-card p-3.5">
            <p className="text-sm font-semibold text-[var(--color-text)]">История</p>
            <div className="mt-3 grid gap-2">
              <div className="rounded-[18px] bg-[var(--color-bg)] px-3.5 py-3">
                <p className="text-sm text-[var(--color-text)]">Заказ создан</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">{createdAtLabel}</p>
              </div>
              {ticket.manualPaymentRequestedAt ? (
                <div className="rounded-[18px] bg-[var(--color-bg)] px-3.5 py-3">
                  <p className="text-sm text-[var(--color-text)]">Платёж отмечен пользователем</p>
                  <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                    {format(new Date(ticket.manualPaymentRequestedAt), "dd MMM · HH:mm", {
                      locale: ru,
                    })}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>

      {isDeleteModalOpen ? (
        <ConfirmDeleteModal
          loading={deleteTicketMutation.isPending}
          onClose={() => {
            if (deleteTicketMutation.isPending) return
            setIsDeleteModalOpen(false)
          }}
          onConfirm={() => {
            deleteTicketMutation.mutate()
          }}
        />
      ) : null}
    </Screen>
  )
}

function renderStatus(status: string) {
  switch (status) {
    case "OPEN":
      return "Открыт"
    case "PAYMENT_REVIEW":
      return "Проверка оплаты"
    case "IN_PROGRESS":
      return "В работе"
    case "CLOSED":
      return "Закрыт"
    case "CANCELLED":
      return "Отменён"
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
  manualPaymentRequestedAt: string | null
}) {
  const closedUnpaid = ticket.status === "CLOSED" && !ticket.isPaid
  const cancelled = ticket.status === "CANCELLED"
  const invoiceReady =
    ticket.paymentMethodType === "CRYPTO_PAY" ? Boolean(ticket.cryptoInvoiceUrl) : true
  const paymentDone = ticket.isPaid
  const workStarted = ticket.status === "IN_PROGRESS" || ticket.status === "CLOSED"
  const fulfilled = Boolean(ticket.deliveredKey) || ticket.status === "CLOSED"

  const stepStates = cancelled
    ? (["done", "upcoming", "upcoming", "done"] as const)
    : closedUnpaid
      ? (["done", "current", "upcoming", "upcoming"] as const)
      : ([
          "done",
          paymentDone ? "done" : "current",
          fulfilled ? "done" : workStarted ? "current" : "upcoming",
          fulfilled ? "done" : "upcoming",
        ] as const)

  return [
    {
      title: "Заказ создан",
      subtitle: "Заказ открыт и привязан к товару.",
      state: stepStates[0],
    },
    {
      title: cancelled
        ? "Оплата отменена"
        : closedUnpaid
          ? "Заказ закрыт без оплаты"
          : paymentDone
            ? "Оплата подтверждена"
            : ticket.paymentMethodType === "MANUAL" && ticket.manualPaymentRequestedAt
              ? "Платёж на проверке"
              : "Ожидание оплаты",
      subtitle: cancelled
        ? "Заказ отменён до подтверждения оплаты."
        : closedUnpaid
          ? "Оплата не была подтверждена, заказ закрыт."
          : ticket.paymentMethodType === "CRYPTO_PAY"
            ? invoiceReady
              ? ticket.cryptoInvoiceStatus === "paid"
                ? "Crypto Pay получил оплату."
                : "Инвойс готов к оплате."
              : "Инвойс ещё создаётся или требует обновления."
            : ticket.manualPaymentRequestedAt
              ? "Покупатель отметил оплату. Нужна ручная проверка."
              : "Ожидается подтверждение по выбранным реквизитам.",
      state: stepStates[1],
    },
    {
      title: cancelled
        ? "Обработка остановлена"
        : closedUnpaid
          ? "Обработка не начата"
          : workStarted
            ? "Заказ в работе"
            : "Ожидает обработки",
      subtitle: cancelled
        ? "Заказ отменён, выдача не начнётся."
        : closedUnpaid
          ? "Этот этап не начался, потому что оплаты не было."
          : fulfilled
            ? "Продавец завершил выдачу."
            : workStarted
              ? "Продавец обрабатывает заказ."
              : "Начнётся после подтверждения оплаты.",
      state: stepStates[2],
    },
    {
      title: cancelled
        ? "Заказ отменён"
        : closedUnpaid
          ? "Выдача отменена"
          : fulfilled
            ? "Заказ завершён"
            : "Выдача / закрытие",
      subtitle: cancelled
        ? "Этот заказ больше не активен."
        : closedUnpaid
          ? "Товар не выдавался, потому что заказ закрыт без оплаты."
          : ticket.deliveredKey
            ? "Ключ уже выдан в этом заказе."
            : ticket.status === "CLOSED"
              ? "Заказ закрыт."
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
        <Image
          src={iconDataUrl}
          alt=""
          fill
          unoptimized
          sizes="48px"
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-[18px] bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}

function HeaderMetaRow({
  items,
}: {
  items: Array<string | null>
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.filter(Boolean).map((item) => (
        <span key={item} className="whitespace-nowrap text-xs text-[var(--color-muted)]">
          {item}
        </span>
      ))}
    </div>
  )
}

function ConfirmDeleteModal({
  loading,
  onClose,
  onConfirm,
}: {
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-3 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="ui-card w-full max-w-md p-4 sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">Удалить заказ</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Заказ будет удалён из базы полностью. Это действие нельзя отменить.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-full bg-[var(--color-destructive)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Удаляю..." : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  )
}
