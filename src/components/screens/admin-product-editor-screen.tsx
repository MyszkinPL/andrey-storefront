"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CopyPlus, ImagePlus, Plus, Trash2 } from "lucide-react"
import {
  Banner,
  Button,
  Field,
  Input,
  SegmentedControl,
  Text,
  Textarea,
} from "sealui"

import { AccessStateScreen } from "@/components/access-state-screen"
import { ImagePicker } from "@/components/image-picker"
import { KeyPoolEditor, splitKeys } from "@/components/key-pool-editor"
import { LinkButton } from "@/components/link-button"
import {
  ActionStack,
  Screen,
  ScreenBody,
  ScreenHeader,
  ScreenState,
  Section,
  StickyActions,
} from "@/components/screen"
import { ToggleRow } from "@/components/toggle-row"
import { useI18n, useTranslate } from "@/components/i18n-provider"
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
  const { t } = useI18n()
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
      <ScreenState
        back="/admin/products"
        description={t("adminProductEditor.loadingDescription")}
        title={t("adminProductEditor.loadingTitle")}
      />
    )
  }

  if (sourceProductId && productQuery.isError) {
    return (
      <ScreenState
        back="/admin/products"
        description={t("adminProductEditor.errorDescription")}
        onRetry={() => productQuery.refetch()}
        title={t("adminProductEditor.errorTitle")}
      />
    )
  }

  const saveLabel = mutation.isPending ? t("common.saving") : t("common.save")
  const selectedCategory = form.category.trim()

  return (
    <Screen narrow noTabBar>
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
          <div className="shop-desktop-only">
            <Button disabled={!canSave || mutation.isPending} onClick={() => mutation.mutate()} size="sm">
              {saveLabel}
            </Button>
          </div>
        }
      />

      <ScreenBody>
        {mutation.error ? (
          <Banner
            title={mutation.error instanceof Error ? mutation.error.message : t("adminProductEditor.saveFailed")}
            variant="danger"
          />
        ) : null}
        {deleteMutation.error ? (
          <Banner
            title={
              deleteMutation.error instanceof Error ? deleteMutation.error.message : t("adminProducts.deleteFailed")
            }
            variant="danger"
          />
        ) : null}

        {/* The cover sits next to its picker, the way a profile photo does. */}
        <div className="shop-row">
          <ProductCoverPreview imageUrl={form.imageUrl} title={form.title || t("adminProductEditor.productFallback")} />
          <div className="shop-row-copy">
            <Text as="span" size="xs" tone="muted">
              {uploading ? t("adminProductEditor.processingImage") : t("adminProductEditor.coverHint")}
            </Text>
            <ImagePicker
              disabled={uploading}
              hasImage={Boolean(form.imageUrl)}
              id="product-cover"
              onClear={() => setForm((prev) => ({ ...prev, imageDataUrl: null, imageUrl: null }))}
              onSelect={handleImageChange}
            />
          </div>
        </div>

        <Section>
              <Field label={t("adminProductEditor.name")}>
                <Input
                  id="product-title"
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder={t("adminProductEditor.name")}
                  value={form.title}
                />
              </Field>

              <Field label={t("adminProductEditor.category")}>
                <Input
                  id="product-category"
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder={t("adminProductEditor.categoryPlaceholder")}
                  value={form.category}
                />
                {categoryOptions.length > 0 ? (
                  // Existing categories as a scrolling capsule: tapping one fills
                  // the input, tapping it again frees the input for a new name.
                  <div className="shop-scroll-x">
                    <SegmentedControl
                      aria-label={t("adminProductEditor.category")}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, category: value || "" }))}
                      options={categoryOptions.map((category) => ({ value: category, label: category }))}
                      size="sm"
                      value={categoryOptions.includes(selectedCategory) ? selectedCategory : ""}
                    />
                  </div>
                ) : null}
              </Field>

              <Field label={t("adminProductEditor.price")}>
                <Input
                  id="product-price"
                  inputMode="decimal"
                  min={0}
                  onChange={(event) => setForm((prev) => ({ ...prev, priceRub: event.target.value }))}
                  placeholder="4990"
                  type="number"
                  value={form.priceRub}
                />
              </Field>

              <Field label={t("adminProductEditor.description")}>
                <Textarea
                  id="product-description"
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={t("adminProductEditor.descriptionPlaceholder")}
                  value={form.description}
                />
              </Field>

          <ToggleRow
            checked={form.isActive}
            id="product-active"
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
            title={t("adminProductEditor.showInShop")}
          />
        </Section>

        {/* How the product is delivered decides whether a key pool exists,
            so the two sit together. */}
        <Section title={t("adminProductEditor.delivery")}>
          <SegmentedControl
            aria-label={t("adminProductEditor.subtitle")}
            onValueChange={(value) => {
              // Base UI lets a toggle group drop its only value; delivery type
              // must always be one of the two.
              if (value === "MANUAL" || value === "AUTO_KEY") {
                setForm((prev) => ({ ...prev, deliveryType: value }))
              }
            }}
            options={[
              { value: "MANUAL", label: t("adminProductEditor.manualDelivery") },
              { value: "AUTO_KEY", label: t("adminProductEditor.autoKeys") },
            ]}
            value={form.deliveryType}
            variant="tabs"
          />
        </Section>

        {form.deliveryType === "AUTO_KEY" ? (
          <KeyPoolEditor
            existing={editableKeys}
            onPendingChange={(keys) => setForm((prev) => ({ ...prev, keyPoolText: keys.join("\n") }))}
            onRemovedIdsChange={(ids) => setForm((prev) => ({ ...prev, removeKeyIds: ids }))}
            pending={splitKeys(form.keyPoolText)}
            removedIds={form.removeKeyIds}
          />
        ) : null}

        <Section
          action={
            <Button
              icon={<Plus size={16} aria-hidden />}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  specs: [...prev.specs, { label: "", value: "" }],
                }))
              }
              size="sm"
              variant="secondary"
            >
              {t("adminProductEditor.add")}
            </Button>
          }
          title={t("adminProductEditor.specs")}
        >
          {form.specs.map((spec, index) => (
            <SpecEditor
              key={`${index}-${form.id || "new"}`}
              spec={spec}
              index={index}
              canRemove={form.specs.length > 1}
              onChange={setForm}
            />
          ))}
        </Section>

        {/* Deleting sits at the foot of the page, away from Save. */}
        {productId ? (
          <ActionStack>
            <LinkButton
              fullWidth
              href={`/admin/products/new?copy=${productId}`}
              icon={<CopyPlus size={16} aria-hidden />}
              variant="secondary"
            >
              {t("adminProducts.duplicate")}
            </LinkButton>
            <Button
              disabled={deleteMutation.isPending}
              fullWidth
              icon={<Trash2 size={16} aria-hidden />}
              onClick={() => setDeleteOpen(true)}
              variant="outline"
            >
              {t("adminProducts.remove")}
            </Button>
          </ActionStack>
        ) : null}

        <StickyActions>
          <Button disabled={!canSave || mutation.isPending} onClick={() => mutation.mutate()} size="lg">
            {saveLabel}
          </Button>
        </StickyActions>
      </ScreenBody>

      <ResponsiveDialog
        confirmLabel={deleteMutation.isPending ? t("adminProducts.deleting") : t("common.delete")}
        confirmVariant="danger"
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

  const update = (field: "label" | "value", value: string) =>
    onChange((prev) => ({
      ...prev,
      specs: prev.specs.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))

  // Name, value and the bin on one line: a spec is a pair, and a caption
  // "Характеристика 1" above every pair only made the list twice as tall.
  return (
    <div className="shop-spec">
      <Input
        aria-label={t("adminProductEditor.specName")}
        id={`product-spec-label-${index}`}
        onChange={(event) => update("label", event.target.value)}
        placeholder={t("adminProductEditor.specNamePlaceholder")}
        value={spec.label}
      />
      <Input
        aria-label={t("adminProductEditor.specValue")}
        id={`product-spec-value-${index}`}
        onChange={(event) => update("value", event.target.value)}
        placeholder={t("adminProductEditor.specValuePlaceholder")}
        value={spec.value}
      />
      <Button
        aria-label={t("adminProductEditor.removeSpec")}
        onClick={() =>
          onChange((prev) => ({
            ...prev,
            specs: canRemove
              ? prev.specs.filter((_, itemIndex) => itemIndex !== index)
              : [{ label: "", value: "" }],
          }))
        }
        size="icon"
        variant="ghost"
      >
        <Trash2 size={16} aria-hidden />
      </Button>
    </div>
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
    <div className="shop-row-media" data-size="lg">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} />
      ) : (
        <ImagePlus aria-hidden />
      )}
    </div>
  )
}
