"use client"

import Image from "next/image"
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
  const isActualAdmin = meData?.user.role === "ADMIN"
  const isRealBuyerView = isBuyerView && !isActualAdmin
  const isClosed = ["CLOSED", "CANCELLED"].includes(ticket.status)
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
  const adminToolsVisible = ticket.isAdmin && mode === "admin"
  const amountLabel = ticket.cryptoInvoiceAmount
    ? `${ticket.cryptoInvoiceAmount} ${ticket.cryptoInvoiceFiat || "RUB"}`
    : null
  const stepper = [
    {
      label: "Оплата",
      active: true,
      done: ticket.isPaid,
    },
    {
      label: ticket.deliveredKey ? "Ключ" : "Выдача",
      active: ticket.isPaid,
      done: Boolean(ticket.deliveredKey) || ticket.status === "CLOSED",
    },
    {
      label: "Готово",
      active: ticket.status === "CLOSED" || Boolean(ticket.deliveredKey),
      done: ticket.status === "CLOSED" || Boolean(ticket.deliveredKey),
    },
  ]

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
    <Screen noTabBar className="pt-3">
      {adminToolsVisible ? (
        <div className="px-4 pb-2.5">
          <div className="ui-card p-2.5">{headerActions}</div>
        </div>
      ) : null}

      <div className="px-4 pb-4">
        <div className="mx-auto grid w-full max-w-3xl gap-3">
          <section className="ui-card overflow-hidden">
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col items-center text-center">
                <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
                  {ticket.productTitle || ticket.subject}
                </p>
                <div className="mt-2">
                  <HeaderMetaRow
                    items={[
                      `#${ticket.number}`,
                      createdAtLabel,
                      ticket.productCategory || null,
                    ]}
                  />
                </div>

                <div className="mt-5 flex size-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-accent)_18%,var(--color-surface)_82%)] sm:size-24">
                  <PaymentMethodIcon
                    iconDataUrl={ticket.paymentMethodIconDataUrl}
                    title={ticket.paymentMethodTitle || "PM"}
                    large
                  />
                </div>

                <p className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-[2rem]">
                  {paymentStateLabel}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {ticket.paymentMethodTitle || "Способ оплаты"}
                </p>
                {amountLabel ? (
                  <p className="mt-3 text-3xl font-semibold leading-none text-[var(--color-text)] sm:text-[2.6rem]">
                    {amountLabel}
                  </p>
                ) : null}
              </div>

              <div className="mt-5">
                <div className="flex items-center gap-2 rounded-[18px] bg-[var(--color-bg)] px-3 py-2.5 sm:px-4">
                  {stepper.map((step, index) => (
                    <div key={step.label} className="flex min-w-0 flex-1 items-center gap-2">
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                          step.done || step.active
                            ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                            : "bg-[var(--color-surface)] text-[var(--color-muted)]",
                        )}
                      >
                        {index + 1}
                      </div>
                      <span
                        className={cn(
                          "truncate text-xs font-medium",
                          step.done || step.active
                            ? "text-[var(--color-text)]"
                            : "text-[var(--color-muted)]",
                        )}
                      >
                        {step.label}
                      </span>
                      {index < stepper.length - 1 ? (
                        <div className="h-px min-w-3 flex-1 bg-[var(--color-border)]" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              {ticket.paymentMethodTitle ? (
                <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5 sm:p-4">
                  {ticket.paymentMethodType === "CRYPTO_PAY" && ticket.cryptoInvoiceUrl ? (
                    <div className="grid gap-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <PaymentDataItem label="Статус" value={ticket.cryptoInvoiceStatus === "paid" ? "Оплачен" : "Ждёт оплату"} />
                        <PaymentDataItem label="Сумма" value={amountLabel || "—"} align="right" />
                      </div>
                      {!ticket.isPaid ? (
                        <a
                          href={ticket.cryptoInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                        >
                          Открыть invoice
                          <ExternalLink size={16} />
                        </a>
                      ) : null}
                    </div>
                  ) : ticket.paymentMethodDetails ? (
                    <div className="grid gap-3">
                      <p className="whitespace-pre-wrap rounded-[18px] bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-text)]">
                        {ticket.paymentMethodDetails}
                      </p>
                      {ticket.paymentMethodType === "MANUAL" &&
                      !ticket.isPaid &&
                      !ticket.manualPaymentRequestedAt &&
                      isRealBuyerView &&
                      !isClosed ? (
                        <button
                          type="button"
                          onClick={() => markManualPaidMutation.mutate()}
                          disabled={markManualPaidMutation.isPending}
                          className="min-h-12 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)] disabled:opacity-60"
                        >
                          {markManualPaidMutation.isPending ? "Отмечаю..." : "Я оплатил"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {ticket.deliveredKey ? (
                <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
                  <p className="mt-3 break-all rounded-[18px] bg-[var(--color-surface)] px-4 py-4 font-mono text-sm text-[var(--color-text)]">
                    {ticket.deliveredKey}
                  </p>
                </div>
              ) : null}

              {showManualWaitingCard ? (
                <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Платёж на проверке</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    Продавец вручную проверит оплату и после подтверждения продолжит выдачу.
                  </p>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {ticket.isPaid && supportLink && isRealBuyerView ? (
                  <a
                    href={supportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                  >
                    Поддержка в Telegram
                  </a>
                ) : null}

                {isRealBuyerView && !ticket.isPaid && !isClosed ? (
                  <button
                    type="button"
                    onClick={() => cancelOrderMutation.mutate()}
                    disabled={cancelOrderMutation.isPending}
                    className="min-h-12 rounded-[18px] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-destructive)] disabled:opacity-60"
                  >
                    {cancelOrderMutation.isPending ? "Отменяю..." : "Отменить заказ"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </div>
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

function PaymentMethodIcon({
  iconDataUrl,
  title,
  large = false,
}: {
  iconDataUrl: string | null
  title: string
  large?: boolean
}) {
  if (iconDataUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[18px]",
          large ? "size-11 rounded-[16px]" : "size-12",
        )}
      >
        <Image
          src={iconDataUrl}
          alt=""
          fill
          unoptimized
          sizes={large ? "44px" : "48px"}
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]",
        large ? "size-11 rounded-[16px]" : "size-12 rounded-[18px]",
      )}
    >
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}

function PaymentDataItem({
  label,
  value,
  align = "left",
}: {
  label: string
  value: string
  align?: "left" | "right"
}) {
  return (
    <div className={cn("rounded-[16px] bg-[var(--color-surface)] px-3 py-3", align === "right" && "text-right")}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--color-text)]">{value}</p>
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
