"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { getMe, getPaymentMethods, getProducts, getTickets } from "@/lib/api"
import { Screen, ScreenHeader } from "@/components/screen"

export function AdminOverviewScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const { data: ticketsData } = useQuery({ queryKey: ["tickets"], queryFn: getTickets })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  if (meData?.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title="Доступ закрыт" subtitle="Эта зона только для админа." />
      </Screen>
    )
  }

  const stats = [
    { label: "Активные товары", value: productsData?.products.filter((item) => item.isActive).length || 0 },
    { label: "Открытые тикеты", value: ticketsData?.tickets.filter((item) => item.status !== "CLOSED").length || 0 },
    {
      label: "Ключи в наличии",
      value:
        productsData?.products.reduce(
          (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
          0,
        ) || 0,
    },
    { label: "Реквизиты", value: paymentData?.paymentMethods.length || 0 },
  ]

  const links = [
    { href: "/admin/products", title: "Товары", subtitle: "Каталог и ключи" },
    { href: "/admin/tickets", title: "Тикеты", subtitle: "Покупки и оплата" },
    { href: "/admin/settings", title: "Настройки", subtitle: "Тексты и реквизиты" },
  ]

  return (
    <Screen>
      <ScreenHeader title="Админка" subtitle="snx.sell control panel" />

      <div className="grid gap-3 px-4 pb-4 md:grid-cols-2">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl bg-[var(--color-surface)] p-4">
            <p className="text-xs text-[var(--color-muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 px-4 pb-4">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{item.subtitle}</p>
          </Link>
        ))}
      </div>
    </Screen>
  )
}
