"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, Package2, Receipt, ShieldCheck, Users } from "lucide-react"

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
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useTranslate } from "@/components/i18n-provider"
import { getAdminUsers, getMe, getOrders, getPaymentMethods, getProducts } from "@/lib/api"

export function AdminOverviewScreen() {
  const t = useTranslate()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
  const { data: ordersData, isLoading: isLoadingOrders, isError: isErrorOrders } = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getOrders({ scope: "all" }),
  })
  const { data: paymentData, isLoading: isLoadingPayments, isError: isErrorPayments } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })
  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminUsers(),
  })

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title={t("admin.deniedTitle")} subtitle={t("admin.deniedOverview")} />
      </Screen>
    )
  }

  const stats = [
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
          <OverviewEmpty
            title={t("admin.overviewErrorTitle")}
            description={t("admin.overviewErrorDescription")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {stats.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label}>
                  <CardHeader>
                    <CardTitle className="text-2xl">{item.value}</CardTitle>
                    <CardDescription>{item.label}</CardDescription>
                    <CardAction>
                      <Icon className="size-5 text-muted-foreground" />
                    </CardAction>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        )}
      </ScreenBody>
    </Screen>
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
