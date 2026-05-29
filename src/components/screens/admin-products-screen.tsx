"use client"

import Image from "next/image"
import type { Dispatch, SetStateAction } from "react"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Cell,
  FileInput,
  Image as TgImage,
  Input,
  Modal,
  Placeholder,
  Section,
  SegmentedControl,
  Switch,
  Textarea,
} from "@telegram-apps/telegram-ui"
import {
  CopyPlus,
  ImagePlus,
  KeyRound,
  PackagePlus,
  PencilLine,
  Plus,
  Trash2,
} from "lucide-react"

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
          <Button size="s" before={<PackagePlus size={14} />} onClick={openCreateEditor}>
            Новый
          </Button>
        }
      />

      <ScreenBody className="gap-3">
        {products.length === 0 ? (
          <Placeholder header="Товаров пока нет" description="Создай первую карточку магазина.">
            <PackagePlus size={32} />
            <Button size="m" onClick={openCreateEditor}>
              Создать товар
            </Button>
          </Placeholder>
        ) : (
          <Section header="Каталог">
            {products.map((product) => (
              <Cell
                key={product.id}
                multiline
                before={
                  <ProductImage
                    imageDataUrl={product.imageDataUrl}
                    title={product.title}
                    size={48}
                  />
                }
                subtitle={`${product.category || "Без категории"} · ${product.priceRub.toLocaleString("ru-RU")} ₽`}
                description={product.description}
                titleBadge={
                  !product.isActive ? (
                    <Badge type="number" mode="gray">
                      Скрыт
                    </Badge>
                  ) : undefined
                }
                after={
                  <div className="flex gap-2">
                    <Button
                      size="s"
                      mode="bezeled"
                      before={<PencilLine size={14} />}
                      onClick={() => openEditEditor(product)}
                    >
                      Править
                    </Button>
                    <Button
                      size="s"
                      mode="gray"
                      before={<CopyPlus size={14} />}
                      onClick={() => openDuplicateEditor(product)}
                    >
                      Копия
                    </Button>
                  </div>
                }
              >
                {product.title}
              </Cell>
            ))}
          </Section>
        )}
      </ScreenBody>

      <ProductEditorModal
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

