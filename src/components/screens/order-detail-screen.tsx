"use client"

import type { PaymentMethodType } from "@prisma/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, LifeBuoy, Timer, Trash2 } from "lucide-react"
import type { BannerVariant } from "sealui"
import { Banner, Button, Pill, Text, Well, WellFooter, WellHeader } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import { useMode } from "@/components/mode-provider"
import { AdminOrderPanel } from "@/components/order-detail/admin-panel"
import { ConfirmDeleteDialog } from "@/components/order-detail/confirm-delete-dialog"
import { ConfirmPaymentDialog } from "@/components/order-detail/confirm-payment-dialog"
import { CopyField } from "@/components/order-detail/copy-field"
import { OrderProgress } from "@/components/order-detail/order-progress"
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
import type { Order, PaymentOption } from "@/components/order-detail/types"
import { ReceiptStatus, ReceiptUpload } from "@/components/receipt-upload"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Screen, ScreenBody, ScreenHeader, ScreenState } from "@/components/screen"
import { useCountdown } from "@/hooks/use-countdown"
import { useNotify } from "@/hooks/use-notify"
import {
  cancelOwnOrder,
  changeOrderPaymentMethod,
  confirmOrderPayment,
  deleteAdminOrder,
  getMe,
  getOrder,
  getPaymentMethods,
  hideOrderFromHistory,
  refreshCryptoInvoice,
  rejectManualOrderPayment,
} from "@/lib/api"
import { formatDateTime, formatInvoiceAmount, formatPrice } from "@/lib/format"
import {
  formatCountdown,
  isOrderExpired,
  isOrderOnTimer,
  ORDER_PAYMENT_WINDOW_MS,
} from "@/lib/order-timer"

/** The notice tint follows the same precedence as its title. */
function noticeVariant(order: Order): BannerVariant {
  if (order.deliveredKey) return "success"
  if (order.status === "PAYMENT_REVIEW") return "info"
  if (isOrderExpired(order) || order.status === "CANCELLED") return "danger"
  if (order.isPaid) return "success"
  return "warning"
}

