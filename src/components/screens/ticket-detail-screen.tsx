"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  ChevronDown,
  CheckCheck,
  CircleDashed,
  CreditCard,
  ExternalLink,
  ImagePlus,
  RefreshCcw,
  SendHorizontal,
  Shield,
  Trash2,
  User2,
  X,
} from "lucide-react"

import {
  confirmTicketPayment,
  cancelOwnTicket,
  deleteAdminTicket,
  getTicket,
  markManualTicketPaid,
  rejectManualTicketPayment,
  refreshCryptoInvoice,
  sendTicketMessage,
  updateTicketStatus,
  type TicketMessageAttachment,
} from "@/lib/api"
import { optimizeMessageImage } from "@/lib/image"
import { useMode } from "@/components/mode-provider"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

const HIDDEN_SYSTEM_PREFIXES = [
  "Выбран способ оплаты:",
  "Crypto invoice создан.",
  "Не удалось автоматически создать crypto invoice.",
  "Оплата подтверждена. Начинаю выдачу.",
  "Покупатель отметил заказ как оплаченный.",
  "Проверка оплаты отклонена.",
  "Покупатель отменил заказ.",
  "Заказ отменён: аккаунт пользователя заблокирован.",
  "Автовыдача ключа:",
  "Оплата подтверждена, но свободных ключей сейчас нет.",
]

const MAX_ATTACHMENTS = 6

