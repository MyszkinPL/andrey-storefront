"use client"

import type { Dispatch, SetStateAction } from "react"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, ImagePlus, PencilLine, Plus, ShieldCheck, Trash2, X } from "lucide-react"

import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

type PaymentMethodForm = {
  id?: string
  title: string
  type: "MANUAL" | "CRYPTO_PAY"
  details: string
  iconDataUrl?: string
  cryptoAcceptedAssets?: string
  isActive: boolean
}

const emptyMethod: PaymentMethodForm = {
  title: "",
  type: "MANUAL",
  details: "",
  iconDataUrl: "",
  cryptoAcceptedAssets: "",
  isActive: true,
}

const templateMethod: PaymentMethodForm = {
  title: "СБП / Т-Банк",
  type: "MANUAL",
  details:
    "Оплата по номеру телефона: +7...\nПолучатель: ...\nПосле оплаты отправь чек в тикет.",
  iconDataUrl: "",
  cryptoAcceptedAssets: "",
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
  const [welcomeText, setWelcomeText] = useState("")
  const [supportIntro, setSupportIntro] = useState("")
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

  useEffect(() => {
    if (!meData) return
    queueMicrotask(() => {
      setShopName(meData.settings.shopName)
      setWelcomeText(meData.settings.welcomeText)
      setSupportIntro(meData.settings.supportIntro)
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
          type: method.type,
          details: method.details,
          iconDataUrl: method.iconDataUrl || "",
          cryptoAcceptedAssets: method.cryptoAcceptedAssets || "",
          isActive: method.isActive,
        })),
      )
    })
  }, [paymentData])

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        shopName,
        welcomeText,
        supportIntro,
        supportUsername,
        cryptoPayEnabled,
        cryptoPayToken,
        cryptoPayUseTestnet,
        cryptoPayFiat,
        cryptoPayDefaultAssets,
        paymentMethods,
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
      cryptoAcceptedAssets: editorDraft.cryptoAcceptedAssets?.trim() || "",
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
      <ScreenHeader title="Настройки" subtitle="Витрина, реквизиты и Crypto Pay" />

      <ScreenBody className="gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(380px,1.08fr)] xl:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)]">
        <div className="grid gap-4">
          <section className="ui-card p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Магазин</p>
            <div className="mt-3 grid gap-3">
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Название"
                className="ui-input"
              />
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="Текст на главной"
                className="ui-input min-h-24"
              />
              <textarea
                value={supportIntro}
                onChange={(e) => setSupportIntro(e.target.value)}
                placeholder="Текст на экране тикетов"
                className="ui-input min-h-24"
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
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[var(--color-muted)]" />
              <p className="text-sm font-semibold text-[var(--color-text)]">Crypto Pay</p>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
                <input
                  checked={cryptoPayEnabled}
                  onChange={(event) => setCryptoPayEnabled(event.target.checked)}
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text)]">Включить Crypto Pay</span>
              </label>
              <input
                value={cryptoPayToken}
                onChange={(e) => setCryptoPayToken(e.target.value)}
                placeholder="API token"
                className="ui-input"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={cryptoPayFiat}
                  onChange={(e) => setCryptoPayFiat(e.target.value.toUpperCase())}
                  placeholder="RUB"
                  className="ui-input"
                />
                <input
                  value={cryptoPayDefaultAssets}
                  onChange={(e) => setCryptoPayDefaultAssets(e.target.value.toUpperCase())}
                  placeholder="USDT,TON,BTC"
                  className="ui-input"
                />
              </div>
              <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
                <input
                  checked={cryptoPayUseTestnet}
                  onChange={(event) => setCryptoPayUseTestnet(event.target.checked)}
                  type="checkbox"
                  className="size-4 accent-[var(--color-accent)]"
                />
                <span className="text-sm text-[var(--color-text)]">Использовать testnet</span>
              </label>
            </div>
          </section>
        </div>

        <section className="ui-card p-4 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Способы оплаты</p>
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
                    <p className="truncate text-sm font-medium text-[var(--color-text)]">{method.title}</p>
                    <span className="ui-pill">{method.type === "MANUAL" ? "Ручная" : "Crypto Pay"}</span>
                    {!method.isActive ? <span className="ui-pill">Скрыт</span> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                    {method.type === "CRYPTO_PAY"
                      ? method.cryptoAcceptedAssets || method.details || "Crypto Pay"
                      : method.details || "Без описания"}
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
              Настрой отображение, тип и реквизиты отдельно от общего экрана.
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
                    <span className="text-xs">{uploadingIcon ? "Обработка..." : "Загрузить"}</span>
                  </div>
                )}
              </div>
            </div>
          </label>

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(["MANUAL", "CRYPTO_PAY"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onChange((prev) => (prev ? { ...prev, type } : prev))}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs",
                    draft.type === type
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                      : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                  )}
                >
                  {type === "MANUAL" ? "Ручная" : "Crypto Pay"}
                </button>
              ))}

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

            {draft.type === "CRYPTO_PAY" ? (
              <input
                value={draft.cryptoAcceptedAssets || ""}
                onChange={(event) =>
                  onChange((prev) =>
                    prev
                      ? { ...prev, cryptoAcceptedAssets: event.target.value.toUpperCase() }
                      : prev,
                  )
                }
                placeholder="USDT,TON,BTC"
                className="ui-input"
              />
            ) : null}

            <textarea
              value={draft.details}
              onChange={(event) =>
                onChange((prev) => (prev ? { ...prev, details: event.target.value } : prev))
              }
              placeholder={
                draft.type === "MANUAL"
                  ? "Реквизиты и инструкция для покупателя"
                  : "Текст под Crypto Pay"
              }
              className="ui-input min-h-32"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <ShieldCheck size={14} />
            {draft.type === "MANUAL"
              ? "Покупатель увидит название, иконку и реквизиты."
              : "Покупатель увидит Crypto Pay и сможет открыть invoice."}
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
