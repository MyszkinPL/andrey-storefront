"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PackageSearch } from "lucide-react"
import { EmptyState, Tabs, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ProfileAvatarLink } from "@/components/profile-avatar-link"
import { Screen, ScreenBody, ScreenError } from "@/components/screen"
import { SearchInput } from "@/components/search-input"
import { ShopLogo } from "@/components/shop-logo"
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

  const shopName = meData?.settings.shopName || ""

  return (
    <Screen>
      {/* The mark alone: the name printed beside it was the wordmark twice. */}
      <header className="shop-header">
        <div className="shop-header-copy">
          <ShopLogo aria-label={shopName} className="h-7 lg:h-8" />
        </div>
        <div className="shop-header-side">
          <ProfileAvatarLink />
        </div>
      </header>

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
            <div className="shop-toolbar">
              <SearchInput
                onValueChange={setSearch}
                placeholder={t("catalog.searchPlaceholder")}
                value={search}
              />

              {/* Tabs rather than a toggle group: exactly one category is always
                  active, so the catalog can never end up filtered to nothing.
                  The row scrolls because the number of categories is unbounded. */}
              <div className="shop-scroll-x">
                <Tabs
                  aria-label={t("catalog.allCategories")}
                  items={categories.map((item) => ({
                    value: item,
                    label: item === ALL_CATEGORIES ? t("catalog.allCategories") : item,
                  }))}
                  onValueChange={(value) => setCategory(String(value))}
                  value={category}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                description={t("catalog.emptyDescription")}
                icon={<PackageSearch />}
                title={t("catalog.emptyTitle")}
              />
            ) : (
              /* A shop sells with pictures. The list row gave the cover 64px
                 and the description most of the width, which on a phone was
                 three truncated words; the card gives the cover the whole
                 column and keeps only what decides a tap: name and price. */
              <div className="shop-grid">
                {filtered.map((product) => (
                  <Link className="shop-product" href={`/product/${product.id}`} key={product.id}>
                    <div className="shop-product-cover">
                      <ProductThumbnail imageUrl={product.imageUrl} title={product.title} />
                    </div>

                    <div className="shop-product-copy">
                      <Text as="span" size="sm" truncate>
                        {product.title}
                      </Text>
                      <Text as="strong" size="md" tabularNums>
                        {formatPrice(product.priceRub, locale, currency)}
                      </Text>
                      <Text as="span" size="xs" tone="muted" truncate>
                        {product.category || t("catalog.noCategory")} ·{" "}
                        {/* Stock is a status, not trivia: an empty key pool
                            reads as a warning. */}
                        <Text as="span" size="xs" tone={stockTone(product)}>
                          {product.deliveryType === "AUTO_KEY"
                            ? tp("catalog.keys", product.availableKeyCount || 0)
                            : t("catalog.manualDelivery")}
                        </Text>
                      </Text>
                    </div>
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

function stockTone(product: {
  deliveryType: string
  availableKeyCount?: number | null
}): "muted" | "success" | "warning" {
  if (product.deliveryType !== "AUTO_KEY") return "muted"
  return (product.availableKeyCount || 0) > 0 ? "success" : "warning"
}

function ProductThumbnail({ imageUrl, title }: { imageUrl: string | null; title: string }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={title} src={imageUrl} />
  }

  return <span>{title.slice(0, 2).toUpperCase()}</span>
}

/** Placeholder shaped like the product grid so nothing jumps when it lands. */
function CatalogSkeleton() {
  return (
    <div aria-hidden="true" className="shop-grid">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="shop-product" key={index}>
          <div className="shop-product-cover" />
          <div className="shop-product-copy">
            <Text as="span" loading placeholderText="A product name" size="sm" />
            <Text as="strong" loading placeholderText="1 000 ₽" size="md" />
            <Text as="span" loading placeholderText="Category · keys" size="xs" />
          </div>
        </div>
      ))}
    </div>
  )
}
