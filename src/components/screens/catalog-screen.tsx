"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PackageSearch, Search } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
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
            <Card size="sm">
              <CardContent>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Поиск"
                  />
                </div>
              </CardContent>
            </Card>

            <ToggleGroup
              value={[category || "Все"]}
              onValueChange={(value) => setCategory(value[0] === "Все" ? "" : value[0] || "")}
              variant="outline"
              size="sm"
              className="w-full overflow-x-auto"
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
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <Link key={product.id} href={`/product/${product.id}`} className="min-w-0">
                    <Card size="sm" className="h-full gap-0 py-0">
                      <ProductCover imageDataUrl={product.imageDataUrl} title={product.title} />
                      <CardFooter className="items-end justify-between gap-3 py-4">
                        <div className="min-w-0">
                          <CardTitle className="truncate">{product.title}</CardTitle>
                          <CardDescription className="truncate">
                            {product.category || "Без категории"}
                          </CardDescription>
                        </div>
                        <div className="shrink-0 text-sm font-medium">
                          {product.priceRub.toLocaleString("ru-RU")} ₽
                        </div>
                      </CardFooter>
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

function ShopLogo() {
  return (
    <Avatar size="lg">
      <AvatarImage src="/logo.svg" alt="snx.sell" />
      <AvatarFallback>SX</AvatarFallback>
    </Avatar>
  )
}

function ProductCover({
  imageDataUrl,
  title,
}: {
  imageDataUrl: string | null
  title: string
}) {
  return (
    <AspectRatio ratio={1} className="overflow-hidden">
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageDataUrl} alt={title} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <PackageSearch className="size-8" />
        </div>
      )}
    </AspectRatio>
  )
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
