"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, Trash2 } from "lucide-react"
import {
  Avatar,
  Banner,
  Button,
  Card,
  Cluster,
  Field,
  Input,
  Setting,
  Stack,
  Switch,
  Textarea,
  Well,
  WellContent,
  WellFooter,
  WellHeader,
} from "sealui"

import { AccessStateScreen } from "@/components/access-state-screen"
import { ImagePicker } from "@/components/image-picker"
import { Screen, ScreenBody, ScreenHeader, ScreenState, StickyActions } from "@/components/screen"
import { useTranslate } from "@/components/i18n-provider"
import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"

type PaymentMethodForm = {
  id?: string
  title: string
  details: string
  /** Existing icon, shown as a preview. */
  iconUrl?: string | null
  /** Set only when the admin picks a new file; null clears the icon. */
  iconDataUrl?: string | null
  isActive: boolean
}

const emptyMethod: PaymentMethodForm = {
  title: "",
  details: "",
  iconUrl: null,
  iconDataUrl: undefined,
  isActive: true,
}

const templateMethod: PaymentMethodForm = {
  title: "СБП / Т-Банк",
  details:
    "Оплата по номеру телефона: +7...\nПолучатель: ...\nПосле оплаты нажми «Я оплатил».",
  iconUrl: null,
  iconDataUrl: undefined,
  isActive: true,
}

