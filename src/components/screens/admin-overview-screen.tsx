"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CreditCard, Package2, ShieldCheck, Ticket, Users } from "lucide-react"

import { getAdminUsers, getMe, getPaymentMethods, getProducts, getTickets } from "@/lib/api"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"

export function AdminOverviewScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const { data: ticketsData } = useQuery({ queryKey: ["tickets"], queryFn: getTickets })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })
  const { data: usersData } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
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
      value: usersData?.users.filter((item) => item.isBanned).length || 0,
      icon: Users,
    },
  ]

  const links = [
    { href: "/admin/products", title: "Товары", subtitle: "Каталог, характеристики и ключи" },
    { href: "/admin/tickets", title: "Заказы", subtitle: "Покупки, статусы, оплата и чат с клиентом" },
    { href: "/admin/users", title: "Модерация", subtitle: "Баны, активные заказы и контроль покупателей" },
    { href: "/admin/settings", title: "Настройки", subtitle: "Тексты магазина и способы оплаты" },
  ]

  return (
    <Screen>
      <ScreenHeader title="Админка" subtitle="snx.sell control panel" />

      <ScreenBody className="gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="ui-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-[var(--color-muted)]">
                    <Icon size={18} />
                  </div>
                  <span className="ui-pill">live</span>
                </div>
                <p className="mt-4 text-xs text-[var(--color-muted)]">{item.label}</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{item.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-3 xl:grid-cols-4">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="ui-card p-4 transition-transform duration-150 active:scale-[0.99]">
              <p className="text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </ScreenBody>
    </Screen>
  )
}
