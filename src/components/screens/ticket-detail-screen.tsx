"use client"

import Image from "next/image"
import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CheckCheck,
  CreditCard,
  ExternalLink,
  ImagePlus,
  RefreshCcw,
  SendHorizontal,
  Shield,
  User2,
  X,
} from "lucide-react"

import {
  confirmTicketPayment,
  getTicket,
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

  const refreshMutation = useMutation({
    mutationFn: () => refreshCryptoInvoice(ticketId),
    onSuccess: invalidate,
  })

  const isClosed = data?.ticket.status === "CLOSED"
  const isAwaitingPayment = !data?.ticket?.isPaid
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

  useBackButton(() => router.back())

  if (!data?.ticket) return null

  const ticket = data.ticket
  const isSupportFlow = !ticket.productTitle && !ticket.paymentMethodTitle
  const isBuyerView = mode === "buyer"
  const adminToolsVisible = ticket.isAdmin && mode === "admin"
  const shouldLockBuyerChat =
    !isSupportFlow && isBuyerView && isAwaitingPayment && !isClosed
  const showRawPaymentDetails =
    ticket.paymentMethodType !== "CRYPTO_PAY" || mode === "admin"
  const statusLabel = renderStatus(ticket.status)
  const createdAtLabel = format(new Date(ticket.createdAt), "dd MMMM · HH:mm", {
    locale: ru,
  })
  const paymentStateLabel = isSupportFlow
    ? "Поддержка"
    : ticket.isPaid
      ? "Оплачено"
      : "Ожидает оплату"
  const invoiceMeta = [
    ticket.cryptoInvoiceStatus,
    ticket.cryptoInvoiceAmount,
    ticket.cryptoInvoiceAsset,
  ]
    .filter(Boolean)
    .join(" · ")
  const orderSteps = getOrderSteps(ticket)

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
          subtitle={`#${ticket.number} · ${paymentStateLabel}`}
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
                    state: "upcoming" as const,
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
                              {ticket.cryptoInvoiceAmount || "—"}
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
                            {ticket.cryptoInvoiceAsset}
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
                    <div className="mt-4 rounded-[18px] bg-[var(--color-surface)] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text)]">
                        {ticket.paymentMethodDetails}
                      </p>
                    </div>
                  ) : null}
                </section>
              ) : null}
            </div>
          </section>
        </div>
      </Screen>
    )
  }

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader
        title={ticket.productTitle || ticket.subject}
        subtitle={`#${ticket.number} · ${isSupportFlow ? "Обращение" : statusLabel}`}
      />

      <div
        className={cn(
          "grid gap-4 px-4 pb-4",
          !isSupportFlow && "xl:grid-cols-[minmax(0,1fr)_360px]",
        )}
      >
        <div className="order-2 grid gap-4 xl:order-1">
          <section className="ui-card overflow-hidden">
            <div className="border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge kind={ticket.isPaid ? "paid" : "waiting"}>
                  {paymentStateLabel}
                </StatusBadge>
                <StatusBadge>{isSupportFlow ? "Поддержка" : statusLabel}</StatusBadge>
                {ticket.paymentMethodTitle ? (
                  <StatusBadge>{ticket.paymentMethodTitle}</StatusBadge>
                ) : null}
                <span className="ml-auto text-[11px] text-[var(--color-muted)]">
                  {createdAtLabel}
                </span>
              </div>
            </div>

            {groupedMessages.length === 0 ? (
              <div className="p-4 sm:p-5">
                <ScreenEmpty
                  title="Сообщений пока нет"
                  subtitle={
                    isSupportFlow
                      ? "Начни диалог с продавцом."
                      : "После оплаты здесь будет нормальный диалог по заказу."
                  }
                  icon={<CreditCard size={28} className="text-[var(--color-muted)]" />}
                />
              </div>
            ) : (
              <div className="grid gap-3 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-bg)_78%,transparent),transparent_24%)] px-3 py-4 sm:px-4 sm:py-5">
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
                          "max-w-[min(820px,92%)]",
                          entry.isMine && "flex flex-col items-end",
                        )}
                      >
                        {entry.showMeta ? (
                          <div
                            className={cn(
                              "mb-1 flex items-center gap-2 px-1 text-[11px] text-[var(--color-muted)]",
                              entry.isMine ? "justify-end" : "justify-start",
                            )}
                          >
                            <span className="font-medium text-[var(--color-text)]">
                              {entry.isMine ? "Ты" : entry.senderName}
                            </span>
                            <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5">
                              {senderRoleLabel}
                            </span>
                          </div>
                        ) : null}

                        <div
                          className={cn(
                            "overflow-hidden rounded-[24px] px-3 py-3 shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_4%,transparent)_inset]",
                            entry.isMine
                              ? "rounded-br-md bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                              : "rounded-bl-md bg-[var(--color-surface-2)] text-[var(--color-text)]",
                          )}
                        >
                          {entry.attachments.length > 0 ? (
                            <div
                              className={cn(
                                "grid gap-2",
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
                                  className="group relative overflow-hidden rounded-[18px] bg-[color-mix(in_srgb,var(--color-bg)_72%,transparent)]"
                                >
                                  <div className="relative aspect-[4/3] w-full">
                                    <Image
                                      src={attachment.url}
                                      alt=""
                                      fill
                                      unoptimized
                                      sizes="(max-width: 768px) 72vw, 320px"
                                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                                    />
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : null}

                          {entry.body ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {entry.body}
                            </p>
                          ) : null}

                          <div
                            className={cn(
                              "mt-2 flex items-center justify-end gap-1 text-[11px]",
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

                      {entry.isMine ? (
                        <SenderAvatar isAdmin={isAdmin} visible={entry.showMeta} />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3 sm:px-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {attachments.length > 0 ? (
                <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
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
                  className="flex size-11 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-bg)] text-[var(--color-text)] disabled:opacity-45"
                >
                  <ImagePlus size={18} />
                </button>

                <div className="min-w-0 flex-1 rounded-[22px] bg-[var(--color-bg)] px-3 py-2">
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
                    className="min-h-[54px] max-h-40 w-full resize-none bg-transparent py-1 text-sm leading-6 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                  />
                  <div className="flex items-center justify-between gap-3 px-1 pt-1">
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {isUploading
                        ? "Обрабатываю изображения..."
                        : `${attachments.length}/${MAX_ATTACHMENTS} вложений`}
                    </span>
                    <button
                      type="button"
                      onClick={() => canSend && sendMutation.mutate()}
                      disabled={!canSend}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full transition-colors",
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
          </section>

          {ticket.deliveredKey ? (
            <section className="ui-card p-4 sm:p-5">
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
                            step.state === "done"
                              ? "bg-[var(--color-accent)]/40"
                              : "bg-[var(--color-border)]",
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
                      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                        {step.subtitle}
                      </p>
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
                      {mode === "admin"
                        ? "Инвойс ещё не создан или не обновился. Проверь настройки Crypto Pay или обнови статус кнопкой справа сверху."
                        : "Invoice ещё не появился. Обнови экран чуть позже или дождись, пока продавец подготовит оплату."}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {adminToolsVisible ? (
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
        ) : null}
      </div>

      {previewImage ? (
        <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      ) : null}
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
  const closedUnpaid = ticket.status === "CLOSED" && !ticket.isPaid
  const invoiceReady =
    ticket.paymentMethodType === "CRYPTO_PAY" ? Boolean(ticket.cryptoInvoiceUrl) : true
  const paymentDone = ticket.isPaid
  const workStarted = ticket.status === "IN_PROGRESS" || ticket.status === "CLOSED"
  const fulfilled = Boolean(ticket.deliveredKey) || ticket.status === "CLOSED"

  const stepStates = closedUnpaid
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
      title: closedUnpaid
        ? "Заказ закрыт без оплаты"
        : paymentDone
          ? "Оплата подтверждена"
          : "Ожидание оплаты",
      subtitle: closedUnpaid
        ? "Оплата не была подтверждена, заказ закрыт."
        : ticket.paymentMethodType === "CRYPTO_PAY"
          ? invoiceReady
            ? ticket.cryptoInvoiceStatus === "paid"
              ? "Crypto Pay получил оплату."
              : "Инвойс готов к оплате."
            : "Инвойс ещё создаётся или требует обновления."
          : "Ожидается подтверждение по выбранным реквизитам.",
      state: stepStates[1],
    },
    {
      title: closedUnpaid
        ? "Обработка не начата"
        : workStarted
          ? "Заказ в работе"
          : "Ожидает обработки",
      subtitle: closedUnpaid
        ? "Этот этап не начался, потому что оплаты не было."
        : fulfilled
          ? "Продавец завершил выдачу."
          : workStarted
            ? "Продавец обрабатывает заказ."
            : "Начнётся после подтверждения оплаты.",
      state: stepStates[2],
    },
    {
      title: closedUnpaid
        ? "Выдача отменена"
        : fulfilled
          ? "Заказ завершён"
          : "Выдача / закрытие",
      subtitle: closedUnpaid
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
