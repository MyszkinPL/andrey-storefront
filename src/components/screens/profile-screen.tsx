"use client"

import { useQuery } from "@tanstack/react-query"
import { Avatar, Cell, Image as TgImage, Placeholder, Section } from "@telegram-apps/telegram-ui"
import { CreditCard } from "lucide-react"

import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { getMe, getPaymentMethods } from "@/lib/api"

export function ProfileScreen() {
  const { data: meData, isLoading: isLoadingMe, isError: isErrorMe } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  })
  const {
    data: paymentData,
    isLoading: isLoadingPayments,
    isError: isErrorPayments,
  } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = (paymentData?.paymentMethods ?? []).filter((method) => method.isActive)
  const hasCryptoPay = Boolean(paymentData?.cryptoPay.enabled)

  return (
    <Screen>
      <ScreenHeader
        title={meData?.user.firstName || "Профиль"}
        subtitle={
          meData?.user.username
            ? `@${meData.user.username}`
            : meData?.user.role === "ADMIN"
              ? "Администратор"
              : "Покупатель"
        }
        trailing={
          <Avatar
            size={40}
            src={meData?.user.photoUrl || undefined}
            acronym={(meData?.user.firstName || "S").slice(0, 1).toUpperCase()}
            alt={meData?.user.firstName || "Профиль"}
          />
        }
      />

      <ScreenBody className="gap-3">
        {isLoadingMe || isLoadingPayments ? (
          <Placeholder header="Загружаю профиль" description="Подтягиваю данные магазина и оплаты.">
            <CreditCard size={32} />
          </Placeholder>
        ) : isErrorMe || isErrorPayments ? (
          <Placeholder header="Профиль не загрузился" description="Обнови экран или попробуй позже.">
            <CreditCard size={32} />
          </Placeholder>
        ) : methods.length === 0 && !hasCryptoPay ? (
          <Placeholder header="Реквизитов пока нет" description="Админ добавит способы оплаты позже.">
            <CreditCard size={32} />
          </Placeholder>
        ) : (
          <Section header="Способы оплаты">
            {methods.map((method) => (
              <Cell
                key={method.id}
                multiline
                before={<PaymentMethodIcon iconDataUrl={method.iconDataUrl} title={method.title} />}
                subtitle={method.details}
              >
                {method.title}
              </Cell>
            ))}
            {hasCryptoPay ? (
              <Cell
                multiline
                before={
                  <PaymentMethodIcon
                    iconDataUrl={paymentData?.cryptoPay.iconDataUrl || null}
                    title="CR"
                  />
                }
                subtitle={
                  paymentData?.cryptoPay.acceptedAssets
                    ? `Автооплата · ${paymentData.cryptoPay.acceptedAssets}`
                    : "Автооплата через invoice"
                }
              >
                {paymentData?.cryptoPay.title || "Crypto Bot"}
              </Cell>
            ) : null}
          </Section>
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
  return (
    <TgImage
      size={48}
      src={iconDataUrl || undefined}
      alt=""
      fallbackIcon={<span>{title.slice(0, 2).toUpperCase()}</span>}
    />
  )
}
