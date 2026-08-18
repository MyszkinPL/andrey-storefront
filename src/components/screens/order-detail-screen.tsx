"use client"

import type { PaymentMethodType } from "@prisma/client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink } from "lucide-react"

import { AdminOrderPanel } from "@/components/order-detail/admin-panel"
import { ConfirmDeleteDialog } from "@/components/order-detail/confirm-delete-dialog"
import { CopyField } from "@/components/order-detail/copy-field"
import { OrderState } from "@/components/order-detail/order-state"
import { OrderReceipt } from "@/components/order-detail/order-summary"
import {
  PaymentMethodSelector,
  PaymentMethodSummary,
} from "@/components/order-detail/payment-method-selector"
import {
  orderNoticeDescriptionKey,
  orderNoticeTitle,
  paymentStateKey,
} from "@/components/order-detail/status"
import type { PaymentOption } from "@/components/order-detail/types"
import { ReceiptStatus, ReceiptUpload } from "@/components/receipt-upload"
import { useI18n } from "@/components/i18n-provider"
import { useNotify } from "@/hooks/use-notify"
import { formatDateTime, formatInvoiceAmount, formatPrice } from "@/lib/format"
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
  Field,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field"
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

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { t, locale, currency } = useI18n()
  const notify = useNotify()
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
    onError: notify.failure,
    onSuccess: async () => {
      notify.success("uiNotify.paymentConfirmed")
      await invalidate()
    },
  })
  const rejectManualPaymentMutation = useMutation({
    mutationFn: () => rejectManualOrderPayment(orderId),
    onError: notify.failure,
    onSuccess: async () => {
      notify.success("uiNotify.paymentRejected")
      await invalidate()
    },
  })
  const cancelOrderMutation = useMutation({
    mutationFn: () => cancelOwnOrder(orderId),
    onError: notify.failure,
    onSuccess: async () => {
      notify.success("uiNotify.orderCancelled")
      await invalidate()
    },
  })
  const refreshMutation = useMutation({
    mutationFn: () => refreshCryptoInvoice(orderId),
    onSuccess: invalidate,
  })
  const markManualPaidMutation = useMutation({
    mutationFn: () => markManualOrderPaid(orderId),
    onError: notify.failure,
    onSuccess: async () => {
      notify.success("uiNotify.markedPaid")
      await invalidate()
    },
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
    onError: notify.failure,
    onSuccess: async () => {
      notify.success("uiNotify.deleted")
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
