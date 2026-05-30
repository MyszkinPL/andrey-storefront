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
      if (!meData || !paymentData || !draft) throw new Error("Настройки ещё не загрузились")

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
        title="Доступ закрыт"
        description="Редактор оплаты доступен только админу."
      />
    )
  }

  if (isError || (methodId && initializedKey && !paymentMethods.some((method) => method.id === methodId))) {
    return <PaymentEditorState title="Способ оплаты не найден" description="Вернись к настройкам и выбери другой." />
  }

  if (isLoading || !draft) {
    return <PaymentEditorState title="Загружаю способ оплаты" description="Подтягиваю текущие настройки." />
  }

  return (
    <Screen noTabBar>
      <ScreenHeader
        title={methodId ? "Способ оплаты" : "Новый способ"}
        subtitle="Иконка, название и реквизиты"
        trailing={
          <Button
            size="sm"
            disabled={!draft.title.trim() || uploadingIcon || mutation.isPending}
            onClick={() => mutation.mutate("save")}
          >
            {mutation.isPending ? "Сохраняю..." : "Сохранить"}
          </Button>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <FieldGroup>
          <Card>
            <CardHeader>
              <MethodPreview iconDataUrl={draft.iconDataUrl} title={draft.title || "PM"} />
              <CardTitle>Иконка</CardTitle>
              <CardDescription>{uploadingIcon ? "Обработка изображения..." : "Квадратная иконка платежки"}</CardDescription>
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
            <FieldLabel htmlFor="payment-method-title">Название</FieldLabel>
            <Input
              id="payment-method-title"
              value={draft.title}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))}
              placeholder="СБП / Т-Банк"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="payment-method-details">Данные для оплаты</FieldLabel>
            <Textarea
              id="payment-method-details"
              value={draft.details}
              onChange={(event) => setDraft((prev) => (prev ? { ...prev, details: event.target.value } : prev))}
              placeholder="Номер, получатель или инструкция"
            />
          </Field>

          <Field orientation="horizontal">
            <FieldLabel htmlFor="payment-method-active">Показывать покупателю</FieldLabel>
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
              Удалить способ
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
    <Avatar size="lg">
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
