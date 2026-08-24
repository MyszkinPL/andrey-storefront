"use client"

import type { PaymentMethodType } from "@prisma/client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, Trash2 } from "lucide-react"

import { AdminOrderPanel } from "@/components/order-detail/admin-panel"
import { ConfirmDeleteDialog } from "@/components/order-detail/confirm-delete-dialog"
import { CopyField } from "@/components/order-detail/copy-field"
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
import { ResponsiveDialog } from "@/components/responsive-dialog"
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
import { BackButton } from "@/components/back-button"
import { Screen, ScreenBody, ScreenState } from "@/components/screen"
import { useMode } from "@/components/mode-provider"
import {
  cancelOwnOrder,
  changeOrderPaymentMethod,
  confirmOrderPayment,
  deleteAdminOrder,
  getMe,
  getOrder,
  getPaymentMethods,
  hideOrderFromHistory,
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
  const [isHideModalOpen, setIsHideModalOpen] = useState(false)
  const [draftPaymentKey, setDraftPaymentKey] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<"payment" | "key" | null>(null)

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })
  const { data, isLoading, refetch } = useQuery({
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
  const hideFromHistoryMutation = useMutation({
    mutationFn: () => hideOrderFromHistory(orderId),
    onError: notify.failure,
    onSuccess: async () => {
      setIsHideModalOpen(false)
      notify.success("orderDetail.hideDone")
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      router.push("/orders")
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

  const paymentOptions: PaymentOption[] = [
    ...((paymentData?.paymentMethods ?? []).filter((item) => item.isActive).map((method) => ({
      key: `manual:${method.id}`,
      id: method.id,
      type: "MANUAL" as const,
      title: method.title,
      // The requisites arrive with the order; the menu only names the method.
      subtitle: method.details ?? t("product.requisitesLater"),
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

  const listHref = mode === "admin" ? "/admin/orders" : "/orders"

  if (isLoading) {
    return (
      <ScreenState
        back={listHref}
        description={t("orderDetail.loadingDescription")}
        title={t("orderDetail.loadingTitle")}
      />
    )
  }

  if (!data?.order) {
    return (
      <ScreenState
        back={listHref}
        description={t("orderDetail.errorDescription")}
        onRetry={() => refetch()}
        title={t("orderDetail.errorTitle")}
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
  // A closed or cancelled order kept printing the requisites with a copy
  // button directly under "no actions are available any more".
  const showManualPayment =
    order.paymentMethodType === "MANUAL" &&
    Boolean(order.paymentMethodDetails) &&
    !order.isPaid &&
    !isClosed &&
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
        <BackButton
          className="-ms-1 self-start"
          href={listHref}
        />
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

            {/* On a finished order this row only repeated the "Оплата" line of
                the summary below it, so it stops at the point it stops being
                something you can act on. */}
            {isClosed ? null : canSwitchPaymentMethod ? (
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
                  // Requisites are for paying with. Once the order is closed or
                  // cancelled they are nobody's business, including its own
                  // buyer's — the summary below still names the method.
                  (!isClosed && order.paymentMethodDetails) ||
                  (order.paymentMethodType === "CRYPTO_PAY"
                    ? t("orderDetail.paymentCryptoLabel")
                    : order.paymentMethodType === "MANUAL"
                      ? t("orderDetail.paymentManualLabel")
                      : t("common.notSelected"))
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

            {/* A Crypto Bot order is confirmed by its webhook, so there is
                never a receipt to wait for — the row only made sense for a
                manual transfer, or once a file actually arrived. */}
            {/* A Crypto Bot order is confirmed by its webhook and a closed one
                is finished, so neither has a receipt still to come. The row
                only earns its place while one could still arrive, or once a
                file actually did. */}
            {adminToolsVisible &&
            (order.receipt ||
              (order.paymentMethodType === "MANUAL" && !isClosed)) ? (
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

          {isRealBuyerView ? (
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
              {!order.isPaid && !isClosed ? (
                <Button
                  variant="destructive"
                  disabled={cancelOrderMutation.isPending}
                  onClick={() => cancelOrderMutation.mutate()}
                >
                  {t("orderDetail.cancelOrder")}
                </Button>
              ) : null}
              {/* Only a finished order can leave the buyer's history — one
                  still waiting for payment must not be able to vanish. */}
              {isClosed ? (
                <Button
                  onClick={() => setIsHideModalOpen(true)}
                  variant="destructive-outline"
                >
                  <Trash2 data-icon="inline-start" />
                  {t("orderDetail.hideAction")}
                </Button>
              ) : null}
            </CardFooter>
          ) : null}
        </Card>
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={t("orderDetail.hideAction")}
        confirmVariant="destructive"
        description={t("orderDetail.hideDescription")}
        loading={hideFromHistoryMutation.isPending}
        onConfirm={() => hideFromHistoryMutation.mutate()}
        onOpenChange={setIsHideModalOpen}
        open={isHideModalOpen}
        title={t("orderDetail.hideTitle")}
      />

      <ConfirmDeleteDialog
        open={isDeleteModalOpen}
        loading={deleteOrderMutation.isPending}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => deleteOrderMutation.mutate()}
      />
    </Screen>
  )
}
