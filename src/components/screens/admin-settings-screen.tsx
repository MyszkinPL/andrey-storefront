"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getMe, getPaymentMethods, saveSettings } from "@/lib/api"
import { Button, Card, Input, Textarea } from "@/components/ui"
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

      <div className="grid gap-3 px-4 pb-5 xl:grid-cols-[1fr,1fr]">
        <Card className="space-y-3 p-5">
          <p className="text-base font-semibold">Магазин</p>
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
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-base font-semibold">Реквизиты</p>
          <div className="flex flex-col gap-3">
            {paymentMethods.map((method, index) => (
              <div key={method.id || index} className="rounded-2xl border border-white/8 p-3">
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
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            onClick={() =>
              setPaymentMethods((prev) => [
                ...prev,
                { title: "", details: "", isActive: true },
              ])
            }
          >
            Добавить реквизит
          </Button>
        </Card>
      </div>

      <div className="px-4 pb-5">
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "Сохранение..." : "Сохранить настройки"}
        </Button>
      </div>
    </Screen>
  )
}
