"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ArrowRight, KeyRound, PackageOpen, Search, ShieldCheck } from "lucide-react"

import { getMe, getProducts } from "@/lib/api"
import { cn } from "@/lib/cn"
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
        title={meData?.settings.shopName || "snx.sell"}
        subtitle={meData?.settings.welcomeText || "Цифровые товары, лицензии и подписки."}
      />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_320px]">
        <section className="rounded-[1.75rem] border border-white/6 bg-[var(--color-panel)] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.22)]">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <span className="rounded-full border border-white/8 px-3 py-1">digital market</span>
            <span className="rounded-full border border-white/8 px-3 py-1">telegram first</span>
          </div>
          <h2 className="mt-4 max-w-xl text-[2rem] font-semibold tracking-[-0.05em] text-white md:text-[2.4rem]">
            Аккуратный маркет для ключей, лицензий и подписок.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Без длинных простыней текста. Выбираешь товар, открываешь тикет, оплачиваешь и получаешь доступ.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <FeaturePill icon={ShieldCheck} label="Надёжная выдача" />
            <FeaturePill icon={KeyRound} label="Автовыдача ключей" />
            <FeaturePill icon={PackageOpen} label="Поддержка в Telegram" />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/6 bg-[var(--color-panel-strong)] p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Быстрый поиск
          </p>
          <p className="mt-3 text-lg font-semibold text-white">Найди нужный софт</p>
          <div className="relative mt-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по программам и подпискам"
              className="h-14 w-full rounded-2xl border border-white/7 bg-transparent pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]/55"
            />
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Одинаково удобно в Telegram, на телефоне и на десктопе.
          </p>
        </section>
      </div>

      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <div>
            <p className="text-lg font-semibold text-white">Каталог</p>
            <p className="text-sm text-[var(--color-muted)]">
              {products.length > 0 ? `${products.length} позиций в продаже` : "Пока без активных позиций"}
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-white/8 bg-[var(--color-panel)] px-6 py-14 text-center">
            <p className="text-2xl font-semibold tracking-[-0.04em] text-white">Каталог скоро наполнится</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">
              Как только в админке добавят товары, здесь появятся карточки с ценой, выдачей и быстрым переходом в покупку.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="enter-card group overflow-hidden rounded-[1.75rem] border border-white/6 bg-[var(--color-panel)] p-5 transition-transform duration-200 hover:-translate-y-0.5"
                style={{ ["--stagger" as string]: `${Math.min(index, 8) * 32}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      {product.category || "subscription"}
                    </p>
                    <h3 className="mt-2 line-clamp-2 text-xl font-semibold tracking-[-0.04em] text-white">
                      {product.title}
                    </h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                      product.deliveryType === "AUTO_KEY"
                        ? "bg-[var(--color-accent)]/16 text-[var(--tg-accent-text-color)]"
                        : "bg-white/6 text-[var(--color-muted)]",
                    )}
                  >
                    {product.deliveryType === "AUTO_KEY" ? "Авто" : "Вручную"}
                  </span>
                </div>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">
                  {product.description}
                </p>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                      {product.priceRub.toLocaleString("ru-RU")} ₽
                    </p>
                    {product.deliveryType === "AUTO_KEY" ? (
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Ключей доступно: {product.availableKeyCount ?? 0}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-[var(--color-muted)]">Выдача после подтверждения</p>
                    )}
                  </div>
                  <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-soft)] text-white transition-transform duration-200 group-hover:translate-x-0.5">
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Screen>
  )
}

function FeaturePill({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck
  label: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-soft)] text-white">
        <Icon size={18} />
      </div>
      <span className="text-sm font-medium text-white">{label}</span>
    </div>
  )
}
