"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Boxes, CreditCard, KeyRound, Ticket } from "lucide-react"

import { getMe, getPaymentMethods, getProducts, getTickets } from "@/lib/api"
import { Card } from "@/components/ui"
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
    {
      label: "Активные товары",
      value: productsData?.products.filter((item) => item.isActive).length || 0,
      icon: Boxes,
    },
    {
      label: "Открытые тикеты",
      value: ticketsData?.tickets.filter((item) => item.status !== "CLOSED").length || 0,
      icon: Ticket,
    },
    {
      label: "Ключи в наличии",
      value:
        productsData?.products.reduce(
          (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
          0,
        ) || 0,
      icon: KeyRound,
    },
    {
      label: "Реквизиты",
      value: paymentData?.paymentMethods.length || 0,
      icon: CreditCard,
    },
  ]

  const links = [
    { href: "/admin/products", title: "Управление товарами", subtitle: "Подписки, цены, автовыдача ключей" },
    { href: "/admin/tickets", title: "Обработка тикетов", subtitle: "Кто создал, оплата, выдача, статусы" },
    { href: "/admin/settings", title: "Настройки магазина", subtitle: "Реквизиты, welcome-текст, контакты" },
  ]

  return (
    <Screen>
      <ScreenHeader title="Админка" subtitle="Полноценное управление магазином с ПК и мобильных" />

      <div className="grid gap-3 px-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-muted)]">{item.label}</p>
                <Icon size={18} className="text-[var(--color-accent)]" />
              </div>
              <p className="text-3xl font-semibold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 px-4 pb-5 pt-4">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-base font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{item.subtitle}</p>
              </div>
              <ArrowRight size={18} className="text-[var(--color-muted)]" />
            </Card>
          </Link>
        ))}
      </div>
    </Screen>
  )
}
