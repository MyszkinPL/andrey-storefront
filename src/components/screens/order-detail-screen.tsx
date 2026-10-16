"use client"

import type { PaymentMethodType } from "@prisma/client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ExternalLink, LifeBuoy, RefreshCcw, Trash2 } from "lucide-react"
import { Avatar, Button, Heading, Pill, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { KeyValueList } from "@/components/key-value"
import { LinkButton } from "@/components/link-button"
import { useMode } from "@/components/mode-provider"
import { AdminOrderPanel } from "@/components/order-detail/admin-panel"
import { ConfirmDeleteDialog } from "@/components/order-detail/confirm-delete-dialog"
import { ConfirmPaymentDialog } from "@/components/order-detail/confirm-payment-dialog"
import { CopyField } from "@/components/order-detail/copy-field"
import { OrderProgress } from "@/components/order-detail/order-progress"
import { PaymentMethodSelector } from "@/components/order-detail/payment-method-selector"
import { orderNoticeDescriptionKey, paymentStateKey } from "@/components/order-detail/status"
import type { Order, PaymentOption } from "@/components/order-detail/types"
import { ReceiptUpload } from "@/components/receipt-upload"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import {
  ActionStack,
  Screen,
  ScreenBody,
  ScreenHeader,
  ScreenState,
  Section,
  StickyActions,
} from "@/components/screen"
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

/** The pill colour of the state heading follows the state itself. */
function stateColor(order: Order): "green" | "yellow" | "blue" | "gray" | "red" {
  if (order.deliveredKey || order.isPaid) return "green"
  if (order.status === "PAYMENT_REVIEW") return "blue"
  if (isOrderExpired(order)) return "gray"
  if (order.status === "CANCELLED") return "red"
  return "yellow"
}

/**
 * An order screen that answers two questions in the first glance: where
 * is my order, and what do I do now. State and clock on top, the one
 * thing to do in the bottom bar, the rest in a details list below.
 */
export function OrderDetailScreen({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { t, locale, currency } = useI18n()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const { mode } = useMode()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isHideModalOpen, setIsHideModalOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
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
  // is about to), so the screen refreshes instead of showing 00:00 forever.
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
      setIsCancelOpen(false)
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
  // An expired or closed order kept offering its dead invoice.
  const showCryptoPayment =
    order.paymentMethodType === "CRYPTO_PAY" &&
    Boolean(order.cryptoInvoiceUrl) &&
    !order.isPaid &&
    !isClosed &&
    !isOrderExpired(order)
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
  const paymentTitle = order.paymentMethodTitle || t("orderDetail.paymentMethodFallback")
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

  // The one thing to do now. A buyer pays or collects; an admin checks.
  const primaryActions = (
    <>
      {isRealBuyerView && showManualPayment ? (
        <Button fullWidth onClick={() => setIsConfirmPaymentOpen(true)} size="lg">
          {t("orderDetail.markPaid")}
        </Button>
      ) : null}
      {isRealBuyerView && showCryptoPayment ? (
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
      {isRealBuyerView && order.isPaid ? (
        <LinkButton fullWidth href={`/orders/${order.id}/complete`} size="lg">
          {t("orderDetail.openDelivery")}
        </LinkButton>
      ) : null}
      {canRejectManualPayment ? (
        <Button
          disabled={rejectManualPaymentMutation.isPending}
          fullWidth
          onClick={() => rejectManualPaymentMutation.mutate()}
          size="lg"
          variant="secondary"
        >
          {t("orderDetail.reject")}
        </Button>
      ) : null}
      {canConfirmManualPayment ? (
        <Button
          disabled={confirmMutation.isPending}
          fullWidth
          loading={confirmMutation.isPending}
          onClick={() => confirmMutation.mutate()}
          size="lg"
        >
          {t("orderDetail.confirmPayment")}
        </Button>
      ) : null}
      {canRefreshCryptoPayment ? (
        <Button
          disabled={refreshMutation.isPending}
          fullWidth
          icon={<RefreshCcw size={16} aria-hidden />}
          loading={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
          size="lg"
          variant="secondary"
        >
          {t("orderDetail.check")}
        </Button>
      ) : null}
    </>
  )
  const hasPrimaryActions =
    (isRealBuyerView && (showManualPayment || showCryptoPayment || order.isPaid)) ||
    canConfirmManualPayment ||
    canRejectManualPayment ||
    canRefreshCryptoPayment

  return (
    <Screen narrow noTabBar>
      <ScreenHeader
        back={listHref}
        subtitle={`${t("orderDetail.orderNumber", { number: order.number })} · ${createdAtLabel}`}
        title={order.productTitle || order.subject}
      />

      <ScreenBody grow>
        {/* State and clock in the largest type on the page. */}
        <div className="shop-status">
          <div className="shop-status-row">
            <Heading as="h2" size="md">
              {t(paymentStateKey(order))}
            </Heading>
            {timedOrder && remaining !== null ? (
              // The last five minutes turn amber, the same warning colour an
              // empty key pool uses in the catalog.
              <span className="shop-timer" data-urgent={remaining <= 5 * 60_000 ? "" : undefined}>
                {formatCountdown(remaining)}
              </span>
            ) : amountLabel ? (
              <Pill color={stateColor(order)}>{amountLabel}</Pill>
            ) : null}
          </div>
          <Text as="p" size="sm" tone="secondary">
            {t(orderNoticeDescriptionKey(order), {
              minutes: Math.round(ORDER_PAYMENT_WINDOW_MS / 60_000),
            })}
            {timedOrder && remaining !== null
              ? ` ${remaining > 0 ? t("orderDetail.timerDescription") : t("orderDetail.timerExpiring")}`
              : ""}
          </Text>
        </div>

        <OrderProgress order={order} />

        {canSwitchPaymentMethod ? (
          <PaymentMethodSelector
            options={paymentOptions}
            selectedKey={selectedPaymentKey}
            loading={changePaymentMethodMutation.isPending}
            onSelect={handlePaymentMethodSelect}
          />
        ) : null}

        {showManualPayment ? (
          <CopyField
            title={t("orderDetail.requisites")}
            value={order.paymentMethodDetails || ""}
            copied={copiedField === "payment"}
            onCopy={() => copyValue(order.paymentMethodDetails || "", "payment")}
          />
        ) : null}

        {order.deliveredKey ? (
          <CopyField
            title={t("orderDetail.deliveredKey")}
            value={order.deliveredKey}
            copied={copiedField === "key"}
            onCopy={() => copyValue(order.deliveredKey || "", "key")}
          />
        ) : null}

        {canAttachReceipt ? (
          <ReceiptUpload
            onUploaded={() => void invalidate()}
            orderId={order.id}
            receipt={order.receipt}
          />
        ) : null}

        {adminToolsVisible ? (
          // A Crypto Bot order is confirmed by its webhook and a closed one
          // is finished, so neither has a receipt still to come.
          <AdminOrderPanel
            order={order}
            showReceipt={Boolean(order.receipt) || (order.paymentMethodType === "MANUAL" && !isClosed)}
          />
        ) : null}

        <Section title={t("orderDetail.details")}>
          <KeyValueList
            items={[
              { label: t("orderComplete.product"), value: order.productTitle || order.subject },
              // While the buyer can still switch, the selector above already
              // names the method.
              !canSwitchPaymentMethod && {
                label: t("orderComplete.payment"),
                value: (
                  <span className="shop-inline">
                    <Avatar name={paymentTitle} size="sm" src={order.paymentMethodIconDataUrl} />
                    {paymentTitle}
                  </span>
                ),
              },
              { label: t("orderComplete.amount"), value: amountLabel || undefined },
              { label: t("orderComplete.createdAt"), value: createdAtLabel },
            ]}
          />
        </Section>

        {hasPrimaryActions ? (
          <div className="shop-desktop-only">
            <ActionStack>{primaryActions}</ActionStack>
          </div>
        ) : null}

        {/* Everything secondary stays quiet below the details: support for
            anyone stuck, and the ways out of an order. */}
        <ActionStack>
          {isRealBuyerView && supportLink ? (
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
          {isRealBuyerView && !order.isPaid && !isClosed ? (
            <Button fullWidth onClick={() => setIsCancelOpen(true)} variant="outline">
              {t("orderDetail.cancelOrder")}
            </Button>
          ) : null}
          {/* Only a finished order can leave the buyer's history — one
              still waiting for payment must not be able to vanish. */}
          {isRealBuyerView && isClosed ? (
            <Button
              fullWidth
              icon={<Trash2 size={16} aria-hidden />}
              onClick={() => setIsHideModalOpen(true)}
              variant="outline"
            >
              {t("orderDetail.hideAction")}
            </Button>
          ) : null}
          {adminToolsVisible ? (
            <Button
              fullWidth
              icon={<Trash2 size={16} aria-hidden />}
              onClick={() => setIsDeleteModalOpen(true)}
              variant="outline"
            >
              {t("common.delete")}
            </Button>
          ) : null}
        </ActionStack>
      </ScreenBody>

      {hasPrimaryActions ? <StickyActions>{primaryActions}</StickyActions> : null}

      <ResponsiveDialog
        confirmLabel={t("orderDetail.cancelOrder")}
        confirmVariant="danger"
        description={t("orderDetail.hintCancelled")}
        loading={cancelOrderMutation.isPending}
        onConfirm={() => cancelOrderMutation.mutate()}
        onOpenChange={setIsCancelOpen}
        open={isCancelOpen}
        title={`${t("orderDetail.cancelOrder")}?`}
      />

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