export function TicketDetailScreen({ ticketId }: { ticketId: string }) {
  const router = useRouter()
  const haptic = useHaptic()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { mode } = useMode()
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<TicketMessageAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => getTicket(ticketId),
    refetchInterval: 10_000,
  })

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] })
    await queryClient.invalidateQueries({ queryKey: ["tickets"] })
  }

  const sendMutation = useMutation({
    mutationFn: () =>
      sendTicketMessage(ticketId, {
        body: message.trim(),
        attachments,
      }),
    onSuccess: async () => {
      setMessage("")
      setAttachments([])
      if (fileInputRef.current) fileInputRef.current.value = ""
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

  const rejectManualPaymentMutation = useMutation({
    mutationFn: () => rejectManualTicketPayment(ticketId),
    onSuccess: invalidate,
  })

  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelOwnTicket(ticketId),
    onSuccess: invalidate,
  })

  const deleteTicketMutation = useMutation({
    mutationFn: () => deleteAdminTicket(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      router.push("/admin/tickets")
    },
  })

  const refreshMutation = useMutation({
    mutationFn: () => refreshCryptoInvoice(ticketId),
    onSuccess: invalidate,
  })

  const markManualPaidMutation = useMutation({
    mutationFn: () => markManualTicketPaid(ticketId),
    onSuccess: invalidate,
  })

  const isClosed = ["CLOSED", "CANCELLED"].includes(data?.ticket.status || "")
  const isAwaitingPayment = !data?.ticket?.isPaid
  const isManualPayment = data?.ticket.paymentMethodType === "MANUAL"
  const isManualPaymentRequested = Boolean(data?.ticket.manualPaymentRequestedAt)
  const hasDraftContent = message.trim().length > 0 || attachments.length > 0
  const canSend =
    hasDraftContent && !isClosed && !isUploading && !sendMutation.isPending
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
      showMeta:
        index === 0 ||
        messages[index - 1]?.isMine !== entry.isMine ||
        messages[index - 1]?.senderRole !== entry.senderRole,
    }))
  }, [visibleMessages])
  const systemMessages = useMemo(
    () =>
      (data?.ticket?.messages ?? []).filter((entry) =>
        HIDDEN_SYSTEM_PREFIXES.some((prefix) => entry.body.startsWith(prefix)),
      ),
    [data?.ticket?.messages],
  )

  useBackButton(() => router.back())

  if (isLoading) {
    return (
      <Screen noTabBar>
        <ScreenEmpty
          icon={<CircleDashed size={28} className="text-[var(--color-muted)]" />}
          title="Загружаю заказ"
          subtitle="Подтягиваю оплату, чат и статус."
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
  const adminToolsVisible = ticket.isAdmin && mode === "admin"
  const shouldLockBuyerChat =
    !isSupportFlow &&
    isBuyerView &&
    isAwaitingPayment &&
    !isClosed &&
    (!isManualPayment || !isManualPaymentRequested)
  const showRawPaymentDetails = ticket.paymentMethodType === "MANUAL"
  const statusLabel = renderStatus(ticket.status)
  const createdAtLabel = format(new Date(ticket.createdAt), "dd MMMM · HH:mm", {
    locale: ru,
  })
  const paymentStateLabel = isSupportFlow
    ? "Поддержка"
    : ticket.isPaid
      ? "Оплачено"
      : ticket.status === "PAYMENT_REVIEW"
        ? "На проверке"
        : ticket.status === "CANCELLED"
          ? "Отменён"
      : "Ожидает оплату"
  const orderSteps = getOrderSteps(ticket)
  const headerActions = adminToolsVisible ? (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {!ticket.isPaid ? (
        <button
          onClick={() => paymentMutation.mutate()}
          disabled={ticket.status === "CANCELLED"}
          className="shrink-0 rounded-full bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-[var(--color-accent-text)]"
        >
          Подтвердить оплату
        </button>
      ) : null}
      {ticket.status === "PAYMENT_REVIEW" ? (
        <button
          onClick={() => rejectManualPaymentMutation.mutate()}
          className="shrink-0 rounded-full bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)]"
        >
          Отклонить
        </button>
      ) : null}
      <button
        onClick={() => statusMutation.mutate("IN_PROGRESS")}
        disabled={ticket.status === "CANCELLED"}
        className="shrink-0 rounded-full bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)]"
      >
        В работу
      </button>
      <button
        onClick={() => statusMutation.mutate("CLOSED")}
        className="shrink-0 rounded-full bg-[var(--color-bg)] px-3 py-2 text-xs font-medium text-[var(--color-text)]"
      >
        Закрыть
      </button>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        disabled={deleteTicketMutation.isPending}
        className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-[var(--color-destructive)]/14 px-3 py-2 text-xs font-medium text-[var(--color-destructive)] disabled:opacity-60"
      >
        <Trash2 size={12} />
        {deleteTicketMutation.isPending ? "Удаляю..." : "Удалить"}
      </button>
    </div>
  ) : null

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const nextFiles = files.slice(0, Math.max(0, MAX_ATTACHMENTS - attachments.length))
    if (!nextFiles.length) {
      event.target.value = ""
      return
    }

    setIsUploading(true)

    try {
      const processed = await Promise.all(
        nextFiles.map(async (file) => ({
          type: "image" as const,
          url: await optimizeMessageImage(file),
        })),
      )

      setAttachments((current) => [...current, ...processed].slice(0, MAX_ATTACHMENTS))
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  if (shouldLockBuyerChat) {
    return (
      <Screen noTabBar className="pb-6">
        <ScreenHeader
          title={ticket.productTitle || ticket.subject}
          subtitle={
            <HeaderMetaRow
              items={[
                `#${ticket.number}`,
                paymentStateLabel,
                ticket.productCategory || null,
                ticket.paymentMethodTitle || null,
              ]}
            />
          }
        />

        <div className="grid gap-4 px-4 pb-4">
          <section className="ui-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge kind="waiting">Оплата</StatusBadge>
              <StatusBadge>{ticket.paymentMethodTitle || "Способ оплаты"}</StatusBadge>
              <span className="ml-auto text-[11px] text-[var(--color-muted)]">
                {createdAtLabel}
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-2 rounded-[20px] bg-[var(--color-bg)] p-4 sm:grid-cols-3">
                {[
                  {
                    title: "Оплата",
                    subtitle: "Сейчас",
                    state: "current" as const,
                  },
                  {
                    title: "Подтверждение",
                    subtitle: "Авто / вручную",
                    state:
                      ticket.status === "PAYMENT_REVIEW"
                        ? ("current" as const)
                        : ("upcoming" as const),
                  },
                  {
                    title: "Выдача",
                    subtitle: "После оплаты",
                    state: "upcoming" as const,
                  },
                ].map((step, index) => (
                  <div
                    key={step.title}
                    className="flex items-center gap-3 rounded-[16px] bg-[var(--color-surface)] px-3 py-3"
                  >
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        step.state === "current"
                          ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                          : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {ticket.paymentMethodTitle ? (
                <section className="rounded-[20px] bg-[var(--color-bg)] p-4 sm:p-5">
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
                        {ticket.paymentMethodType === "CRYPTO_PAY"
                          ? "Оплата через Crypto Bot"
                          : ticket.status === "PAYMENT_REVIEW"
                            ? "Платёж отмечен, ждём проверку"
                            : "Реквизиты для оплаты"}
                      </p>
                    </div>
                    {ticket.paymentMethodType === "CRYPTO_PAY" ? (
                      <button
                        onClick={() => refreshMutation.mutate()}
                        className="flex size-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]"
                      >
                        <RefreshCcw
                          size={15}
                          className={refreshMutation.isPending ? "animate-spin" : ""}
                        />
                      </button>
                    ) : null}
                  </div>

                {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[18px] bg-[var(--color-surface)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                              Сумма
                          </p>
                          <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">
                              {ticket.cryptoInvoiceAmount
                                ? `${ticket.cryptoInvoiceAmount} ${ticket.cryptoInvoiceFiat || "RUB"}`
                                : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                              Статус
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                              {ticket.cryptoInvoiceStatus === "paid"
                                ? "Оплачено"
                                : "Ожидает оплату"}
                            </p>
                          </div>
                        </div>
                        {ticket.cryptoInvoiceAsset ? (
                          <p className="mt-3 text-xs text-[var(--color-muted)]">
                            Доступные монеты: {ticket.cryptoInvoiceAsset}
                          </p>
                        ) : null}
                      </div>

                      <a
                        href={ticket.cryptoInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                      >
                        Оплатить через Crypto Bot
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  ) : ticket.paymentMethodType === "CRYPTO_PAY" ? (
                    <div className="mt-4 rounded-[18px] bg-[var(--color-surface)] p-4">
                      <p className="text-sm text-[var(--color-text)]">
                        Подготавливаю оплату. Обнови экран чуть позже.
                      </p>
                    </div>
                  ) : ticket.paymentMethodDetails && showRawPaymentDetails ? (
                    <div className="mt-4 grid gap-3">
                      <div className="rounded-[18px] bg-[var(--color-surface)] p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                          {ticket.paymentMethodDetails}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => markManualPaidMutation.mutate()}
                        disabled={markManualPaidMutation.isPending || Boolean(ticket.manualPaymentRequestedAt)}
                        className="flex items-center justify-center rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)] disabled:opacity-60"
                      >
                        {markManualPaidMutation.isPending
                          ? "Отмечаю..."
                          : ticket.manualPaymentRequestedAt
                            ? "Платёж отправлен на проверку"
                            : "Я оплатил"}
                      </button>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {!ticket.isPaid && ticket.status !== "CANCELLED" ? (
                <button
                  type="button"
                  onClick={() => cancelOrderMutation.mutate()}
                  disabled={cancelOrderMutation.isPending}
                  className="rounded-[18px] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-destructive)] disabled:opacity-60"
                >
                  {cancelOrderMutation.isPending ? "Отменяю..." : "Отменить заказ"}
                </button>
              ) : null}
            </div>
          </section>

          {systemMessages.length > 0 ? (
            <section className="ui-card p-4 sm:p-5">
              <p className="text-sm font-semibold text-[var(--color-text)]">История заказа</p>
              <div className="mt-4 grid gap-2">
                {systemMessages.map((entry) => (
                  <div key={entry.id} className="rounded-[18px] bg-[var(--color-bg)] px-4 py-3">
                    <p className="text-sm text-[var(--color-text)]">{entry.body}</p>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                      {format(new Date(entry.createdAt), "dd MMM · HH:mm", { locale: ru })}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </Screen>
    )
  }

  return (
    <Screen noTabBar className="xl:h-dvh xl:overflow-hidden">
      <ScreenHeader
        title={ticket.productTitle || ticket.subject}
        subtitle={
          <HeaderMetaRow
            items={[
              `#${ticket.number}`,
              isSupportFlow ? "Обращение" : statusLabel,
              ticket.productCategory || null,
              ticket.paymentMethodTitle || null,
            ]}
          />
        }
      />

      {adminToolsVisible ? (
        <div className="px-4 pb-3">
          <div className="ui-card p-3">
            {headerActions}
            {ticket.createdBy ? (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-bg)] px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                    Покупатель
                  </p>
                  <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">
                    {[ticket.createdBy.firstName, ticket.createdBy.lastName || ""].join(" ").trim()}
                  </p>
                </div>
                <Link
                  href="/admin/users"
                  className="shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
                >
                  Модерация
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col px-4 pb-4 xl:min-h-0">
        {!isSupportFlow ? (
          <button
            type="button"
            onClick={() => setIsMobileDetailsOpen((current) => !current)}
            className="ui-card mb-4 flex items-center justify-between px-4 py-3 text-left xl:hidden"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">Детали заказа</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {paymentStateLabel} · {ticket.paymentMethodTitle || "Без способа оплаты"}
              </p>
            </div>
            <ChevronDown
              size={16}
              className={cn(
                "shrink-0 text-[var(--color-muted)] transition-transform",
                isMobileDetailsOpen && "rotate-180",
              )}
            />
          </button>
        ) : null}

        <div
          className={cn(
            "grid gap-4 xl:min-h-0 xl:flex-1",
            !isSupportFlow && "xl:grid-cols-[minmax(0,1fr)_360px]",
          )}
        >
          <div className="order-1 grid gap-4 xl:order-1 xl:min-h-0">
            {systemMessages.length > 0 ? (
              <section className="ui-card p-4">
                <div className="flex items-center gap-2">
                  <CircleDashed size={16} className="text-[var(--color-muted)]" />
                  <p className="text-sm font-semibold text-[var(--color-text)]">Системные события</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {systemMessages.map((entry) => (
                    <div key={entry.id} className="rounded-[18px] bg-[var(--color-bg)] px-4 py-3">
                      <p className="text-sm text-[var(--color-text)]">{entry.body}</p>
                      <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                        {format(new Date(entry.createdAt), "dd MMM · HH:mm", { locale: ru })}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="ui-card flex min-h-[48dvh] max-h-[62dvh] flex-col overflow-hidden xl:min-h-0 xl:max-h-none">
              <div className="hidden border-b border-[var(--color-border)] px-4 py-3 sm:px-5 xl:block">
                <div className="flex flex-wrap items-center gap-2">
                  {!isSupportFlow ? (
                    <StatusBadge kind={ticket.isPaid ? "paid" : "waiting"}>
                      {paymentStateLabel}
                    </StatusBadge>
                  ) : null}
                  <StatusBadge>{isSupportFlow ? "Поддержка" : statusLabel}</StatusBadge>
                  {ticket.paymentMethodTitle ? (
                    <StatusBadge>{ticket.paymentMethodTitle}</StatusBadge>
                  ) : null}
                  <span className="ml-auto text-[11px] text-[var(--color-muted)]">
                    {createdAtLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col xl:min-h-0">
              {groupedMessages.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-4 sm:p-5 xl:min-h-0">
                  <ScreenEmpty
                    title="Сообщений пока нет"
                    subtitle={
                      isSupportFlow
                        ? "Начни диалог с продавцом."
                        : ticket.paymentMethodType === "MANUAL" && ticket.manualPaymentRequestedAt
                          ? "Платёж отмечен. Можно уточнить детали у продавца."
                          : "После оплаты здесь будет нормальный диалог по заказу."
                    }
                    icon={<CreditCard size={28} className="text-[var(--color-muted)]" />}
                  />
                </div>
              ) : (
                <div className="flex flex-1 flex-col justify-end gap-2.5 overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg)_78%,transparent),transparent_24%)] px-3 py-3 sm:px-4 sm:py-4 xl:min-h-0">
                  {groupedMessages.map((entry) => {
                    const isAdmin = entry.senderRole === "ADMIN"
                    const senderRoleLabel = isAdmin ? "Админ" : "Покупатель"

                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-end gap-2",
                          entry.isMine ? "justify-end" : "justify-start",
                        )}
                      >
                        {!entry.isMine ? (
                          <SenderAvatar isAdmin={isAdmin} visible={entry.showMeta} />
                        ) : null}

                        <div
                          className={cn(
                            "max-w-[82%] sm:max-w-[74%]",
                            entry.attachments.length > 0 && "w-[min(360px,72vw)] sm:w-[min(420px,52vw)]",
                            entry.isMine && "flex flex-col items-end",
                          )}
                        >
                          {entry.showMeta && !entry.isMine ? (
                            <div
                              className={cn(
                                "mb-1 flex items-center gap-2 px-1 text-[11px] text-[var(--color-muted)] justify-start",
                              )}
                            >
                              <span className="font-medium text-[var(--color-text)]">{entry.senderName}</span>
                              <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5">
                                {senderRoleLabel}
                              </span>
                            </div>
                          ) : null}

                          <div
                            className={cn(
                                "overflow-hidden rounded-[22px] shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_4%,transparent)_inset]",
                              entry.isMine
                                ? "rounded-br-md bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                                : "rounded-bl-md bg-[var(--color-surface-2)] text-[var(--color-text)]",
                            )}
                          >
                            {entry.attachments.length > 0 ? (
                              <div
                                className={cn(
                                  "grid gap-2 p-2",
                                  entry.attachments.length === 1
                                    ? "grid-cols-1"
                                    : "grid-cols-2",
                                  entry.body && "mb-3",
                                )}
                              >
                                {entry.attachments.map((attachment, index) => (
                                  <button
                                    key={`${entry.id}-${index}`}
                                    type="button"
                                    onClick={() => setPreviewImage(attachment.url)}
                                    className="group relative overflow-hidden rounded-[20px] bg-[color-mix(in_srgb,var(--color-bg)_72%,transparent)]"
                                  >
                                    <div
                                      className={cn(
                                        "relative w-full",
                                        entry.attachments.length === 1
                                          ? "aspect-[1/1]"
                                          : "aspect-[4/3]",
                                      )}
                                    >
                                      <Image
                                        src={attachment.url}
                                        alt=""
                                        fill
                                        unoptimized
                                        sizes="(max-width: 768px) 72vw, 420px"
                                        className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                      />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null}

                            {entry.body ? (
                              <p
                                className={cn(
                                  "whitespace-pre-wrap break-words px-3 pb-2.5 text-sm leading-[1.35rem]",
                                  !entry.attachments.length && "pt-2.5",
                                )}
                              >
                                {entry.body}
                              </p>
                            ) : null}

                            <div
                              className={cn(
                                "flex items-center justify-end gap-1 px-3 pb-2.5 text-[10px]",
                                entry.body && "pt-0",
                                !entry.body && entry.attachments.length > 0 && "pt-1",
                                entry.isMine
                                  ? "text-[var(--color-accent-text)]/78"
                                  : "text-[var(--color-muted)]",
                              )}
                            >
                              <span>
                                {format(new Date(entry.createdAt), "HH:mm", { locale: ru })}
                              </span>
                              {entry.isMine ? <CheckCheck size={12} /> : null}
                            </div>
                          </div>
                        </div>

                      </div>
                    )
                  })}
                </div>
              )}

              <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 sm:px-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />

                {attachments.length > 0 ? (
                  <div className="mb-2.5 flex gap-2 overflow-x-auto pb-1">
                    {attachments.map((attachment, index) => (
                      <div
                        key={`${attachment.url}-${index}`}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg)]"
                      >
                        <Image
                          src={attachment.url}
                          alt=""
                          fill
                          unoptimized
                          sizes="80px"
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((current) =>
                              current.filter((_, currentIndex) => currentIndex !== index),
                            )
                          }
                          className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] text-[var(--color-text)]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isClosed || isUploading || attachments.length >= MAX_ATTACHMENTS}
                    className="flex size-10 shrink-0 items-center justify-center rounded-[15px] bg-[var(--color-bg)] text-[var(--color-text)] disabled:opacity-45"
                  >
                    <ImagePlus size={18} />
                  </button>

                  <div className="min-w-0 flex-1 rounded-[18px] bg-[var(--color-bg)] px-3 py-2">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={
                        isClosed
                          ? "Заказ закрыт"
                          : isSupportFlow
                            ? "Напиши сообщение или прикрепи скрин"
                            : "Сообщение по заказу или скрин"
                      }
                      disabled={isClosed}
                      className="min-h-[38px] max-h-28 w-full resize-none bg-transparent py-0.5 text-sm leading-5 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                    />
                    <div className="flex items-center justify-between gap-2 px-1 pt-1">
                      <span className="text-[11px] text-[var(--color-muted)]">
                        {isUploading
                          ? "Обработка..."
                          : attachments.length > 0
                            ? `${attachments.length}/${MAX_ATTACHMENTS} вложений`
                            : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => canSend && sendMutation.mutate()}
                        disabled={!canSend}
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full transition-colors",
                          canSend
                            ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                            : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                        )}
                      >
                        <SendHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </section>

          {ticket.deliveredKey ? (
            <section className="ui-card shrink-0 p-4 sm:p-5">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Выданный ключ
              </p>
              <p className="mt-3 break-all rounded-[18px] bg-[var(--color-bg)] p-4 font-mono text-sm text-[var(--color-text)]">
                {ticket.deliveredKey}
              </p>
            </section>
          ) : null}
        </div>

          {!isSupportFlow ? (
            <aside
              className={cn(
                "order-2 content-start gap-4 xl:order-2 xl:min-h-0 xl:overflow-y-auto",
                isMobileDetailsOpen ? "grid" : "hidden xl:grid",
              )}
            >
            <section className="ui-card shrink-0 p-4">
              <p className="text-sm font-semibold text-[var(--color-text)]">Статус заказа</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                {orderSteps.map((step, index) => (
                  <div key={step.title} className="rounded-[18px] bg-[var(--color-bg)] p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
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
                      <div className="min-w-0">
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
                        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {ticket.paymentMethodTitle ? (
              <section className="ui-card shrink-0 p-4">
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
                      {ticket.paymentMethodType === "CRYPTO_PAY"
                        ? "Crypto Pay"
                        : "Ручные реквизиты"}
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

                {ticket.paymentMethodDetails && showRawPaymentDetails ? (
                  <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                      {ticket.paymentMethodDetails}
                    </p>
                  </div>
                ) : null}

                {ticket.paymentMethodType === "MANUAL" && ticket.manualPaymentRequestedAt && !ticket.isPaid ? (
                  <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      Платёж отправлен на проверку
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                      Админ проверит оплату и после подтверждения запустит выдачу.
                    </p>
                  </div>
                ) : null}

                {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[18px] bg-[var(--color-bg)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                            Статус
                          </p>
                          <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                            {ticket.cryptoInvoiceStatus === "paid"
                              ? "Оплачен"
                              : "Ждёт оплату"}
                          </p>
                        </div>
                        {ticket.cryptoInvoiceAmount || ticket.cryptoInvoiceAsset ? (
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              Сумма
                            </p>
                            <p className="mt-1 text-sm font-medium text-[var(--color-text)]">
                              {ticket.cryptoInvoiceAmount
                                ? `${ticket.cryptoInvoiceAmount} ${ticket.cryptoInvoiceFiat || "RUB"}`
                                : "—"}
                            </p>
                          </div>
                        ) : null}
                      </div>

                      {ticket.cryptoInvoiceAsset ? (
                        <p className="mt-3 text-xs text-[var(--color-muted)]">
                          Доступные монеты: {ticket.cryptoInvoiceAsset}
                        </p>
                      ) : null}

                      {ticket.cryptoInvoiceExpiresAt ? (
                        <p className="mt-3 text-xs text-[var(--color-muted)]">
                          До{" "}
                          {format(new Date(ticket.cryptoInvoiceExpiresAt), "dd MMM · HH:mm", {
                            locale: ru,
                          })}
                        </p>
                      ) : null}
                    </div>

                    <a
                      href={ticket.cryptoInvoiceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                    >
                      Открыть invoice
                      <ExternalLink size={15} />
                    </a>
                  </div>
                ) : ticket.paymentMethodType === "CRYPTO_PAY" ? (
                  <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          Invoice ещё не создан
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          Попробуй обновить через пару секунд.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => refreshMutation.mutate()}
                        className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                      >
                        Обновить
                      </button>
                    </div>
                  </div>
                ) : ticket.paymentMethodType === "MANUAL" && !ticket.paymentMethodDetails ? (
                  <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-4">
                    <p className="text-sm text-[var(--color-muted)]">
                      Реквизиты пока не добавлены.
                    </p>
                  </div>
                ) : null}

                {isBuyerView && !ticket.isPaid && !["CLOSED", "CANCELLED"].includes(ticket.status) ? (
                  <button
                    type="button"
                    onClick={() => cancelOrderMutation.mutate()}
                    disabled={cancelOrderMutation.isPending}
                    className="mt-4 w-full rounded-[18px] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-destructive)] disabled:opacity-60"
                  >
                    {cancelOrderMutation.isPending ? "Отменяю..." : "Отменить заказ"}
                  </button>
                ) : null}
              </section>
            ) : null}
          </aside>
          ) : null}
        </div>
      </div>

      {previewImage ? (
        <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      ) : null}

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

function ImagePreviewModal({
  src,
  onClose,
}: {
  src: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-bg)_90%,transparent)] p-3 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(90vh,920px)] w-full max-w-6xl items-center justify-center overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_76%,transparent)] text-[var(--color-text)]"
        >
          <X size={16} />
        </button>

        <div className="relative h-full w-full">
          <Image src={src} alt="" fill unoptimized sizes="100vw" className="object-contain" />
        </div>
      </div>
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
            <p className="text-base font-semibold text-[var(--color-text)]">
              Удалить заказ
            </p>
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
