"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, ImagePlus, Plus, Trash2 } from "lucide-react"

import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { optimizeSquareImage } from "@/lib/image"
import { Screen, ScreenHeader } from "@/components/screen"
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
  title: "Новый способ",
  type: "MANUAL",
  details: "Укажи реквизиты и короткую инструкцию для покупателя.",
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
  const [uploadingId, setUploadingId] = useState<string | null>(null)

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

  async function handleMethodIcon(index: number, file: File | null) {
    if (!file) return
    const uploadKey = paymentMethods[index]?.id || `new-${index}`
    setUploadingId(uploadKey)
    try {
      const iconDataUrl = await optimizeSquareImage(file, 256)
      setPaymentMethods((prev) =>
        prev.map((method, itemIndex) =>
          itemIndex === index ? { ...method, iconDataUrl } : method,
        ),
      )
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Настройки" subtitle="Витрина, реквизиты и Crypto Pay" />

      <div className="grid gap-3 px-4 pb-4 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="grid gap-3">
          <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Магазин</p>
            <div className="mt-3 grid gap-3">
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Название"
                className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
              <textarea
                value={welcomeText}
                onChange={(e) => setWelcomeText(e.target.value)}
                placeholder="Текст на главной"
                className="min-h-24 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
              <textarea
                value={supportIntro}
                onChange={(e) => setSupportIntro(e.target.value)}
                placeholder="Текст на экране тикетов"
                className="min-h-24 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
              <input
                value={supportUsername}
                onChange={(e) => setSupportUsername(e.target.value)}
                placeholder="Username поддержки"
                className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
            </div>
          </section>

          <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[var(--color-muted)]" />
              <p className="text-sm font-semibold text-[var(--color-text)]">Crypto Pay</p>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] px-4 py-3">
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
                className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={cryptoPayFiat}
                  onChange={(e) => setCryptoPayFiat(e.target.value.toUpperCase())}
                  placeholder="RUB"
                  className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                />
                <input
                  value={cryptoPayDefaultAssets}
                  onChange={(e) => setCryptoPayDefaultAssets(e.target.value.toUpperCase())}
                  placeholder="USDT,TON,BTC"
                  className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                />
              </div>
              <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] px-4 py-3">
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

        <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">Способы оплаты</p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setPaymentMethods((prev) => [
                    ...prev,
                    {
                      ...emptyMethod,
                      title: "СБП / Т-Банк",
                      details: "Оплата по номеру телефона: +7...\nПолучатель: ...\nПосле оплаты отправь чек в тикет.",
                    },
                  ])
                }
                className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-muted)]"
              >
                шаблон
              </button>
              <button
                onClick={() => setPaymentMethods((prev) => [...prev, emptyMethod])}
                className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]"
              >
                <Plus size={12} className="inline-block" /> добавить
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3">
            {paymentMethods.map((method, index) => {
              const uploadKey = method.id || `new-${index}`
              return (
                <div key={uploadKey} className="rounded-[24px] bg-[var(--color-bg)] p-3">
                  <div className="grid gap-3 sm:grid-cols-[96px_1fr]">
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleMethodIcon(index, event.target.files?.[0] || null)}
                      />
                      <div className="overflow-hidden rounded-[20px] bg-[var(--color-surface)]">
                        <div className="aspect-square">
                          {method.iconDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={method.iconDataUrl} alt="" className="size-full object-cover" />
                          ) : (
                            <div className="flex size-full flex-col items-center justify-center gap-2 text-[var(--color-muted)]">
                              <ImagePlus size={18} />
                              <span className="text-[11px]">
                                {uploadingId === uploadKey ? "..." : "иконка"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </label>

                    <div className="grid gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
                          {method.isActive ? "Активен" : "Скрыт"}
                        </span>
                        <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
                          {method.type === "MANUAL" ? "Ручная оплата" : "Crypto Pay"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(["MANUAL", "CRYPTO_PAY"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() =>
                              setPaymentMethods((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, type } : item,
                                ),
                              )
                            }
                            className={cn(
                              "rounded-full px-3 py-1.5 text-xs",
                              method.type === type
                                ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                                : "bg-[var(--color-surface)] text-[var(--color-muted)]",
                            )}
                          >
                            {type === "MANUAL" ? "Ручная" : "Crypto Pay"}
                          </button>
                        ))}
                        <button
                          onClick={() =>
                            setPaymentMethods((prev) =>
                              prev.length === 1
                                ? [emptyMethod]
                                : prev.filter((_, itemIndex) => itemIndex !== index),
                            )
                          }
                          className="ml-auto flex size-9 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <input
                        value={method.title}
                        onChange={(event) =>
                          setPaymentMethods((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, title: event.target.value } : item,
                            ),
                          )
                        }
                        placeholder="Название"
                        className="w-full rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                      />

                      {method.type === "MANUAL" ? (
                        <textarea
                          value={method.details}
                          onChange={(event) =>
                            setPaymentMethods((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, details: event.target.value } : item,
                              ),
                            )
                          }
                          placeholder="Реквизиты и инструкция. Например: банк, номер, имя получателя, что отправить после оплаты."
                          className="min-h-24 w-full rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                        />
                      ) : (
                        <div className="grid gap-3">
                          <input
                            value={method.cryptoAcceptedAssets}
                            onChange={(event) =>
                              setPaymentMethods((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index
                                    ? { ...item, cryptoAcceptedAssets: event.target.value.toUpperCase() }
                                    : item,
                                ),
                              )
                            }
                            placeholder="USDT,TON,BTC"
                            className="w-full rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          />
                          <textarea
                            value={method.details}
                            onChange={(event) =>
                              setPaymentMethods((prev) =>
                                prev.map((item, itemIndex) =>
                                  itemIndex === index ? { ...item, details: event.target.value } : item,
                                ),
                              )
                            }
                            placeholder="Текст под оплатой"
                            className="min-h-20 w-full rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-3 rounded-2xl bg-[var(--color-surface)] px-4 py-3">
                        <input
                          checked={method.isActive}
                          onChange={(event) =>
                            setPaymentMethods((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, isActive: event.target.checked } : item,
                              ),
                            )
                          }
                          type="checkbox"
                          className="size-4 accent-[var(--color-accent)]"
                        />
                        <span className="text-sm text-[var(--color-text)]">Показывать покупателю</span>
                      </label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-[var(--color-accent-text)]"
        >
          {mutation.isPending ? "Сохранение..." : "Сохранить настройки"}
        </button>
      </div>
    </Screen>
  )
}
