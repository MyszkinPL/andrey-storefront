"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ImagePlus, PencilLine, Plus, RefreshCcw, Trash2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getCryptoPayCurrencies, getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"

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

export function AdminSettingsScreen() {
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const [shopName, setShopName] = useState("")
  const [supportUsername, setSupportUsername] = useState("")
  const [cryptoPayEnabled, setCryptoPayEnabled] = useState(false)
  const [cryptoPayToken, setCryptoPayToken] = useState("")
  const [cryptoPayUseTestnet, setCryptoPayUseTestnet] = useState(false)
  const [cryptoPayFiat, setCryptoPayFiat] = useState("RUB")
  const [cryptoPayDefaultAssets, setCryptoPayDefaultAssets] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([])
  const [editorIndex, setEditorIndex] = useState<number | null>(null)
  const [editorDraft, setEditorDraft] = useState<PaymentMethodForm | null>(null)
  const [uploadingIcon, setUploadingIcon] = useState(false)

  const cryptoPayTokenValue = cryptoPayToken.trim()

  const {
    data: cryptoCurrencyData,
    isFetching: isFetchingCurrencies,
    refetch: refetchCurrencies,
  } = useQuery({
    queryKey: ["crypto-pay-currencies", cryptoPayTokenValue, cryptoPayUseTestnet],
    queryFn: () =>
      getCryptoPayCurrencies({
        token: cryptoPayTokenValue,
        useTestnet: cryptoPayUseTestnet,
      }),
    enabled: Boolean(cryptoPayEnabled && cryptoPayTokenValue),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => {
    if (!meData) return
    queueMicrotask(() => {
      setShopName(meData.settings.shopName)
      setSupportUsername(meData.settings.supportUsername || "")
      setCryptoPayEnabled(Boolean(meData.settings.cryptoPayEnabled))
      setCryptoPayToken(meData.settings.cryptoPayToken || "")
      setCryptoPayUseTestnet(Boolean(meData.settings.cryptoPayUseTestnet))
      setCryptoPayFiat(meData.settings.cryptoPayFiat || "RUB")
      setCryptoPayDefaultAssets(meData.settings.cryptoPayDefaultAssets || "")
    })
  }, [meData])

  useEffect(() => {
    if (!paymentData) return
    queueMicrotask(() => {
      setPaymentMethods(
        paymentData.paymentMethods.map((method) => ({
          id: method.id,
          title: method.title,
          details: method.details,
          iconDataUrl: method.iconDataUrl || "",
          isActive: method.isActive,
        })),
      )
    })
  }, [paymentData])

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        shopName,
        supportUsername,
        cryptoPayEnabled,
        cryptoPayToken,
        cryptoPayUseTestnet,
        cryptoPayFiat,
        cryptoPayDefaultAssets,
        paymentMethods: paymentMethods.map((method) => ({
          ...method,
          type: "MANUAL" as const,
        })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })

  const activeCount = useMemo(
    () => paymentMethods.filter((method) => method.isActive).length,
    [paymentMethods],
  )
  const selectedCryptoAssets = useMemo(
    () =>
      cryptoPayDefaultAssets
        .split(",")
        .map((asset) => asset.trim().toUpperCase())
        .filter(Boolean),
    [cryptoPayDefaultAssets],
  )
  const cryptoWebhookUrl = meData?.settings.appUrl
    ? `${meData.settings.appUrl}/api/crypto-pay/webhook`
    : ""
  const assetOptions = cryptoCurrencyData?.assets ?? []

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title="Доступ закрыт" subtitle="Настройки магазина доступны только админу." />
      </Screen>
    )
  }

  function openCreateModal(preset?: PaymentMethodForm) {
    setEditorIndex(null)
    setEditorDraft({ ...(preset || emptyMethod) })
  }

  function openEditModal(index: number) {
    setEditorIndex(index)
    setEditorDraft({ ...paymentMethods[index] })
  }

  function closeModal() {
    setEditorIndex(null)
    setEditorDraft(null)
    setUploadingIcon(false)
  }

  function saveDraft() {
    if (!editorDraft?.title.trim()) return

    const normalized = {
      ...editorDraft,
      title: editorDraft.title.trim(),
      details: editorDraft.details.trim(),
    }

    if (editorIndex === null) {
      setPaymentMethods((prev) => [...prev, normalized])
    } else {
      setPaymentMethods((prev) =>
        prev.map((method, index) => (index === editorIndex ? normalized : method)),
      )
    }

    closeModal()
  }

  function removeDraft() {
    if (editorIndex === null) return
    setPaymentMethods((prev) => prev.filter((_, index) => index !== editorIndex))
    closeModal()
  }

  async function handleDraftIcon(file: File | null) {
    if (!file || !editorDraft) return
    setUploadingIcon(true)
    try {
      const iconDataUrl = await optimizeSquareImage(file, 256)
      setEditorDraft((prev) => (prev ? { ...prev, iconDataUrl } : prev))
    } finally {
      setUploadingIcon(false)
    }
  }

  function toggleAsset(asset: string) {
    const normalized = asset.toUpperCase()
    const next = selectedCryptoAssets.includes(normalized)
      ? selectedCryptoAssets.filter((item) => item !== normalized)
      : [...selectedCryptoAssets, normalized]
    setCryptoPayDefaultAssets(next.join(","))
  }

  return (
    <Screen>
      <ScreenHeader
        title="Настройки"
        subtitle="Магазин, оплата и поддержка"
        trailing={
          <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Сохраняю..." : "Сохранить"}
          </Button>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Магазин</CardTitle>
            <CardDescription>Базовая информация и Telegram-поддержка.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Название</FieldLabel>
                <Input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="snx.sell" />
              </Field>
              <Field>
                <FieldLabel>Поддержка</FieldLabel>
                <Input value={supportUsername} onChange={(event) => setSupportUsername(event.target.value)} placeholder="@username" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MethodPreview iconDataUrl="/crypto-bot-logo.svg" title="Crypto Bot" />
            <CardTitle>Crypto Bot</CardTitle>
            <CardDescription>Автооплата через invoice и webhook.</CardDescription>
            <CardAction>
              <Switch checked={cryptoPayEnabled} onCheckedChange={setCryptoPayEnabled} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>API token</FieldLabel>
                <Input value={cryptoPayToken} onChange={(event) => setCryptoPayToken(event.target.value)} placeholder="Token из Crypto Bot" />
              </Field>
              <div className="flex items-center justify-between gap-3">
                <FieldLabel>Testnet</FieldLabel>
                <Switch checked={cryptoPayUseTestnet} onCheckedChange={setCryptoPayUseTestnet} />
              </div>
              <Field>
                <FieldLabel>Fiat</FieldLabel>
                <Input value={cryptoPayFiat} onChange={(event) => setCryptoPayFiat(event.target.value.toUpperCase())} placeholder="RUB" />
              </Field>
              <Field>
                <FieldLabel>Монеты</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {assetOptions.length > 0 ? (
                    assetOptions.map((asset) => (
                      <Button
                        key={asset.code}
                        size="sm"
                        variant={selectedCryptoAssets.includes(asset.code) ? "default" : "secondary"}
                        onClick={() => toggleAsset(asset.code)}
                      >
                        {selectedCryptoAssets.includes(asset.code) ? <Check data-icon="inline-start" /> : null}
                        {asset.code}
                      </Button>
                    ))
                  ) : (
                    <Badge variant="secondary">
                      {cryptoPayTokenValue ? "Нажми обновить" : "Сначала API token"}
                    </Badge>
                  )}
                </div>
              </Field>
              <Field>
                <FieldLabel>Webhook</FieldLabel>
                <div className="flex gap-2">
                  <Input readOnly value={cryptoWebhookUrl || "Появится после открытия на домене деплоя"} />
                  {cryptoWebhookUrl ? (
                    <Button variant="secondary" onClick={() => void navigator.clipboard.writeText(cryptoWebhookUrl)}>
                      Копировать
                    </Button>
                  ) : null}
                </div>
              </Field>
              <Button
                variant="secondary"
                disabled={!cryptoPayTokenValue}
                onClick={() => void refetchCurrencies()}
              >
                <RefreshCcw data-icon="inline-start" />
                {isFetchingCurrencies ? "Обновляю..." : "Обновить валюты"}
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ручная оплата</CardTitle>
            <CardDescription>{paymentMethods.length} всего · {activeCount} активных</CardDescription>
            <CardAction>
              <Button size="sm" onClick={() => openCreateModal()}>
                <Plus data-icon="inline-start" />
                Добавить
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {paymentMethods.map((method, index) => (
              <div key={method.id || `${method.title}-${index}`} className="flex items-center gap-3 rounded-3xl bg-input/50 p-3">
                <MethodPreview iconDataUrl={method.iconDataUrl} title={method.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{method.title}</span>
                    {!method.isActive ? <Badge variant="secondary">Скрыт</Badge> : null}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{method.details || "Без реквизитов"}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => openEditModal(index)}>
                  <PencilLine data-icon="inline-start" />
                  Править
                </Button>
              </div>
            ))}
            {paymentMethods.length === 0 ? (
              <div className="text-sm text-muted-foreground">Добавь СБП, карту или другой ручной способ.</div>
            ) : null}
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="secondary" onClick={() => openCreateModal(templateMethod)}>
              <Plus data-icon="inline-start" />
              Шаблон
            </Button>
            <Button onClick={() => openCreateModal()}>
              <Plus data-icon="inline-start" />
              Новый
            </Button>
          </CardFooter>
        </Card>
      </ScreenBody>

      {editorDraft ? (
        <MethodEditorDialog
          open={Boolean(editorDraft)}
          draft={editorDraft}
          uploadingIcon={uploadingIcon}
          onClose={closeModal}
          onChange={setEditorDraft}
          onSave={saveDraft}
          onDelete={removeDraft}
          onUpload={handleDraftIcon}
          canDelete={editorIndex !== null}
        />
      ) : null}
    </Screen>
  )
}

