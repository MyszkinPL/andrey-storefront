"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Clock3 } from "lucide-react"
import { EmptyState, Tabs } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ListSkeleton } from "@/components/list-row"
import { OrderList } from "@/components/order-row"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { getMe, getOrders } from "@/lib/api"

type FilterKey = "all" | "waiting" | "review" | "work" | "closed"

export function AdminOrdersScreen() {
  const { t } = useI18n()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getOrders({ scope: "all" }),
    refetchInterval: 10_000,
  })
  const [filter, setFilter] = useState<FilterKey>("all")

  const orders = useMemo(() => data?.orders ?? [], [data?.orders])
  const buckets = useMemo(() => {
    const waiting = orders.filter(
      (order) =>
        !order.isPaid &&
        order.status !== "CLOSED" &&
        order.status !== "CANCELLED" &&
        order.status !== "PAYMENT_REVIEW",
    )
    const review = orders.filter((order) => order.status === "PAYMENT_REVIEW")
    const work = orders.filter((order) => order.isPaid && !["CLOSED", "CANCELLED"].includes(order.status))
    const closed = orders.filter((order) => ["CLOSED", "CANCELLED"].includes(order.status))

    return { all: orders, waiting, review, work, closed }
  }, [orders])

  const visibleOrders = buckets[filter]

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title={t("admin.deniedTitle")} subtitle={t("admin.deniedOrders")} />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title={t("admin.ordersTitle")} subtitle={t("admin.ordersSubtitle")} />

      {isLoading ? (
        <ListSkeleton />
      ) : isError && !data ? (
        <ScreenError
          onRetry={() => refetch()}
          subtitle={t("admin.ordersErrorDescription")}
          title={t("admin.ordersErrorTitle")}
        />
      ) : orders.length === 0 ? (
        <EmptyState
          description={t("admin.ordersEmptyDescription")}
          icon={<Clock3 />}
          title={t("admin.ordersEmptyTitle")}
        />
      ) : (
        <ScreenBody>
          <div className="shop-scroll-x">
            <Tabs
              aria-label={t("admin.ordersTitle")}
              items={[
                { value: "all", label: t("orders.filterAll") },
                { value: "waiting", label: t("orders.filterPayment") },
                { value: "review", label: t("orders.filterReview") },
                { value: "work", label: t("orders.filterDelivery") },
                { value: "closed", label: t("orders.filterHistory") },
              ]}
              onValueChange={(value) => setFilter(value as FilterKey)}
              value={filter}
            />
          </div>

          {visibleOrders.length === 0 ? (
            <EmptyState
              description={t("orders.filterEmptyDescription")}
              icon={<Clock3 />}
              title={t("orders.filterEmptyTitle")}
            />
          ) : (
            <OrderList orders={visibleOrders} />
          )}
        </ScreenBody>
      )}
    </Screen>
  )
}
