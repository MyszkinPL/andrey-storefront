"use client"

import type { PaymentMethodType } from "@prisma/client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Badge,
  Button,
  Cell,
  Image as TgImage,
  Modal,
  Placeholder,
  Radio,
  Section,
  Steps,
  Title,
} from "@telegram-apps/telegram-ui"
import { Check, CircleDashed, Copy, ExternalLink, RefreshCcw, Trash2 } from "lucide-react"

import { Screen, ScreenBody } from "@/components/screen"
import { useMode } from "@/components/mode-provider"
import { useBackButton } from "@/hooks/use-telegram"
import {
  cancelOwnOrder,
  changeOrderPaymentMethod,
  confirmOrderPayment,
  deleteAdminOrder,
  getMe,
  getOrder,
  getPaymentMethods,
  markManualOrderPaid,
  refreshCryptoInvoice,
  rejectManualOrderPayment,
} from "@/lib/api"

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isPaymentPickerOpen, setIsPaymentPickerOpen] = useState(false)
  const [draftPaymentKey, setDraftPaymentKey] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<"payment" | "key" | null>(null)

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
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
    }, 1400)
  }

  const confirmMutation = useMutation({
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
            subtitle: paymentData.cryptoPay.acceptedAssets
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
        <Placeholder header="Загружаю заказ" description="Подтягиваю оплату и статус.">
          <CircleDashed size={32} />
        </Placeholder>
      </Screen>
    )
  }

  if (isError || !data?.order) {
    return (
      <Screen noTabBar>
        <Placeholder header="Заказ не загрузился" description="Обнови экран или попробуй позже.">
          <CircleDashed size={32} />
        </Placeholder>
      </Screen>
    )
  }

  const order = data.order
  const isBuyerView = mode === "buyer"
  const isRealBuyerView = isBuyerView && order.isOwner
  const isClosed = ["CLOSED", "CANCELLED"].includes(order.status)
  const adminToolsVisible = order.isAdmin && mode === "admin"
  const supportLink = meData?.settings.supportUsername
    ? `https://t.me/${meData.settings.supportUsername.replace(/^@/, "")}`
    : null
  const createdAtLabel = format(new Date(order.createdAt), "dd MMMM · HH:mm", { locale: ru })
  const currentPaymentKey =
    order.paymentMethodType === "MANUAL" && order.paymentMethodId
      ? `manual:${order.paymentMethodId}`
      : order.paymentMethodType === "CRYPTO_PAY"
        ? "crypto:auto"
        : null
  const selectedDraftPayment =
    paymentOptions.find((option) => option.key === (draftPaymentKey || currentPaymentKey)) || null
  const canConfirmManualPayment =
    adminToolsVisible &&
    order.paymentMethodType === "MANUAL" &&
    order.status === "PAYMENT_REVIEW" &&
    !order.isPaid
  const canRejectManualPayment =
    adminToolsVisible && order.paymentMethodType === "MANUAL" && order.status === "PAYMENT_REVIEW"
  const canRefreshCryptoPayment =
    order.paymentMethodType === "CRYPTO_PAY" && !order.isPaid && !isClosed
  const canSwitchPaymentMethod =
    isRealBuyerView &&
    !order.isPaid &&
    !isClosed &&
    !order.manualPaymentRequestedAt &&
    paymentOptions.length > 1
  const showManualPayment =
    order.paymentMethodType === "MANUAL" &&
    Boolean(order.paymentMethodDetails) &&
    !order.isPaid &&
    order.status !== "PAYMENT_REVIEW"
  const showCryptoPayment =
    order.paymentMethodType === "CRYPTO_PAY" && Boolean(order.cryptoInvoiceUrl) && !order.isPaid
  const amountLabel = order.cryptoInvoiceAmount
    ? `${order.cryptoInvoiceAmount} ${order.cryptoInvoiceFiat || "RUB"}`
    : null
  const progress = order.status === "CLOSED" || order.deliveredKey ? 3 : order.isPaid ? 2 : 1

  return (
    <Screen noTabBar className="pb-5 pt-2">
      <ScreenBody className="mx-auto w-full max-w-2xl gap-3">
        {adminToolsVisible ? (
          <Section header="Действия">
            {order.createdBy ? (
              <Cell
                multiline
                before={
                  <TgImage
                    size={48}
                    src={order.createdBy.photoUrl || undefined}
                    alt=""
                    fallbackIcon={<span>{order.createdBy.firstName.slice(0, 1)}</span>}
                  />
                }
                subtitle={order.createdBy.username ? `@${order.createdBy.username}` : "Без username"}
                after={order.createdBy.isBanned ? <Badge type="number" mode="critical">Бан</Badge> : null}
              >
                {order.createdBy.firstName}
              </Cell>
            ) : null}
            {canConfirmManualPayment ? (
              <Cell
                after={
                  <Button
                    size="s"
                    loading={confirmMutation.isPending}
                    onClick={() => confirmMutation.mutate()}
                  >
                    Подтвердить
                  </Button>
                }
              >
                Оплата отмечена
              </Cell>
            ) : null}
            {canRejectManualPayment ? (
              <Cell
                after={
                  <Button
                    size="s"
                    mode="gray"
                    loading={rejectManualPaymentMutation.isPending}
                    onClick={() => rejectManualPaymentMutation.mutate()}
                  >
                    Отклонить
                  </Button>
                }
              >
                Проверка вручную
              </Cell>
            ) : null}
            {canRefreshCryptoPayment ? (
              <Cell
                after={
                  <Button
                    size="s"
                    mode="bezeled"
                    loading={refreshMutation.isPending}
                    onClick={() => refreshMutation.mutate()}
                  >
                    Проверить
                  </Button>
                }
              >
                Crypto invoice
              </Cell>
            ) : null}
            <Cell
              after={
                <Button
                  size="s"
                  mode="outline"
                  before={<Trash2 size={14} />}
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  Удалить
                </Button>
              }
            >
              База
            </Cell>
          </Section>
        ) : null}

        <Section>
          <div className="px-4 py-6 text-center">
            <Title level="2">{order.productTitle || order.subject}</Title>
            <p className="mt-2 text-[var(--tgui--hint_color)]">
              #{order.number} · {createdAtLabel}
              {order.productCategory ? ` · ${order.productCategory}` : ""}
            </p>
            <div className="mt-5 flex justify-center">
              <PaymentMethodIcon
                iconDataUrl={order.paymentMethodIconDataUrl}
                title={order.paymentMethodTitle || "PM"}
              />
            </div>
            <Title level="2" className="mt-4">
              {paymentStateLabel(order)}
            </Title>
            <p className="mt-1 text-[var(--tgui--hint_color)]">
              {order.paymentMethodTitle || "Способ оплаты"}
            </p>
            {amountLabel ? (
              <Title level="1" className="mt-3">
                {amountLabel}
              </Title>
            ) : null}
          </div>
          <div className="px-4 pb-4">
            <Steps count={3} progress={progress} />
            <div className="mt-2 grid grid-cols-3 text-center text-sm">
              <span>Оплата</span>
              <span>Выдача</span>
              <span>Готово</span>
            </div>
          </div>
        </Section>

        {canSwitchPaymentMethod ? (
          <Section>
            <Cell
              multiline
              subtitle={order.paymentMethodTitle || "Не выбран"}
              after={
                <Button
                  size="s"
                  mode="bezeled"
                  onClick={() => {
                    setDraftPaymentKey(currentPaymentKey)
                    setIsPaymentPickerOpen(true)
                  }}
                >
                  Изменить
                </Button>
              }
            >
              Способ оплаты
            </Cell>
          </Section>
        ) : null}

        {showCryptoPayment ? (
          <Section header="Оплата">
            <Cell multiline subtitle={amountLabel || "Invoice готов"}>
              Crypto Bot
            </Cell>
            <Cell
              after={<ExternalLink size={18} />}
              Component="a"
              href={order.cryptoInvoiceUrl || undefined}
              target="_blank"
            >
              Открыть invoice
            </Cell>
          </Section>
        ) : null}

        {showManualPayment ? (
          <Section header="Реквизиты">
            <Cell
              multiline
              subtitle={order.paymentMethodDetails}
              after={
                <CopyButton
                  copied={copiedField === "payment"}
                  onClick={() => copyValue(order.paymentMethodDetails || "", "payment")}
                />
              }
            >
              {order.paymentMethodTitle || "Ручная оплата"}
            </Cell>
            {isRealBuyerView && !isClosed ? (
              <Cell
                after={
                  <Button
                    size="s"
                    loading={markManualPaidMutation.isPending}
                    onClick={() => markManualPaidMutation.mutate()}
                  >
                    Я оплатил
                  </Button>
                }
              >
                Перевод отправлен
              </Cell>
            ) : null}
          </Section>
        ) : null}

        {order.deliveredKey ? (
          <Section header="Выдача">
            <Cell
              multiline
              subtitle={<code className="break-all">{order.deliveredKey}</code>}
              after={
                <CopyButton
                  copied={copiedField === "key"}
                  onClick={() => copyValue(order.deliveredKey || "", "key")}
                />
              }
            >
              Выданный ключ
            </Cell>
          </Section>
        ) : null}

        {order.status === "PAYMENT_REVIEW" && !order.isPaid ? (
          <Section>
            <Cell multiline description="Покупатель отметил перевод. Заказ ждёт ручного подтверждения продавцом.">
              Платёж на проверке
            </Cell>
          </Section>
        ) : null}

        {(isRealBuyerView && !order.isPaid && !isClosed) || (order.isPaid && supportLink && isRealBuyerView) ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {order.isPaid && supportLink && isRealBuyerView ? (
              <Button stretched Component="a" href={supportLink} target="_blank">
                Поддержка в Telegram
              </Button>
            ) : null}
            {isRealBuyerView && !order.isPaid && !isClosed ? (
              <Button
                stretched
                mode="plain"
                loading={cancelOrderMutation.isPending}
                onClick={() => cancelOrderMutation.mutate()}
              >
                Отменить заказ
              </Button>
            ) : null}
          </div>
        ) : null}
      </ScreenBody>

      <ConfirmDeleteModal
        open={isDeleteModalOpen}
        loading={deleteOrderMutation.isPending}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => deleteOrderMutation.mutate()}
      />

      {canSwitchPaymentMethod ? (
        <PaymentMethodPickerModal
          open={isPaymentPickerOpen}
          options={paymentOptions}
          selectedKey={draftPaymentKey || currentPaymentKey}
          currentKey={currentPaymentKey}
          loading={changePaymentMethodMutation.isPending}
          onOpenChange={(open) => {
            if (changePaymentMethodMutation.isPending) return
            setIsPaymentPickerOpen(open)
            if (!open) setDraftPaymentKey(null)
          }}
          onSelect={setDraftPaymentKey}
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

function paymentStateLabel(order: Awaited<ReturnType<typeof getOrder>>["order"]) {
  if (!order) return "Заказ"
  if (order.status === "CANCELLED") return "Отменён"
  if (order.status === "PAYMENT_REVIEW") return "На проверке"
  if (order.isPaid) return "Оплачено"
  return "Ожидает оплату"
}

function PaymentMethodIcon({
  iconDataUrl,
  title,
}: {
  iconDataUrl: string | null
  title: string
}) {
  return (
    <TgImage
      size={96}
      src={iconDataUrl || undefined}
      alt=""
      fallbackIcon={<span>{title.slice(0, 2).toUpperCase()}</span>}
    />
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
    <Button size="s" mode={copied ? "filled" : "bezeled"} before={copied ? <Check size={14} /> : <Copy size={14} />} onClick={onClick}>
      {copied ? "Готово" : "Копировать"}
    </Button>
  )
}

function ConfirmDeleteModal({
  open,
  loading,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  loading: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) onOpenChange(nextOpen)
      }}
      header={<Modal.Header>Удалить заказ</Modal.Header>}
    >
      <Section footer="Заказ будет удалён из базы полностью. Это действие нельзя отменить.">
        <Cell
          after={
            <Button size="s" mode="outline" loading={loading} onClick={onConfirm}>
              Удалить
            </Button>
          }
        >
          Подтверждение
        </Cell>
      </Section>
    </Modal>
  )
}

function PaymentMethodPickerModal({
  open,
  options,
  selectedKey,
  currentKey,
  loading,
  onSelect,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
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
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const canConfirm = Boolean(selectedKey && selectedKey !== currentKey && !loading)

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      header={<Modal.Header>Способ оплаты</Modal.Header>}
    >
      <Section footer="Изменить можно только до оплаты.">
        {options.map((option) => (
          <Cell
            key={option.key}
            multiline
            before={<TgImage size={48} src={option.iconDataUrl || undefined} alt="" fallbackIcon={<span>{option.title.slice(0, 2).toUpperCase()}</span>} />}
            subtitle={option.subtitle}
            after={<Radio checked={option.key === selectedKey} readOnly />}
            onClick={() => onSelect(option.key)}
          >
            {option.title}
          </Cell>
        ))}
      </Section>
      <div className="p-4">
        <Button stretched loading={loading} disabled={!canConfirm} onClick={onConfirm}>
          Подтвердить
        </Button>
      </div>
    </Modal>
  )
}
