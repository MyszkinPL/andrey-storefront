"use client"

import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  CreditCard,
  Eye,
  Package2,
  Receipt,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

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
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field"
import { ListGroup, ListRow, ListRowMedia } from "@/components/list-row"
import { Screen, ScreenBody, ScreenEmpty, ScreenError, ScreenHeader } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { formatPrice } from "@/lib/format"
import {
  getAdminUsers,
  getMe,
  getOrders,
  getPaymentMethods,
  getProducts,
  getShopStats,
} from "@/lib/api"

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
    { label: t("admin.statUsers"), value: stats?.users.total ?? 0, icon: Users },
    { label: t("admin.statBotStarted"), value: stats?.users.botStarted ?? 0, icon: Send },
    { label: t("admin.statNewUsers"), value: stats?.users.newLast7Days ?? 0, icon: UserPlus },
    { label: t("admin.statActiveUsers"), value: stats?.users.activeLast7Days ?? 0, icon: Activity },
    { label: t("admin.statViews"), value: stats?.products.totalViews ?? 0, icon: Eye },
  ]

  const tiles = [
    {
      label: t("admin.statActiveProducts"),
      value: productsData?.products.filter((item) => item.isActive).length || 0,
      icon: Package2,
    },
    {
      label: t("admin.statActiveOrders"),
      value:
        ordersData?.orders.filter((item) => !["CLOSED", "CANCELLED"].includes(item.status)).length ||
        0,
      icon: Receipt,
    },
    {
      label: t("admin.statKeys"),
      value:
        productsData?.products.reduce(
          (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
          0,
        ) || 0,
      icon: ShieldCheck,
    },
    {
      label: t("admin.statPaymentMethods"),
      value: paymentData?.paymentMethods.length || 0,
      icon: CreditCard,
    },
    {
      label: t("admin.statBans"),
      value: usersData?.summary.banned || 0,
      icon: Users,
    },
  ]

  return (
    <Screen>
      <ScreenHeader title={t("admin.overviewTitle")} subtitle={t("admin.overviewSubtitle")} />

      <ScreenBody>
        {isLoadingProducts || isLoadingOrders || isLoadingPayments || isLoadingUsers ? (
          <OverviewEmpty
            title={t("admin.overviewLoadingTitle")}
            description={t("admin.overviewLoadingDescription")}
          />
        ) : isErrorProducts || isErrorOrders || isErrorPayments || isErrorUsers ? (
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

            <Field className="gap-1 px-1 pt-2">
              <FieldTitle>{t("admin.audienceTitle")}</FieldTitle>
              <FieldDescription>{t("admin.audienceHint")}</FieldDescription>
            </Field>
            <StatTiles items={audience} />

            {stats?.orders.paid ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {formatPrice(stats.orders.revenue, locale, currency)}
                  </CardTitle>
                  <CardDescription>
                    {t("admin.revenueHint", {
                      paid: stats.orders.paid,
                      total: stats.orders.total,
                    })}
                  </CardDescription>
                  <CardAction>
                    <Wallet className="size-5 text-muted-foreground" />
                  </CardAction>
                </CardHeader>
              </Card>
            ) : null}

            <Field className="gap-1 px-1 pt-2">
              <FieldTitle>{t("admin.topViewedTitle")}</FieldTitle>
              <FieldDescription>{t("admin.topViewedHint")}</FieldDescription>
            </Field>
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
                    media={<ListRowMedia>{index + 1}</ListRowMedia>}
                    title={product.title}
                  />
                ))}
              </ListGroup>
            ) : (
              <ScreenEmpty
                icon={<Eye />}
                subtitle={t("admin.topViewedEmptyHint")}
                title={t("admin.topViewedEmpty")}
              />
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

function StatTiles({
  items,
}: {
  items: Array<{ label: string; value: number; icon: LucideIcon }>
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-2xl tabular-nums">{item.value}</CardTitle>
              <CardDescription>{item.label}</CardDescription>
              <CardAction>
                <Icon className="size-5 text-muted-foreground" />
              </CardAction>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}

function OverviewEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <Package2 />
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
