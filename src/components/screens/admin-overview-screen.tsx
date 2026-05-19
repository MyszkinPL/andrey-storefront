"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Cell, Section, Subheadline, Title } from "@telegram-apps/telegram-ui"

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
    {
      label: "Активные товары",
      value: productsData?.products.filter((item) => item.isActive).length || 0,
    },
    {
      label: "Открытые тикеты",
      value: ticketsData?.tickets.filter((item) => item.status !== "CLOSED").length || 0,
    },
    {
      label: "Ключи в наличии",
      value:
        productsData?.products.reduce(
          (sum, item) => sum + (item.deliveryType === "AUTO_KEY" ? item.availableKeyCount || 0 : 0),
          0,
        ) || 0,
    },
    {
      label: "Реквизиты",
      value: paymentData?.paymentMethods.length || 0,
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

      <Section header="Сводка">
        {stats.map((item) => (
          <Cell key={item.label} after={<Title level="2">{item.value}</Title>}>
            {item.label}
          </Cell>
        ))}
      </Section>

      <Section header="Управление">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <Cell multiline subtitle={item.subtitle}>
              <div className="min-w-0">
                <Title level="3">{item.title}</Title>
                <Subheadline level="2">{item.subtitle}</Subheadline>
              </div>
            </Cell>
          </Link>
        ))}
      </Section>
    </Screen>
  )
}
