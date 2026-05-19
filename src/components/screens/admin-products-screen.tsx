"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Cell, Checkbox, Placeholder, Section, SegmentedControl, Subheadline, Title } from "@telegram-apps/telegram-ui"

import { getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { Badge, Button, Input, Textarea } from "@/components/ui"
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

      <Section header="Каталог">
        {(data?.products || []).length === 0 ? (
          <Placeholder
            header="Товаров пока нет"
            description="Добавь первую подписку или продукт через форму ниже."
          />
        ) : null}

        {(data?.products || []).map((product) => (
          <div key={product.id}>
            <Cell
              multiline
              subtitle={`${product.category || "Без категории"} · ${product.priceRub.toLocaleString("ru-RU")} ₽`}
              description={product.description}
              after={
                <Badge>{product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная"}</Badge>
              }
            >
              <div className="min-w-0">
                <Title level="3">{product.title}</Title>
                <Subheadline level="2">
                  {product.isActive ? "Показывается в каталоге" : "Скрыт из каталога"}
                </Subheadline>
                {product.deliveryType === "AUTO_KEY" ? (
                  <Subheadline level="2">
                    Остаток ключей: {product.availableKeyCount ?? 0}
                  </Subheadline>
                ) : null}
              </div>
            </Cell>

            <div className="mt-2 flex flex-wrap gap-2 px-4 pb-3">
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
          </div>
        ))}
      </Section>

      <Section header={form.id ? "Редактировать товар" : "Новый товар"}>
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
        <div className="mt-2">
          <SegmentedControl>
            <SegmentedControl.Item
              selected={form.deliveryType === "MANUAL"}
              onClick={() => setForm((prev) => ({ ...prev, deliveryType: "MANUAL" }))}
            >
              Ручная
            </SegmentedControl.Item>
            <SegmentedControl.Item
              selected={form.deliveryType === "AUTO_KEY"}
              onClick={() => setForm((prev) => ({ ...prev, deliveryType: "AUTO_KEY" }))}
            >
              Автовыдача
            </SegmentedControl.Item>
          </SegmentedControl>
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
        <label className="mt-2 flex items-center gap-3">
          <Checkbox
            checked={form.isActive}
            onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
          />
          <span>Показывать в каталоге</span>
        </label>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} stretched className="mt-3">
          {mutation.isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </Section>
    </Screen>
  )
}
