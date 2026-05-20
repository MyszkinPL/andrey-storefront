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
      <ScreenHeader title="Админка" subtitle="Управление магазином" />

      <ScreenBody className="gap-3">
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

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="ui-card p-4 transition-transform duration-150 active:scale-[0.99]"
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </ScreenBody>
    </Screen>
  )
}