function MethodEditorDialog({
  open,
  draft,
  uploadingIcon,
  onClose,
  onChange,
  onSave,
  onDelete,
  onUpload,
  canDelete,
}: {
  open: boolean
  draft: PaymentMethodForm
  uploadingIcon: boolean
  onClose: () => void
  onChange: Dispatch<SetStateAction<PaymentMethodForm | null>>
  onSave: () => void
  onDelete: () => void
  onUpload: (file: File | null) => void
  canDelete: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{canDelete ? "Способ оплаты" : "Новый способ"}</DialogTitle>
          <DialogDescription>Название, иконка и реквизиты ручной оплаты.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Card size="sm">
            <CardHeader>
              <MethodPreview iconDataUrl={draft.iconDataUrl} title={draft.title || "PM"} />
              <CardTitle>Иконка</CardTitle>
              <CardDescription>{uploadingIcon ? "Обработка изображения..." : "Квадратная иконка платежки"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => onUpload(event.currentTarget.files?.[0] || null)}
              />
            </CardContent>
          </Card>

          <Field>
            <FieldLabel>Название</FieldLabel>
            <Input
              value={draft.title}
              onChange={(event) =>
                onChange((prev) => (prev ? { ...prev, title: event.target.value } : prev))
              }
              placeholder="СБП / Т-Банк"
            />
          </Field>
          <Field>
            <FieldLabel>Данные для оплаты</FieldLabel>
            <Textarea
              value={draft.details}
              onChange={(event) =>
                onChange((prev) => (prev ? { ...prev, details: event.target.value } : prev))
              }
              placeholder="Номер, получатель или инструкция"
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <FieldLabel>Показывать покупателю</FieldLabel>
            <Switch
              checked={draft.isActive}
              onCheckedChange={(checked) =>
                onChange((prev) => (prev ? { ...prev, isActive: checked } : prev))
              }
            />
          </div>
        </FieldGroup>
        <DialogFooter>
          {canDelete ? (
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 data-icon="inline-start" />
              Удалить
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={onSave} disabled={!draft.title.trim()}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <AvatarFallback>
        {title ? title.slice(0, 2).toUpperCase() : <ImagePlus className="size-4" />}
      </AvatarFallback>
    </Avatar>
  )
}
