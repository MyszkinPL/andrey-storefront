"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CopyPlus, ImagePlus, PackagePlus, PencilLine, Trash2 } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ListGroup, ListRow, ListRowMedia } from "@/components/list-row"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { deleteAdminProduct, getMe, getProducts } from "@/lib/api"
import { formatPrice } from "@/lib/format"

type AdminProduct = Awaited<ReturnType<typeof getProducts>>["products"][number]

export function AdminProductsScreen() {
  const { t, tp, locale, currency } = useI18n()
  const queryClient = useQueryClient()
  const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null)
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const products = useMemo(() => data?.products ?? [], [data?.products])
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
        subtitle={t("adminProducts.subtitle", { count: products.length })}
        trailing={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            <PackagePlus data-icon="inline-start" />
            {t("adminProducts.new")}
          </Link>
        }
      />

      <ScreenBody>
        {products.length === 0 ? (
          <Card>
            <CardContent>
              <Empty>
                <EmptyMedia variant="icon">
                  <PackagePlus />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>{t("adminProducts.emptyTitle")}</EmptyTitle>
                  <EmptyDescription>{t("adminProducts.emptyDescription")}</EmptyDescription>
                </EmptyHeader>
                <Link href="/admin/products/new" className={buttonVariants()}>
                  {t("adminProducts.create")}
                </Link>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <ListGroup className="lg:grid lg:grid-cols-2">
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
                media={
                  <ListRowMedia>
                    <ProductThumbnail
                      imageUrl={product.imageUrl}
                      title={product.title}
                    />
                  </ListRowMedia>
                }
                title={product.title}
                trailing={
                  <div className="flex items-center gap-1">
                    {!product.isActive ? <Badge variant="secondary">{t("adminProducts.hidden")}</Badge> : null}
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className={buttonVariants({ size: "icon-sm", variant: "secondary" })}
                    aria-label={t("adminProducts.edit")}
                  >
                    <PencilLine />
                  </Link>
                  <Link
                    href={`/admin/products/new?copy=${product.id}`}
                    className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                    aria-label={t("adminProducts.duplicate")}
                  >
                    <CopyPlus />
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    aria-label={t("adminProducts.remove")}
                    onClick={() => setDeleteProduct(product)}
                  >
                    <Trash2 />
                  </Button>
                  </div>
                }
              />
            ))}
          </ListGroup>
        )}
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={
          deleteMutation.isPending ? t("adminProducts.deleting") : t("common.delete")
        }
        confirmVariant="destructive"
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

