"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, ShieldCheck, ShieldX } from "lucide-react"
import { Avatar, Button, DetailRow, Pill, Text } from "sealui"

import { AccessStateScreen } from "@/components/access-state-screen"
import { useI18n } from "@/components/i18n-provider"
import { ListGroup, ListRow } from "@/components/list-row"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import {
  ActionStack,
  Screen,
  ScreenBody,
  ScreenHeader,
  ScreenState,
  Section,
} from "@/components/screen"
import { useNotify } from "@/hooks/use-notify"
import { getAdminUser, getMe, updateAdminUserModeration } from "@/lib/api"
import { formatPrice } from "@/lib/format"
import type { TranslationKey } from "@/lib/i18n"

/** One person: who they are, their orders, and the two moderation levers. */
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
  const roleLabel = user.role === "ADMIN" ? t("profile.administrator") : t("profile.buyer")

  return (
    <Screen narrow noTabBar>
      <ScreenHeader
        back="/admin/users"
        title={displayName}
        subtitle={`${roleLabel} · ${tp("adminUsers.countActive", user.activeOrderCount)}`}
        trailing={<Avatar name={displayName || user.firstName} size="lg" src={user.photoUrl} />}
      />

      <ScreenBody>
        {user.isBanned ? (
          <div className="shop-section-head">
            <Pill color="red">{t("adminUsers.banned")}</Pill>
          </div>
        ) : null}

        <div className="shop-lines">
          <DetailRow label="Telegram ID" mono value={String(user.telegramId)} />
          <DetailRow
            label="Username"
            value={user.username ? `@${user.username}` : t("adminUserDetail.none")}
          />
          <DetailRow label={t("adminUserDetail.role")} value={roleLabel} />
          <DetailRow label={t("adminUserDetail.activeOrders")} value={String(user.activeOrderCount)} />
        </div>

        <Section
          hint={tp("adminUserDetail.orderHistoryRecent", user.orders.length)}
          title={t("adminUserDetail.orderHistory")}
        >
          {user.orders.length > 0 ? (
            <ListGroup>
              {user.orders.map((order) => (
                <ListRow
                  description={`#${order.number}${
                    order.productCategory ? ` · ${order.productCategory}` : ""
                  }${order.priceRub ? ` · ${formatPrice(order.priceRub, locale, currency)}` : ""}`}
                  href={`/orders/${order.id}`}
                  key={order.id}
                  title={
                    order.productTitle ||
                    t("adminUserDetail.orderFallback", { number: order.number })
                  }
                  trailing={
                    <Pill color={historyPillColor(order.status, order.isPaid)}>
                      {t(historyStatusKey(order.status, order.isPaid))}
                    </Pill>
                  }
                />
              ))}
            </ListGroup>
          ) : (
            <Text as="p" size="sm" tone="muted">
              {t("adminUserDetail.noOrdersTitle")} · {t("adminUserDetail.noOrdersDescription")}
            </Text>
          )}
        </Section>

        {/* Role first, ban second: the destructive action sits after the
            reversible one and stays visually quieter. */}
        <ActionStack>
          {user.role === "ADMIN" ? (
            <Button
              disabled={!canRevokeAdmin || moderationMutation.isPending}
              fullWidth
              icon={<ShieldX size={16} aria-hidden />}
              onClick={() => setConfirmRole("USER")}
              variant="secondary"
            >
              {t("adminUserDetail.revokeAdmin")}
            </Button>
          ) : (
            <Button
              disabled={moderationMutation.isPending}
              fullWidth
              icon={<ShieldCheck size={16} aria-hidden />}
              onClick={() => setConfirmRole("ADMIN")}
              variant="secondary"
            >
              {t("adminUserDetail.grantAdmin")}
            </Button>
          )}
          {canBan ? (
            <Button
              disabled={moderationMutation.isPending}
              fullWidth
              icon={user.isBanned ? undefined : <Ban size={16} aria-hidden />}
              onClick={() => {
                if (user.isBanned) {
                  moderationMutation.mutate({ isBanned: false })
                } else {
                  setConfirmBanOpen(true)
                }
              }}
              variant="outline"
            >
              {user.isBanned ? t("adminUserDetail.unban") : t("adminUserDetail.ban")}
            </Button>
          ) : null}
        </ActionStack>
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

function historyStatusKey(status: string, isPaid: boolean): TranslationKey {
  if (status === "CANCELLED") return "adminUserDetail.statusCancelled"
  if (status === "CLOSED") {
    return isPaid ? "adminUserDetail.statusDone" : "adminUserDetail.statusClosed"
  }
  if (status === "PAYMENT_REVIEW") return "adminUserDetail.statusReview"
  if (!isPaid) return "adminUserDetail.statusPayment"
  return "adminUserDetail.statusPaid"
}

function historyPillColor(status: string, isPaid: boolean): "green" | "yellow" | "blue" | "gray" | "red" {
  if (status === "CANCELLED") return "red"
  if (status === "CLOSED") return isPaid ? "green" : "gray"
  if (status === "PAYMENT_REVIEW") return "blue"
  return isPaid ? "green" : "yellow"
}
