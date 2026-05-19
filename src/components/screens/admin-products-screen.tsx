"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { Screen, ScreenHeader } from "@/components/screen"

const emptyForm = {
  id: "",
  title: "",
  category: "",
  description: "",
  priceRub: "0",
  deliveryType: "MANUAL" as "MANUAL" | "AUTO_KEY",
  keyPoolText: "",
  isActive: true,
}

export function AdminProductsScreen() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const [form, setForm] = useState(emptyForm)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        priceRub: Number(form.priceRub),
        deliveryType: form.deliveryType,
        keyPoolText: form.keyPoolText,
        isActive: form.isActive,
      }

      if (form.id) return updateAdminProduct(form.id, payload)
      return saveAdminProduct(payload)
    },
    onSuccess: async () => {
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  return (
    <Screen>
      <ScreenHeader title="Товары" subtitle="Каталог и выдача ключей" />

      <div className="grid gap-3 px-4 pb-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3">
          {(data?.products ?? []).map((product) => (
            <div key={product.id} className="rounded-2xl bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">{product.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {product.category || "Без категории"} · {product.priceRub.toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                  {product.deliveryType === "AUTO_KEY" ? "Авто" : "Вручную"}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">
                {product.description}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    setForm({
                      id: product.id,
                      title: product.title,
                      category: product.category || "",
                      description: product.description,
                      priceRub: String(product.priceRub),
                      deliveryType: product.deliveryType,
                      keyPoolText: "",
                      isActive: product.isActive,
                    })
                  }
                  className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">
            {form.id ? "Редактирование" : "Новый товар"}
          </p>
          <div className="mt-3 grid gap-3">
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Название"
              className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
            />
            <input
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Категория"
              className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
            />
            <input
              value={form.priceRub}
              type="number"
              onChange={(event) => setForm((prev) => ({ ...prev, priceRub: event.target.value }))}
              placeholder="Цена"
              className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
            />
            <div className="flex rounded-full bg-[var(--color-bg)] p-1">
              {(["MANUAL", "AUTO_KEY"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setForm((prev) => ({ ...prev, deliveryType: type }))}
                  className={`flex-1 rounded-full px-4 py-2 text-sm ${form.deliveryType === type ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]" : "text-[var(--color-muted)]"}`}
                >
                  {type === "MANUAL" ? "Ручная" : "Автовыдача"}
                </button>
              ))}
            </div>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Описание"
              className="min-h-28 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
            />
            {form.deliveryType === "AUTO_KEY" ? (
              <textarea
                value={form.keyPoolText}
                onChange={(event) => setForm((prev) => ({ ...prev, keyPoolText: event.target.value }))}
                placeholder="Один ключ на строку"
                className="min-h-28 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
            ) : null}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
            >
              {mutation.isPending ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </Screen>
  )
}
