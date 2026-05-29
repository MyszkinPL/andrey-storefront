"use client"

import type { PaymentMethodType } from "@prisma/client"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react"

import {
  cancelOwnOrder,
  changeOrderPaymentMethod,
  confirmOrderPayment,
  deleteAdminOrder,
  getMe,
  getPaymentMethods,
  getOrder,
  markManualOrderPaid,
  rejectManualOrderPayment,
  refreshCryptoInvoice,
} from "@/lib/api"
import { useMode } from "@/components/mode-provider"
import { Screen, ScreenEmpty } from "@/components/screen"
import { useBackButton } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false)
  const [draftPaymentKey, setDraftPaymentKey] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<"payment" | "key" | null>(null)

  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
    enabled: true,
  })
  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
    refetchInterval: 10_000,
  })

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: ["order", orderId] })
    await queryClient.invalidateQueries({ queryKey: ["orders"] })
  }

  async function copyValue(value: string, field: "payment" | "key") {
    await navigator.clipboard.writeText(value)
    setCopiedField(field)
    window.setTimeout(() => {
      setCopiedField((current) => (current === field ? null : current))
    }, 1500)
  }

  const paymentMutation = useMutation({
    mutationFn: () => confirmOrderPayment(orderId),
    onSuccess: invalidate,
  })
  const rejectManualPaymentMutation = useMutation({
    mutationFn: () => rejectManualOrderPayment(orderId),
    onSuccess: invalidate,
  })
  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelOwnOrder(orderId),
    onSuccess: invalidate,
  })
  const refreshMutation = useMutation({
    mutationFn: () => refreshCryptoInvoice(orderId),
    onSuccess: invalidate,
  })
  const markManualPaidMutation = useMutation({
    mutationFn: () => markManualOrderPaid(orderId),
    onSuccess: invalidate,
  })
  const changePaymentMethodMutation = useMutation({
    mutationFn: (payload: { paymentMethodId?: string; paymentMethodType?: PaymentMethodType }) =>
      changeOrderPaymentMethod(
        orderId,
        payload.paymentMethodId
          ? { paymentMethodId: payload.paymentMethodId }
          : { paymentMethodType: "CRYPTO_PAY" },
      ),
    onSuccess: async () => {
      await invalidate()
      setIsPaymentPickerOpen(false)
      setDraftPaymentKey(null)
    },
  })
  const deleteOrderMutation = useMutation({
    mutationFn: () => deleteAdminOrder(orderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      router.push("/admin/orders")
    },
  })

  useBackButton(() => router.back())

  const paymentOptions = [
    ...((paymentData?.paymentMethods ?? []).filter((item) => item.isActive).map((method) => ({
      key: `manual:${method.id}`,
      id: method.id,
      type: "MANUAL" as const,
      title: method.title,
      subtitle: method.details,
      iconDataUrl: method.iconDataUrl,
    })) ?? []),
    ...(paymentData?.cryptoPay.enabled
      ? [
          {
            key: "crypto:auto",
            id: undefined,
            type: "CRYPTO_PAY" as const,
            title: paymentData.cryptoPay.title || "Crypto Bot",
            subtitle:
              paymentData.cryptoPay.acceptedAssets
                ? `Автооплата · ${paymentData.cryptoPay.acceptedAssets}`
                : "Автооплата через invoice",
            iconDataUrl: paymentData.cryptoPay.iconDataUrl || null,
          },
        ]
      : []),
  ]

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

  if (isError || !data?.order) {
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

  const order = data.order
  const isBuyerView = mode === "buyer"
  const isRealBuyerView = isBuyerView && order.isOwner
  const isClosed = ["CLOSED", "CANCELLED"].includes(order.status)
  const supportLink = meData?.settings.supportUsername
    ? `https://t.me/${meData.settings.supportUsername.replace(/^@/, "")}`
    : null
  const createdAtLabel = format(new Date(order.createdAt), "dd MMMM · HH:mm", {
    locale: ru,
  })
  const paymentStateLabel = order.isPaid
    ? "Оплачено"
    : order.status === "PAYMENT_REVIEW"
      ? "На проверке"
        : order.status === "CANCELLED"
          ? "Отменён"
          : "Ожидает оплату"
  const adminToolsVisible = order.isAdmin && mode === "admin"
  const canConfirmManualPayment =
    adminToolsVisible &&
    order.paymentMethodType === "MANUAL" &&
    order.status === "PAYMENT_REVIEW" &&
    !order.isPaid
  const canRefreshCryptoPayment =
    order.paymentMethodType === "CRYPTO_PAY" && !order.isPaid && !isClosed
  const canSwitchPaymentMethod =
    isRealBuyerView &&
    !order.isPaid &&
    !isClosed &&
    !order.manualPaymentRequestedAt &&
    paymentOptions.length > 1
  const amountLabel = order.cryptoInvoiceAmount
    ? `${order.cryptoInvoiceAmount} ${order.cryptoInvoiceFiat || "RUB"}`
    : null
  const currentPaymentKey =
    order.paymentMethodType === "MANUAL" && order.paymentMethodId
      ? `manual:${order.paymentMethodId}`
      : order.paymentMethodType === "CRYPTO_PAY"
        ? "crypto:auto"
        : null
  const selectedDraftPayment =
    paymentOptions.find((option) => option.key === (draftPaymentKey || currentPaymentKey)) || null
  const stepper = [
    {
      label: "Оплата",
      active: true,
      done: order.isPaid,
    },
    {
      label: order.deliveredKey ? "Ключ" : "Выдача",
      active: order.isPaid,
      done: Boolean(order.deliveredKey) || order.status === "CLOSED",
    },
    {
      label: "Готово",
      active: order.status === "CLOSED" || Boolean(order.deliveredKey),
      done: order.status === "CLOSED" || Boolean(order.deliveredKey),
    },
  ]

  const showManualWaitingCard =
    order.paymentMethodType === "MANUAL" && order.manualPaymentRequestedAt && !order.isPaid
  const showPaymentDetailsCard =
    (order.paymentMethodType === "CRYPTO_PAY" && Boolean(order.cryptoInvoiceUrl) && !order.isPaid) ||
    (order.paymentMethodType === "MANUAL" && Boolean(order.paymentMethodDetails) && !order.isPaid)

  return (
    <Screen noTabBar className="pt-3">
      <div className="px-4 pb-4">
        <div className="mx-auto grid w-full max-w-3xl gap-3">
          <section className="ui-card overflow-hidden">
            <div className="px-5 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-col items-center text-center">
                <p className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text)]">
                  {order.productTitle || order.subject}
                </p>
                <div className="mt-2">
                  <HeaderMetaRow
                    items={[
                      `#${order.number}`,
                      createdAtLabel,
                      order.productCategory || null,
                    ]}
                  />
                </div>

                <div className="mt-5">
                  <PaymentMethodIcon
                    iconDataUrl={order.paymentMethodIconDataUrl}
                    title={order.paymentMethodTitle || "PM"}
                    large
                  />
                </div>

                <p className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text)] sm:text-[2rem]">
                  {paymentStateLabel}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {order.paymentMethodTitle || "Способ оплаты"}
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

              {adminToolsVisible ? (
                <div className="mt-6 grid gap-3">
                  {order.createdBy ? (
                    <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Покупатель
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                            {order.createdBy.firstName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                            {order.createdBy.username ? `@${order.createdBy.username}` : "Без username"}
                          </p>
                        </div>
                        <div className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-[11px] text-[var(--color-text)]">
                          {order.paymentMethodType === "MANUAL" ? "Ручная оплата" : "Crypto Bot"}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Действия
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {canConfirmManualPayment ? (
                        <button
                          onClick={() => paymentMutation.mutate()}
                          disabled={paymentMutation.isPending}
                          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-text)] disabled:opacity-60"
                        >
                          {paymentMutation.isPending ? "Подтверждаю..." : "Подтвердить оплату"}
                        </button>
                      ) : null}
                      {order.status === "PAYMENT_REVIEW" && order.paymentMethodType === "MANUAL" ? (
                        <button
                          onClick={() => rejectManualPaymentMutation.mutate()}
                          disabled={rejectManualPaymentMutation.isPending}
                          className="rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-60"
                        >
                          {rejectManualPaymentMutation.isPending ? "Отклоняю..." : "Отклонить"}
                        </button>
                      ) : null}
                      {canRefreshCryptoPayment ? (
                        <button
                          onClick={() => refreshMutation.mutate()}
                          disabled={refreshMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text)] disabled:opacity-60"
                        >
                          <RefreshCcw size={14} className={cn(refreshMutation.isPending && "animate-spin")} />
                          {refreshMutation.isPending ? "Проверяю оплату" : "Проверить оплату"}
                        </button>
                      ) : null}
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        disabled={deleteOrderMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-destructive)]/14 px-4 py-2 text-sm font-medium text-[var(--color-destructive)] disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        {deleteOrderMutation.isPending ? "Удаляю..." : "Удалить"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {canSwitchPaymentMethod ? (
                <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--color-text)]">Способ оплаты</p>
                      <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                        {order.paymentMethodTitle || "Не выбран"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftPaymentKey(currentPaymentKey)
                        setIsPaymentPickerOpen(true)
                      }}
                      className="shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text)]"
                    >
                      Изменить
                    </button>
                  </div>
                </div>
              ) : null}

              {showPaymentDetailsCard ? (
                <div className="mt-6 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3.5 sm:p-4">
                  {order.paymentMethodType === "CRYPTO_PAY" && order.cryptoInvoiceUrl ? (
                    <div className="grid gap-3">
                      {!order.isPaid ? (
                        <a
                          href={order.cryptoInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-12 items-center justify-center gap-2 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                        >
                          Открыть invoice
                          <ExternalLink size={16} />
                        </a>
                      ) : null}
                    </div>
                  ) : order.paymentMethodDetails && !order.isPaid ? (
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--color-text)]">Реквизиты</p>
                        <CopyButton
                          copied={copiedField === "payment"}
                          onClick={() => copyValue(order.paymentMethodDetails || "", "payment")}
                        />
                      </div>
                      <p className="break-all rounded-[18px] bg-[var(--color-surface)] px-4 py-4 text-sm leading-6 text-[var(--color-text)]">
                        {order.paymentMethodDetails}
                      </p>
                      {order.paymentMethodType === "MANUAL" &&
                      !order.isPaid &&
                      !order.manualPaymentRequestedAt &&
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

              {order.deliveredKey ? (
                <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--color-text)]">Выданный ключ</p>
                    <CopyButton
                      copied={copiedField === "key"}
                      onClick={() => copyValue(order.deliveredKey || "", "key")}
                    />
                  </div>
                  <p className="mt-3 break-all rounded-[18px] bg-[var(--color-surface)] px-4 py-4 font-mono text-sm text-[var(--color-text)]">
                    {order.deliveredKey}
                  </p>
                </div>
              ) : null}

              {showManualWaitingCard ? (
                <div className="mt-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Платёж на проверке</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    {adminToolsVisible
                      ? "Покупатель отметил перевод. Проверь реквизиты и либо подтверди оплату, либо отклони её."
                      : "Продавец вручную проверит оплату и после подтверждения продолжит выдачу."}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {order.isPaid && supportLink && isRealBuyerView ? (
                  <a
                    href={supportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
                  >
                    Поддержка в Telegram
                  </a>
                ) : null}

                {isRealBuyerView && !order.isPaid && !isClosed ? (
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
          loading={deleteOrderMutation.isPending}
          onClose={() => {
            if (deleteOrderMutation.isPending) return
            setIsDeleteModalOpen(false)
          }}
          onConfirm={() => {
            deleteOrderMutation.mutate()
          }}
        />
      ) : null}

      {isPaymentPickerOpen && canSwitchPaymentMethod ? (
        <PaymentMethodPickerModal
          options={paymentOptions}
          selectedKey={draftPaymentKey || currentPaymentKey}
          currentKey={currentPaymentKey}
          loading={changePaymentMethodMutation.isPending}
          onSelect={setDraftPaymentKey}
          onClose={() => {
            if (changePaymentMethodMutation.isPending) return
            setIsPaymentPickerOpen(false)
            setDraftPaymentKey(null)
          }}
          onConfirm={() => {
            if (!selectedDraftPayment || selectedDraftPayment.key === currentPaymentKey) return
            changePaymentMethodMutation.mutate(
              selectedDraftPayment.type === "MANUAL"
                ? { paymentMethodId: selectedDraftPayment.id }
                : { paymentMethodType: "CRYPTO_PAY" },
            )
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
          "relative overflow-hidden",
          large ? "size-16 rounded-[20px]" : "size-12 rounded-[18px]",
        )}
      >
        <Image
          src={iconDataUrl}
          alt=""
          fill
          unoptimized
          sizes={large ? "64px" : "48px"}
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]",
        large ? "size-16 rounded-[20px]" : "size-12 rounded-[18px]",
      )}
    >
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

function CopyButton({
  copied,
  onClick,
}: {
  copied: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors",
        copied
          ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
          : "bg-[var(--color-bg)] text-[var(--color-text)]",
      )}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Скопировано" : "Копировать"}
    </button>
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

function PaymentMethodPickerModal({
  options,
  selectedKey,
  currentKey,
  loading,
  onSelect,
  onClose,
  onConfirm,
}: {
  options: Array<{
    key: string
    id?: string
    type: "MANUAL" | "CRYPTO_PAY"
    title: string
    subtitle: string
    iconDataUrl: string | null
  }>
  selectedKey: string | null
  currentKey: string | null
  loading: boolean
  onSelect: (key: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const canConfirm = Boolean(selectedKey && selectedKey !== currentKey && !loading)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-3 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="ui-card w-full max-w-lg p-4 sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">Изменить способ оплаты</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Выбери новый способ и подтверди изменение.
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

        <div className="mt-4 grid max-h-[55dvh] gap-2 overflow-y-auto pr-1">
          {options.map((option) => {
            const isSelected = option.key === selectedKey

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onSelect(option.key)}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-colors sm:px-4",
                  isSelected
                    ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-bg))]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]",
                )}
              >
                <PaymentMethodIcon iconDataUrl={option.iconDataUrl} title={option.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {option.title}
                    </p>
                    <span className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                      {option.type === "CRYPTO_PAY" ? "Авто" : "Ручная"}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                    {option.subtitle}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    isSelected
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                      : "border-[var(--color-border)] bg-transparent text-transparent",
                  )}
                >
                  <Check size={12} />
                </div>
              </button>
            )
          })}
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
            disabled={!canConfirm}
            className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-text)] disabled:opacity-60"
          >
            {loading ? "Сохраняю..." : "Подтвердить"}
          </button>
        </div>
      </div>
    </div>
  )
}
