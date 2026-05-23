"use client"
import { useQuery } from "@tanstack/react-query"
import { CreditCard, Package2, ShieldCheck, Ticket, Users } from "lucide-react"

import { getAdminUsers, getMe, getPaymentMethods, getProducts, getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function AdminOverviewScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: productsData, isLoading: isLoadingProducts, isError: isErrorProducts } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const { data: ticketsData, isLoading: isLoadingTickets, isError: isErrorTickets } = useQuery({ queryKey: ["tickets", "all"], queryFn: () => getTickets({ scope: "all" }) })
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
        ticketsData?.tickets.filter((item) => !["CLOSED", "CANCELLED"].includes(item.status)).length || 0,
      icon: Ticket,
    },
    {
      label: "Ключи в наличии",
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
      label: "Забаненные",
      value: usersData?.summary.banned || 0,
      icon: Users,
    },
  ]

  return (
    <Screen>
      <ScreenHeader title="Админка" subtitle="Управление магазином" />

      <ScreenBody className="gap-3">
        {isLoadingProducts || isLoadingTickets || isLoadingPayments || isLoadingUsers ? (
          <ScreenEmpty
            icon={<Package2 size={28} className="text-[var(--color-muted)]" />}
            title="Загружаю сводку"
            subtitle="Собираю данные магазина."
          />
        ) : isErrorProducts || isErrorTickets || isErrorPayments || isErrorUsers ? (
          <ScreenEmpty
            icon={<Package2 size={28} className="text-[var(--color-muted)]" />}
            title="Сводка не загрузилась"
            subtitle="Обнови экран или попробуй позже."
          />
        ) : (
          <section className="ui-card p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">Сводка</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Главное по магазину без лишнего воздуха
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
              {stats.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-[20px] bg-[var(--color-bg)] px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 text-[11px] leading-4 text-[var(--color-muted)]">
                        {item.label}
                      </p>
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-muted)]">
                        <Icon size={15} />
                      </div>
                    </div>
                    <p className="mt-3 text-2xl font-semibold leading-none text-[var(--color-text)]">
                      {item.value}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </ScreenBody>
    </Screen>
  )
}
