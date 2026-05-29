"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Cell,
  FileInput,
  Image as TgImage,
  Input,
  Modal,
  Multiselect,
  Placeholder,
  Section,
  Select,
  Switch,
  Textarea,
} from "@telegram-apps/telegram-ui"
import {
  Check,
  ImagePlus,
  PencilLine,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
} from "lucide-react"

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
  const assetOptions = useMemo(
    () =>
      (cryptoCurrencyData?.assets ?? []).map((asset) => ({
        value: asset.code,
        label: `${asset.code} · ${asset.name}`,
      })),
    [cryptoCurrencyData?.assets],
  )
  const selectedAssetOptions = selectedCryptoAssets.map((asset) => ({
    value: asset,
    label: asset,
  }))

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <Placeholder header="Доступ закрыт" description="Настройки магазина доступны только админу.">
          <ShieldCheck size={32} />
        </Placeholder>
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

  return (
    <Screen>
      <ScreenHeader
        title="Настройки"
        subtitle="Магазин, оплата и поддержка"
        trailing={
          <Button size="s" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Сохранить
          </Button>
        }
      />

      <ScreenBody className="gap-3">
        <Section header="Магазин">
          <Input
            header="Название"
            value={shopName}
            onChange={(event) => setShopName(event.target.value)}
            placeholder="snx.sell"
          />
          <Input
            header="Поддержка"
            value={supportUsername}
            onChange={(event) => setSupportUsername(event.target.value)}
            placeholder="@username"
          />
        </Section>

        <Section
          header="Автооплата"
          footer="Crypto Bot создаёт invoice и подтверждает заказ через webhook."
        >
          <Cell
            multiline
            before={<TgImage size={48} src="/crypto-bot-logo.svg" alt="" />}
            subtitle={cryptoPayEnabled ? "Включена" : "Выключена"}
            after={
              <Switch
                checked={cryptoPayEnabled}
                onChange={(event) => setCryptoPayEnabled(event.target.checked)}
              />
            }
          >
            Crypto Bot
          </Cell>
          <Input
            header="API token"
            value={cryptoPayToken}
            onChange={(event) => setCryptoPayToken(event.target.value)}
            placeholder="Token из Crypto Bot"
          />
          <Cell
            after={
              <Switch
                checked={cryptoPayUseTestnet}
                onChange={(event) => setCryptoPayUseTestnet(event.target.checked)}
              />
            }
          >
            Testnet
          </Cell>
          <Select
            header="Fiat"
            value={cryptoPayFiat}
            onChange={(event) => setCryptoPayFiat(event.target.value)}
          >
            {cryptoCurrencyData?.fiats?.length ? (
              cryptoCurrencyData.fiats.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} · {currency.name}
                </option>
              ))
            ) : (
              <option value="RUB">RUB</option>
            )}
          </Select>
          <Multiselect
            header="Монеты"
            placeholder={cryptoPayTokenValue ? "Любая доступная монета" : "Сначала API token"}
            options={assetOptions}
            value={selectedAssetOptions}
            disabled={!cryptoPayTokenValue}
            emptyText="Монеты не найдены"
            selectedBehavior="highlight"
            onChange={(options) =>
              setCryptoPayDefaultAssets(
                options.map((option) => String(option.value).toUpperCase()).join(","),
              )
            }
          />
          <Cell
            multiline
            subtitle={cryptoWebhookUrl || "Появится после открытия на домене деплоя"}
            after={
              cryptoWebhookUrl ? (
                <Button
                  size="s"
                  mode="bezeled"
                  before={<Check size={14} />}
                  onClick={() => void navigator.clipboard.writeText(cryptoWebhookUrl)}
                >
                  Копировать
                </Button>
              ) : null
            }
          >
            Webhook
          </Cell>
          <Cell
            after={
              <Button
                size="s"
                mode="gray"
                loading={isFetchingCurrencies}
                before={<RefreshCcw size={14} />}
                disabled={!cryptoPayTokenValue}
                onClick={() => void refetchCurrencies()}
              >
                Обновить
              </Button>
            }
          >
            Список валют
          </Cell>
        </Section>

        <Section
          header="Ручная оплата"
          footer={`${paymentMethods.length} всего · ${activeCount} активных`}
        >
          {paymentMethods.map((method, index) => (
            <Cell
              key={method.id || `${method.title}-${index}`}
              multiline
              before={<MethodPreview iconDataUrl={method.iconDataUrl} title={method.title} />}
              subtitle={method.details || "Без реквизитов"}
              titleBadge={
                method.isActive ? undefined : (
                  <Badge type="number" mode="gray">
                    Скрыт
                  </Badge>
                )
              }
              after={
                <Button
                  size="s"
                  mode="bezeled"
                  before={<PencilLine size={14} />}
                  onClick={() => openEditModal(index)}
                >
                  Править
                </Button>
              }
            >
              {method.title}
            </Cell>
          ))}
          {paymentMethods.length === 0 ? (
            <Cell subtitle="Добавь СБП, карту или другой ручной способ.">
              Способов оплаты пока нет
            </Cell>
          ) : null}
          <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
            <Button mode="gray" before={<Plus size={14} />} onClick={() => openCreateModal(templateMethod)}>
              Шаблон
            </Button>
            <Button before={<Plus size={14} />} onClick={() => openCreateModal()}>
              Добавить
            </Button>
          </div>
        </Section>
      </ScreenBody>

      {editorDraft ? (
        <MethodEditorModal
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

function MethodEditorModal({
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
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      header={<Modal.Header>{canDelete ? "Способ оплаты" : "Новый способ"}</Modal.Header>}
    >
      <Section header="Иконка">
        <Cell
          multiline
          before={<MethodPreview iconDataUrl={draft.iconDataUrl} title={draft.title || "PM"} />}
          subtitle={uploadingIcon ? "Обработка изображения..." : "Квадратная иконка платежки"}
        >
          Превью
        </Cell>
        <div className="px-4 pb-3">
          <FileInput
            label="Загрузить иконку"
            accept="image/*"
            onChange={(event) => onUpload(event.currentTarget.files?.[0] || null)}
          />
        </div>
      </Section>

      <Section header="Реквизиты">
        <Input
          header="Название"
          value={draft.title}
          onChange={(event) =>
            onChange((prev) => (prev ? { ...prev, title: event.target.value } : prev))
          }
          placeholder="СБП / Т-Банк"
        />
        <Textarea
          header="Данные для оплаты"
          value={draft.details}
          onChange={(event) =>
            onChange((prev) => (prev ? { ...prev, details: event.target.value } : prev))
          }
          placeholder="Номер, получатель или инструкция"
        />
        <Cell
          after={
            <Switch
              checked={draft.isActive}
              onChange={(event) =>
                onChange((prev) => (prev ? { ...prev, isActive: event.target.checked } : prev))
              }
            />
          }
        >
          Показывать покупателю
        </Cell>
      </Section>

      <Section footer="Покупатель увидит этот способ только до оплаты заказа.">
        <Cell before={<ShieldCheck size={18} />} subtitle="Название, иконка и реквизиты">
          Ручная оплата
        </Cell>
      </Section>

      <div className="grid gap-2 p-4">
        <Button stretched onClick={onSave} disabled={!draft.title.trim()}>
          Сохранить способ
        </Button>
        {canDelete ? (
          <Button stretched mode="outline" before={<Trash2 size={14} />} onClick={onDelete}>
            Удалить
          </Button>
        ) : null}
        <Button stretched mode="plain" onClick={onClose}>
          Отмена
        </Button>
      </div>
    </Modal>
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
    <TgImage
      size={48}
      src={iconDataUrl || undefined}
      alt=""
      fallbackIcon={title ? <span>{title.slice(0, 2).toUpperCase()}</span> : <ImagePlus size={18} />}
    />
  )
}
