"use client"

import type { CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { Eye } from "lucide-react"
import { EmptyState, StatisticCard, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { Screen, ScreenBody, ScreenError, ScreenHeader, SectionTitle } from "@/components/screen"
import {
  getAdminUsers,
  getMe,
  getOrders,
  getPaymentMethods,
  getProducts,
  getShopStats,
} from "@/lib/api"
import { formatPrice } from "@/lib/format"

export function AdminOverviewScreen() {
  const { t, tp, locale, currency } = useI18n()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    isError: isErrorProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getOrders({ scope: "all" }),
  })
  const {
    data: paymentData,
    isLoading: isLoadingPayments,
    isError: isErrorPayments,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isErrorUsers,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
  })
  // Counted in the database rather than by tallying lists on the client, so
  // the numbers stay right once the shop outgrows one page of orders.
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ["shop-stats"],
    queryFn: getShopStats,
  })
  const stats = statsData?.stats

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title={t("admin.deniedTitle")} subtitle={t("admin.deniedOverview")} />
      </Screen>
    )
  }

  const audience = [
    { label: t("admin.statUsers"), value: stats?.users.total ?? 0 },
    { label: t("admin.statBotStarted"), value: stats?.users.botStarted ?? 0 },
    { label: t("admin.statNewUsers"), value: stats?.users.newLast7Days ?? 0 },
    { label: t("admin.statActiveUsers"), value: stats?.users.activeLast7Days ?? 0 },
    { label: t("admin.statBans"), value: usersData?.summary.banned || 0 },
  ]

  const tiles = [
    {
      label: t("admin.statActiveProducts"),
      value: productsData?.products.filter((item) => item.isActive).length || 0,
    },
    {
      label: t("admin.statActiveOrders"),
      value:
        ordersData?.orders.filter((item) => !["CLOSED", "CANCELLED"].includes(item.status)).length ||
        0,
    },
    {
      label: t("admin.statKeys"),
      value:
        productsData?.products.reduce(
          (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
          0,
        ) || 0,
    },
    {
      label: t("admin.statPaymentMethods"),
      value: paymentData?.paymentMethods.length || 0,
    },
  ]

  const isLoading = isLoadingProducts || isLoadingOrders || isLoadingPayments || isLoadingUsers
  const isError = isErrorProducts || isErrorOrders || isErrorPayments || isErrorUsers

  return (
    <Screen>
      <ScreenHeader title={t("admin.overviewTitle")} subtitle={t("admin.overviewSubtitle")} />

      <ScreenBody>
        {isLoading ? (
          // The tiles keep their labels while the numbers load, so the
          // layout does not jump once the counts land.
          <>
            <SectionTitle
              hint={t("admin.overviewLoadingDescription")}
              title={t("admin.overviewLoadingTitle")}
            />
            <StatTiles items={tiles} loading />
            <StatTiles items={audience} loading />
            <ListSkeleton rows={3} />
          </>
        ) : isError ? (
          <ScreenError
            onRetry={() => {
              refetchProducts()
              refetchOrders()
              refetchPayments()
              refetchUsers()
              refetchStats()
            }}
            subtitle={t("admin.overviewErrorDescription")}
            title={t("admin.overviewErrorTitle")}
          />
        ) : (
          <>
            <SectionTitle hint={t("admin.shopHint")} title={t("admin.shopTitle")} />
            <StatTiles items={tiles} />

            <SectionTitle hint={t("admin.audienceHint")} title={t("admin.audienceTitle")} />
            <StatTiles items={audience} />

            {stats?.orders.paid ? (
              <StatisticCard
                size="lg"
                title={t("admin.revenueHint", {
                  paid: stats.orders.paid,
                  total: stats.orders.total,
                })}
              >
                <Text as="span" size="xl" tabularNums>
                  {formatPrice(stats.orders.revenue, locale, currency)}
                </Text>
              </StatisticCard>
            ) : null}

            <SectionTitle
              hint={`${tp("admin.viewsCount", stats?.products.totalViews ?? 0)} — ${t(
                "admin.topViewedHint",
              )}`}
              title={t("admin.topViewedTitle")}
            />
            {stats && stats.topViewed.length > 0 ? (
              <ListGroup>
                {stats.topViewed.map((product, index) => (
                  <ListRow
                    description={[
                      tp("admin.viewsCount", product.views),
                      tp("admin.viewersCount", product.viewers),
                      tp("admin.ordersCount", product.orders),
                    ].join(" \u00B7 ")}
                    href={`/admin/products/${product.id}/edit`}
                    key={product.id}
                    mediaBox
                    media={
                      <Text as="span" size="sm" tabularNums tone="secondary">
                        {index + 1}
                      </Text>
                    }
                    title={product.title}
                  />
                ))}
              </ListGroup>
            ) : (
              <EmptyState
                description={t("admin.topViewedEmptyHint")}
                icon={<Eye />}
                title={t("admin.topViewedEmpty")}
              />
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

/**
 * One tile per number. The grid fits as many columns as there are tiles on
 * desktop and falls back to two on a phone, so the audience row never
 * leaves a lonely fifth tile.
 */
function StatTiles({
  items,
  loading = false,
}: {
  items: Array<{ label: string; value: number }>
  loading?: boolean
}) {
  return (
    <div
      className="shop-stats"
      style={{ "--shop-stats-cols": String(items.length) } as CSSProperties}
    >
      {items.map((item) => (
        <StatisticCard key={item.label} size="lg" title={item.label}>
          <Text as="span" loading={loading} placeholderText="0000" size="xl" tabularNums>
            {item.value}
          </Text>
        </StatisticCard>
      ))}
    </div>
  )
}
