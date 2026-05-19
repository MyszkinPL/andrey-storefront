"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, Plus, Trash2 } from "lucide-react"

import { getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

type SpecForm = {
  label: string
  value: string
}

const emptyForm = {
  id: "",
  title: "",
  category: "",
  description: "",
  imageDataUrl: "",
  priceRub: "0",
  deliveryType: "MANUAL" as "MANUAL" | "AUTO_KEY",
  keyPoolText: "",
  isActive: true,
  specs: [{ label: "", value: "" }] as SpecForm[],
}

export function AdminProductsScreen() {
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        category: form.category || undefined,
        description: form.description,
        imageDataUrl: form.imageDataUrl || undefined,
        priceRub: Number(form.priceRub),
        deliveryType: form.deliveryType,
        keyPoolText: form.keyPoolText,
        isActive: form.isActive,
        specs: form.specs
          .map((spec) => ({
            label: spec.label.trim(),
            value: spec.value.trim(),
          }))
          .filter((spec) => spec.label && spec.value),
      }

      if (form.id) return updateAdminProduct(form.id, payload)
      return saveAdminProduct(payload)
    },
    onSuccess: async () => {
      setForm(emptyForm)
      await queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const products = useMemo(() => data?.products ?? [], [data?.products])

  async function handleImageChange(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const imageDataUrl = await optimizeSquareImage(file, 768)
      setForm((prev) => ({ ...prev, imageDataUrl }))
    } finally {
      setUploading(false)
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Товары" subtitle="Карточки, квадратные изображения и характеристики" />

      <div className="grid gap-3 px-4 pb-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-3">
          {products.map((product) => (
            <div key={product.id} className="overflow-hidden rounded-[24px] bg-[var(--color-surface)]">
              <div className="grid gap-3 p-3 sm:grid-cols-[116px_1fr]">
                <div className="aspect-square overflow-hidden rounded-[20px] bg-[var(--color-bg)]">
                  {product.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageDataUrl} alt="" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text)]">{product.title}</p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {product.category || "Без категории"} · {product.priceRub.toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                      {product.deliveryType === "AUTO_KEY" ? "Авто" : "Ручная"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {product.specs.slice(0, 3).map((spec) => (
                      <span
                        key={`${product.id}-${spec.label}`}
                        className="rounded-full bg-[var(--color-bg)] px-2 py-1 text-[10px] text-[var(--color-muted)]"
                      >
                        {spec.label}: {spec.value}
                      </span>
                    ))}
                    {product.deliveryType === "AUTO_KEY" ? (
                      <span className="rounded-full bg-[var(--color-bg)] px-2 py-1 text-[10px] text-[var(--color-accent)]">
                        {product.availableKeyCount ?? 0} keys
                      </span>
                    ) : null}
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
                          imageDataUrl: product.imageDataUrl || "",
                          priceRub: String(product.priceRub),
                          deliveryType: product.deliveryType,
                          keyPoolText: "",
                          isActive: product.isActive,
                          specs: product.specs.length > 0 ? product.specs : [{ label: "", value: "" }],
                        })
                      }
                      className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() =>
                        setForm({
                          ...emptyForm,
                          title: `${product.title} copy`,
                          category: product.category || "",
                          description: product.description,
                          imageDataUrl: product.imageDataUrl || "",
                          priceRub: String(product.priceRub),
                          deliveryType: product.deliveryType,
                          specs: product.specs.length > 0 ? product.specs : [{ label: "", value: "" }],
                        })
                      }
                      className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)]"
                    >
                      Дублировать
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-[28px] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">
              {form.id ? "Редактирование" : "Новый товар"}
            </p>
            <button
              onClick={() => setForm(emptyForm)}
              className="text-xs text-[var(--color-muted)]"
            >
              Сбросить
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="block">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageChange(event.target.files?.[0] || null)}
              />
              <div className="overflow-hidden rounded-[24px] bg-[var(--color-bg)]">
                <div className="aspect-square">
                  {form.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageDataUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <button
                      type="button"
                      className="flex size-full flex-col items-center justify-center gap-2 text-[var(--color-muted)]"
                    >
                      <ImagePlus size={22} />
                      <span className="text-xs">{uploading ? "Обработка..." : "Загрузить квадрат"}</span>
                    </button>
                  )}
                </div>
              </div>
            </label>

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
                  className={cn(
                    "flex-1 rounded-full px-4 py-2 text-sm",
                    form.deliveryType === type
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                      : "text-[var(--color-muted)]",
                  )}
                >
                  {type === "MANUAL" ? "Ручная" : "Автовыдача"}
                </button>
              ))}
            </div>

            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Описание"
              className="min-h-32 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
            />

            <div className="rounded-2xl bg-[var(--color-bg)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--color-text)]">Характеристики</p>
                <button
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      specs: [...prev.specs, { label: "", value: "" }],
                    }))
                  }
                  className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)]"
                >
                  <Plus size={12} className="inline-block" /> добавить
                </button>
              </div>

              <div className="mt-3 grid gap-2">
                {form.specs.map((spec, index) => (
                  <div key={`${index}-${form.id || "new"}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      value={spec.label}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          specs: prev.specs.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, label: event.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Название"
                      className="w-full rounded-2xl bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-text)] outline-none"
                    />
                    <input
                      value={spec.value}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          specs: prev.specs.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, value: event.target.value } : item,
                          ),
                        }))
                      }
                      placeholder="Значение"
                      className="w-full rounded-2xl bg-[var(--color-surface)] px-3 py-3 text-sm text-[var(--color-text)] outline-none"
                    />
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          specs:
                            prev.specs.length === 1
                              ? [{ label: "", value: "" }]
                              : prev.specs.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-[var(--color-muted)]"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {form.deliveryType === "AUTO_KEY" ? (
              <textarea
                value={form.keyPoolText}
                onChange={(event) => setForm((prev) => ({ ...prev, keyPoolText: event.target.value }))}
                placeholder="Один ключ на строку"
                className="min-h-28 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
            ) : null}

            <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] px-4 py-3">
              <input
                checked={form.isActive}
                onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                type="checkbox"
                className="size-4 accent-[var(--color-accent)]"
              />
              <span className="text-sm text-[var(--color-text)]">Показывать в магазине</span>
            </label>

            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || uploading}
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
