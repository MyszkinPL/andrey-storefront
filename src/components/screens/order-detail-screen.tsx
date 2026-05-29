"use client"

import type { PaymentMethodType } from "@prisma/client"
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
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { cn } from "@/lib/utils"

type Order = NonNullable<Awaited<ReturnType<typeof getOrder>>["order"]>

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

  const confirmMutation = useMutation({ mutationFn: () => confirmOrderPayment(orderId), onSuccess: invalidate })
  const rejectManualPaymentMutation = useMutation({ mutationFn: () => rejectManualOrderPayment(orderId), onSuccess: invalidate })
  const cancelOrderMutation = useMutation({ mutationFn: () => cancelOwnOrder(orderId), onSuccess: invalidate })
  const refreshMutation = useMutation({ mutationFn: () => refreshCryptoInvoice(orderId), onSuccess: invalidate })
  const markManualPaidMutation = useMutation({ mutationFn: () => markManualOrderPaid(orderId), onSuccess: invalidate })
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
    return <OrderState title="Загружаю заказ" description="Подтягиваю оплату и статус." />
  }

  if (isError || !data?.order) {
    return <OrderState title="Заказ не загрузился" description="Обнови экран или попробуй позже." />
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
    adminToolsVisible && order.paymentMethodType === "CRYPTO_PAY" && !order.isPaid && !isClosed
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
    <Screen noTabBar>
      <ScreenBody className="mx-auto w-full max-w-2xl">
        {adminToolsVisible ? (
          <AdminOrderPanel
            order={order}
            canConfirmManualPayment={canConfirmManualPayment}
            canRejectManualPayment={canRejectManualPayment}
            canRefreshCryptoPayment={canRefreshCryptoPayment}
            confirmPending={confirmMutation.isPending}
            rejectPending={rejectManualPaymentMutation.isPending}
            refreshPending={refreshMutation.isPending}
            onConfirm={() => confirmMutation.mutate()}
            onReject={() => rejectManualPaymentMutation.mutate()}
            onRefresh={() => refreshMutation.mutate()}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
        ) : null}

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto">
              <PaymentMethodIcon
                iconDataUrl={order.paymentMethodIconDataUrl}
                title={order.paymentMethodTitle || "PM"}
              />
            </div>
            <CardTitle>{paymentStateLabel(order)}</CardTitle>
            <CardDescription>
              {order.productTitle || order.subject} · {createdAtLabel}
            </CardDescription>
            {amountLabel ? <div className="text-3xl font-semibold">{amountLabel}</div> : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <OrderProgress progress={progress} />

            {canSwitchPaymentMethod ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setDraftPaymentKey(currentPaymentKey)
                  setIsPaymentPickerOpen(true)
                }}
              >
                Изменить способ оплаты
              </Button>
            ) : null}

            {showCryptoPayment ? (
              <a
                href={order.cryptoInvoiceUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants(), "w-full")}
              >
                Открыть invoice
                <ExternalLink data-icon="inline-end" />
              </a>
            ) : null}

            {showManualPayment ? (
              <ValueBlock
                title="Реквизиты"
                value={order.paymentMethodDetails || ""}
                copied={copiedField === "payment"}
                onCopy={() => copyValue(order.paymentMethodDetails || "", "payment")}
              />
            ) : null}

            {isRealBuyerView && showManualPayment && !isClosed ? (
              <Button
                disabled={markManualPaidMutation.isPending}
                onClick={() => markManualPaidMutation.mutate()}
              >
                Я оплатил
              </Button>
            ) : null}

            {order.status === "PAYMENT_REVIEW" && !order.isPaid ? (
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Платёж на проверке</CardTitle>
                  <CardDescription>Продавец вручную проверит оплату.</CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {order.deliveredKey ? (
              <ValueBlock
                title="Выданный ключ"
                value={order.deliveredKey}
                copied={copiedField === "key"}
                onCopy={() => copyValue(order.deliveredKey || "", "key")}
              />
            ) : null}

            {(isRealBuyerView && !order.isPaid && !isClosed) || (order.isPaid && supportLink && isRealBuyerView) ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {order.isPaid && supportLink && isRealBuyerView ? (
                  <a href={supportLink} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "secondary" })}>
                    Поддержка в Telegram
                  </a>
                ) : null}
                {isRealBuyerView && !order.isPaid && !isClosed ? (
                  <Button
                    variant="destructive"
                    disabled={cancelOrderMutation.isPending}
                    onClick={() => cancelOrderMutation.mutate()}
                  >
                    Отменить заказ
                  </Button>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </ScreenBody>

      <ConfirmDeleteDialog
        open={isDeleteModalOpen}
        loading={deleteOrderMutation.isPending}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => deleteOrderMutation.mutate()}
      />

      {canSwitchPaymentMethod ? (
        <PaymentMethodPickerDialog
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

function AdminOrderPanel({
  order,
  canConfirmManualPayment,
  canRejectManualPayment,
  canRefreshCryptoPayment,
  confirmPending,
  rejectPending,
  refreshPending,
  onConfirm,
  onReject,
  onRefresh,
  onDelete,
}: {
  order: Order
  canConfirmManualPayment: boolean
  canRejectManualPayment: boolean
  canRefreshCryptoPayment: boolean
  confirmPending: boolean
  rejectPending: boolean
  refreshPending: boolean
  onConfirm: () => void
  onReject: () => void
  onRefresh: () => void
  onDelete: () => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Админ</CardTitle>
        <CardDescription>Заказ #{order.number}</CardDescription>
        <CardAction>
          {order.createdBy?.isBanned ? <Badge variant="destructive">Бан</Badge> : null}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {order.createdBy ? (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {order.createdBy.photoUrl ? <AvatarImage src={order.createdBy.photoUrl} alt={order.createdBy.firstName} /> : null}
              <AvatarFallback>{order.createdBy.firstName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{order.createdBy.firstName}</div>
              <div className="truncate text-xs text-muted-foreground">
                {order.createdBy.username ? `@${order.createdBy.username}` : "Без username"}
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {canConfirmManualPayment ? (
            <Button size="sm" disabled={confirmPending} onClick={onConfirm}>
              Подтвердить оплату
            </Button>
          ) : null}
          {canRejectManualPayment ? (
            <Button size="sm" variant="secondary" disabled={rejectPending} onClick={onReject}>
              Отклонить
            </Button>
          ) : null}
          {canRefreshCryptoPayment ? (
            <Button size="sm" variant="secondary" disabled={refreshPending} onClick={onRefresh}>
              <RefreshCcw data-icon="inline-start" />
              Проверить
            </Button>
          ) : null}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 data-icon="inline-start" />
            Удалить
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderProgress({ progress }: { progress: 1 | 2 | 3 }) {
  const steps = ["Оплата", "Ключ", "Готово"]
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const done = progress >= index + 1
        return (
          <div key={step} className={cn("rounded-3xl px-3 py-2 text-center text-sm", done ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
            {step}
          </div>
        )
      })}
    </div>
  )
}

function ValueBlock({
  title,
  value,
  copied,
  onCopy,
}: {
  title: string
  value: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Button size="sm" variant="secondary" onClick={onCopy}>
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
            {copied ? "Готово" : "Копировать"}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <code className="block overflow-x-auto rounded-3xl bg-input/50 p-3 text-sm">{value}</code>
      </CardContent>
    </Card>
  )
}

function paymentStateLabel(order: Order) {
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
    <Avatar className="size-20">
      {iconDataUrl ? <AvatarImage src={iconDataUrl} alt={title} /> : null}
      <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  )
}

function ConfirmDeleteDialog({
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
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить заказ</DialogTitle>
          <DialogDescription>Заказ будет удалён из базы полностью. Это действие нельзя отменить.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button variant="destructive" disabled={loading} onClick={onConfirm}>
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentMethodPickerDialog({
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Способ оплаты</DialogTitle>
          <DialogDescription>Изменить можно только до оплаты.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={selectedKey || ""} onValueChange={onSelect}>
          {options.map((option) => (
            <label key={option.key} className="flex cursor-pointer items-center gap-3 rounded-3xl bg-input/50 p-3">
              <PaymentMethodIcon iconDataUrl={option.iconDataUrl} title={option.title} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{option.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{option.subtitle}</span>
              </span>
              <RadioGroupItem value={option.key} />
            </label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button disabled={!canConfirm} onClick={onConfirm}>
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OrderState({ title, description }: { title: string; description: string }) {
  return (
    <Screen noTabBar>
      <Card>
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">
              <CircleDashed />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </Screen>
  )
}
