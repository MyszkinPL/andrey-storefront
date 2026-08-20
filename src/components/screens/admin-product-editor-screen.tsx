"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, KeyRound, Plus, Trash2 } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
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
import { ImagePicker } from "@/components/image-picker"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useTranslate } from "@/components/i18n-provider"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { deleteAdminProduct, getMe, getProduct, getProducts, saveAdminProduct, updateAdminProduct } from "@/lib/api"
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
  /** Existing cover, shown as a preview. */
  imageUrl: string | null
  /** Set only when the admin picks a new file; null clears the cover. */
  imageDataUrl: string | null | undefined
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
  imageUrl: null,
  imageDataUrl: undefined,
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
  const t = useTranslate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
        imageUrl: product.imageUrl,
        imageDataUrl: undefined,
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
        imageDataUrl: form.imageDataUrl,
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

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminProduct(productId || ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["products"] })
      if (productId) await queryClient.invalidateQueries({ queryKey: ["admin-product-editor", productId] })
      router.replace("/admin/products")
    },
  })

  
  async function handleImageChange(file: File | null) {
    if (!file) return
    setUploading(true)
    try {
      const imageDataUrl = await optimizeSquareImage(file, 768)
      setForm((prev) => ({ ...prev, imageDataUrl, imageUrl: imageDataUrl }))
    } finally {
      setUploading(false)
    }
  }

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title={t("admin.deniedTitle")}
        description={t("adminProductEditor.deniedDescription")}
      />
    )
  }

  if (sourceProductId && productQuery.isLoading) {
    return (
      <ProductEditorState
        title={t("adminProductEditor.loadingTitle")}
        description={t("adminProductEditor.loadingDescription")}
      />
    )
  }

  if (sourceProductId && productQuery.isError) {
    return (
      <ProductEditorState
        title={t("adminProductEditor.errorTitle")}
        description={t("adminProductEditor.errorDescription")}
      />
    )
  }

  return (
    <Screen noTabBar>
      <ScreenHeader
        back="/admin/products"
        title={
          productId
            ? t("adminProductEditor.editTitle")
            : copyProductId
              ? t("adminProductEditor.duplicateTitle")
              : t("adminProductEditor.newTitle")
        }
        subtitle={t("adminProductEditor.subtitle")}
        trailing={
          <div className="flex items-center gap-2">
            {productId ? (
              <Button
                size="sm"
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 data-icon="inline-start" />
                {t("common.delete")}
              </Button>
            ) : null}
            <Button size="sm" disabled={!canSave || mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <FieldGroup>
          {mutation.error ? (
            <Field>
              <FieldError>
                {mutation.error instanceof Error ? mutation.error.message : t("adminProductEditor.saveFailed")}
              </FieldError>
            </Field>
          ) : null}
          {deleteMutation.error ? (
            <Field>
              <FieldError>
                {deleteMutation.error instanceof Error ? deleteMutation.error.message : t("adminProducts.deleteFailed")}
              </FieldError>
            </Field>
          ) : null}

          <Card>
            <CardHeader>
              <ProductCoverPreview imageUrl={form.imageUrl} title={form.title || t("adminProductEditor.productFallback")} />
              <CardTitle>{t("adminProductEditor.cover")}</CardTitle>
              <CardDescription>
                {uploading
                  ? t("adminProductEditor.processingImage")
                  : t("adminProductEditor.coverHint")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImagePicker
                disabled={uploading}
                hasImage={Boolean(form.imageUrl)}
                id="product-cover"
                onClear={() =>
                  setForm((prev) => ({ ...prev, imageDataUrl: null, imageUrl: null }))
                }
                onSelect={handleImageChange}
              />
            </CardContent>
          </Card>

          <Field>
            <FieldLabel htmlFor="product-title">{t("adminProductEditor.name")}</FieldLabel>
            <Input
              id="product-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="DRIP LITE LIFETIME"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="product-category">{t("adminProductEditor.category")}</FieldLabel>
            <Input
              id="product-category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder={t("adminProductEditor.categoryPlaceholder")}
            />
            {categoryOptions.length > 0 ? (
              <ToggleGroup
                className="flex flex-wrap gap-1.5"
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, category: value[0] || "" }))
                }
                size="sm"
                value={form.category.trim() ? [form.category.trim()] : []}
                variant="default"
              >
                {categoryOptions.map((category) => (
                  <ToggleGroupItem
                    className="shrink-0 rounded-full px-3"
                    key={category}
                    value={category}
                    variant="outline"
                  >
                    {category}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : null}
          </Field>

          <Field>
            <FieldLabel htmlFor="product-price">{t("adminProductEditor.price")}</FieldLabel>
            <Input
              id="product-price"
              value={form.priceRub}
              type="number"
              onChange={(event) => setForm((prev) => ({ ...prev, priceRub: event.target.value }))}
              placeholder="4990"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="product-description">{t("adminProductEditor.description")}</FieldLabel>
            <Textarea
              id="product-description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t("adminProductEditor.descriptionPlaceholder")}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="product-active">{t("adminProductEditor.showInShop")}</FieldLabel>
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
              <TabsTrigger value="MANUAL">{t("adminProductEditor.manualDelivery")}</TabsTrigger>
              <TabsTrigger value="AUTO_KEY">{t("adminProductEditor.autoKeys")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>{t("adminProductEditor.specs")}</CardTitle>
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
                  {t("adminProductEditor.add")}
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
                <CardTitle>{t("adminProductEditor.keyPool")}</CardTitle>
                <CardDescription>{t("adminProductEditor.keyPoolHint")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {productId ? (
                  <>
                    {/* Base UI field parts need a Field.Root ancestor. */}
                    <Field>
                      <FieldDescription>
                        {t("adminProductEditor.keysInStock", {
                          count: visibleKeys.length,
                        })}
                        {form.removeKeyIds.length > 0
                          ? t("adminProductEditor.pendingRemoval", {
                              count: form.removeKeyIds.length,
                            })
                          : ""}
                      </FieldDescription>
                    </Field>
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
                          {t("adminProductEditor.removeKey")}
                        </Button>
                      </Field>
                    ))}
                  </>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="product-key-pool">{t("adminProductEditor.addNewKeys")}</FieldLabel>
                  <Textarea
                    id="product-key-pool"
                    value={form.keyPoolText}
                    onChange={(event) => setForm((prev) => ({ ...prev, keyPoolText: event.target.value }))}
                    placeholder={t("adminProductEditor.keyPlaceholder")}
                  />
                </Field>
              </CardContent>
            </Card>
          ) : null}
        </FieldGroup>
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={
          deleteMutation.isPending ? t("adminProducts.deleting") : t("common.delete")
        }
        confirmVariant="destructive"
        description={t("adminProducts.deleteDescription")}
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title={t("adminProducts.deleteTitle")}
      />
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
  const t = useTranslate()

  return (
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldTitle>{t("adminProductEditor.specLabel", { index: index + 1 })}</FieldTitle>
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
          {t("adminProductEditor.removeKey")}
        </Button>
      </Field>
      <Field>
        <Input
          aria-label={t("adminProductEditor.specName")}
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
          aria-label={t("adminProductEditor.specValue")}
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
  imageUrl,
  title,
}: {
  imageUrl?: string | null
  title: string
}) {
  return (
    <div className="mx-auto aspect-square w-full max-w-48 overflow-hidden">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <ImagePlus />
          </EmptyMedia>
        </Empty>
      )}
    </div>
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
