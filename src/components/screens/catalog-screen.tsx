"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Cell, Placeholder, Section, Subheadline, Text, Title } from "@telegram-apps/telegram-ui"

import { getMe, getProducts } from "@/lib/api"
import { Badge, Input } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"

export function CatalogScreen() {
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [search, setSearch] = useState("")

  const products = useMemo(() => {
    const list = productsData?.products ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list.filter((item) => item.isActive)
    return list.filter(
      (item) =>
        item.isActive &&
        `${item.title} ${item.category || ""} ${item.description}`.toLowerCase().includes(query),
    )
  }, [productsData?.products, search])

  return (
    <Screen>
      <ScreenHeader
        title={meData?.settings.shopName || "Andrey Store"}
        subtitle={meData?.settings.welcomeText}
      />

      <Section>
        <Title level="3">Подписки, лицензии и ключи</Title>
        <Text className="mt-2 block">
          Магазин работает как mini app в Telegram и как storefront на ПК. Для товаров с ключами поддерживается автовыдача после подтверждения оплаты.
        </Text>
      </Section>

      <Section header="Поиск" footer="Один UX для ПК, мобилки и Telegram.">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск по программам и подпискам"
        />
      </Section>

      <Section header="Каталог">
        {products.length === 0 ? (
          <Placeholder
            header="Ничего не найдено"
            description="Попробуй изменить запрос или проверь список товаров в админке."
          />
        ) : null}

        {products.map((product) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Cell
              multiline
              subtitle={`${product.priceRub.toLocaleString("ru-RU")} ₽`}
              description={product.description}
              after={
                <Badge>
                  {product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная выдача"}
                </Badge>
              }
            >
              <div className="min-w-0">
                <Title level="3">{product.title}</Title>
                <Subheadline level="2">
                  {product.category || "Software subscription"}
                </Subheadline>
                {product.deliveryType === "AUTO_KEY" ? (
                  <Subheadline level="2">
                    Остаток ключей: {product.availableKeyCount ?? 0}
                  </Subheadline>
                ) : null}
              </div>
            </Cell>
          </Link>
        ))}
      </Section>
    </Screen>
  )
}