function ProductEditorModal({
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
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!saving && !nextOpen) onClose()
      }}
      header={<Modal.Header>{form.id ? "Редактирование товара" : "Новый товар"}</Modal.Header>}
    >
      <Section header="Обложка">
        <Cell
          multiline
          before={
            <ProductImage imageDataUrl={form.imageDataUrl} title={form.title || "Товар"} size={96} />
          }
          subtitle={uploading ? "Обработка изображения..." : "Квадратная картинка товара"}
        >
          Изображение
        </Cell>
        <div className="px-4 pb-3">
          <FileInput
            label="Загрузить изображение"
            accept="image/*"
            onChange={(event) => onImageChange(event.currentTarget.files?.[0] || null)}
          />
        </div>
      </Section>

      <Section header="Карточка">
        <Input
          header="Название"
          value={form.title}
          onChange={(event) => onChange((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="DRIP LITE LIFETIME"
        />
        <Input
          header="Категория"
          value={form.category}
          onChange={(event) => onChange((prev) => ({ ...prev, category: event.target.value }))}
          placeholder="Новая или существующая"
        />
        {categoryOptions.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto px-4 py-2">
            {categoryOptions.map((category) => (
              <Button
                key={category}
                size="s"
                mode={form.category.trim() === category ? "filled" : "gray"}
                onClick={() => onChange((prev) => ({ ...prev, category }))}
              >
                {category}
              </Button>
            ))}
          </div>
        ) : null}
        <Input
          header="Цена, RUB"
          value={form.priceRub}
          type="number"
          onChange={(event) => onChange((prev) => ({ ...prev, priceRub: event.target.value }))}
          placeholder="4990"
        />
        <Textarea
          header="Описание"
          value={form.description}
          onChange={(event) => onChange((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Краткое описание товара"
        />
        <Cell after={<Switch checked={form.isActive} onChange={(event) => onChange((prev) => ({ ...prev, isActive: event.target.checked }))} />}>
          Показывать в магазине
        </Cell>
      </Section>

      <Section header="Выдача">
        <SegmentedControl>
          <SegmentedControl.Item
            selected={form.deliveryType === "MANUAL"}
            onClick={() => onChange((prev) => ({ ...prev, deliveryType: "MANUAL" }))}
          >
            Ручная
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={form.deliveryType === "AUTO_KEY"}
            onClick={() => onChange((prev) => ({ ...prev, deliveryType: "AUTO_KEY" }))}
          >
            Автоключи
          </SegmentedControl.Item>
        </SegmentedControl>
      </Section>

      <Section
        header="Характеристики"
        footer="Пустые строки не сохраняются и не показываются в карточке товара."
      >
        {form.specs.map((spec, index) => (
          <SpecEditor
            key={`${index}-${form.id || "new"}`}
            spec={spec}
            index={index}
            canRemove={form.specs.length > 1}
            onChange={onChange}
          />
        ))}
        <Cell
          after={
            <Button
              size="s"
              mode="bezeled"
              before={<Plus size={14} />}
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  specs: [...prev.specs, { label: "", value: "" }],
                }))
              }
            >
              Добавить
            </Button>
          }
        >
          Новый пункт
        </Cell>
      </Section>

      {form.deliveryType === "AUTO_KEY" ? (
        <Section header="Пул ключей" footer="Новые ключи добавляются по одному на строку.">
          {form.id ? (
            <>
              <Cell
                subtitle={
                  form.removeKeyIds.length > 0
                    ? `К удалению: ${form.removeKeyIds.length}`
                    : "Без изменений"
                }
              >
                {visibleKeys.length} ключей в наличии
              </Cell>
              {visibleKeys.map((key) => (
                <Cell
                  key={key.id}
                  multiline
                  before={<KeyRound size={18} />}
                  subtitle={<code className="break-all">{key.value}</code>}
                  after={
                    <Button
                      size="s"
                      mode="gray"
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          removeKeyIds: [...prev.removeKeyIds, key.id],
                        }))
                      }
                    >
                      Убрать
                    </Button>
                  }
                >
                  Ключ
                </Cell>
              ))}
            </>
          ) : null}
          <Textarea
            header="Добавить новые"
            value={form.keyPoolText}
            onChange={(event) => onChange((prev) => ({ ...prev, keyPoolText: event.target.value }))}
            placeholder="Один ключ на строку"
          />
        </Section>
      ) : null}

      <div className="grid gap-2 p-4">
        <Button stretched loading={saving} disabled={!canSave} onClick={onSave}>
          {form.id ? "Сохранить изменения" : "Создать товар"}
        </Button>
        <Button stretched mode="plain" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </Modal>
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
    <div className="grid gap-2 px-4 py-3">
      <Cell
        after={
          <Button
            size="s"
            mode="gray"
            before={<Trash2 size={14} />}
            onClick={() =>
              onChange((prev) => ({
                ...prev,
                specs: canRemove
                  ? prev.specs.filter((_, itemIndex) => itemIndex !== index)
                  : [{ label: "", value: "" }],
              }))
            }
          >
            Убрать
          </Button>
        }
      >
        Характеристика {index + 1}
      </Cell>
      <Input
        header="Название"
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
      <Input
        header="Значение"
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
    </div>
  )
}

function ProductImage({
  imageDataUrl,
  title,
  size,
}: {
  imageDataUrl?: string | null
  title: string
  size: 48 | 96
}) {
  if (imageDataUrl) {
    return (
      <TgImage
        size={size}
        src={imageDataUrl}
        alt=""
      />
    )
  }

  return (
    <TgImage
      size={size}
      alt=""
      fallbackIcon={title ? <span>{title.slice(0, 2).toUpperCase()}</span> : <ImagePlus size={20} />}
    />
  )
}
