"use client"

import { useQuery } from "@tanstack/react-query"

import { getMe, getPaymentMethods } from "@/lib/api"
import { Badge, Card } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"

export function ProfileScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  return (
    <Screen>
      <ScreenHeader
        title={meData?.user.firstName || "Профиль"}
        subtitle={meData?.user.username ? `@${meData.user.username}` : "Telegram customer"}
      />

      <div className="grid gap-3 px-4 pb-5 lg:grid-cols-[0.9fr,1.1fr]">
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-base font-semibold">Поддержка</p>
            {meData?.user.role === "ADMIN" ? <Badge>Админ</Badge> : null}
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {meData?.settings.supportIntro}
          </p>
          {meData?.settings.supportUsername ? (
            <p className="text-sm text-[var(--color-accent)]">
              Telegram: @{meData.settings.supportUsername}
            </p>
          ) : null}
        </Card>

        <Card className="space-y-3 p-5">
          <p className="text-base font-semibold">Реквизиты</p>
          <div className="grid gap-3">
            {(paymentData?.paymentMethods || []).map((method) => (
              <div key={method.id} className="rounded-2xl border border-white/8 px-4 py-3">
                <p className="text-sm font-medium">{method.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
                  {method.details}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Screen>
  )
}
