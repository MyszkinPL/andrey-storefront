"use client"

import Image from "next/image"
import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronDown,
  ImagePlus,
  PencilLine,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react"

import { getCryptoPayCurrencies, getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

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
  const [isFiatPickerOpen, setIsFiatPickerOpen] = useState(false)
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false)
  const [assetSearch, setAssetSearch] = useState("")
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
  const filteredCryptoAssets = useMemo(() => {
    const query = assetSearch.trim().toLowerCase()
    return (cryptoCurrencyData?.assets ?? []).filter((asset) => {
      if (!query) return true
      return (
        asset.code.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query)
      )
    })
  }, [assetSearch, cryptoCurrencyData?.assets])
  const cryptoWebhookUrl = meData?.settings.appUrl
    ? `${meData.settings.appUrl}/api/crypto-pay/webhook`
    : ""

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
    if (!editorDraft) return
    if (!editorDraft.title.trim()) return

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

  function toggleCryptoAsset(code: string) {
    setCryptoPayDefaultAssets((current) => {
      const next = new Set(
        current
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean),
      )

      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }

      return Array.from(next).join(",")
    })
  }

  return (
    <Screen>
      <ScreenHeader title="Настройки" subtitle="Магазин, ручная оплата и автооплата" />

      <ScreenBody className="gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(380px,1.08fr)] xl:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)]">
        <div className="grid gap-4">
          <section className="ui-card p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Магазин</p>
            <div className="mt-3 grid gap-3">
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Название магазина"
                className="ui-input"
              />
              <input
                value={supportUsername}
                onChange={(e) => setSupportUsername(e.target.value)}
                placeholder="Username поддержки"
                className="ui-input"
              />
            </div>
          </section>

          <section className="ui-card p-4">
            <div className="flex items-center gap-3">
              <div className="relative size-11 shrink-0 overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg)]">
                <Image
                  src="/crypto-bot-logo.svg"
                  alt=""
                  fill
                  sizes="44px"
                  className="object-contain p-1.5"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Автооплата · Crypto Bot
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Отдельный автоматический способ. Не смешивается с ручными реквизитами.
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
                <input
                  checked={cryptoPayEnabled}
                  onChange={(event) => setCryptoPayEnabled(event.target.checked)}
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text)]">
                  Включить автооплату через Crypto Bot
                </span>
              </label>

              <input
                value={cryptoPayToken}
                onChange={(e) => setCryptoPayToken(e.target.value)}
                placeholder="API token Crypto Bot"
                className="ui-input"
              />

              <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
                <input
                  checked={cryptoPayUseTestnet}
                  onChange={(event) => setCryptoPayUseTestnet(event.target.checked)}
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text)]">Использовать testnet</span>
              </label>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Валюты и монеты
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetchCurrencies()}
                    disabled={!cryptoPayTokenValue || isFetchingCurrencies}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)] disabled:opacity-50"
                  >
                    <RefreshCcw
                      size={12}
                      className={cn(isFetchingCurrencies && "animate-spin")}
                    />
                    обновить
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFiatPickerOpen((value) => !value)
                        setIsAssetPickerOpen(false)
                      }}
                      className="ui-input flex min-h-14 w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Fiat
                        </p>
                        <p className="mt-1 truncate text-sm text-[var(--color-text)]">
                          {cryptoPayFiat || "Выбери валюту"}
                        </p>
                      </div>
                      <ChevronDown size={16} className="shrink-0 text-[var(--color-muted)]" />
                    </button>

                    {isFiatPickerOpen ? (
                      <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
                        <div className="grid max-h-64 gap-1 overflow-y-auto">
                          {(cryptoCurrencyData?.fiats ?? []).map((currency) => (
                            <button
                              key={currency.code}
                              type="button"
                              onClick={() => {
                                setCryptoPayFiat(currency.code)
                                setIsFiatPickerOpen(false)
                              }}
                              className={cn(
                                "flex items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-colors",
                                cryptoPayFiat === currency.code
                                  ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                                  : "text-[var(--color-muted)] hover:bg-[var(--color-bg)]",
                              )}
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{currency.code}</p>
                                <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                                  {currency.name}
                                </p>
                              </div>
                              {cryptoPayFiat === currency.code ? (
                                <Check size={14} className="text-[var(--color-accent)]" />
                              ) : null}
                            </button>
                          ))}
                          {!cryptoPayTokenValue ? (
                            <div className="px-3 py-4 text-xs text-[var(--color-muted)]">
                              Сначала вставь API token.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAssetPickerOpen((value) => !value)
                        setIsFiatPickerOpen(false)
                      }}
                      className="ui-input flex min-h-14 w-full items-center justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                          Монеты
                        </p>
                        <p className="mt-1 truncate text-sm text-[var(--color-text)]">
                          {selectedCryptoAssets.length > 0
                            ? selectedCryptoAssets.join(", ")
                            : "Любая доступная монета"}
                        </p>
                      </div>
                      <ChevronDown size={16} className="shrink-0 text-[var(--color-muted)]" />
                    </button>

                    {isAssetPickerOpen ? (
                      <div className="absolute inset-x-0 top-[calc(100%+8px)] z-20 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
                        <label className="ui-card-soft mb-2 flex items-center gap-3 px-3 py-2.5">
                          <Search size={14} className="text-[var(--color-muted)]" />
                          <input
                            value={assetSearch}
                            onChange={(event) => setAssetSearch(event.target.value)}
                            placeholder="Поиск монеты"
                            className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                          />
                        </label>

                        <div className="grid max-h-72 gap-1 overflow-y-auto">
                          {filteredCryptoAssets.map((asset) => {
                            const checked = selectedCryptoAssets.includes(asset.code)

                            return (
                              <button
                                key={asset.code}
                                type="button"
                                onClick={() => toggleCryptoAsset(asset.code)}
                                className={cn(
                                  "flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                                  checked
                                    ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                                    : "text-[var(--color-muted)] hover:bg-[var(--color-bg)]",
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{asset.code}</p>
                                  <p className="mt-0.5 truncate text-[11px] text-[var(--color-muted)]">
                                    {asset.name}
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    "flex size-5 shrink-0 items-center justify-center rounded-md border",
                                    checked
                                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                                      : "border-[var(--color-border)] text-transparent",
                                  )}
                                >
                                  <Check size={12} />
                                </div>
                              </button>
                            )
                          })}

                          {!cryptoPayTokenValue ? (
                            <div className="px-3 py-4 text-xs text-[var(--color-muted)]">
                              Сначала вставь API token.
                            </div>
                          ) : null}

                          {cryptoPayTokenValue && filteredCryptoAssets.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-[var(--color-muted)]">
                              Ничего не найдено.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="ui-card-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      Как это увидит покупатель
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                      Один отдельный способ оплаты: Crypto Bot. После выбора создаётся invoice и статус заказа обновляется автоматически.
                    </p>
                  </div>
                  <span
                    className={cn(
                      "ui-pill",
                      cryptoPayEnabled && cryptoPayToken
                        ? "bg-[var(--color-accent)]/14 text-[var(--color-accent)]"
                        : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                    )}
                  >
                    {cryptoPayEnabled && cryptoPayToken ? "активно" : "выключено"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="ui-pill bg-[var(--color-bg)] text-[var(--color-text)]">
                    {cryptoPayFiat || "RUB"}
                  </span>
                  {selectedCryptoAssets.length > 0 ? (
                    selectedCryptoAssets.map((asset) => (
                      <span
                        key={asset}
                        className="ui-pill bg-[var(--color-bg)] text-[var(--color-text)]"
                      >
                        {asset}
                      </span>
                    ))
                  ) : (
                    <span className="ui-pill bg-[var(--color-bg)] text-[var(--color-muted)]">
                      любая доступная монета
                    </span>
                  )}
                </div>
              </div>

              <div className="ui-card-soft p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Webhook URL
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                      Вставь этот адрес в настройках Crypto Bot, чтобы заказы подтверждались автоматически.
                    </p>
                  </div>
                  {cryptoWebhookUrl ? (
                    <button
                      onClick={() => {
                        void navigator.clipboard.writeText(cryptoWebhookUrl)
                      }}
                      className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                    >
                      копировать
                    </button>
                  ) : null}
                </div>
                <input
                  readOnly
                  value={cryptoWebhookUrl}
                  placeholder="Открой миниапп в домене деплоя"
                  className="ui-input mt-3 text-xs"
                />
              </div>
            </div>
          </section>
        </div>

        <section className="ui-card p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                Ручные способы оплаты
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {paymentMethods.length} всего · {activeCount} активных
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openCreateModal(templateMethod)}
                className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-muted)]"
              >
                шаблон
              </button>
              <button
                onClick={() => openCreateModal()}
                className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent-text)]"
              >
                <Plus size={12} className="mr-1 inline-block" />
                добавить
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            {paymentMethods.map((method, index) => (
              <button
                key={method.id || `${method.title}-${index}`}
                onClick={() => openEditModal(index)}
                className="ui-card-soft flex items-center gap-3 p-3 text-left transition-transform duration-150 active:scale-[0.99]"
              >
                <MethodPreview iconDataUrl={method.iconDataUrl} title={method.title} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">
                      {method.title}
                    </p>
                    <span className="ui-pill">Ручная</span>
                    {!method.isActive ? <span className="ui-pill">Скрыт</span> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                    {method.details || "Без описания"}
                  </p>
                </div>
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
                  <PencilLine size={14} />
                </div>
              </button>
            ))}

            {paymentMethods.length === 0 ? (
              <div className="ui-card-soft px-4 py-8 text-center">
                <p className="text-sm text-[var(--color-muted)]">Способов оплаты пока нет</p>
              </div>
            ) : null}
          </div>
        </section>
      </ScreenBody>

      <div className="px-4 pb-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
        >
          {mutation.isPending ? "Сохранение..." : "Сохранить настройки"}
        </button>
      </div>

      {editorDraft ? (
        <MethodEditorModal
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
  draft,
  uploadingIcon,
  onClose,
  onChange,
  onSave,
  onDelete,
  onUpload,
  canDelete,
}: {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-3 md:items-center">
      <div className="ui-card w-full max-w-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">
              {canDelete ? "Редактирование способа" : "Новый способ оплаты"}
            </p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Настрой название, иконку и реквизиты для ручной оплаты.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[128px_minmax(0,1fr)]">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => onUpload(event.target.files?.[0] || null)}
            />
            <div className="ui-card-soft overflow-hidden">
              <div className="aspect-square">
                {draft.iconDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={draft.iconDataUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--color-muted)]">
                    <ImagePlus size={20} />
                    <span className="text-xs">
                      {uploadingIcon ? "Обработка..." : "Загрузить"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </label>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="ui-pill bg-[var(--color-bg)] text-[var(--color-text)]">
                Ручная оплата
              </span>
              <label className="ml-auto flex items-center gap-2 rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]">
                <input
                  checked={draft.isActive}
                  onChange={(event) =>
                    onChange((prev) => (prev ? { ...prev, isActive: event.target.checked } : prev))
                  }
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                />
                Показывать
              </label>
            </div>

            <input
              value={draft.title}
              onChange={(event) =>
                onChange((prev) => (prev ? { ...prev, title: event.target.value } : prev))
              }
              placeholder="Название способа"
              className="ui-input"
            />

            <textarea
              value={draft.details}
              onChange={(event) =>
                onChange((prev) => (prev ? { ...prev, details: event.target.value } : prev))
              }
              placeholder="Реквизиты и инструкция для покупателя"
              className="ui-input min-h-32"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <ShieldCheck size={14} />
            Покупатель увидит название, иконку и реквизиты.
          </div>

          <div className="flex flex-wrap gap-2">
            {canDelete ? (
              <button
                onClick={onDelete}
                className="rounded-full bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-destructive)]"
              >
                <Trash2 size={14} className="mr-1 inline-block" />
                Удалить
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="rounded-full bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-text)]"
            >
              Отмена
            </button>
            <button
              onClick={onSave}
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-accent-text)]"
            >
              Сохранить способ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MethodPreview({
  iconDataUrl,
  title,
}: {
  iconDataUrl?: string
  title: string
}) {
  if (iconDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={iconDataUrl} alt="" className="size-12 rounded-2xl object-cover" />
    )
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase() || "PM"}
    </div>
  )
}
