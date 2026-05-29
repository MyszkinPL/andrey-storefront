"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Avatar,
  Card,
  Cell,
  Chip,
  Image as TgImage,
  Input,
  Placeholder,
  Section,
} from "@telegram-apps/telegram-ui"
import { PackageSearch, Search } from "lucide-react"

import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { getMe, getProducts } from "@/lib/api"

export function CatalogScreen() {
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")

  const products = productsData?.products ?? []
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of products) {
      if (item.category) set.add(item.category)
    }
    return ["Все", ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((item) => {
      if (!item.isActive) return false
      const categoryOk = !category || category === "Все" || item.category === category
      const searchOk =
        !query ||
        `${item.title} ${item.category || ""} ${item.description} ${item.specs
          .map((spec) => `${spec.label} ${spec.value}`)
          .join(" ")}`
          .toLowerCase()
          .includes(query)
      return categoryOk && searchOk
    })
  }, [category, products, search])

  const shopName = meData?.settings.shopName || "snx.sell"

  return (
    <Screen>
      <ScreenHeader
        before={
          <TgImage
            size={40}
            src="/logo.svg"
            alt=""
            fallbackIcon={<span>{shopName.slice(0, 2).toUpperCase()}</span>}
          />
        }
        title={shopName}
        trailing={
          <Avatar
            size={40}
            src={meData?.user.photoUrl || undefined}
            acronym={(meData?.user.firstName || "S").slice(0, 1).toUpperCase()}
            alt={meData?.user.firstName || shopName}
          />
        }
      />

      <ScreenBody>
        {isLoading ? (
          <Placeholder header="Загружаю каталог" description="Подтягиваю товары магазина.">
            <PackageSearch size={32} />
          </Placeholder>
        ) : isError ? (
          <Placeholder header="Каталог не загрузился" description="Обнови экран или попробуй позже.">
            <PackageSearch size={32} />
          </Placeholder>
        ) : (
          <>
            <Section>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                before={<Search size={18} />}
                placeholder="Поиск"
              />
            </Section>

            <div className="flex gap-2 overflow-x-auto px-1 py-1">
              {categories.map((item) => {
                const active = (category || "Все") === item
                return (
                  <Chip
                    key={item}
                    mode={active ? "elevated" : "mono"}
                    Component="button"
                    onClick={() => setCategory(item === "Все" ? "" : item)}
                  >
                    {item}
                  </Chip>
                )
              })}
            </div>

            {filtered.length === 0 ? (
              <Placeholder header="Пусто" description="Попробуй другую категорию или запрос.">
                <PackageSearch size={32} />
              </Placeholder>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`}>
                    <Card type="plain" className="w-full">
                      <div className="aspect-square overflow-hidden">
                        {product.imageDataUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageDataUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Cell before={<TgImage size={96} fallbackIcon={<PackageSearch size={28} />} />}>
                            Фото
                          </Cell>
                        )}
                      </div>
                      <Card.Cell
                        subtitle={product.category || "Без категории"}
                        after={`${product.priceRub.toLocaleString("ru-RU")} ₽`}
                      >
                        {product.title}
                      </Card.Cell>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}
