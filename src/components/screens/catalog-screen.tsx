"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PackageSearch } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Frame, FrameDescription, FramePanel, FrameTitle } from "@/components/ui/frame"
import { SearchInput } from "@/components/search-input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListSkeleton } from "@/components/list-row"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { ShopLogo } from "@/components/shop-logo"
import { useI18n } from "@/components/i18n-provider"
import { getMe, getProducts } from "@/lib/api"
import { formatPrice } from "@/lib/format"

/**
 * Sentinel for "no category filter". A real value rather than an empty string,
 * because a tab with an empty value cannot be marked active.
 */
const ALL_CATEGORIES = "__all__"

export function CatalogScreen() {
  const { t, tp, locale, currency } = useI18n()
  const { data: productsData, isLoading, isError, refetch } = useQuery({
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
      const categoryOk = category === ALL_CATEGORIES || item.category === category
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
        before={<ShopLogo className="lg:h-8" />}
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
          <ListSkeleton
            className="lg:grid lg:grid-cols-2 xl:grid-cols-3"
            mediaClassName="size-16 sm:size-20"
            trailing={false}
          />
        ) : isError && !productsData ? (
          <ScreenError
            onRetry={() => refetch()}
            subtitle={t("catalog.errorDescription")}
            title={t("catalog.errorTitle")}
          />
        ) : (
          <>
            {/* Search and categories stack on phones and share a row on desktop. */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            <SearchInput
              className="lg:max-w-xs"
              onValueChange={setSearch}
              placeholder={t("catalog.searchPlaceholder")}
              value={search}
            />

            {/* Tabs rather than a toggle group: exactly one category is always
                active, so the catalog can never end up filtered to nothing.
                The row scrolls because the number of categories is unbounded. */}
            <div className="-mx-3 overflow-x-auto px-3 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden">
              <Tabs onValueChange={(value) => setCategory(String(value))} value={category}>
                <TabsList className="w-max">
                  {categories.map((item) => (
                    <TabsTrigger className="shrink-0" key={item} value={item}>
                      {item === ALL_CATEGORIES ? t("catalog.allCategories") : item}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            </div>

            {filtered.length === 0 ? (
              <CatalogEmpty
                title={t("catalog.emptyTitle")}
                description={t("catalog.emptyDescription")}
              />
            ) : (
              <Frame className="gap-1 lg:grid lg:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
                  <Link
                    className="block"
                    href={`/product/${product.id}`}
                    key={product.id}
                  >
                    <FramePanel className="flex h-full items-center gap-3 p-3 transition-colors hover:bg-accent/40">
                      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted font-medium text-muted-foreground sm:size-20">
                        <ProductThumbnail
                          imageUrl={product.imageUrl}
                          title={product.title}
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        {/* Price sits on the title line: it is the reason the
                            row gets read at all, and a muted badge off to the
                            side made it the weakest thing on the card. */}
                        <div className="flex items-baseline gap-2">
                          <FrameTitle className="min-w-0 flex-1 truncate">
                            {product.title}
                          </FrameTitle>
                          <span className="shrink-0 font-semibold text-sm tabular-nums">
                            {formatPrice(product.priceRub, locale, currency)}
                          </span>
                        </div>

                        <FrameDescription className="truncate text-xs">
                          {product.category || t("catalog.noCategory")} ·{" "}
                          <span className={stockClassName(product)}>
                            {product.deliveryType === "AUTO_KEY"
                              ? tp("catalog.keys", product.availableKeyCount || 0)
                              : t("catalog.manualDelivery")}
                          </span>
                        </FrameDescription>

                        {/* Truncated to a few words on a phone the description
                            says nothing, so it only earns its line from sm up. */}
                        {product.description ? (
                          <FrameDescription className="hidden truncate text-xs sm:block">
                            {product.description}
                          </FrameDescription>
                        ) : null}
                      </div>
                    </FramePanel>
                  </Link>
                ))}
              </Frame>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}


/** Stock is a status, not trivia: out-of-stock keys should read as a warning. */
function stockClassName(product: { deliveryType: string; availableKeyCount?: number | null }) {
  if (product.deliveryType !== "AUTO_KEY") return undefined
  return (product.availableKeyCount || 0) > 0
    ? "text-success-foreground"
    : "text-warning-foreground"
}

function ProductThumbnail({
  imageUrl,
  title,
}: {
  imageUrl: string | null
  title: string
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={title} className="size-full object-cover" src={imageUrl} />
    )
  }

  return <span className="text-lg">{title.slice(0, 2).toUpperCase()}</span>
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
