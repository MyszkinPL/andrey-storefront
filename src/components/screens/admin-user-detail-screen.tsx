"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, History, ShieldCheck, ShieldX } from "lucide-react"
import {
  Avatar,
  Button,
  Cluster,
  DetailRow,
  EmptyState,
  Heading,
  Pill,
  Text,
  Well,
  WellContent,
  WellHeader,
} from "sealui"

import { AccessStateScreen } from "@/components/access-state-screen"
import { useI18n } from "@/components/i18n-provider"
import { ListGroup, ListRow } from "@/components/list-row"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Screen, ScreenBody, ScreenHeader, ScreenState } from "@/components/screen"
import { useNotify } from "@/hooks/use-notify"
import { getAdminUser, getMe, updateAdminUserModeration } from "@/lib/api"
import { formatPrice } from "@/lib/format"
import type { TranslationKey } from "@/lib/i18n"

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
  const roleLabel = user.role === "ADMIN" ? t("adminUsers.admin") : t("profile.buyer")

  return (
    <Screen noTabBar>
      <ScreenHeader
        back="/admin/users"
        title={displayName}
        subtitle={user.username ? `@${user.username}` : `tg:${user.telegramId}`}
        trailing={
          user.isBanned ? (
            <Pill color="red">{t("adminUsers.banned")}</Pill>
          ) : user.role === "ADMIN" ? (
            <Pill color="blue">{t("adminUsers.admin")}</Pill>
          ) : null
        }
      />

      <ScreenBody>
        <Well>
          <div className="shop-row">
            <Avatar name={displayName || user.firstName} size="lg" src={user.photoUrl} />
            <div className="shop-row-copy">
              <Heading as="h2" size="sm" truncate>
                {t("adminUserDetail.profile")}
              </Heading>
              <Text as="p" size="sm" tone="muted" truncate>
                {`${user.role === "ADMIN" ? t("profile.administrator") : t("profile.buyer")} · ${tp(
                  "adminUsers.countActive",
                  user.activeOrderCount,
                )}`}
              </Text>
            </div>
          </div>

          {/* Role first, ban second: the destructive action sits after the
              reversible one and stays visually quieter. */}
          <Cluster>
            {user.role === "ADMIN" ? (
              <Button
                disabled={!canRevokeAdmin || moderationMutation.isPending}
                icon={<ShieldX size={16} aria-hidden />}
                onClick={() => setConfirmRole("USER")}
                size="sm"
                variant="secondary"
              >
                {t("adminUserDetail.revokeAdmin")}
              </Button>
            ) : (
              <Button
                disabled={moderationMutation.isPending}
                icon={<ShieldCheck size={16} aria-hidden />}
                onClick={() => setConfirmRole("ADMIN")}
                size="sm"
                variant="secondary"
              >
                {t("adminUserDetail.grantAdmin")}
              </Button>
            )}
            {canBan ? (
              <Button
                disabled={moderationMutation.isPending}
                icon={user.isBanned ? undefined : <Ban size={16} aria-hidden />}
                onClick={() => {
                  if (user.isBanned) {
                    moderationMutation.mutate({ isBanned: false })
                  } else {
                    setConfirmBanOpen(true)
                  }
                }}
                size="sm"
                variant={user.isBanned ? "secondary" : "danger"}
              >
                {user.isBanned ? t("adminUserDetail.unban") : t("adminUserDetail.ban")}
              </Button>
            ) : null}
          </Cluster>

          <WellContent>
            <DetailRow label="Telegram ID" mono value={String(user.telegramId)} />
            <DetailRow
              label="Username"
              value={user.username ? `@${user.username}` : t("adminUserDetail.none")}
            />
            <DetailRow label={t("adminUserDetail.role")} value={roleLabel} />
            <DetailRow
              label={t("adminUserDetail.activeOrders")}
              value={String(user.activeOrderCount)}
            />
          </WellContent>
        </Well>

        <Well>
          <WellHeader
            description={tp("adminUserDetail.orderHistoryRecent", user.orders.length)}
            title={t("adminUserDetail.orderHistory")}
          />
          <WellContent>
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
                    media={<History />}
                    title={
                      order.productTitle ||
                      t("adminUserDetail.orderFallback", { number: order.number })
                    }
                  />
                ))}
              </ListGroup>
            ) : (
              <EmptyState
                description={t("adminUserDetail.noOrdersDescription")}
                icon={<History />}
                title={t("adminUserDetail.noOrdersTitle")}
              />
            )}
          </WellContent>
        </Well>
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={t("adminUserDetail.ban")}
        confirmVariant="danger"
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
        confirmVariant={confirmRole === "USER" ? "danger" : "primary"}
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
