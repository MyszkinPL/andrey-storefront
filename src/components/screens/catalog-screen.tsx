"use client"

import { useMemo, useState } from "react"
import { Search, Sparkles } from "lucide-react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { getMe, getProducts } from "@/lib/api"
import { Badge, Card, Input } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"

export function CatalogScreen() {
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [search, setSearch] = useState("")

  const products = useMemo(() => {
    const list = productsData?.products ?? []
    const query = search.trim().toLowerCase()
    if (!query) return list.filter((item) => item.isActive)
    return list.filter(
      (item) =>
        item.isActive &&
        `${item.title} ${item.category || ""} ${item.description}`.toLowerCase().includes(query),
    )
  }, [productsData?.products, search])

  return (
    <Screen>
      <ScreenHeader
        title={meData?.settings.shopName || "Andrey Store"}
        subtitle={meData?.settings.welcomeText}
      />

      <div className="grid gap-4 px-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card className="rounded-[28px] p-5">
          <p className="text-2xl font-semibold">Подписки, лицензии и ключи</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Магазин работает как mini app в Telegram и как desktop storefront. Для key-based товаров поддерживается автовыдача после подтверждения оплаты.
          </p>
        </Card>
        <Card className="rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--color-accent)]/15 p-3 text-[var(--color-accent)]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-semibold">Desktop + Mobile</p>
              <p className="text-sm text-[var(--color-muted)]">Один UX для ПК, мобилки и Telegram.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 pt-4">
        <div className="glass-card flex items-center gap-3 rounded-[22px] px-4 py-3">
          <Search size={18} className="text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по программам и подпискам"
            className="border-0 bg-transparent px-0 py-0"
          />
        </div>
      </div>

      <section className="grid gap-3 px-4 pb-5 pt-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product, index) => (
          <Link key={product.id} href={`/product/${product.id}`}>
            <Card
              className="enter-card flex h-full flex-col gap-3 p-5"
              style={{ ["--stagger" as string]: `${index * 35}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">{product.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {product.category || "Software subscription"}
                  </p>
                </div>
                <Badge>
                  {product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная выдача"}
                </Badge>
              </div>
              <p className="line-clamp-4 text-sm leading-6 text-[var(--color-muted)]">
                {product.description}
              </p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div>
                  <span className="text-xl font-semibold">
                    {product.priceRub.toLocaleString("ru-RU")} ₽
                  </span>
                  {product.deliveryType === "AUTO_KEY" ? (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Остаток ключей: {product.availableKeyCount ?? 0}
                    </p>
                  ) : null}
                </div>
                <span className="text-sm text-[var(--color-accent)]">Открыть</span>
              </div>
            </Card>
          </Link>
        ))}
      </section>
    </Screen>
  )
}
