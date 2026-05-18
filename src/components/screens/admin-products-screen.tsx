"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { Button, Card, Input, Textarea } from "@/components/ui"
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
      <ScreenHeader title="Товары" subtitle="Каталог подписок и товаров с пулом ключей" />

      <div className="grid gap-3 px-4 pb-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="flex flex-col gap-3">
          {(data?.products || []).map((product) => (
            <Card key={product.id} className="space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{product.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {product.category || "Без категории"} ·{" "}
                    {product.deliveryType === "AUTO_KEY" ? "автовыдача" : "ручная выдача"}
                  </p>
                </div>
                <span className="text-sm text-[var(--color-accent)]">
                  {product.priceRub.toLocaleString("ru-RU")} ₽
                </span>
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-[var(--color-muted)]">
                {product.description}
              </p>
              {product.deliveryType === "AUTO_KEY" ? (
                <p className="text-xs text-[var(--color-muted)]">
                  Свободных ключей: {product.availableKeyCount ?? 0}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  variant="secondary"
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
                >
                  Редактировать
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    updateAdminProduct(product.id, {
                      title: product.title,
                      category: product.category || "",
                      description: product.description,
                      priceRub: product.priceRub,
                      deliveryType: product.deliveryType,
                      isActive: !product.isActive,
                    }).then(() => queryClient.invalidateQueries({ queryKey: ["products"] }))
                  }
                >
                  {product.isActive ? "Скрыть" : "Показать"}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="h-fit space-y-3 p-5">
          <p className="text-base font-semibold">{form.id ? "Редактировать товар" : "Новый товар"}</p>
          <Input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Название"
          />
          <Input
            value={form.category}
            onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            placeholder="Категория"
          />
          <Input
            value={form.priceRub}
            type="number"
            onChange={(event) => setForm((prev) => ({ ...prev, priceRub: event.target.value }))}
            placeholder="Цена"
          />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={form.deliveryType === "MANUAL" ? "primary" : "secondary"}
              onClick={() => setForm((prev) => ({ ...prev, deliveryType: "MANUAL" }))}
            >
              Ручная выдача
            </Button>
            <Button
              variant={form.deliveryType === "AUTO_KEY" ? "primary" : "secondary"}
              onClick={() => setForm((prev) => ({ ...prev, deliveryType: "AUTO_KEY" }))}
            >
              Автовыдача ключей
            </Button>
          </div>
          <Textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Описание"
          />
          {form.deliveryType === "AUTO_KEY" ? (
            <Textarea
              value={form.keyPoolText}
              onChange={(event) => setForm((prev) => ({ ...prev, keyPoolText: event.target.value }))}
              placeholder="Один ключ на строку. При редактировании сюда можно добавить новые ключи."
            />
          ) : null}
          <label className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            Показывать в каталоге
          </label>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
        </Card>
      </div>
    </Screen>
  )
}
