"use client"

import { useQuery } from "@tanstack/react-query"
import { Cell, Placeholder, Section, Text, Title } from "@telegram-apps/telegram-ui"

import { getMe, getPaymentMethods } from "@/lib/api"
import { Badge } from "@/components/ui"
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

      <Section
        header={
          <div className="flex items-center justify-between gap-3">
            <span>Поддержка</span>
            {meData?.user.role === "ADMIN" ? <Badge>Админ</Badge> : null}
          </div>
        }
      >
        <Text>{meData?.settings.supportIntro}</Text>
        {meData?.settings.supportUsername ? (
          <Text className="mt-2 block">Telegram: @{meData.settings.supportUsername}</Text>
        ) : null}
      </Section>

      <Section header="Реквизиты">
        {(paymentData?.paymentMethods || []).length === 0 ? (
          <Placeholder header="Реквизитов пока нет" description="Админ добавит способы оплаты в настройках." />
        ) : null}
        {(paymentData?.paymentMethods || []).map((method) => (
          <Cell key={method.id} multiline description={method.details}>
            <Title level="3">{method.title}</Title>
          </Cell>
        ))}
      </Section>
    </Screen>
  )
}
