"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LifeBuoy, ReceiptText, Trash2 } from "lucide-react"
import { Button, Cluster, EmptyState, Pill, Tabs } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { OrderTimeLeft } from "@/components/order-time-left"
import { ProfileAvatarLink } from "@/components/profile-avatar-link"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { useNotify } from "@/hooks/use-notify"
import { useRelativeTime } from "@/hooks/use-relative-time"
import { clearOrderHistory, getMe, getOrders } from "@/lib/api"
import { orderPillColor, orderStatusKey } from "@/lib/order-status"

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
        !order.isPaid && !["CLOSED", "CANCELLED", "PAYMENT_REVIEW"].includes(order.status),
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
          <>
            {supportLink ? (
              <LinkButton
                external
                href={supportLink}
                icon={<LifeBuoy size={16} aria-hidden />}
                size="sm"
                variant="secondary"
              >
                {t("orders.support")}
              </LinkButton>
            ) : null}
            <ProfileAvatarLink />
          </>
        }
      />

      {isLoading ? (
        <ListSkeleton />
      ) : isError && !ordersData ? (
        <ScreenError
          onRetry={() => refetch()}
          subtitle={t("orders.errorDescription")}
          title={t("orders.errorTitle")}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          description={t("orders.emptyDescription")}
          icon={<ReceiptText />}
          title={t("orders.emptyTitle")}
        />
      ) : (
        <ScreenBody>
          <div className="shop-scroll-x">
            <Tabs
              aria-label={t("orders.title")}
              items={[
                { value: "all", label: t("orders.filterAll") },
                { value: "waiting", label: t("orders.filterPayment") },
                { value: "review", label: t("orders.filterReview") },
                { value: "active", label: t("orders.filterDelivery") },
                { value: "closed", label: t("orders.filterHistory") },
              ]}
              onValueChange={(value) => setFilter(value as FilterKey)}
              value={filter}
            />
          </div>

          {/* Clearing is offered where the finished orders actually are. */}
          {filter === "closed" && buckets.closed.length > 0 ? (
            <Cluster justify="end">
              <Button
                icon={<Trash2 size={16} aria-hidden />}
                onClick={() => setIsClearOpen(true)}
                size="sm"
                variant="outline"
              >
                {t("orders.clearHistoryAction")}
              </Button>
            </Cluster>
          ) : null}

          {visibleOrders.length === 0 ? (
            <EmptyState
              description={t("orders.filterEmptyDescription")}
              icon={<ReceiptText />}
              title={t("orders.filterEmptyTitle")}
            />
          ) : (
            <ListGroup>
                {visibleOrders.map((order) => (
                  <ListRow
                    description={
                      <>
                        {`#${order.number}${
                          order.productCategory ? ` · ${order.productCategory}` : ""
                        }${
                          order.paymentMethodTitle && !order.isPaid
                            ? ` · ${order.paymentMethodTitle}`
                            : ""
                        } · `}
                        {/* The clock matters more than "5 min ago" while the
                            order is still waiting to be paid. */}
                        <OrderTimeLeft fallback={formatRelative(order.updatedAt)} order={order} />
                      </>
                    }
                    href={`/orders/${order.id}`}
                    key={order.id}
                    title={order.productTitle || order.subject}
                    trailing={<Pill color={orderPillColor(order)}>{t(orderStatusKey(order))}</Pill>}
                  />
                ))}
            </ListGroup>
          )}
        </ScreenBody>
      )}

      <ResponsiveDialog
        confirmLabel={t("orders.clearHistoryAction")}
        confirmVariant="danger"
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
