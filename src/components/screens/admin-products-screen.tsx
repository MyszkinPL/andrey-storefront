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
import { deleteAdminProduct, getMe, getProducts } from "@/lib/api"

type AdminProduct = Awaited<ReturnType<typeof getProducts>>["products"][number]

export function AdminProductsScreen() {
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
        title="Доступ закрыт"
        description="Каталог продавца доступен только админу."
      />
    )
  }

  return (
    <Screen>
      <ScreenHeader
        title="Товары"
        subtitle={`${products.length} в каталоге`}
        trailing={
          <Link href="/admin/products/new" className={buttonVariants({ size: "sm" })}>
            <PackagePlus data-icon="inline-start" />
            Новый
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
                  <EmptyTitle>Товаров пока нет</EmptyTitle>
                  <EmptyDescription>Создай первую карточку магазина.</EmptyDescription>
                </EmptyHeader>
                <Link href="/admin/products/new" className={buttonVariants()}>
                  Создать товар
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
                    {product.category || "Без категории"} · {product.priceRub.toLocaleString("ru-RU")} ₽ ·{" "}
                    {renderDelivery(product)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {!product.isActive ? <Badge variant="secondary">Скрыт</Badge> : null}
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className={buttonVariants({ size: "icon-sm", variant: "secondary" })}
                    aria-label="Править товар"
                  >
                    <PencilLine />
                  </Link>
                  <Link
                    href={`/admin/products/new?copy=${product.id}`}
                    className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
                    aria-label="Скопировать товар"
                  >
                    <CopyPlus />
                  </Link>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    aria-label="Удалить товар"
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
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Удалить товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Карточка исчезнет из каталога. История заказов сохранит название, цену и уже выданные ключи.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteMutation.error ? (
            <Field>
              <FieldError>
                {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Товар не удалился"}
              </FieldError>
            </Field>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!deleteProduct || deleteMutation.isPending}
              onClick={() => {
                if (deleteProduct) deleteMutation.mutate(deleteProduct.id)
              }}
            >
              <Trash2 data-icon="inline-start" />
              {deleteMutation.isPending ? "Удаляю..." : "Удалить"}
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

function renderDelivery(product: AdminProduct) {
  if (product.deliveryType === "AUTO_KEY") {
    return `${product.availableKeyCount || 0} ключей`
  }

  return "ручная выдача"
}
