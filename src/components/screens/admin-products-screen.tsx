"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CopyPlus,
  EllipsisVertical,
  ImagePlus,
  PackagePlus,
  PackageSearch,
  PencilLine,
  Trash2,
} from "lucide-react"
import { Button, EmptyState, Menu, MenuItem, MenuLinkItem, MenuSeparator, Pill } from "sealui"

import { AccessStateScreen } from "@/components/access-state-screen"
import { useI18n } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { SearchInput } from "@/components/search-input"
import { deleteAdminProduct, getMe, getProducts } from "@/lib/api"
import { formatPrice } from "@/lib/format"

type AdminProduct = Awaited<ReturnType<typeof getProducts>>["products"][number]

export function AdminProductsScreen() {
  const { t, tp, locale, currency } = useI18n()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null)
  const [search, setSearch] = useState("")
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isError, isLoading, refetch } = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  })
  const allProducts = useMemo(() => data?.products ?? [], [data?.products])
  // The buyer catalog has always been searchable; the admin list it mirrors
  // was the one place you had to scroll to find a product.
  const products = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return allProducts
    return allProducts.filter((product) =>
      `${product.title} ${product.category || ""}`.toLowerCase().includes(query),
    )
  }, [allProducts, search])
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      setDeleteProduct(null)
    },
  })

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title={t("admin.deniedTitle")}
        description={t("adminProducts.deniedDescription")}
      />
    )
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("adminProducts.title")}
        subtitle={t("adminProducts.subtitle", { count: allProducts.length })}
        trailing={
          <LinkButton
            href="/admin/products/new"
            icon={<PackagePlus size={16} aria-hidden />}
            size="sm"
          >
            {t("adminProducts.new")}
          </LinkButton>
        }
      />

      <ScreenBody>
        {/* Without these two branches an unfinished or failed request rendered
            the "no products yet" card, which told the admin their catalog was
            empty when it was only unread. */}
        {isLoading ? (
          <ListSkeleton />
        ) : isError && !data ? (
          <ScreenError
            onRetry={() => refetch()}
            subtitle={t("adminProducts.errorDescription")}
            title={t("adminProducts.errorTitle")}
          />
        ) : allProducts.length === 0 ? (
          <EmptyState
            actions={[
              {
                label: t("adminProducts.create"),
                icon: <PackagePlus size={16} aria-hidden />,
                onClick: () => router.push("/admin/products/new"),
              },
            ]}
            description={t("adminProducts.emptyDescription")}
            icon={<PackagePlus />}
            title={t("adminProducts.emptyTitle")}
          />
        ) : (
          <>
            {allProducts.length > 4 ? (
              <div className="shop-toolbar">
                <SearchInput
                  onValueChange={setSearch}
                  placeholder={t("adminProducts.searchPlaceholder")}
                  value={search}
                />
              </div>
            ) : null}

            {products.length === 0 ? (
              <EmptyState
                description={t("adminProducts.noMatchDescription")}
                icon={<PackageSearch />}
                title={t("adminProducts.noMatchTitle")}
              />
            ) : (
              <ListGroup>
                {products.map((product) => (
                  <ListRow
                    description={`${product.category || t("catalog.noCategory")} · ${formatPrice(
                      product.priceRub,
                      locale,
                      currency,
                    )} · ${
                      product.deliveryType === "AUTO_KEY"
                        ? tp("catalog.keys", product.availableKeyCount || 0)
                        : t("catalog.manualDelivery")
                    }`}
                    key={product.id}
                    mediaBox
                    media={<ProductThumbnail imageUrl={product.imageUrl} title={product.title} />}
                    title={product.title}
                    trailing={
                      /* Three icon buttons per row, one of them red, crowded the
                         title off a phone and put "delete" one thumb-slip from
                         "edit". Edit is the obvious tap and stays; the rest sit
                         behind a menu. */
                      <>
                        {!product.isActive ? (
                          <Pill color="gray">{t("adminProducts.hidden")}</Pill>
                        ) : null}
                        <LinkButton
                          aria-label={t("adminProducts.edit")}
                          href={`/admin/products/${product.id}/edit`}
                          size="icon"
                          variant="secondary"
                        >
                          <PencilLine size={16} aria-hidden />
                        </LinkButton>
                        <Menu
                          align="end"
                          aria-label={t("adminProducts.more")}
                          trigger={
                            <Button aria-label={t("adminProducts.more")} size="icon" variant="ghost">
                              <EllipsisVertical size={16} aria-hidden />
                            </Button>
                          }
                        >
                          <MenuLinkItem href={`/admin/products/new?copy=${product.id}`}>
                            <CopyPlus size={16} aria-hidden />
                            {t("adminProducts.duplicate")}
                          </MenuLinkItem>
                          <MenuSeparator />
                          <MenuItem destructive onClick={() => setDeleteProduct(product)}>
                            <Trash2 size={16} aria-hidden />
                            {t("adminProducts.remove")}
                          </MenuItem>
                        </Menu>
                      </>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </>
        )}
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={
          deleteMutation.isPending ? t("adminProducts.deleting") : t("common.delete")
        }
        confirmVariant="danger"
        description={t("adminProducts.deleteDescription")}
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteProduct) deleteMutation.mutate(deleteProduct.id)
        }}
        onOpenChange={(open) => {
          if (!open) setDeleteProduct(null)
        }}
        open={Boolean(deleteProduct)}
        title={t("adminProducts.deleteTitle")}
      />
    </Screen>
  )
}

function ProductThumbnail({
  imageUrl,
  title,
}: {
  imageUrl?: string | null
  title: string
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={title} />
    )
  }

  return <ImagePlus />
}
