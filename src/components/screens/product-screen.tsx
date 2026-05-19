"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Cell, Section, Spinner, Subheadline, Text, Title } from "@telegram-apps/telegram-ui"

import { createTicket, getProduct } from "@/lib/api"
import { Button } from "@/components/ui"
import { Screen, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"

export function ProductScreen({ productId }: { productId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
  const { data } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  })

  const ticketMutation = useMutation({
    mutationFn: () =>
      createTicket({
        productId,
        subject: `Покупка: ${data?.product.title || "товар"}`,
        message:
          data?.product.deliveryType === "AUTO_KEY"
            ? `Хочу купить ${data?.product.title}. После оплаты нужен автоматический ключ.`
            : `Хочу купить ${data?.product.title}. Нужны реквизиты и инструкция по активации.`,
      }),
    onSuccess: async ({ ticketId }) => {
      haptic.success()
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      router.replace(`/tickets/${ticketId}`)
    },
  })

  useBackButton(() => router.back())
  useMainButton({
    text: ticketMutation.isPending ? "Создаём..." : "Создать тикет на покупку",
    onClick: () => ticketMutation.mutate(),
    visible: true,
    enabled: !ticketMutation.isPending && Boolean(data?.product),
    progress: ticketMutation.isPending,
  })

  if (!data) {
    return (
      <Screen noTabBar>
        <div className="flex min-h-dvh items-center justify-center">
          <Spinner size="m" />
        </div>
      </Screen>
    )
  }

  const autoKey = data.product.deliveryType === "AUTO_KEY"

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader
        title={data.product.title}
        subtitle={data.product.category || "Software subscription"}
      />

      <Section>
        <Title level="1">{data.product.priceRub.toLocaleString("ru-RU")} ₽</Title>
        <Text className="mt-2 block">{data.product.description}</Text>
        <Subheadline level="2" className="mt-2 block">
          {autoKey
            ? "После подтверждения оплаты система выдаст ключ прямо в тикет."
            : "После оплаты админ отправит инструкции и доступ."}
        </Subheadline>
        {autoKey ? (
          <Subheadline level="2" className="mt-2 block">
            Свободных ключей: {data.product.availableKeyCount ?? 0}
          </Subheadline>
        ) : null}
      </Section>

      <Section header="Как проходит покупка">
        <Cell multiline>1. Создаёшь тикет по этому товару.</Cell>
        <Cell multiline>2. Получаешь реквизиты для оплаты.</Cell>
        <Cell multiline>3. Отправляешь подтверждение оплаты.</Cell>
        <Cell multiline>
          4.{" "}
          {autoKey
            ? "После подтверждения оплаты автоматически выдаётся следующий свободный ключ."
            : "Админ вручную подтверждает и выдаёт доступ или инструкцию."}
        </Cell>
      </Section>

      <Section>
        <Button onClick={() => ticketMutation.mutate()} disabled={ticketMutation.isPending} stretched>
          {ticketMutation.isPending ? "Создание..." : "Открыть тикет"}
        </Button>
      </Section>
    </Screen>
  )
}
