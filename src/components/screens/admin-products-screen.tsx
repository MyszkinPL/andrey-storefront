"use client"

import type { Dispatch, SetStateAction } from "react"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CopyPlus,
  ImagePlus,
  KeyRound,
  PackagePlus,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getMe, getProduct, getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"

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
      <ScreenHeader
        title="Товары"
        subtitle={`${products.length} в каталоге`}
        trailing={
          <Button size="sm" onClick={openCreateEditor}>
            <PackagePlus data-icon="inline-start" />
            Новый
          </Button>
        }
      />

      <ScreenBody>
        {products.length === 0 ? (
          <Card>
            <CardContent>
              <Empty>
                <EmptyMedia variant="icon">
                  <PackagePlus />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Товаров пока нет</EmptyTitle>
                  <EmptyDescription>Создай первую карточку магазина.</EmptyDescription>
                </EmptyHeader>
                <Button onClick={openCreateEditor}>Создать товар</Button>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <ItemGroup className="gap-2 lg:grid lg:grid-cols-2">
            {products.map((product) => (
              <Item key={product.id} variant="muted" size="sm">
                <ItemMedia variant={product.imageDataUrl ? "image" : "icon"}>
                    <ProductThumbnail imageDataUrl={product.imageDataUrl} title={product.title} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>{product.title}</ItemTitle>
                  <ItemDescription>
                    {product.category || "Без категории"} · {product.priceRub.toLocaleString("ru-RU")} ₽ ·{" "}
                    {renderDelivery(product)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {!product.isActive ? <Badge variant="secondary">Скрыт</Badge> : null}
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Править товар"
                    onClick={() => openEditEditor(product)}
                  >
                    <PencilLine />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Скопировать товар"
                    onClick={() => openDuplicateEditor(product)}
                  >
                    <CopyPlus />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </ScreenBody>

      <ProductEditorDialog
        open={isEditorOpen}
        form={form}
        categoryOptions={categoryOptions}
        uploading={uploading}
        saving={mutation.isPending}
        onClose={closeEditor}
        onSave={() => mutation.mutate()}
        onImageChange={handleImageChange}
        onChange={setForm}
      />
    </Screen>
  )
}

function ProductEditorDialog({
  open,
  form,
  categoryOptions,
  uploading,
  saving,
  onClose,
  onSave,
  onImageChange,
  onChange,
}: {
  open: boolean
  form: ProductForm
  categoryOptions: string[]
  uploading: boolean
  saving: boolean
  onClose: () => void
  onSave: () => void
  onImageChange: (file: File | null) => void
  onChange: Dispatch<SetStateAction<ProductForm>>
}) {
  const { data: productData } = useQuery({
    queryKey: ["admin-product", form.id],
    queryFn: () => getProduct(form.id),
    enabled: Boolean(form.id && open),
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving && !nextOpen) onClose()
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Редактирование товара" : "Новый товар"}</DialogTitle>
          <DialogDescription>Карточка, выдача и пул ключей.</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Card size="sm">
            <CardHeader>
              <ProductCoverPreview imageDataUrl={form.imageDataUrl} title={form.title || "Товар"} />
              <CardTitle>Обложка</CardTitle>
              <CardDescription>
                {uploading ? "Обработка изображения..." : "Квадратная картинка товара"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => onImageChange(event.currentTarget.files?.[0] || null)}
              />
            </CardContent>
          </Card>

          <Field>
            <FieldLabel>Название</FieldLabel>
            <Input
              value={form.title}
              onChange={(event) => onChange((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="DRIP LITE LIFETIME"
            />
          </Field>

          <Field>
            <FieldLabel>Категория</FieldLabel>
            <Input
              value={form.category}
              onChange={(event) => onChange((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Новая или существующая"
            />
            {categoryOptions.length > 0 ? (
              <ToggleGroup
                value={form.category.trim() ? [form.category.trim()] : []}
                onValueChange={(value) => onChange((prev) => ({ ...prev, category: value[0] || "" }))}
                variant="outline"
                size="sm"
                className="flex-wrap"
              >
                {categoryOptions.map((category) => (
                  <ToggleGroupItem
                    key={category}
                    value={category}
                  >
                    {category}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}
          </Field>

          <Field>
            <FieldLabel>Цена, RUB</FieldLabel>
            <Input
              value={form.priceRub}
              type="number"
              onChange={(event) => onChange((prev) => ({ ...prev, priceRub: event.target.value }))}
              placeholder="4990"
            />
          </Field>

          <Field>
            <FieldLabel>Описание</FieldLabel>
            <Textarea
              value={form.description}
              onChange={(event) => onChange((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Краткое описание товара"
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel>Показывать в магазине</FieldLabel>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => onChange((prev) => ({ ...prev, isActive: checked }))}
            />
          </Field>

          <Tabs value={form.deliveryType} onValueChange={(value) => onChange((prev) => ({ ...prev, deliveryType: value as ProductForm["deliveryType"] }))}>
            <TabsList className="w-full">
              <TabsTrigger value="MANUAL">Ручная выдача</TabsTrigger>
              <TabsTrigger value="AUTO_KEY">Автоключи</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Характеристики</CardTitle>
              <CardAction>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onChange((prev) => ({
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
                  onChange={onChange}
                />
              ))}
            </CardContent>
          </Card>

          {form.deliveryType === "AUTO_KEY" ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Пул ключей</CardTitle>
                <CardDescription>Новые ключи добавляются по одному на строку.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {form.id ? (
                  <>
                    <FieldDescription>
                      {visibleKeys.length} ключей в наличии
                      {form.removeKeyIds.length > 0 ? ` · к удалению ${form.removeKeyIds.length}` : ""}
                    </FieldDescription>
                    {visibleKeys.map((key) => (
                      <Field key={key.id} orientation="horizontal">
                        <KeyRound className="size-4 text-muted-foreground" />
                        <Input readOnly value={key.value} />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onChange((prev) => ({
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
                  <FieldLabel>Добавить новые</FieldLabel>
                  <Textarea
                    value={form.keyPoolText}
                    onChange={(event) => onChange((prev) => ({ ...prev, keyPoolText: event.target.value }))}
                    placeholder="Один ключ на строку"
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button disabled={!canSave} onClick={onSave}>
            {saving ? "Сохраняю..." : form.id ? "Сохранить изменения" : "Создать товар"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function ProductThumbnail({
  imageDataUrl,
  title,
}: {
  imageDataUrl?: string | null
  title: string
}) {
  if (imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageDataUrl} alt={title} />
    )
  }

  return <ImagePlus />
}

function renderDelivery(product: Awaited<ReturnType<typeof getProducts>>["products"][number]) {
  if (product.deliveryType === "AUTO_KEY") {
    return `${product.availableKeyCount || 0} ключей`
  }

  return "ручная выдача"
}

function ProductCoverPreview({
  imageDataUrl,
  title,
}: {
  imageDataUrl?: string | null
  title: string
}) {
  return (
    <AspectRatio ratio={1} className="mx-auto w-full max-w-64 overflow-hidden">
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
