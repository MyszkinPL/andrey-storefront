"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { CopyPlus, ImagePlus, PackagePlus, PencilLine } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
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
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { getMe, getProducts } from "@/lib/api"

export function AdminProductsScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const products = useMemo(() => data?.products ?? [], [data?.products])

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
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </ScreenBody>
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

function renderDelivery(product: Awaited<ReturnType<typeof getProducts>>["products"][number]) {
  if (product.deliveryType === "AUTO_KEY") {
    return `${product.availableKeyCount || 0} ключей`
  }

  return "ручная выдача"
}
