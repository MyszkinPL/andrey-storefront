"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Checkbox, Placeholder, Section } from "@telegram-apps/telegram-ui"

import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { Button, Input, Textarea } from "@/components/ui"
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
      <ScreenHeader title="Настройки" subtitle="Тексты, контакты и реквизиты оплаты" />

      <Section header="Магазин">
        <Input value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="Название" />
        <Textarea
          value={welcomeText}
          onChange={(event) => setWelcomeText(event.target.value)}
          placeholder="Текст на главной"
        />
        <Textarea
          value={supportIntro}
          onChange={(event) => setSupportIntro(event.target.value)}
          placeholder="Текст на экране тикетов"
        />
        <Input
          value={supportUsername}
          onChange={(event) => setSupportUsername(event.target.value)}
          placeholder="Telegram username support"
        />
      </Section>

      <Section header="Реквизиты" footer="Можно держать несколько способов оплаты и временно выключать любой из них.">
        {paymentMethods.length === 0 ? (
          <Placeholder
            header="Реквизитов пока нет"
            description="Добавь хотя бы один способ оплаты ниже."
          />
        ) : null}

        {paymentMethods.map((method, index) => (
          <div key={method.id || index} className="pb-4">
            <Input
              value={method.title}
              onChange={(event) =>
                setPaymentMethods((prev) =>
                  prev.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, title: event.target.value } : item,
                  ),
                )
              }
              placeholder="Название способа оплаты"
            />
            <Textarea
              value={method.details}
              onChange={(event) =>
                setPaymentMethods((prev) =>
                  prev.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, details: event.target.value } : item,
                  ),
                )
              }
              placeholder="Реквизиты"
              className="mt-3"
            />
            <label className="mt-3 flex items-center gap-3">
              <Checkbox
                checked={method.isActive}
                onChange={(event) =>
                  setPaymentMethods((prev) =>
                    prev.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, isActive: event.target.checked } : item,
                    ),
                  )
                }
              />
              <span>Способ оплаты активен</span>
            </label>
          </div>
        ))}

        <Button
          variant="secondary"
          onClick={() =>
            setPaymentMethods((prev) => [...prev, { title: "", details: "", isActive: true }])
          }
        >
          Добавить реквизит
        </Button>
      </Section>

      <Section>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} stretched>
          {mutation.isPending ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </Section>
    </Screen>
  )
}
