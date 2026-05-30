"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PackageSearch, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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

  const products = useMemo(() => productsData?.products ?? [], [productsData?.products])
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
        before={<ShopLogo />}
        title={shopName}
        trailing={
          <Avatar size="lg">
            {meData?.user.photoUrl ? (
              <AvatarImage src={meData.user.photoUrl} alt={meData.user.firstName} />
            ) : null}
            <AvatarFallback>{(meData?.user.firstName || "S").slice(0, 1)}</AvatarFallback>
          </Avatar>
        }
      />

      <ScreenBody>
        {isLoading ? (
          <CatalogEmpty title="Загружаю каталог" description="Подтягиваю товары магазина." />
        ) : isError ? (
          <CatalogEmpty title="Каталог не загрузился" description="Обнови экран или попробуй позже." />
        ) : (
          <>
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск"
              />
            </InputGroup>

            <ToggleGroup
              value={[category || "Все"]}
              onValueChange={(value) => setCategory(value[0] === "Все" ? "" : value[0] || "")}
              variant="outline"
              size="sm"
              className="grid w-full grid-cols-3"
            >
              {categories.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {filtered.length === 0 ? (
              <CatalogEmpty title="Пусто" description="Попробуй другую категорию или запрос." />
            ) : (
              <ItemGroup className="gap-2 lg:grid lg:grid-cols-2">
                {filtered.map((product) => (
                  <Item
                    key={product.id}
                    render={<Link href={`/product/${product.id}`} />}
                    variant="muted"
                    className="p-2.5"
                  >
                    <ItemMedia
                      variant={product.imageDataUrl ? "image" : "icon"}
                      className={product.imageDataUrl ? "size-20" : "size-20 rounded-xl"}
                    >
                      <ProductThumbnail imageDataUrl={product.imageDataUrl} title={product.title} />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{product.title}</ItemTitle>
                      <ItemDescription>
                        {product.category || "Без категории"} · {renderDelivery(product)}
                      </ItemDescription>
                      {product.description ? (
                        <ItemDescription className="line-clamp-1">{product.description}</ItemDescription>
                      ) : null}
                    </ItemContent>
                    <ItemActions>
                      <Badge variant="secondary">{product.priceRub.toLocaleString("ru-RU")} ₽</Badge>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

function ShopLogo() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" alt="snx.sell" className="size-8 shrink-0" />
  )
}

function ProductThumbnail({
  imageDataUrl,
  title,
}: {
  imageDataUrl: string | null
  title: string
}) {
  if (imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageDataUrl} alt={title} />
    )
  }

  return <PackageSearch />
}

function renderDelivery(product: Awaited<ReturnType<typeof getProducts>>["products"][number]) {
  if (product.deliveryType === "AUTO_KEY") {
    return `${product.availableKeyCount || 0} ключей`
  }

  return "ручная выдача"
}

function CatalogEmpty({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <Empty>
          <EmptyMedia variant="icon">
            <PackageSearch />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardHeader>
    </Card>
  )
}
