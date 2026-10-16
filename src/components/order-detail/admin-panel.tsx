"use client"

import { RefreshCcw, Trash2 } from "lucide-react"
import { Avatar, Button, Cluster, Pill, Text, Well, WellContent, WellHeader } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import type { Order } from "@/components/order-detail/types"

/** Everything only an admin sees on an order: the buyer, and the levers. */
export function AdminOrderPanel({
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
    <Well>
      <WellHeader
        action={order.createdBy?.isBanned ? <Pill color="red">{t("orderDetail.banned")}</Pill> : undefined}
        description={t("orderDetail.orderNumber", { number: order.number })}
        title={t("orderDetail.admin")}
      />
      <WellContent>
        {order.createdBy ? (
          <div className="shop-row">
            <Avatar name={order.createdBy.firstName} size="lg" src={order.createdBy.photoUrl} />
            <div className="shop-row-copy">
              <Text as="span" size="sm" truncate>
                {order.createdBy.firstName}
              </Text>
              <Text as="span" size="xs" tone="muted" truncate>
                {order.createdBy.username ? `@${order.createdBy.username}` : t("auth.noUsername")}
              </Text>
            </div>
          </div>
        ) : null}
        <Cluster gap="2">
          {canConfirmManualPayment ? (
            <Button disabled={confirmPending} loading={confirmPending} onClick={onConfirm} size="sm">
              {t("orderDetail.confirmPayment")}
            </Button>
          ) : null}
          {canRejectManualPayment ? (
            <Button disabled={rejectPending} onClick={onReject} size="sm" variant="secondary">
              {t("orderDetail.reject")}
            </Button>
          ) : null}
          {canRefreshCryptoPayment ? (
            <Button
              disabled={refreshPending}
              icon={<RefreshCcw size={16} aria-hidden />}
              loading={refreshPending}
              onClick={onRefresh}
              size="sm"
              variant="secondary"
            >
              {t("orderDetail.check")}
            </Button>
          ) : null}
          <Button icon={<Trash2 size={16} aria-hidden />} onClick={onDelete} size="sm" variant="danger">
            {t("common.delete")}
          </Button>
        </Cluster>
      </WellContent>
    </Well>
  )
}
