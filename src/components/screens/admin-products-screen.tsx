"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  CopyPlus,
  ImagePlus,
  KeyRound,
  PackagePlus,
  PencilLine,
  Plus,
  Trash2,
  X,
} from "lucide-react"

import { getMe, getProduct, getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

type SpecForm = {
  label: string
  value: string
}

type ProductForm = {
  id: string
  title: string
  category: string
  description: string
  imageDataUrl: string
  priceRub: string
  deliveryType: "MANUAL" | "AUTO_KEY"
  keyPoolText: string
  removeKeyIds: string[]
  isActive: boolean
  specs: SpecForm[]
}

const emptyForm: ProductForm = {
  id: "",
  title: "",
  category: "",
  description: "",
  imageDataUrl: "",
  priceRub: "0",
  deliveryType: "MANUAL",
  keyPoolText: "",
  removeKeyIds: [],
  isActive: true,
  specs: [{ label: "", value: "" }],
}

export function AdminProductsScreen() {
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [uploading, setUploading] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || undefined,
        description: form.description.trim(),
        imageDataUrl: form.imageDataUrl || undefined,
        priceRub: Number(form.priceRub),
        deliveryType: form.deliveryType,
        keyPoolText: form.keyPoolText,
        removeKeyIds: form.removeKeyIds,
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
      closeEditor()
      await queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })

  const products = useMemo(() => data?.products ?? [], [data?.products])
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category?.trim()).filter(Boolean)),
      ) as string[],
    [products],
  )

  function closeEditor() {
    setForm(emptyForm)
    setIsEditorOpen(false)
  }

  function openCreateEditor() {
    setForm(emptyForm)
    setIsEditorOpen(true)
  }

  function openEditEditor(product: (typeof products)[number]) {
    setForm({
      id: product.id,
      title: product.title,
      category: product.category || "",
      description: product.description,
      imageDataUrl: product.imageDataUrl || "",
      priceRub: String(product.priceRub),
      deliveryType: product.deliveryType,
      keyPoolText: "",
      removeKeyIds: [],
      isActive: product.isActive,
      specs: product.specs.length > 0 ? product.specs : [{ label: "", value: "" }],
    })
    setIsEditorOpen(true)
  }

  function openDuplicateEditor(product: (typeof products)[number]) {
    setForm({
      ...emptyForm,
      title: `${product.title} copy`,
      category: product.category || "",
      description: product.description,
      imageDataUrl: product.imageDataUrl || "",
      priceRub: String(product.priceRub),
      deliveryType: product.deliveryType,
      removeKeyIds: [],
      specs: product.specs.length > 0 ? product.specs : [{ label: "", value: "" }],
    })
    setIsEditorOpen(true)
  }

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

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title="Доступ закрыт" subtitle="Каталог продавца доступен только админу." />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="Товары" subtitle="Каталог, карточки и параметры товара" />

      <div className="grid gap-4 px-4 pb-4">
        <section className="ui-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-[var(--color-text)]">
                Каталог товаров
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Товары отдельно, редактор отдельно. Без мусора в одном экране.
              </p>
            </div>

            <button
              onClick={openCreateEditor}
              className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
            >
              <PackagePlus size={16} />
              Новый товар
            </button>
          </div>
        </section>

        {products.length === 0 ? (
          <section className="ui-card flex min-h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
              <PackagePlus size={22} />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text)]">
                Товаров пока нет
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Создай первую карточку и она сразу появится в магазине.
              </p>
            </div>
            <button
              onClick={openCreateEditor}
              className="rounded-[18px] bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
            >
              Создать товар
            </button>
          </section>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {products.map((product) => (
              <article
                key={product.id}
                className="ui-card overflow-hidden p-3 sm:p-4"
              >
                <div className="grid gap-4 sm:grid-cols-[136px_minmax(0,1fr)]">
                  <div className="relative aspect-square overflow-hidden rounded-[22px] bg-[var(--color-bg)]">
                    {product.imageDataUrl ? (
                      <Image
                        src={product.imageDataUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[var(--color-muted)]">
                        <ImagePlus size={24} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-[var(--color-text)]">
                            {product.title}
                          </p>
                          {!product.isActive ? (
                            <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                              Скрыт
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--color-muted)]">
                          {product.category || "Без категории"} ·{" "}
                          {product.priceRub.toLocaleString("ru-RU")} ₽
                        </p>
                      </div>

                      <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                        {product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {product.deliveryType === "AUTO_KEY" ? (
                        <span className="rounded-full bg-[var(--color-accent)]/14 px-2.5 py-1 text-[11px] text-[var(--color-accent)]">
                          {product.availableKeyCount ?? 0} ключей
                        </span>
                      ) : (
                        <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]">
                          Ручная выдача
                        </span>
                      )}
                    </div>

                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-[var(--color-muted)]">
                      {product.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => openEditEditor(product)}
                        className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--color-bg)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)]"
                      >
                        <PencilLine size={14} />
                        Редактировать
                      </button>
                      <button
                        onClick={() => openDuplicateEditor(product)}
                        className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--color-bg)] px-3.5 py-2 text-sm font-medium text-[var(--color-muted)]"
                      >
                        <CopyPlus size={14} />
                        Дублировать
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isEditorOpen ? (
        <ProductEditorModal
          form={form}
          categoryOptions={categoryOptions}
          uploading={uploading}
          saving={mutation.isPending}
          onClose={closeEditor}
          onSave={() => mutation.mutate()}
          onImageChange={handleImageChange}
          onChange={setForm}
        />
      ) : null}
    </Screen>
  )
}

