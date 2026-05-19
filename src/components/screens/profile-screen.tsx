"use client"

import { useQuery } from "@tanstack/react-query"
import { BadgeInfo, CreditCard, User2 } from "lucide-react"

import { getMe, getPaymentMethods } from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"

export function ProfileScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = paymentData?.paymentMethods ?? []

  return (
    <Screen>
      <ScreenHeader
        title={meData?.user.firstName || "Профиль"}
        subtitle={meData?.user.username ? `@${meData.user.username}` : "Telegram customer"}
      />

      <div className="grid gap-3 px-4 pb-4">
        <section className="rounded-2xl bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
              <User2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {meData?.user.firstName || "Покупатель"}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {meData?.user.role === "ADMIN" ? "Администратор" : "Покупатель"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--color-surface)] p-4">
          <div className="mb-3 flex items-center gap-2">
            <BadgeInfo size={16} className="text-[var(--color-muted)]" />
            <p className="text-sm font-semibold text-[var(--color-text)]">Поддержка</p>
          </div>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {meData?.settings.supportIntro || "Связь с продавцом внутри тикетов."}
          </p>
          {meData?.settings.supportUsername ? (
            <p className="mt-3 text-sm text-[var(--color-text)]">@{meData.settings.supportUsername}</p>
          ) : null}
        </section>

        {methods.length === 0 ? (
          <ScreenEmpty
            icon={<CreditCard size={30} className="text-[var(--color-muted)]" />}
            title="Реквизитов пока нет"
            subtitle="Админ добавит способы оплаты позже."
          />
        ) : (
          <section className="rounded-2xl bg-[var(--color-surface)] p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Способы оплаты</p>
            <div className="grid gap-3">
              {methods.map((method) => (
                <div key={method.id} className="rounded-2xl bg-[var(--color-bg)] p-3">
                  <p className="text-sm font-medium text-[var(--color-text)]">{method.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--color-muted)]">
                    {method.details}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Screen>
  )
}