export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { t, locale, currency } = useI18n()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isHideModalOpen, setIsHideModalOpen] = useState(false)
  const [isConfirmPaymentOpen, setIsConfirmPaymentOpen] = useState(false)
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

  // The payment clock. Once it hits zero the server has closed the order (or
  // is about to), so the card refreshes instead of showing 00:00 forever.
  const timedOrder = data?.order && isOrderOnTimer(data.order) ? data.order : null
  const remaining = useCountdown(timedOrder?.expiresAt ?? null)
  useEffect(() => {
    if (timedOrder && remaining === 0) void refetch()
  }, [remaining, refetch, timedOrder])

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
  // Before "I have paid" the receipt is collected inside that sheet; the
  // standalone row only remains while the order is under review, so a
  // buyer can swap in a better scan without bothering support.
  const canAttachReceipt =
    isRealBuyerView &&
    order.status === "PAYMENT_REVIEW" &&
    !order.isPaid &&
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
    <Screen noTabBar>
      <ScreenHeader
        back={listHref}
        subtitle={t("orderDetail.orderNumber", { number: order.number })}
        title={order.productTitle || order.subject}
      />

      <ScreenBody grow>
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

        <Well>
          <WellHeader
            action={amountLabel ? <Pill color="gray">{amountLabel}</Pill> : undefined}
            description={t("orderDetail.summaryLine", {
              number: order.number,
              title: order.productTitle || order.subject,
              date: createdAtLabel,
            })}
            title={t(paymentStateKey(order))}
          />

          <OrderProgress order={order} />

          {showOrderNotice ? (
            <Banner
              description={t(orderNoticeDescriptionKey(order), {
                minutes: Math.round(ORDER_PAYMENT_WINDOW_MS / 60_000),
              })}
              title={orderNoticeTitle(order, amountLabel, t)}
              variant={noticeVariant(order)}
            />
          ) : null}

          {timedOrder && remaining !== null ? (
            <div className="shop-row">
              <div className="shop-row-media">
                <Timer aria-hidden />
              </div>
              <div className="shop-row-copy">
                <Text as="span" size="sm">
                  {t("orderDetail.timerTitle")}
                </Text>
                <Text as="span" size="xs" tone="muted">
                  {remaining > 0
                    ? t("orderDetail.timerDescription")
                    : t("orderDetail.timerExpiring")}
                </Text>
              </div>
              <div className="shop-row-trailing">
                {/* The last five minutes turn amber, the same warning colour
                    an empty key pool uses in the catalog. */}
                <span
                  className="shop-countdown"
                  data-urgent={remaining <= 5 * 60_000 ? "" : undefined}
                >
                  {formatCountdown(remaining)}
                </span>
              </div>
            </div>
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
            <LinkButton
              external
              fullWidth
              href={order.cryptoInvoiceUrl || ""}
              icon={<ExternalLink size={16} aria-hidden />}
              size="lg"
            >
              {t("orderDetail.openInvoice")}
            </LinkButton>
          ) : null}

          {isRealBuyerView && showManualPayment && !isClosed ? (
            <Button fullWidth onClick={() => setIsConfirmPaymentOpen(true)}>
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

          {/* A Crypto Bot order is confirmed by its webhook and a closed one
              is finished, so neither has a receipt still to come. The row
              only earns its place while one could still arrive, or once a
              file actually did. */}
          {adminToolsVisible &&
          (order.receipt || (order.paymentMethodType === "MANUAL" && !isClosed)) ? (
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
            productTitle={order.productTitle || order.subject}
            paymentTitle={order.paymentMethodTitle || t("common.notSelected")}
            amountLabel={amountLabel}
            createdAtLabel={createdAtLabel}
          />

          {isRealBuyerView ? (
            <WellFooter>
              {order.isPaid ? (
                <LinkButton fullWidth href={`/orders/${order.id}/complete`}>
                  {t("orderDetail.openDelivery")}
                </LinkButton>
              ) : null}
              {/* Support is for anyone stuck, and a buyer stuck on paying
                  needs it more than one who already got their key. */}
              {supportLink ? (
                <LinkButton
                  external
                  fullWidth
                  href={supportLink}
                  icon={<LifeBuoy size={16} aria-hidden />}
                  variant="secondary"
                >
                  {t("orderDetail.telegramSupport")}
                </LinkButton>
              ) : null}
              {/* Outlined: a solid red block under "I have paid" pulled the
                  eye to the one action the buyer should not take. */}
              {!order.isPaid && !isClosed ? (
                <Button
                  disabled={cancelOrderMutation.isPending}
                  fullWidth
                  loading={cancelOrderMutation.isPending}
                  onClick={() => cancelOrderMutation.mutate()}
                  variant="outline"
                >
                  {t("orderDetail.cancelOrder")}
                </Button>
              ) : null}
              {/* Only a finished order can leave the buyer's history — one
                  still waiting for payment must not be able to vanish. */}
              {isClosed ? (
                <Button
                  fullWidth
                  icon={<Trash2 size={16} aria-hidden />}
                  onClick={() => setIsHideModalOpen(true)}
                  variant="outline"
                >
                  {t("orderDetail.hideAction")}
                </Button>
              ) : null}
            </WellFooter>
          ) : null}
        </Well>
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={t("orderDetail.hideAction")}
        confirmVariant="danger"
        description={t("orderDetail.hideDescription")}
        loading={hideFromHistoryMutation.isPending}
        onConfirm={() => hideFromHistoryMutation.mutate()}
        onOpenChange={setIsHideModalOpen}
        open={isHideModalOpen}
        title={t("orderDetail.hideTitle")}
      />

      <ConfirmPaymentDialog
        onDone={() => void invalidate()}
        onOpenChange={setIsConfirmPaymentOpen}
        open={isConfirmPaymentOpen}
        orderId={order.id}
        receipt={order.receipt}
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
