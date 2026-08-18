"use client"

import type { PaymentMethodType } from "@prisma/client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  RefreshCcw,
  Trash2,
} from "lucide-react"

import { ReceiptStatus, ReceiptUpload } from "@/components/receipt-upload"
import { useI18n, useTranslate } from "@/components/i18n-provider"
import type { TranslateFn, TranslationKey } from "@/lib/i18n"
import { formatDateTime, formatInvoiceAmount, formatPrice } from "@/lib/format"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
type PaymentOption = {
  key: string
  id?: string
  type: "MANUAL" | "CRYPTO_PAY"
  title: string
  subtitle: string
  iconUrl: string | null
}

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { t, locale, currency } = useI18n()
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
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

  const paymentOptions: PaymentOption[] = [
    ...((paymentData?.paymentMethods ?? []).filter((item) => item.isActive).map((method) => ({
      key: `manual:${method.id}`,
      id: method.id,
      type: "MANUAL" as const,
      title: method.title,
      subtitle: method.details,
      iconUrl: method.iconUrl,
    })) ?? []),
    ...(paymentData?.cryptoPay.enabled
      ? [
          {
            key: "crypto:auto",
            id: undefined,
            type: "CRYPTO_PAY" as const,
            title: paymentData.cryptoPay.title || "Crypto Bot",
            subtitle: paymentData.cryptoPay.acceptedAssets
              ? t("product.cryptoAutoWithAssets", {
                  assets: paymentData.cryptoPay.acceptedAssets,
                })
              : t("product.cryptoAuto"),
            iconUrl: paymentData.cryptoPay.iconUrl || null,
          },
        ]
      : []),
  ]

  if (isLoading) {
    return (
      <OrderState
        title={t("orderDetail.loadingTitle")}
        description={t("orderDetail.loadingDescription")}
      />
    )
  }

  if (isError || !data?.order) {
    return (
      <OrderState
        title={t("orderDetail.errorTitle")}
        description={t("orderDetail.errorDescription")}
      />
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
  const createdAtLabel = formatDateTime(order.createdAt, locale)
  const currentPaymentKey =
    order.paymentMethodType === "MANUAL" && order.paymentMethodId
      ? `manual:${order.paymentMethodId}`
      : order.paymentMethodType === "CRYPTO_PAY"
        ? "crypto:auto"
        : null
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
  // A receipt only helps while a manual transfer is still awaiting confirmation.
  const canAttachReceipt =
    isRealBuyerView &&
    !order.isPaid &&
    !isClosed &&
    order.paymentMethodType !== "CRYPTO_PAY"
  const amountLabel =
    formatInvoiceAmount(order.cryptoInvoiceAmount, order.cryptoInvoiceFiat, locale) ??
    (order.priceRub ? formatPrice(order.priceRub, locale, currency) : null)
  const selectedPaymentKey = draftPaymentKey || currentPaymentKey
  const showOrderNotice =
    Boolean(order.deliveredKey) ||
    order.status === "PAYMENT_REVIEW" ||
    order.status === "CANCELLED" ||
    order.isPaid
  const handlePaymentMethodSelect = (key: string) => {
    if (changePaymentMethodMutation.isPending) return

    const option = paymentOptions.find((item) => item.key === key)
    if (!option) return

    if (option.key === currentPaymentKey) {
      setDraftPaymentKey(null)
      return
    }

    setDraftPaymentKey(option.key)
    changePaymentMethodMutation.mutate(
      option.type === "MANUAL" && option.id
        ? { paymentMethodId: option.id }
        : { paymentMethodType: "CRYPTO_PAY" },
    )
  }

  return (
    <Screen noTabBar className="min-h-[calc(100dvh-3rem)]">
      <ScreenBody className="mx-auto w-full max-w-2xl flex-1">
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

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{t(paymentStateKey(order))}</CardTitle>
            <CardDescription>
              {t("orderDetail.summaryLine", {
                number: order.number,
                title: order.productTitle || order.subject,
                date: createdAtLabel,
              })}
            </CardDescription>
            <CardAction>
              {amountLabel ? <Badge variant="secondary">{amountLabel}</Badge> : null}
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-3">
            {showOrderNotice ? (
              <Field>
                <FieldTitle>{orderNoticeTitle(order, amountLabel, t)}</FieldTitle>
                <FieldDescription>{t(orderNoticeDescriptionKey(order))}</FieldDescription>
              </Field>
            ) : null}

            {canSwitchPaymentMethod ? (
              <PaymentMethodSelector
                options={paymentOptions}
                selectedKey={selectedPaymentKey}
                loading={changePaymentMethodMutation.isPending}
                onSelect={handlePaymentMethodSelect}
              />
            ) : (
              <PaymentMethodSummary
                title={order.paymentMethodTitle || t("orderDetail.paymentMethodFallback")}
                description={
                  order.paymentMethodDetails ||
                  order.paymentMethodType ||
                  t("common.notSelected")
                }
                iconUrl={order.paymentMethodIconDataUrl}
              />
            )}

            {showManualPayment ? (
              <CopyField
                title={t("orderDetail.requisites")}
                value={order.paymentMethodDetails || ""}
                copied={copiedField === "payment"}
                onCopy={() => copyValue(order.paymentMethodDetails || "", "payment")}
              />
            ) : null}

            {showCryptoPayment ? (
              <a
                href={order.cryptoInvoiceUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                {t("orderDetail.openInvoice")}
                <ExternalLink data-icon="inline-end" />
              </a>
            ) : null}

            {isRealBuyerView && showManualPayment && !isClosed ? (
              <Button
                disabled={markManualPaidMutation.isPending}
                onClick={() => markManualPaidMutation.mutate()}
              >
                {t("orderDetail.markPaid")}
              </Button>
            ) : null}

            {canAttachReceipt ? (
              <ReceiptUpload
                onUploaded={() => void invalidate()}
                orderId={order.id}
                receipt={order.receipt}
              />
            ) : null}

            {adminToolsVisible ? (
              <ReceiptStatus receipt={order.receipt} />
            ) : null}

            {order.deliveredKey ? (
              <CopyField
                title={t("orderDetail.deliveredKey")}
                value={order.deliveredKey}
                copied={copiedField === "key"}
                onCopy={() => copyValue(order.deliveredKey || "", "key")}
              />
            ) : null}

            <OrderReceipt
              className="mt-auto"
              productTitle={order.productTitle || order.subject}
              paymentTitle={order.paymentMethodTitle || t("common.notSelected")}
              amountLabel={amountLabel}
              createdAtLabel={createdAtLabel}
            />
          </CardContent>

          {(order.isPaid && isRealBuyerView) || (isRealBuyerView && !order.isPaid && !isClosed) ? (
            <CardFooter className="mt-auto flex-col items-stretch gap-2">
              {order.isPaid && isRealBuyerView ? (
                <Link
                  href={`/orders/${order.id}/complete`}
                  className={buttonVariants()}
                >
                  {t("orderDetail.openDelivery")}
                </Link>
              ) : null}
              {order.isPaid && supportLink && isRealBuyerView ? (
                <a
                  href={supportLink}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "secondary" })}
                >
                  {t("orderDetail.telegramSupport")}
                </a>
              ) : null}
              {isRealBuyerView && !order.isPaid && !isClosed ? (
                <Button
                  variant="destructive"
                  disabled={cancelOrderMutation.isPending}
                  onClick={() => cancelOrderMutation.mutate()}
                >
                  {t("orderDetail.cancelOrder")}
                </Button>
              ) : null}
            </CardFooter>
          ) : null}
        </Card>
      </ScreenBody>

      <ConfirmDeleteDialog
        open={isDeleteModalOpen}
        loading={deleteOrderMutation.isPending}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => deleteOrderMutation.mutate()}
      />
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
  const t = useTranslate()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("orderDetail.admin")}</CardTitle>
        <CardDescription>
          {t("orderDetail.orderNumber", { number: order.number })}
        </CardDescription>
        <CardAction>
          {order.createdBy?.isBanned ? (
            <Badge variant="destructive">{t("orderDetail.banned")}</Badge>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {order.createdBy ? (
          <Field orientation="horizontal">
            <Avatar className="size-10">
              {order.createdBy.photoUrl ? (
                <AvatarImage src={order.createdBy.photoUrl} alt={order.createdBy.firstName} />
              ) : null}
              <AvatarFallback>{order.createdBy.firstName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <FieldContent>
              <FieldTitle className="truncate">{order.createdBy.firstName}</FieldTitle>
              <FieldDescription className="truncate">
                {order.createdBy.username
                  ? `@${order.createdBy.username}`
                  : t("auth.noUsername")}
              </FieldDescription>
            </FieldContent>
          </Field>
        ) : null}
        <FieldGroup className="gap-2 sm:flex sm:flex-row sm:flex-wrap">
          {canConfirmManualPayment ? (
            <Button size="sm" disabled={confirmPending} onClick={onConfirm}>
              {t("orderDetail.confirmPayment")}
            </Button>
          ) : null}
          {canRejectManualPayment ? (
            <Button size="sm" variant="secondary" disabled={rejectPending} onClick={onReject}>
              {t("orderDetail.reject")}
            </Button>
          ) : null}
          {canRefreshCryptoPayment ? (
            <Button size="sm" variant="secondary" disabled={refreshPending} onClick={onRefresh}>
              <RefreshCcw data-icon="inline-start" />
              {t("orderDetail.check")}
            </Button>
          ) : null}
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 data-icon="inline-start" />
            {t("common.delete")}
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

function CopyField({
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
  const t = useTranslate()

  return (
    <Field>
      <FieldLabel>{title}</FieldLabel>
      <InputGroup>
        <InputGroupInput readOnly value={value} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton onClick={onCopy}>
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
            {copied ? t("common.copied") : t("common.copy")}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}

function paymentStateKey(order: Order): TranslationKey {
  if (order.status === "CANCELLED") return "orderDetail.stateCancelled"
  if (order.status === "PAYMENT_REVIEW") return "orderDetail.stateReview"
  if (order.isPaid) return "orderDetail.statePaid"
  return "orderDetail.stateAwaiting"
}

function orderNoticeTitle(
  order: Order,
  amountLabel: string | null,
  t: TranslateFn,
) {
  if (order.deliveredKey) return t("orderDetail.noticeKeyReady")
  if (order.status === "PAYMENT_REVIEW") return t("orderDetail.noticeReview")
  if (order.status === "CANCELLED") return t("orderDetail.noticeCancelled")
  if (order.isPaid) return t("orderDetail.noticePaid")
  // The invoice amount is the most useful headline when one exists.
  if (order.paymentMethodType === "CRYPTO_PAY") return amountLabel || "Invoice"
  return t("orderDetail.noticeRequisites")
}

function orderNoticeDescriptionKey(order: Order): TranslationKey {
  if (order.deliveredKey) return "orderDetail.hintKeyReady"
  if (order.status === "PAYMENT_REVIEW") return "orderDetail.hintReview"
  if (order.status === "CANCELLED") return "orderDetail.hintCancelled"
  if (order.isPaid) return "orderDetail.hintPaid"
  if (order.paymentMethodType === "CRYPTO_PAY") return "orderDetail.hintCrypto"
  return "orderDetail.hintRequisites"
}

function PaymentMethodSelector({
  options,
  selectedKey,
  loading,
  onSelect,
}: {
  options: PaymentOption[]
  selectedKey: string | null
  loading: boolean
  onSelect: (key: string) => void
}) {
  const t = useTranslate()
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.key === selectedKey)

  return (
    <Field>
      <FieldLabel>{t("product.paymentMethod")}</FieldLabel>
      <Select
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        value={selectedKey || ""}
        onValueChange={(value) => {
          if (value) {
            onSelect(String(value))
            setOpen(false)
          }
        }}
        disabled={loading}
        items={options.map((option) => ({ value: option.key, label: option.title }))}
      >
        <SelectTrigger size="lg">
          {selectedOption ? (
            <Avatar className="size-6">
              {selectedOption.iconUrl ? (
                <AvatarImage src={selectedOption.iconUrl} alt={selectedOption.title} />
              ) : null}
              <AvatarFallback>{getAvatarFallback(selectedOption.title)}</AvatarFallback>
            </Avatar>
          ) : null}
          <SelectValue placeholder={t("product.choosePayment")} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.key} value={option.key} label={option.title}>
                <Avatar className="size-6">
                  {option.iconUrl ? <AvatarImage src={option.iconUrl} alt={option.title} /> : null}
                  <AvatarFallback>{getAvatarFallback(option.title)}</AvatarFallback>
                </Avatar>
                {option.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {loading ? (
        <FieldDescription>{t("orderDetail.changingPayment")}</FieldDescription>
      ) : null}
    </Field>
  )
}

function PaymentMethodSummary({
  title,
  description,
  iconUrl,
}: {
  title: string
  description: string
  iconUrl: string | null
}) {
  return (
    <Field orientation="horizontal">
      <Avatar className="size-10">
        {iconUrl ? <AvatarImage src={iconUrl} alt={title} /> : null}
        <AvatarFallback>{getAvatarFallback(title)}</AvatarFallback>
      </Avatar>
      <FieldContent>
        <FieldTitle>{title}</FieldTitle>
        <FieldDescription className="truncate">{description}</FieldDescription>
      </FieldContent>
    </Field>
  )
}

function OrderReceipt({
  productTitle,
  paymentTitle,
  amountLabel,
  createdAtLabel,
  className,
}: {
  productTitle: string
  paymentTitle: string
  amountLabel: string | null
  createdAtLabel: string
  className?: string
}) {
  const t = useTranslate()

  return (
    <FieldGroup className={cn("gap-2", className)}>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.product")}</FieldLabel>
        <FieldDescription className="truncate text-right">{productTitle}</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.payment")}</FieldLabel>
        <FieldDescription className="text-right">{paymentTitle}</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.amount")}</FieldLabel>
        <FieldDescription className="text-right">{amountLabel || t("orderDetail.amountFallback")}</FieldDescription>
      </Field>
      <Field orientation="horizontal">
        <FieldLabel>{t("orderComplete.createdAt")}</FieldLabel>
        <FieldDescription className="text-right">{createdAtLabel}</FieldDescription>
      </Field>
    </FieldGroup>
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
  const t = useTranslate()

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("orderDetail.deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("orderDetail.deleteDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={loading} onClick={onConfirm}>
            {t("common.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function getAvatarFallback(title: string) {
  return title.slice(0, 2).toUpperCase()
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
