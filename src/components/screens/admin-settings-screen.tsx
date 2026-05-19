"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { Screen, ScreenHeader } from "@/components/screen"

type PaymentMethodForm = {
  id?: string
  title: string
  details: string
  isActive: boolean
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodForm[]>([])

  useEffect(() => {
    if (!meData) return
    queueMicrotask(() => {
      setShopName(meData.settings.shopName)
      setWelcomeText(meData.settings.welcomeText)
      setSupportIntro(meData.settings.supportIntro)
      setSupportUsername(meData.settings.supportUsername || "")
    })
  }, [meData])

  useEffect(() => {
    if (!paymentData) return
    queueMicrotask(() => {
      setPaymentMethods(paymentData.paymentMethods)
    })
  }, [paymentData])

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        shopName,
        welcomeText,
        supportIntro,
        supportUsername,
        paymentMethods,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })

  return (
    <Screen>
      <ScreenHeader title="Настройки" subtitle="Тексты и реквизиты" />

      <div className="grid gap-3 px-4 pb-4 xl:grid-cols-2">
        <div className="rounded-2xl bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">Магазин</p>
          <div className="mt-3 grid gap-3">
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Название" className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" />
            <textarea value={welcomeText} onChange={(e) => setWelcomeText(e.target.value)} placeholder="Текст на главной" className="min-h-24 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" />
            <textarea value={supportIntro} onChange={(e) => setSupportIntro(e.target.value)} placeholder="Текст на экране тикетов" className="min-h-24 w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" />
            <input value={supportUsername} onChange={(e) => setSupportUsername(e.target.value)} placeholder="Username поддержки" className="w-full rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none" />
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text)]">Реквизиты</p>
          <div className="mt-3 grid gap-3">
            {paymentMethods.map((method, index) => (
              <div key={method.id || index} className="rounded-2xl bg-[var(--color-bg)] p-3">
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
                  className="w-full rounded-xl bg-transparent px-2 py-2 text-sm text-[var(--color-text)] outline-none"
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
                  placeholder="Реквизиты"
                  className="mt-2 min-h-24 w-full rounded-xl bg-transparent px-2 py-2 text-sm text-[var(--color-text)] outline-none"
                />
              </div>
            ))}
            <button
              onClick={() => setPaymentMethods((prev) => [...prev, { title: "", details: "", isActive: true }])}
              className="rounded-2xl bg-[var(--color-bg)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
            >
              Добавить реквизит
            </button>
          </div>
        </div>
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