export function AdminPaymentMethodEditorScreen({
  methodId,
  template,
}: {
  methodId?: string
  template?: string
}) {
  const t = useTranslate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState<PaymentMethodForm | null>(null)
  const [initializedKey, setInitializedKey] = useState("")
  const [uploadingIcon, setUploadingIcon] = useState(false)

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData, isLoading, isError } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const paymentMethods = useMemo(
    () =>
      (paymentData?.paymentMethods ?? []).map((method) => ({
        id: method.id,
        title: method.title,
        details: method.details,
        iconUrl: method.iconUrl,
        iconDataUrl: undefined,
        isActive: method.isActive,
      })),
    [paymentData?.paymentMethods],
  )

  useEffect(() => {
    if (!paymentData) return
    const key = methodId ? `edit:${methodId}` : template ? `new:${template}` : "new"
    if (initializedKey === key) return

    queueMicrotask(() => {
      if (methodId) {
        const method = paymentMethods.find((item) => item.id === methodId)
        // details is null for a buyer, and this screen is admin-only.
        if (method) setDraft({ ...method, details: method.details ?? "" })
      } else {
        setDraft(template ? templateMethod : emptyMethod)
      }

      setInitializedKey(key)
    })
  }, [initializedKey, methodId, paymentData, paymentMethods, template])

  const mutation = useMutation({
    mutationFn: (action: "save" | "delete") => {
      if (!meData || !paymentData || !draft) throw new Error(t("adminPaymentEditor.notLoaded"))

      const normalized = {
        ...draft,
        title: draft.title.trim(),
        details: draft.details.trim(),
      }
      const nextMethods =
        action === "delete"
          ? paymentMethods.filter((method) => method.id !== methodId)
          : methodId
            ? paymentMethods.map((method) => (method.id === methodId ? normalized : method))
            : [...paymentMethods, normalized]

      return saveSettings({
        shopName: meData.settings.shopName,
        supportUsername: meData.settings.supportUsername || "",
        cryptoPayEnabled: Boolean(meData.settings.cryptoPayEnabled),
        cryptoPayToken: meData.settings.cryptoPayToken || "",
        cryptoPayUseTestnet: Boolean(meData.settings.cryptoPayUseTestnet),
        cryptoPayFiat: meData.settings.cryptoPayFiat || "RUB",
        cryptoPayDefaultAssets: meData.settings.cryptoPayDefaultAssets || "",
        paymentMethods: nextMethods.map((method) => ({
          ...method,
          details: method.details ?? "",
          type: "MANUAL" as const,
        })),
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      router.replace("/admin/settings")
    },
  })

  async function handleIcon(file: File | null) {
    if (!file || !draft) return
    setUploadingIcon(true)
    try {
      const iconDataUrl = await optimizeSquareImage(file, 256)
      setDraft((prev) => (prev ? { ...prev, iconDataUrl, iconUrl: iconDataUrl } : prev))
    } finally {
      setUploadingIcon(false)
    }
  }

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title={t("admin.deniedTitle")}
        description={t("adminPaymentEditor.deniedDescription")}
      />
    )
  }

  if (isError || (methodId && initializedKey && !paymentMethods.some((method) => method.id === methodId))) {
    return (
      <ScreenState
        back="/admin/settings"
        description={t("adminPaymentEditor.notFoundDescription")}
        title={t("adminPaymentEditor.notFoundTitle")}
      />
    )
  }

  if (isLoading || !draft) {
    return (
      <ScreenState
        back="/admin/settings"
        description={t("adminPaymentEditor.loadingDescription")}
        title={t("adminPaymentEditor.loadingTitle")}
      />
    )
  }

  const canSave = Boolean(draft.title.trim()) && !uploadingIcon && !mutation.isPending
  const saveLabel = mutation.isPending ? t("common.saving") : t("common.save")

  return (
    <Screen noTabBar>
      <ScreenHeader
        back="/admin/settings"
        title={methodId ? t("adminPaymentEditor.title") : t("adminPaymentEditor.newTitle")}
        subtitle={t("adminPaymentEditor.subtitle")}
        trailing={
          <div className="max-sm:hidden">
            <Button disabled={!canSave} onClick={() => mutation.mutate("save")} size="sm">
              {saveLabel}
            </Button>
          </div>
        }
      />

      <ScreenBody>
        {mutation.error ? (
          <Banner
            title={mutation.error instanceof Error ? mutation.error.message : t("adminPaymentEditor.notLoaded")}
            variant="danger"
          />
        ) : null}

        <Well>
          <WellHeader
            description={uploadingIcon ? t("adminPaymentEditor.processingImage") : t("adminPaymentEditor.iconHint")}
            title={t("adminPaymentEditor.icon")}
          />
          <WellContent>
            <Cluster gap="4">
              <MethodPreview iconUrl={draft.iconUrl} title={draft.title} />
              <ImagePicker
                disabled={uploadingIcon}
                hasImage={Boolean(draft.iconUrl)}
                id="payment-method-icon"
                onClear={() =>
                  setDraft((prev) => (prev ? { ...prev, iconDataUrl: null, iconUrl: null } : prev))
                }
                onSelect={handleIcon}
              />
            </Cluster>
          </WellContent>
        </Well>

        <Well>
          <WellContent>
            <Stack gap="4">
              <Field label={t("adminPaymentEditor.name")}>
                <Input
                  id="payment-method-title"
                  onChange={(event) => setDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
                  placeholder="СБП / Т-Банк"
                  value={draft.title}
                />
              </Field>

              <Field label={t("adminPaymentEditor.details")}>
                <Textarea
                  id="payment-method-details"
                  onChange={(event) =>
                    setDraft((prev) => (prev ? { ...prev, details: event.target.value } : prev))
                  }
                  placeholder={t("adminPaymentEditor.detailsPlaceholder")}
                  value={draft.details}
                />
              </Field>

              <Card>
                <Setting
                  layout="inline"
                  title={<label htmlFor="payment-method-active">{t("adminPaymentEditor.showToBuyer")}</label>}
                >
                  <Switch
                    checked={draft.isActive}
                    id="payment-method-active"
                    onCheckedChange={(checked) =>
                      setDraft((prev) => (prev ? { ...prev, isActive: checked } : prev))
                    }
                  />
                </Setting>
              </Card>
            </Stack>
          </WellContent>

          {methodId ? (
            <WellFooter>
              <Cluster>
                <Button
                  disabled={mutation.isPending}
                  icon={<Trash2 size={16} aria-hidden />}
                  onClick={() => mutation.mutate("delete")}
                  variant="danger"
                >
                  {t("adminPaymentEditor.removeMethod")}
                </Button>
              </Cluster>
            </WellFooter>
          ) : null}
        </Well>

        <StickyActions>
          <Button disabled={!canSave} onClick={() => mutation.mutate("save")}>
            {saveLabel}
          </Button>
        </StickyActions>
      </ScreenBody>
    </Screen>
  )
}

function MethodPreview({
  iconUrl,
  title,
}: {
  iconUrl?: string | null
  title: string
}) {
  const initials = title.trim().slice(0, 2).toUpperCase()

  return (
    <Avatar
      fallback={initials || <ImagePlus size={20} aria-hidden />}
      name={title || "PM"}
      size="lg"
      src={iconUrl}
    />
  )
}
