"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton } from "@/hooks/use-telegram"
import { useTranslate } from "@/components/i18n-provider"
import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"

type PaymentMethodForm = {
  id?: string
  title: string
  details: string
  iconDataUrl?: string
  isActive: boolean
}

const emptyMethod: PaymentMethodForm = {
  title: "",
  details: "",
  iconDataUrl: "",
  isActive: true,
}

const templateMethod: PaymentMethodForm = {
  title: "СБП / Т-Банк",
  details:
    "Оплата по номеру телефона: +7...\nПолучатель: ...\nПосле оплаты нажми «Я оплатил».",
  iconDataUrl: "",
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
        iconDataUrl: method.iconDataUrl || "",
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
        if (method) setDraft(method)
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

  useBackButton(() => router.push("/admin/settings"))

  async function handleIcon(file: File | null) {
    if (!file || !draft) return
    setUploadingIcon(true)
    try {
      const iconDataUrl = await optimizeSquareImage(file, 256)
      setDraft((prev) => (prev ? { ...prev, iconDataUrl } : prev))
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
      <PaymentEditorState
        title={t("adminPaymentEditor.notFoundTitle")}
        description={t("adminPaymentEditor.notFoundDescription")}
      />
    )
  }

  if (isLoading || !draft) {
    return (
      <PaymentEditorState
        title={t("adminPaymentEditor.loadingTitle")}
        description={t("adminPaymentEditor.loadingDescription")}
      />
    )
  }

  return (
    <Screen noTabBar>
      <ScreenHeader
        title={methodId ? t("adminPaymentEditor.title") : t("adminPaymentEditor.newTitle")}
        subtitle={t("adminPaymentEditor.subtitle")}
        trailing={
          <Button
            size="sm"
            disabled={!draft.title.trim() || uploadingIcon || mutation.isPending}
            onClick={() => mutation.mutate("save")}
          >
            {mutation.isPending ? t("common.saving") : t("common.save")}
          </Button>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <FieldGroup>
          <Card>
            <CardHeader>
              <MethodPreview iconDataUrl={draft.iconDataUrl} title={draft.title || "PM"} />
              <CardTitle>{t("adminPaymentEditor.icon")}</CardTitle>
              <CardDescription>
                {uploadingIcon
                  ? t("adminPaymentEditor.processingImage")
                  : t("adminPaymentEditor.iconHint")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                id="payment-method-icon"
                type="file"
                accept="image/*"
                onChange={(event) => handleIcon(event.currentTarget.files?.[0] || null)}
              />
            </CardContent>
          </Card>

          <Field>
            <FieldLabel htmlFor="payment-method-title">{t("adminPaymentEditor.name")}</FieldLabel>
            <Input
              id="payment-method-title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
              placeholder="СБП / Т-Банк"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="payment-method-details">{t("adminPaymentEditor.details")}</FieldLabel>
            <Textarea
              id="payment-method-details"
              value={draft.details}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, details: event.target.value } : prev))}
              placeholder={t("adminPaymentEditor.detailsPlaceholder")}
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="payment-method-active">{t("adminPaymentEditor.showToBuyer")}</FieldLabel>
            <Switch
              id="payment-method-active"
              checked={draft.isActive}
              onCheckedChange={(checked) => setDraft((prev) => (prev ? { ...prev, isActive: checked } : prev))}
            />
          </Field>

          {methodId ? (
            <Button
              variant="destructive"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate("delete")}
            >
              <Trash2 data-icon="inline-start" />
              {t("adminPaymentEditor.removeMethod")}
            </Button>
          ) : null}
        </FieldGroup>
      </ScreenBody>
    </Screen>
  )
}

function MethodPreview({
  iconDataUrl,
  title,
}: {
  iconDataUrl?: string
  title: string
}) {
  return (
    <Avatar className="size-10">
      {iconDataUrl ? <AvatarImage src={iconDataUrl} alt={title} /> : null}
      <AvatarFallback>{title ? title.slice(0, 2).toUpperCase() : "PM"}</AvatarFallback>
    </Avatar>
  )
}

function PaymentEditorState({ title, description }: { title: string; description: string }) {
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
