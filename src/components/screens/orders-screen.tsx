"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LifeBuoy, Receipt, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ListGroup, ListRow, ListRowMedia, ListSkeleton } from "@/components/list-row"
import { ProfileAvatarLink } from "@/components/profile-avatar-link"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { clearOrderHistory, getMe, getOrders } from "@/lib/api"
import { useNotify } from "@/hooks/use-notify"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { orderBadgeVariant, orderStatusKey } from "@/lib/order-status"

type FilterKey = "all" | "waiting" | "review" | "active" | "closed"

export function OrdersScreen() {
  const { t, tp } = useI18n()
  const formatRelative = useRelativeTime()
  const { data: ordersData, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: () => getOrders(),
  })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [filter, setFilter] = useState<FilterKey>("all")
  const [isClearOpen, setIsClearOpen] = useState(false)
  const queryClient = useQueryClient()
  const notify = useNotify()
  const clearMutation = useMutation({
    mutationFn: clearOrderHistory,
    onSuccess: async () => {
      setIsClearOpen(false)
      notify.success("orders.clearHistoryDone")
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
    onError: notify.failure,
  })
  const supportLink = meData?.settings.supportUsername
    ? `https://t.me/${meData.settings.supportUsername.replace(/^@/, "")}`
    : null

  const orders = useMemo(() => ordersData?.orders ?? [], [ordersData?.orders])
  const buckets = useMemo(() => {
    const waiting = orders.filter(
      (order) =>
        !order.isPaid &&
        !["CLOSED", "CANCELLED", "PAYMENT_REVIEW"].includes(order.status),
    )
    const active = orders.filter(
      (order) => order.isPaid && !["CLOSED", "CANCELLED"].includes(order.status),
    )
    const review = orders.filter((order) => order.status === "PAYMENT_REVIEW")
    const closed = orders.filter((order) => ["CLOSED", "CANCELLED"].includes(order.status))

    return {
      all: [...waiting, ...review, ...active, ...closed],
      waiting,
      review,
      active,
      closed,
    }
  }, [orders])

  const visibleOrders = buckets[filter]

  return (
    <Screen>
      <ScreenHeader
        title={t("orders.title")}
        subtitle={[
          tp("orders.activeCount", buckets.active.length),
          tp("orders.waitingCount", buckets.waiting.length),
        ].join(" · ")}
        trailing={
          <div className="flex items-center gap-2">
            {supportLink ? (
              <a
                aria-label={t("orders.support")}
                className={buttonVariants({ size: "sm", variant: "secondary" })}
                href={supportLink}
                rel="noreferrer"
                target="_blank"
              >
                <LifeBuoy data-icon="inline-start" />
                {/* The label costs more width than it is worth next to the
                    avatar on a narrow phone. */}
                <span className="max-sm:hidden">{t("orders.support")}</span>
              </a>
            ) : null}
            <ProfileAvatarLink />
          </div>
        }
      />

      {isLoading ? (
        <ListSkeleton className="lg:grid lg:grid-cols-2" />
      ) : isError && !ordersData ? (
        <ScreenError
          onRetry={() => refetch()}
          subtitle={t("orders.errorDescription")}
          title={t("orders.errorTitle")}
        />
      ) : orders.length === 0 ? (
        <OrdersEmpty title={t("orders.emptyTitle")} description={t("orders.emptyDescription")} />
      ) : (
        <ScreenBody>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterKey)}>
            <TabsList className="grid w-full grid-cols-5">
              {[
                { key: "all" as const, label: t("orders.filterAll") },
                { key: "waiting" as const, label: t("orders.filterPayment") },
                { key: "review" as const, label: t("orders.filterReview") },
                { key: "active" as const, label: t("orders.filterDelivery") },
                { key: "closed" as const, label: t("orders.filterHistory") },
              ].map((item) => (
                <TabsTrigger key={item.key} value={item.key} className="px-1 text-xs">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Clearing is offered where the finished orders actually are. */}
          {filter === "closed" && buckets.closed.length > 0 ? (
            <div className="flex justify-end px-1">
              <Button
                onClick={() => setIsClearOpen(true)}
                size="sm"
                variant="destructive-outline"
              >
                <Trash2 data-icon="inline-start" />
                {t("orders.clearHistoryAction")}
              </Button>
            </div>
          ) : null}

          {visibleOrders.length === 0 ? (
            <OrdersEmpty title={t("orders.filterEmptyTitle")} description={t("orders.filterEmptyDescription")} />
          ) : (
            <ListGroup className="lg:grid lg:grid-cols-2">
              {visibleOrders.map((order) => (
                <ListRow
                  description={`#${order.number}${
                    order.productCategory ? ` · ${order.productCategory}` : ""
                  }${
                    order.paymentMethodTitle && !order.isPaid
                      ? ` · ${order.paymentMethodTitle}`
                      : ""
                  } · ${formatRelative(order.updatedAt)}`}
                  href={`/orders/${order.id}`}
                  key={order.id}
                  media={
                    <ListRowMedia>
                      <Receipt />
                    </ListRowMedia>
                  }
                  title={order.productTitle || order.subject}
                  trailing={
                    <Badge variant={orderBadgeVariant(order)}>
                      {t(orderStatusKey(order))}
                    </Badge>
                  }
                />
              ))}
            </ListGroup>
          )}
        </ScreenBody>
      )}

      <ResponsiveDialog
        confirmLabel={t("orders.clearHistoryAction")}
        confirmVariant="destructive"
        description={t("orders.clearHistoryDescription")}
        loading={clearMutation.isPending}
        onConfirm={() => clearMutation.mutate()}
        onOpenChange={setIsClearOpen}
        open={isClearOpen}
        title={t("orders.clearHistoryTitle")}
      />
    </Screen>
  )
}

function OrdersEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

