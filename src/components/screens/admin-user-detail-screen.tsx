"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, History, ShieldCheck, ShieldX } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
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
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton } from "@/hooks/use-telegram"
import { useI18n } from "@/components/i18n-provider"
import { formatPrice } from "@/lib/format"
import type { TranslationKey } from "@/lib/i18n"
import { getAdminUser, getMe, updateAdminUserModeration } from "@/lib/api"

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const { t, tp, locale } = useI18n()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmBanOpen, setConfirmBanOpen] = useState(false)
  const [confirmRole, setConfirmRole] = useState<"USER" | "ADMIN" | null>(null)

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    refetchInterval: 10_000,
  })

  const moderationMutation = useMutation({
    mutationFn: (payload: { isBanned?: boolean; role?: "USER" | "ADMIN" }) =>
      updateAdminUserModeration(userId, payload),
    onSuccess: async () => {
      setConfirmBanOpen(false)
      setConfirmRole(null)
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] })
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      await queryClient.invalidateQueries({ queryKey: ["me"] })
    },
  })

  useBackButton(() => router.push("/admin/users"))

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
      <UserState
        title={t("adminUserDetail.loadingTitle")}
        description={t("adminUserDetail.loadingDescription")}
      />
    )
  }

  if (isError || !data?.user) {
    return (
      <UserState
        title={t("adminUserDetail.errorTitle")}
        description={t("adminUserDetail.errorDescription")}
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
              {moderationMutation.error ? (
                <Field>
                  <FieldDescription>{moderationMutation.error.message}</FieldDescription>
                </Field>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("adminUserDetail.orderHistory")}</CardTitle>
            <CardDescription>
              {t("adminUserDetail.orderHistoryCount", { count: user.orders.length })}
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
                      order.priceRub ? ` · ${formatPrice(order.priceRub, locale)}` : ""
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

      {confirmBanOpen && !user.isBanned ? (
        <AlertDialog
          open
          onOpenChange={(open) => !moderationMutation.isPending && setConfirmBanOpen(open)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("adminUserDetail.banTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("adminUserDetail.banDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={moderationMutation.isPending}
                onClick={() => {
                  setConfirmBanOpen(false)
                  moderationMutation.mutate({ isBanned: true })
                }}
              >
                {t("adminUserDetail.ban")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      {confirmRole ? (
        <AlertDialog
          open
          onOpenChange={(open) => !moderationMutation.isPending && setConfirmRole(open ? confirmRole : null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmRole === "ADMIN"
                  ? t("adminUserDetail.grantTitle")
                  : t("adminUserDetail.revokeTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmRole === "ADMIN"
                  ? t("adminUserDetail.grantDescription")
                  : t("adminUserDetail.revokeDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant={confirmRole === "USER" ? "destructive" : "default"}
                disabled={moderationMutation.isPending}
                onClick={() => {
                  const nextRole = confirmRole
                  setConfirmRole(null)
                  moderationMutation.mutate({ role: nextRole })
                }}
              >
                {confirmRole === "ADMIN"
                  ? t("adminUserDetail.grantAction")
                  : t("adminUserDetail.revokeAction")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </Screen>
  )
}

function UserState({ title, description }: { title: string; description: string }) {
  return (
    <Screen noTabBar>
      <Card>
        <CardContent>
          <Empty>
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

function orderStatusKey2(status: string, isPaid: boolean): TranslationKey {
  if (status === "CANCELLED") return "adminUserDetail.statusCancelled"
  if (status === "CLOSED") {
    return isPaid ? "adminUserDetail.statusDone" : "adminUserDetail.statusClosed"
  }
  if (status === "PAYMENT_REVIEW") return "adminUserDetail.statusReview"
  if (!isPaid) return "adminUserDetail.statusPayment"
  return "adminUserDetail.statusPaid"
}

