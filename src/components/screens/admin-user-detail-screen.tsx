"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, History, ShieldCheck, ShieldX } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { ListGroup, ListRow, ListRowMedia } from "@/components/list-row"
import { Screen, ScreenBody, ScreenHeader, ScreenState } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { useNotify } from "@/hooks/use-notify"
import { formatPrice } from "@/lib/format"
import type { TranslationKey } from "@/lib/i18n"
import { getAdminUser, getMe, updateAdminUserModeration } from "@/lib/api"

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const { t, tp, locale, currency } = useI18n()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const [confirmBanOpen, setConfirmBanOpen] = useState(false)
  const [confirmRole, setConfirmRole] = useState<"USER" | "ADMIN" | null>(null)

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    refetchInterval: 10_000,
  })

  const moderationMutation = useMutation({
    mutationFn: (payload: { isBanned?: boolean; role?: "USER" | "ADMIN" }) =>
      updateAdminUserModeration(userId, payload),
    onError: notify.failure,
    onSuccess: async (_result, payload) => {
      notify.success(
        payload.role
          ? "uiNotify.roleChanged"
          : payload.isBanned
            ? "uiNotify.userBanned"
            : "uiNotify.userUnbanned",
      )
      setConfirmBanOpen(false)
      setConfirmRole(null)
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] })
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      await queryClient.invalidateQueries({ queryKey: ["me"] })
    },
  })

  
  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title={t("admin.deniedTitle")}
        description={t("adminUserDetail.deniedDescription")}
      />
    )
  }

  if (isLoading) {
    return (
      <ScreenState
        back="/admin/users"
        description={t("adminUserDetail.loadingDescription")}
        title={t("adminUserDetail.loadingTitle")}
      />
    )
  }

  if (!data?.user) {
    return (
      <ScreenState
        back="/admin/users"
        description={t("adminUserDetail.errorDescription")}
        onRetry={() => refetch()}
        title={t("adminUserDetail.errorTitle")}
      />
    )
  }

  const user = data.user
  const displayName = [user.firstName, user.lastName || ""].join(" ").trim()
  const isCurrentUser = meData?.user.id === user.id
  const canBan = user.role !== "ADMIN"
  const canRevokeAdmin = user.role === "ADMIN" && !isCurrentUser

  return (
    <Screen noTabBar>
      <ScreenHeader
        back="/admin/users"
        title={displayName}
        subtitle={user.username ? `@${user.username}` : `tg:${user.telegramId}`}
        trailing={
          user.isBanned ? (
            <Badge variant="destructive">{t("adminUsers.banned")}</Badge>
          ) : user.role === "ADMIN" ? (
            <Badge variant="secondary">{t("adminUsers.admin")}</Badge>
          ) : null
        }
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <Avatar className="size-10">
              {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={displayName} /> : null}
              <AvatarFallback>{user.firstName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <CardTitle>{t("adminUserDetail.profile")}</CardTitle>
            <CardDescription>
              {user.role === "ADMIN" ? "Администратор" : "Покупатель"} · {tp("adminUsers.countActive", user.activeOrderCount)}
            </CardDescription>
            <CardAction className="flex flex-wrap justify-end gap-2">
              {user.role === "ADMIN" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!canRevokeAdmin || moderationMutation.isPending}
                  onClick={() => setConfirmRole("USER")}
                >
                  <ShieldX data-icon="inline-start" />
                  {t("adminUserDetail.revokeAdmin")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={moderationMutation.isPending}
                  onClick={() => setConfirmRole("ADMIN")}
                >
                  <ShieldCheck data-icon="inline-start" />
                  {t("adminUserDetail.grantAdmin")}
                </Button>
              )}
              {canBan ? (
                <Button
                  size="sm"
                  variant={user.isBanned ? "secondary" : "destructive"}
                  disabled={moderationMutation.isPending}
                  onClick={() => {
                    if (user.isBanned) {
                      moderationMutation.mutate({ isBanned: false })
                    } else {
                      setConfirmBanOpen(true)
                    }
                  }}
                >
                  {!user.isBanned ? <Ban data-icon="inline-start" /> : null}
                  {user.isBanned ? t("adminUserDetail.unban") : t("adminUserDetail.ban")}
                </Button>
              ) : null}
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel>Telegram ID</FieldLabel>
                <FieldDescription className="text-right">{user.telegramId}</FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>Username</FieldLabel>
                <FieldDescription className="text-right">
                  {user.username ? `@${user.username}` : t("adminUserDetail.none")}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>{t("adminUserDetail.role")}</FieldLabel>
                <FieldDescription className="text-right">
                  {user.role === "ADMIN" ? t("adminUsers.admin") : t("profile.buyer")}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>{t("adminUserDetail.activeOrders")}</FieldLabel>
                <FieldDescription className="text-right">{user.activeOrderCount}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("adminUserDetail.orderHistory")}</CardTitle>
            <CardDescription>
              {tp("adminUserDetail.orderHistoryRecent", user.orders.length)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.orders.length > 0 ? (
              <ListGroup>
                {user.orders.map((order) => (
                  <ListRow
                    description={`#${order.number}${
                      order.productCategory ? ` · ${order.productCategory}` : ""
                    }${
                      order.priceRub ? ` · ${formatPrice(order.priceRub, locale, currency)}` : ""
                    } · ${t(orderStatusKey2(order.status, order.isPaid))}`}
                    href={`/orders/${order.id}`}
                    key={order.id}
                    media={
                      <ListRowMedia>
                        <History />
                      </ListRowMedia>
                    }
                    title={
                      order.productTitle ||
                      t("adminUserDetail.orderFallback", { number: order.number })
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{t("adminUserDetail.noOrdersTitle")}</EmptyTitle>
                  <EmptyDescription>{t("adminUserDetail.noOrdersDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={t("adminUserDetail.ban")}
        confirmVariant="destructive"
        description={t("adminUserDetail.banDescription")}
        loading={moderationMutation.isPending}
        onConfirm={() => moderationMutation.mutate({ isBanned: true })}
        onOpenChange={setConfirmBanOpen}
        open={confirmBanOpen && !user.isBanned}
        title={t("adminUserDetail.banTitle")}
      />

      <ResponsiveDialog
        confirmLabel={
          confirmRole === "ADMIN"
            ? t("adminUserDetail.grantAction")
            : t("adminUserDetail.revokeAction")
        }
        confirmVariant={confirmRole === "USER" ? "destructive" : "default"}
        description={
          confirmRole === "ADMIN"
            ? t("adminUserDetail.grantDescription")
            : t("adminUserDetail.revokeDescription")
        }
        loading={moderationMutation.isPending}
        onConfirm={() => {
          if (confirmRole) moderationMutation.mutate({ role: confirmRole })
        }}
        onOpenChange={(open) => setConfirmRole(open ? confirmRole : null)}
        open={Boolean(confirmRole)}
        title={
          confirmRole === "ADMIN"
            ? t("adminUserDetail.grantTitle")
            : t("adminUserDetail.revokeTitle")
        }
      />
    </Screen>
  )
}


function orderStatusKey2(status: string, isPaid: boolean): TranslationKey {
  if (status === "CANCELLED") return "adminUserDetail.statusCancelled"
  if (status === "CLOSED") {
    return isPaid ? "adminUserDetail.statusDone" : "adminUserDetail.statusClosed"
  }
  if (status === "PAYMENT_REVIEW") return "adminUserDetail.statusReview"
  if (!isPaid) return "adminUserDetail.statusPayment"
  return "adminUserDetail.statusPaid"
}

