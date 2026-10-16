"use client"

import type { CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight } from "lucide-react"
import { DetailRow, Pill, StatisticCard, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { Screen, ScreenBody, ScreenError, ScreenHeader, Section } from "@/components/screen"
import {
  getAdminUsers,
  getMe,
  getOrders,
  getPaymentMethods,
  getProducts,
  getShopStats,
} from "@/lib/api"
import { formatPrice } from "@/lib/format"
import { orderPillColor, orderStatusKey } from "@/lib/order-status"

/**
 * The admin's home: what needs doing today, four numbers, and the lists
 * worth a glance. Everything else is one tap away on its own tab.
 */
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
    refetchInterval: 10_000,
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

  const orders = ordersData?.orders ?? []
  const activeOrders = orders.filter((item) => !["CLOSED", "CANCELLED"].includes(item.status))
  // What the admin has to act on: a payment to check, or a paid order
  // still waiting for its delivery.
  const attention = activeOrders.filter(
    (item) => item.status === "PAYMENT_REVIEW" || item.isPaid,
  )
  const products = productsData?.products ?? []

  const tiles = [
    { label: t("admin.statActiveOrders"), value: activeOrders.length },
    {
      label: t("admin.statReview"),
      value: orders.filter((item) => item.status === "PAYMENT_REVIEW").length,
    },
    {
      label: t("admin.statKeys"),
      value: products.reduce(
        (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
        0,
      ),
    },
    { label: t("admin.statUsers"), value: stats?.users.total ?? 0 },
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
            <StatTiles items={tiles} loading />
            <ListSkeleton media={false} rows={3} />
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
            <StatTiles items={tiles} />

            <Section
              action={
                <LinkButton href="/admin/orders" icon={<ArrowRight size={16} aria-hidden />} size="sm" variant="ghost">
                  {t("admin.allOrders")}
                </LinkButton>
              }
              hint={t("admin.attentionHint")}
              title={t("admin.attentionTitle")}
            >
              {attention.length > 0 ? (
                <ListGroup>
                  {attention.slice(0, 5).map((order) => (
                    <ListRow
                      description={[`#${order.number}`, order.paymentMethodTitle]
                        .filter(Boolean)
                        .join(" · ")}
                      href={`/orders/${order.id}`}
                      key={order.id}
                      title={order.productTitle || order.subject}
                      trailing={<Pill color={orderPillColor(order)}>{t(orderStatusKey(order))}</Pill>}
                    />
                  ))}
                </ListGroup>
              ) : (
                <Text as="p" size="sm" tone="muted">
                  {t("admin.attentionEmpty")} · {t("admin.attentionEmptyHint")}
                </Text>
              )}
            </Section>

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

            {stats && stats.topViewed.length > 0 ? (
              <Section
                hint={`${tp("admin.viewsCount", stats.products.totalViews)} ${t("admin.topViewedHint")}`}
                title={t("admin.topViewedTitle")}
              >
                <ListGroup>
                  {stats.topViewed.map((product, index) => (
                    <ListRow
                      description={[
                        tp("admin.viewsCount", product.views),
                        tp("admin.viewersCount", product.viewers),
                        tp("admin.ordersCount", product.orders),
                      ].join(" · ")}
                      href={`/admin/products/${product.id}/edit`}
                      key={product.id}
                      media={
                        <Text as="span" size="sm" tabularNums tone="muted">
                          {index + 1}
                        </Text>
                      }
                      title={product.title}
                    />
                  ))}
                </ListGroup>
              </Section>
            ) : null}

            <Section hint={t("admin.audienceHint")} title={t("admin.audienceTitle")}>
              <div className="shop-lines">
                <DetailRow label={t("admin.statBotStarted")} value={String(stats?.users.botStarted ?? 0)} />
                <DetailRow label={t("admin.statNewUsers")} value={String(stats?.users.newLast7Days ?? 0)} />
                <DetailRow label={t("admin.statActiveUsers")} value={String(stats?.users.activeLast7Days ?? 0)} />
                <DetailRow label={t("admin.statBans")} value={String(usersData?.summary.banned || 0)} />
                <DetailRow
                  label={t("admin.statActiveProducts")}
                  value={String(products.filter((item) => item.isActive).length)}
                />
                <DetailRow
                  label={t("admin.statPaymentMethods")}
                  value={String(paymentData?.paymentMethods.length || 0)}
                />
              </div>
            </Section>
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

/** Four numbers, two per row on a phone and one row on desktop. */
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
