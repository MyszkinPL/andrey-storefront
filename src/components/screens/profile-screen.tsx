"use client"

import { useQuery } from "@tanstack/react-query"
import { BadgeInfo, CreditCard } from "lucide-react"

import { getMe, getPaymentMethods } from "@/lib/api"
import { Screen, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { Avatar } from "@/components/ui"

export function ProfileScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = (paymentData?.paymentMethods ?? []).filter((method) => method.isActive)

  return (
    <Screen>
      <ScreenHeader
        title={meData?.user.firstName || "Профиль"}
        subtitle={meData?.user.username ? `@${meData.user.username}` : "Telegram customer"}
      />

      <div className="grid gap-3 px-4 pb-4">
        <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
          <div className="flex items-center gap-3">
            {meData?.user.photoUrl ? (
              <Avatar size={48} src={meData.user.photoUrl} alt={meData.user.firstName} />
            ) : (
              <div className="flex size-13 items-center justify-center rounded-full bg-[var(--color-bg)] text-base font-semibold text-[var(--color-text)]">
                {(meData?.user.firstName || "S").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {meData?.user.firstName || "Покупатель"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {meData?.user.role === "ADMIN" ? "Администратор" : "Покупатель"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
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
          <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
            <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Способы оплаты</p>
            <div className="grid gap-2">
              {methods.map((method) => (
                <div key={method.id} className="flex items-center gap-3 rounded-2xl bg-[var(--color-bg)] p-3">
                  <PaymentMethodIcon iconDataUrl={method.iconDataUrl} title={method.title} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">{method.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--color-muted)]">
                      {method.type === "CRYPTO_PAY"
                        ? method.cryptoAcceptedAssets
                          ? `Crypto Pay · ${method.cryptoAcceptedAssets}`
                          : "Crypto Pay"
                        : method.details}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Screen>
  )
}

function PaymentMethodIcon({
  iconDataUrl,
  title,
}: {
  iconDataUrl: string | null
  title: string
}) {
  if (iconDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={iconDataUrl} alt="" className="size-11 rounded-2xl object-cover" />
    )
  }

  return (
    <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}
