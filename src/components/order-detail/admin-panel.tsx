"use client"

import { RefreshCcw, Trash2 } from "lucide-react"

import { useTranslate } from "@/components/i18n-provider"
import type { Order } from "@/components/order-detail/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldTitle,
} from "@/components/ui/field"

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
