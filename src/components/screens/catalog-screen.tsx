"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PackageSearch, Search } from "lucide-react"

import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { Avatar } from "@/components/ui"
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

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (productsData?.products ?? []).filter((item) => {
      if (!item.isActive) return false
      const categoryOk = !category || category === "Все" || item.category === category
      const searchOk =
        !query ||
        `${item.title} ${item.category || ""} ${item.description} ${item.specs.map((spec) => `${spec.label} ${spec.value}`).join(" ")}`.toLowerCase().includes(query)
      return categoryOk && searchOk
    })
  }, [category, productsData?.products, search])

  return (
    <Screen>
      <ScreenHeader
        title={
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="snx.sell"
              width={40}
              height={40}
              className="size-10 shrink-0 object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold tracking-[-0.02em] text-[var(--color-text)]">
                snx.sell
              </p>
            </div>
          </div>
        }
        trailing={
          <div className="shrink-0">
            {meData?.user.photoUrl ? (
              <Avatar size={40} src={meData.user.photoUrl} alt={meData.user.firstName} />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[11px] font-semibold text-[var(--color-text)]">
                {(meData?.user.firstName || "S").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        }
      />

      <ScreenBody className="gap-4">
        <section className="ui-card p-3">
          <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
            <Search size={16} className="text-[var(--color-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по товарам и характеристикам"
              className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </label>

          <div className="mt-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
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
                      : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                  )}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </section>

        {filtered.length === 0 ? (
          <ScreenEmpty
            icon={<PackageSearch size={32} className="text-[var(--color-muted)]" />}
            title="Пусто"
            subtitle="Попробуй другую категорию или запрос."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:[grid-template-columns:repeat(auto-fill,minmax(196px,1fr))]">
            {filtered.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="ui-card enter-card overflow-hidden"
                style={{ ["--stagger" as string]: `${Math.min(index, 8) * 28}ms` }}
              >
                <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-2)]">
                  {product.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageDataUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-end bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_rgba(255,255,255,0.02)_58%)] p-3">
                      <div className="ui-pill bg-[var(--color-overlay)] text-[var(--color-text)]">
                        {product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная"}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 p-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-tight text-[var(--color-text)]">
                      {product.title}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                      {product.category || "digital"}
                    </p>
                  </div>

                  <div className="mt-auto flex items-end justify-between gap-2">
                    <p className="text-base font-semibold text-[var(--color-text)]">
                      {product.priceRub.toLocaleString("ru-RU")} ₽
                    </p>
                    <span className="text-[11px] text-[var(--color-accent)]">
                      {product.deliveryType === "AUTO_KEY" ? `${product.availableKeyCount ?? 0} keys` : "заказ"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ScreenBody>
    </Screen>
  )
}
