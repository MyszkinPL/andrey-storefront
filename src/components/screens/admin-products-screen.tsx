"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CopyPlus, ImagePlus, PackagePlus, PencilLine, Trash2 } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Field, FieldError } from "@/components/ui/field"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { deleteAdminProduct, getMe, getProducts } from "@/lib/api"
import { formatPrice } from "@/lib/format"

type AdminProduct = Awaited<ReturnType<typeof getProducts>>["products"][number]

export function AdminProductsScreen() {
  const { t, tp, locale } = useI18n()
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
          <ItemGroup className="gap-2 lg:grid lg:grid-cols-2">
            {products.map((product) => (
              <Item key={product.id} variant="muted" size="sm">
                <ItemMedia variant={product.imageDataUrl ? "image" : "icon"}>
                  <ProductThumbnail imageDataUrl={product.imageDataUrl} title={product.title} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>{product.title}</ItemTitle>
                  <ItemDescription>
                    {product.category || t("catalog.noCategory")} · {formatPrice(product.priceRub, locale)} ·{" "}
                    {product.deliveryType === "AUTO_KEY"
                      ? tp("catalog.keys", product.availableKeyCount || 0)
                      : t("catalog.manualDelivery")}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
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
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </ScreenBody>

      <AlertDialog
        open={Boolean(deleteProduct)}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteProduct(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("adminProducts.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("adminProducts.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMutation.error ? (
            <Field>
              <FieldError>
                {deleteMutation.error instanceof Error ? deleteMutation.error.message : t("adminProducts.deleteFailed")}
              </FieldError>
            </Field>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!deleteProduct || deleteMutation.isPending}
              onClick={() => {
                if (deleteProduct) deleteMutation.mutate(deleteProduct.id)
              }}
            >
              <Trash2 data-icon="inline-start" />
              {deleteMutation.isPending ? t("adminProducts.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  )
}

function ProductThumbnail({
  imageDataUrl,
  title,
}: {
  imageDataUrl?: string | null
  title: string
}) {
  if (imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageDataUrl} alt={title} />
    )
  }

  return <ImagePlus />
}

