"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PackageSearch } from "lucide-react"

import { Card, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SearchInput } from "@/components/search-input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfileAvatarLink } from "@/components/profile-avatar-link"
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
        trailing={<ProfileAvatarLink />}
      />

      <ScreenBody>
        {isLoading ? (
          <CatalogSkeleton />
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
              /* A shop sells with pictures. The list row gave the cover 64px
                 and the description most of the width, which on a phone was
                 three truncated words; the card gives the cover the whole
                 column and keeps only what decides a tap: name and price. */
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <Link
                    className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                    href={`/product/${product.id}`}
                    key={product.id}
                  >
                    <Card className="h-full gap-2 overflow-hidden p-2 transition-colors hover:bg-accent/40">
                      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-muted font-semibold text-2xl text-muted-foreground">
                        <ProductThumbnail
                          imageUrl={product.imageUrl}
                          title={product.title}
                        />
                      </div>

                      <div className="flex min-w-0 flex-col gap-0.5 px-1 pb-1">
                        <p className="truncate font-medium text-sm">{product.title}</p>
                        <p className="font-semibold text-base tabular-nums">
                          {formatPrice(product.priceRub, locale, currency)}
                        </p>
                        <p className="truncate text-muted-foreground text-xs">
                          {product.category || t("catalog.noCategory")} ·{" "}
                          <span className={stockClassName(product)}>
                            {product.deliveryType === "AUTO_KEY"
                              ? tp("catalog.keys", product.availableKeyCount || 0)
                              : t("catalog.manualDelivery")}
                          </span>
                        </p>
                      </div>
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
      <img
        alt={title}
        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        src={imageUrl}
      />
    )
  }

  return <span>{title.slice(0, 2).toUpperCase()}</span>
}

/** Placeholder shaped like the product grid so nothing jumps when it lands. */
function CatalogSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:gap-3 xl:grid-cols-4">
      {Array.from({ length: 6 }, (_, index) => (
        <Card className="gap-2 p-2" key={index}>
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="flex flex-col gap-1.5 px-1 pb-1">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
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
