"use client"

import { useQuery } from "@tanstack/react-query"
import { Cell, Placeholder, Section } from "@telegram-apps/telegram-ui"
import { CreditCard, Package2, Receipt, ShieldCheck, Users } from "lucide-react"

import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { getAdminUsers, getMe, getOrders, getPaymentMethods, getProducts } from "@/lib/api"

export function AdminOverviewScreen() {
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
        <ScreenHeader title="Доступ закрыт" subtitle="Эта зона только для админа." />
      </Screen>
    )
  }

  const stats = [
    {
      label: "Активные товары",
      value: productsData?.products.filter((item) => item.isActive).length || 0,
      icon: Package2,
    },
    {
      label: "Активные заказы",
      value:
        ordersData?.orders.filter((item) => !["CLOSED", "CANCELLED"].includes(item.status)).length ||
        0,
      icon: Receipt,
    },
    {
      label: "Ключи",
      value:
        productsData?.products.reduce(
          (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
          0,
        ) || 0,
      icon: ShieldCheck,
    },
    {
      label: "Реквизиты",
      value: paymentData?.paymentMethods.length || 0,
      icon: CreditCard,
    },
    {
      label: "Баны",
      value: usersData?.summary.banned || 0,
      icon: Users,
    },
  ]

  return (
    <Screen>
      <ScreenHeader title="Админка" subtitle="Управление магазином" />

      <ScreenBody className="gap-3">
        {isLoadingProducts || isLoadingOrders || isLoadingPayments || isLoadingUsers ? (
          <Placeholder header="Загружаю сводку" description="Собираю данные магазина.">
            <Package2 size={32} />
          </Placeholder>
        ) : isErrorProducts || isErrorOrders || isErrorPayments || isErrorUsers ? (
          <Placeholder header="Сводка не загрузилась" description="Обнови экран или попробуй позже.">
            <Package2 size={32} />
          </Placeholder>
        ) : (
          <Section header="Сводка">
            {stats.map((item) => {
              const Icon = item.icon
              return (
                <Cell key={item.label} before={<Icon size={24} />} after={item.value}>
                  {item.label}
                </Cell>
              )
            })}
          </Section>
        )}
      </ScreenBody>
    </Screen>
  )
}
