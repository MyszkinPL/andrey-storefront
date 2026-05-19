"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, PackageSearch } from "lucide-react"

import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { getMe, getProducts } from "@/lib/api"
import { cn } from "@/lib/cn"

export function CatalogScreen() {
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [category, setCategory] = useState("")
  const [search, setSearch] = useState("")

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of productsData?.products ?? []) {
      if (item.category) set.add(item.category)
    }
    return ["Все", ...Array.from(set)]
  }, [productsData?.products])

  const products = useMemo(() => {
    const list = (productsData?.products ?? []).filter((item) => item.isActive)
    const query = search.trim().toLowerCase()
    return list.filter((item) => {
      const categoryOk = !category || category === "Все" || item.category === category
      const searchOk =
        !query ||
        `${item.title} ${item.category || ""} ${item.description}`.toLowerCase().includes(query)
      return categoryOk && searchOk
    })
  }, [category, productsData?.products, search])

  return (
    <Screen>
      <ScreenHeader
        title="snx.sell"
        subtitle={meData?.settings.welcomeText || "Цифровые товары через Telegram"}
        trailing={
          <div className="flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-2 py-1.5 text-xs font-medium text-[var(--color-text)]">
            <Image src="/logo.svg" alt="snx.sell" width={20} height={20} className="size-5 object-contain" />
            <ChevronDown size={14} />
          </div>
        }
      />

      <div className="px-4 pb-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск"
          className="w-full rounded-2xl border border-white/5 bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]/40 transition-colors"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: "none" }}>
        {categories.map((item) => {
          const active = (category || "Все") === item
          return (
            <button
              key={item}
              onClick={() => setCategory(item === "Все" ? "" : item)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,transform] duration-150 active:scale-[0.96]",
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)]",
              )}
            >
              {item}
            </button>
          )
        })}
      </div>

      {products.length === 0 ? (
        <ScreenEmpty
          icon={<PackageSearch size={32} className="text-[var(--color-muted)]" />}
          title="Ничего не найдено"
          subtitle="Попробуй другой запрос или категорию."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
          {products.map((product, index) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="enter-card flex flex-col overflow-hidden rounded-2xl transition-transform duration-150 active:scale-[0.985]"
              style={{
                background: "var(--color-surface)",
                ["--stagger" as string]: `${Math.min(index, 8) * 30}ms`,
              }}
            >
              <div
                className="aspect-square w-full"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                }}
              />
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="line-clamp-2 text-sm font-medium leading-tight text-[var(--color-text)]">
                  {product.title}
                </p>
                <p className="text-xs text-[var(--color-muted)]">
                  {product.category || (product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная выдача")}
                </p>
                <p className="mt-auto text-base font-semibold text-[var(--color-text)]">
                  {product.priceRub.toLocaleString("ru-RU")} ₽
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Screen>
  )
}
