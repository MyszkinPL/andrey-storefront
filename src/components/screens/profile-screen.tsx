"use client"

import { useQuery } from "@tanstack/react-query"
import { BadgeInfo, CreditCard } from "lucide-react"

import { getMe, getPaymentMethods } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { Avatar } from "@/components/ui"

export function ProfileScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = (paymentData?.paymentMethods ?? []).filter((method) => method.isActive)
  const hasCryptoPay = Boolean(paymentData?.cryptoPay.enabled)

  return (
    <Screen>
      <ScreenHeader
        inlineTrailingMobile
        title={
          <div>
            <p>{meData?.user.firstName || "Профиль"}</p>
            <p className="mt-1 text-xs font-normal text-[var(--color-muted)]">
              {meData?.user.role === "ADMIN" ? "Администратор" : "Покупатель"}
            </p>
          </div>
        }
        subtitle={meData?.user.username ? `@${meData.user.username}` : "Telegram"}
        trailing={
          meData?.user.photoUrl ? (
            <Avatar size={40} src={meData.user.photoUrl} alt={meData.user.firstName} />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-sm font-semibold text-[var(--color-text)]">
              {(meData?.user.firstName || "S").slice(0, 1).toUpperCase()}
            </div>
          )
        }
      />

      <ScreenBody className="gap-3 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <section className="ui-card p-4 xl:col-span-2">
          <div className="flex items-start gap-2">
            <BadgeInfo size={16} className="text-[var(--color-muted)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Поддержка</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                {meData?.settings.supportIntro || "Связь с продавцом по заказам внутри магазина."}
              </p>
              {meData?.settings.supportUsername ? (
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  @{meData.settings.supportUsername}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {methods.length === 0 && !hasCryptoPay ? (
          <ScreenEmpty
            icon={<CreditCard size={30} className="text-[var(--color-muted)]" />}
            title="Реквизитов пока нет"
            subtitle="Админ добавит способы оплаты позже."
          />
        ) : (
          <section className="ui-card p-4 xl:col-span-2">
            <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Способы оплаты</p>
            <div className="grid gap-2 md:grid-cols-2">
              {methods.map((method) => (
                <div key={method.id} className="ui-card-soft flex items-center gap-3 p-3">
                  <PaymentMethodIcon iconDataUrl={method.iconDataUrl} title={method.title} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">{method.title}</p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-[var(--color-muted)]">
                      {method.details}
                    </p>
                  </div>
                </div>
              ))}
              {hasCryptoPay ? (
                <div className="ui-card-soft flex items-center gap-3 p-3">
                  <PaymentMethodIcon
                    iconDataUrl={paymentData?.cryptoPay.iconDataUrl || null}
                    title="CR"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {paymentData?.cryptoPay.title || "Crypto Bot"}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[var(--color-muted)]">
                      {paymentData?.cryptoPay.acceptedAssets
                        ? `Автооплата · ${paymentData.cryptoPay.acceptedAssets}`
                        : "Автооплата через invoice"}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        )}
      </ScreenBody>
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