function ProductEditorModal({
  form,
  categoryOptions,
  uploading,
  saving,
  onClose,
  onSave,
  onImageChange,
  onChange,
}: {
  form: ProductForm
  categoryOptions: string[]
  uploading: boolean
  saving: boolean
  onClose: () => void
  onSave: () => void
  onImageChange: (file: File | null) => void
  onChange: React.Dispatch<React.SetStateAction<ProductForm>>
}) {
  const { data: productData } = useQuery({
    queryKey: ["admin-product", form.id],
    queryFn: () => getProduct(form.id),
    enabled: Boolean(form.id),
  })

  const editableKeys = productData?.product.editableKeys ?? []
  const visibleKeys = editableKeys.filter((key) => !form.removeKeyIds.includes(key.id))
  const canSave =
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    Number(form.priceRub) >= 0 &&
    !uploading &&
    !saving

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-0 sm:p-3 md:items-center md:p-6">
      <div className="ui-card flex h-[min(100dvh,1040px)] w-full max-w-5xl flex-col overflow-hidden rounded-b-none rounded-t-[28px] sm:h-[min(92vh,1040px)] sm:rounded-[32px]">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-5 sm:py-4">
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">
              {form.id ? "Редактирование товара" : "Новый товар"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)] sm:text-sm">
              Настройки карточки товара
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)] sm:size-10"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-4 sm:px-5 sm:py-4">
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <section className="grid content-start gap-4">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => onImageChange(event.target.files?.[0] || null)}
                />
                <div className="overflow-hidden rounded-[26px] bg-[var(--color-bg)]">
                  <div className="relative aspect-square">
                    {form.imageDataUrl ? (
                      <Image
                        src={form.imageDataUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="320px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-3 text-[var(--color-muted)]">
                        <ImagePlus size={24} />
                        <span className="text-sm">
                          {uploading ? "Обработка..." : "Загрузить квадрат"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </label>

              <div className="ui-card-soft p-4">
                <p className="text-sm font-medium text-[var(--color-text)]">Превью</p>
                <div className="mt-3 rounded-[22px] bg-[var(--color-surface)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                        {form.title || "Название товара"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        {form.category || "Категория"} ·{" "}
                        {Number(form.priceRub || 0).toLocaleString("ru-RU")} ₽
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
                      {form.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid content-start gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Название">
                  <input
                    value={form.title}
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder="DRIP LITE LIFETIME"
                    className="ui-input"
                  />
                </Field>

                <Field label="Категория">
                  <div className="grid gap-2">
                    <input
                      value={form.category}
                      onChange={(event) =>
                        onChange((prev) => ({ ...prev, category: event.target.value }))
                      }
                      placeholder="Новая или существующая категория"
                      className="ui-input"
                    />
                    {categoryOptions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categoryOptions.map((category) => {
                          const active = form.category.trim() === category

                          return (
                            <button
                              key={category}
                              type="button"
                              onClick={() =>
                                onChange((prev) => ({ ...prev, category }))
                              }
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs transition-colors",
                                active
                                  ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                                  : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                              )}
                            >
                              {category}
                            </button>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                </Field>

                <Field label="Цена">
                  <input
                    value={form.priceRub}
                    type="number"
                    onChange={(event) =>
                      onChange((prev) => ({ ...prev, priceRub: event.target.value }))
                    }
                    placeholder="4990"
                    className="ui-input"
                  />
                </Field>

                <Field label="Публикация">
                  <label className="flex h-[50px] items-center gap-3 rounded-2xl bg-[var(--color-bg)] px-4">
                    <input
                      checked={form.isActive}
                      onChange={(event) =>
                        onChange((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                      type="checkbox"
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    <span className="text-sm text-[var(--color-text)]">
                      Показывать в магазине
                    </span>
                  </label>
                </Field>
              </div>

              <div className="grid gap-2">
                <p className="px-1 text-sm font-medium text-[var(--color-text)]">Выдача</p>
                <div className="flex rounded-[22px] bg-[var(--color-bg)] p-1">
                  {(["MANUAL", "AUTO_KEY"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => onChange((prev) => ({ ...prev, deliveryType: type }))}
                      className={cn(
                        "flex-1 rounded-[18px] px-4 py-2.5 text-sm font-medium transition-colors",
                        form.deliveryType === type
                          ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                          : "text-[var(--color-muted)]",
                      )}
                    >
                      {type === "MANUAL" ? "Ручная выдача" : "Автовыдача ключей"}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Описание">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    onChange((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="Краткое и нормальное описание товара"
                  className="ui-input min-h-36"
                />
              </Field>

              <div className="ui-card-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      Характеристики
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Каждая строка станет отдельным пунктом в карточке товара.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onChange((prev) => ({
                        ...prev,
                        specs: [...prev.specs, { label: "", value: "" }],
                      }))
                    }
                    className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--color-bg)] px-3 py-2 text-sm font-medium text-[var(--color-text)]"
                  >
                    <Plus size={14} />
                    Добавить
                  </button>
                </div>

                <div className="mt-4 grid gap-2">
                  {form.specs.map((spec, index) => (
                    <div
                      key={`${index}-${form.id || "new"}`}
                      className="grid gap-2 sm:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)_44px]"
                    >
                      <input
                        value={spec.label}
                        onChange={(event) =>
                          onChange((prev) => ({
                            ...prev,
                            specs: prev.specs.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, label: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        placeholder="Название"
                        className="ui-input"
                      />
                      <input
                        value={spec.value}
                        onChange={(event) =>
                          onChange((prev) => ({
                            ...prev,
                            specs: prev.specs.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, value: event.target.value }
                                : item,
                            ),
                          }))
                        }
                        placeholder="Значение"
                        className="ui-input"
                      />
                      <button
                        onClick={() =>
                          onChange((prev) => ({
                            ...prev,
                            specs:
                              prev.specs.length === 1
                                ? [{ label: "", value: "" }]
                                : prev.specs.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                        className="flex h-[44px] items-center justify-center rounded-2xl bg-[var(--color-bg)] text-[var(--color-muted)] sm:h-[50px]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {form.deliveryType === "AUTO_KEY" ? (
                <div className="ui-card-soft p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        Пул ключей
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Добавляй новые ключи отдельно, старые можно убрать поштучно.
                      </p>
                    </div>
                    <div className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]">
                      {visibleKeys.length} в наличии
                    </div>
                  </div>

                  {form.id ? (
                    <div className="mt-4 grid gap-2">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        Текущие ключи
                      </p>
                      {visibleKeys.length > 0 ? (
                        <div className="grid gap-2 max-h-56 overflow-y-auto pr-1">
                          {visibleKeys.map((key) => (
                            <div
                              key={key.id}
                              className="flex items-center gap-2 rounded-[18px] bg-[var(--color-bg)] px-3 py-3"
                            >
                              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
                                <KeyRound size={14} />
                              </div>
                              <code className="min-w-0 flex-1 truncate text-xs text-[var(--color-text)]">
                                {key.value}
                              </code>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange((prev) => ({
                                    ...prev,
                                    removeKeyIds: [...prev.removeKeyIds, key.id],
                                  }))
                                }
                                className="rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-muted)]"
                              >
                                Убрать
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-[18px] bg-[var(--color-bg)] px-4 py-4 text-sm text-[var(--color-muted)]">
                          Активных ключей сейчас нет.
                        </div>
                      )}
                    </div>
                  ) : null}

                  {form.removeKeyIds.length > 0 ? (
                    <div className="mt-4 rounded-[18px] bg-[var(--color-bg)] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text)]">
                          <Check size={14} className="text-[var(--color-accent)]" />
                          Помечено на удаление: {form.removeKeyIds.length}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            onChange((prev) => ({ ...prev, removeKeyIds: [] }))
                          }
                          className="text-xs text-[var(--color-muted)]"
                        >
                          Сбросить
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-2">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
                      Добавить новые
                    </p>
                    <textarea
                      value={form.keyPoolText}
                      onChange={(event) =>
                        onChange((prev) => ({ ...prev, keyPoolText: event.target.value }))
                      }
                      placeholder="Один ключ на строку"
                      className="ui-input min-h-32"
                    />
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-5 sm:py-4">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-[18px] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)]"
            >
              Отмена
            </button>
            <button
              onClick={onSave}
              disabled={!canSave}
              className={cn(
                "rounded-[18px] px-4 py-2.5 text-sm font-semibold",
                canSave
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                  : "bg-[var(--color-bg)] text-[var(--color-muted)]",
              )}
            >
              {saving ? "Сохранение..." : form.id ? "Сохранить изменения" : "Создать товар"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="grid gap-2">
      <span className="px-1 text-sm font-medium text-[var(--color-text)]">{label}</span>
      {children}
    </label>
  )
}
