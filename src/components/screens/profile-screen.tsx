"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, LifeBuoy } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
          <Avatar size="lg">
            {meData?.user.photoUrl ? (
              <AvatarImage src={meData.user.photoUrl} alt={meData.user.firstName} />
            ) : null}
            <AvatarFallback>{(meData?.user.firstName || "S").slice(0, 1)}</AvatarFallback>
          </Avatar>
        }
      />

      <ScreenBody>
        {isLoadingMe || isLoadingPayments ? (
          <ProfileEmpty title="Загружаю профиль" description="Подтягиваю данные магазина и оплаты." />
        ) : isErrorMe || isErrorPayments ? (
          <ProfileEmpty title="Профиль не загрузился" description="Обнови экран или попробуй позже." />
        ) : (
          <>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Аккаунт</CardTitle>
                <CardDescription>
                  {meData?.user.role === "ADMIN" ? "Администратор" : "Покупатель"}
                </CardDescription>
                <CardAction>
                  <LifeBuoy className="size-5 text-muted-foreground" />
                </CardAction>
              </CardHeader>
            </Card>

            {methods.length === 0 && !hasCryptoPay ? (
              <ProfileEmpty title="Реквизитов пока нет" description="Админ добавит способы оплаты позже." />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Способы оплаты</CardTitle>
                  <CardDescription>Доступны при оформлении заказа.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {methods.map((method) => (
                    <PaymentMethodRow
                      key={method.id}
                      iconDataUrl={method.iconDataUrl}
                      title={method.title}
                      subtitle={method.details}
                    />
                  ))}
                  {hasCryptoPay ? (
                    <PaymentMethodRow
                      iconDataUrl={paymentData?.cryptoPay.iconDataUrl || null}
                      title={paymentData?.cryptoPay.title || "Crypto Bot"}
                      subtitle={
                        paymentData?.cryptoPay.acceptedAssets
                          ? `Автооплата · ${paymentData.cryptoPay.acceptedAssets}`
                          : "Автооплата через invoice"
                      }
                    />
                  ) : null}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

function PaymentMethodRow({
  iconDataUrl,
  title,
  subtitle,
}: {
  iconDataUrl: string | null
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-3">
      <Avatar size="lg">
        {iconDataUrl ? <AvatarImage src={iconDataUrl} alt={title} /> : null}
        <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  )
}

function ProfileEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <CreditCard />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}
