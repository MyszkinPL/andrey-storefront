"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, KeyRound, Plus, Trash2 } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton } from "@/hooks/use-telegram"
import { getMe, getProduct, getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"

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

export function AdminProductEditorScreen({
  productId,
  copyProductId,
}: {
  productId?: string
  copyProductId?: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const sourceProductId = productId || copyProductId || ""

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: productsData } = useQuery({ queryKey: ["products"], queryFn: getProducts })
  const productQuery = useQuery({
    queryKey: ["admin-product-editor", sourceProductId],
    queryFn: () => getProduct(sourceProductId),
    enabled: Boolean(sourceProductId),
    staleTime: Number.POSITIVE_INFINITY,
  })

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set((productsData?.products ?? []).map((product) => product.category?.trim()).filter(Boolean)),
      ) as string[],
    [productsData?.products],
  )

  useEffect(() => {
    if (!productQuery.data?.product) return
    const product = productQuery.data.product
    queueMicrotask(() => {
      setForm({
        id: productId ? product.id : "",
        title: copyProductId ? `${product.title} copy` : product.title,
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
    })
  }, [copyProductId, productId, productQuery.data?.product])

  const editableKeys = productQuery.data?.product.editableKeys ?? []
  const visibleKeys = editableKeys.filter((key) => !form.removeKeyIds.includes(key.id))
  const canSave =
    form.title.trim().length > 0 &&
    form.description.trim().length > 0 &&
    Number(form.priceRub) >= 0 &&
    !uploading

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

      if (productId) return updateAdminProduct(productId, payload)
      return saveAdminProduct(payload)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      if (productId) await queryClient.invalidateQueries({ queryKey: ["admin-product-editor", productId] })
      router.replace("/admin/products")
    },
  })

  useBackButton(() => router.push("/admin/products"))

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
      <AccessStateScreen
        title="Доступ закрыт"
        description="Редактор товаров доступен только админу."
      />
    )
  }

  if (sourceProductId && productQuery.isLoading) {
    return <ProductEditorState title="Загружаю товар" description="Подтягиваю карточку и ключи." />
  }

  if (sourceProductId && productQuery.isError) {
    return <ProductEditorState title="Товар не загрузился" description="Вернись к списку и попробуй ещё раз." />
  }

  return (
    <Screen noTabBar>
      <ScreenHeader
        title={productId ? "Редактирование" : copyProductId ? "Дубликат товара" : "Новый товар"}
        subtitle="Карточка, выдача и ключи"
        trailing={
          <Button size="sm" disabled={!canSave || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Сохраняю..." : "Сохранить"}
          </Button>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <FieldGroup>
          {mutation.error ? (
            <Field>
              <FieldError>
                {mutation.error instanceof Error ? mutation.error.message : "Товар не сохранился"}
              </FieldError>
            </Field>
          ) : null}

          <Card>
            <CardHeader>
              <ProductCoverPreview imageDataUrl={form.imageDataUrl} title={form.title || "Товар"} />
              <CardTitle>Обложка</CardTitle>
              <CardDescription>
                {uploading ? "Обработка изображения..." : "Квадратная картинка товара"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                id="product-cover"
                type="file"
                accept="image/*"
                onChange={(event) => handleImageChange(event.currentTarget.files?.[0] || null)}
              />
            </CardContent>
          </Card>

          <Field>
            <FieldLabel htmlFor="product-title">Название</FieldLabel>
            <Input
              id="product-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="DRIP LITE LIFETIME"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="product-category">Категория</FieldLabel>
            <Input
              id="product-category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Новая или существующая"
            />
            {categoryOptions.length > 0 ? (
              <ToggleGroup
                value={form.category.trim() ? [form.category.trim()] : []}
                onValueChange={(value) => setForm((prev) => ({ ...prev, category: value[0] || "" }))}
                variant="outline"
                size="sm"
                className="flex-wrap"
              >
                {categoryOptions.map((category) => (
                  <ToggleGroupItem key={category} value={category}>
                    {category}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="product-price">Цена, RUB</FieldLabel>
            <Input
              id="product-price"
              value={form.priceRub}
              type="number"
              onChange={(event) => setForm((prev) => ({ ...prev, priceRub: event.target.value }))}
              placeholder="4990"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="product-description">Описание</FieldLabel>
            <Textarea
              id="product-description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Краткое описание товара"
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="product-active">Показывать в магазине</FieldLabel>
            <Switch
              id="product-active"
              checked={form.isActive}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            />
          </Field>

          <Tabs
            value={form.deliveryType}
            onValueChange={(value) => setForm((prev) => ({ ...prev, deliveryType: value as ProductForm["deliveryType"] }))}
          >
            <TabsList className="w-full">
              <TabsTrigger value="MANUAL">Ручная выдача</TabsTrigger>
              <TabsTrigger value="AUTO_KEY">Автоключи</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Характеристики</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      specs: [...prev.specs, { label: "", value: "" }],
                    }))
                  }
                >
                  <Plus data-icon="inline-start" />
                  Добавить
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {form.specs.map((spec, index) => (
                <SpecEditor
                  key={`${index}-${form.id || "new"}`}
                  spec={spec}
                  index={index}
                  canRemove={form.specs.length > 1}
                  onChange={setForm}
                />
              ))}
            </CardContent>
          </Card>

          {form.deliveryType === "AUTO_KEY" ? (
            <Card>
              <CardHeader>
                <CardTitle>Пул ключей</CardTitle>
                <CardDescription>Новые ключи добавляются по одному на строку.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {productId ? (
                  <>
                    <FieldDescription>
                      {visibleKeys.length} ключей в наличии
                      {form.removeKeyIds.length > 0 ? ` · к удалению ${form.removeKeyIds.length}` : ""}
                    </FieldDescription>
                    {visibleKeys.map((key) => (
                      <Field key={key.id} orientation="horizontal">
                        <KeyRound />
                        <Input readOnly value={key.value} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              removeKeyIds: [...prev.removeKeyIds, key.id],
                            }))
                          }
                        >
                          Убрать
                        </Button>
                      </Field>
                    ))}
                  </>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="product-key-pool">Добавить новые</FieldLabel>
                  <Textarea
                    id="product-key-pool"
                    value={form.keyPoolText}
                    onChange={(event) => setForm((prev) => ({ ...prev, keyPoolText: event.target.value }))}
                    placeholder="Один ключ на строку"
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}
        </FieldGroup>
      </ScreenBody>
    </Screen>
  )
}

function SpecEditor({
  spec,
  index,
  canRemove,
  onChange,
}: {
  spec: SpecForm
  index: number
  canRemove: boolean
  onChange: Dispatch<SetStateAction<ProductForm>>
}) {
  return (
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldTitle>Характеристика {index + 1}</FieldTitle>
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange((prev) => ({
              ...prev,
              specs: canRemove
                ? prev.specs.filter((_, itemIndex) => itemIndex !== index)
                : [{ label: "", value: "" }],
            }))
          }
        >
          <Trash2 data-icon="inline-start" />
          Убрать
        </Button>
      </Field>
      <Field>
        <Input
          id={`product-spec-label-${index}`}
          value={spec.label}
          onChange={(event) =>
            onChange((prev) => ({
              ...prev,
              specs: prev.specs.map((item, itemIndex) =>
                itemIndex === index ? { ...item, label: event.target.value } : item,
              ),
            }))
          }
          placeholder="Support versions"
        />
      </Field>
      <Field>
        <Input
          id={`product-spec-value-${index}`}
          value={spec.value}
          onChange={(event) =>
            onChange((prev) => ({
              ...prev,
              specs: prev.specs.map((item, itemIndex) =>
                itemIndex === index ? { ...item, value: event.target.value } : item,
              ),
            }))
          }
          placeholder="1.8.9 - 1.21.4"
        />
      </Field>
    </FieldGroup>
  )
}

function ProductCoverPreview({
  imageDataUrl,
  title,
}: {
  imageDataUrl?: string | null
  title: string
}) {
  return (
    <AspectRatio ratio={1} className="mx-auto w-full max-w-48 overflow-hidden">
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageDataUrl} alt={title} className="size-full object-cover" />
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <ImagePlus />
          </EmptyMedia>
        </Empty>
      )}
    </AspectRatio>
  )
}

function ProductEditorState({ title, description }: { title: string; description: string }) {
  return (
    <Screen noTabBar>
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </Screen>
  )
}
