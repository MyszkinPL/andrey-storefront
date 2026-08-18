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
import { ShopLogo } from "@/components/shop-logo"
import { useI18n } from "@/components/i18n-provider"
import { getMe, getProducts } from "@/lib/api"
import { formatPrice } from "@/lib/format"

/** Sentinel for "no category filter", kept out of the translated labels. */
const ALL_CATEGORIES = ""

export function CatalogScreen() {
  const { t, tp, locale } = useI18n()
  const { data: productsData, isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [search, setSearch] = useState("")

  const products = useMemo(() => productsData?.products ?? [], [productsData?.products])
  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of products) {
      if (item.category) set.add(item.category)
    }
    return [ALL_CATEGORIES, ...Array.from(set)]
  }, [products])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return products.filter((item) => {
      if (!item.isActive) return false
      const categoryOk = !category || item.category === category
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
          <Avatar className="size-10">
            {meData?.user.photoUrl ? (
              <AvatarImage src={meData.user.photoUrl} alt={meData.user.firstName} />
            ) : null}
            <AvatarFallback>{(meData?.user.firstName || "S").slice(0, 1)}</AvatarFallback>
          </Avatar>
        }
      />

      <ScreenBody>
        {isLoading ? (
          <CatalogEmpty
            title={t("catalog.loadingTitle")}
            description={t("catalog.loadingDescription")}
          />
        ) : isError ? (
          <CatalogEmpty
            title={t("catalog.errorTitle")}
            description={t("catalog.errorDescription")}
          />
        ) : (
          <>
            {/* Search and categories stack on phones and share a row on desktop. */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <InputGroup className="lg:max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("catalog.searchPlaceholder")}
              />
            </InputGroup>

            <ToggleGroup
              value={[category]}
              onValueChange={(value) => setCategory(value[0] ?? ALL_CATEGORIES)}
              variant="outline"
              size="sm"
              className="grid w-full grid-cols-3 lg:flex lg:w-auto lg:flex-wrap"
            >
              {categories.map((item) => (
                <ToggleGroupItem key={item || "all"} value={item}>
                  {item || t("catalog.allCategories")}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            </div>

            {filtered.length === 0 ? (
              <CatalogEmpty
                title={t("catalog.emptyTitle")}
                description={t("catalog.emptyDescription")}
              />
            ) : (
              <ItemGroup className="gap-2 lg:grid lg:grid-cols-2 xl:grid-cols-3">
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
                        {product.category || t("catalog.noCategory")} ·{" "}
                        {product.deliveryType === "AUTO_KEY"
                          ? tp("catalog.keys", product.availableKeyCount || 0)
                          : t("catalog.manualDelivery")}
                      </ItemDescription>
                      {product.description ? (
                        <ItemDescription className="line-clamp-1">{product.description}</ItemDescription>
                      ) : null}
                    </ItemContent>
                    <ItemActions>
                      <Badge variant="secondary">{formatPrice(product.priceRub, locale)}</Badge>
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
