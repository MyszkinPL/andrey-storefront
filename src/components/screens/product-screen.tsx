"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, KeyRound, MessageSquareMore } from "lucide-react"

import { createTicket, getProduct } from "@/lib/api"
import { Button, Card } from "@/components/ui"
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
          <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
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
        trailing={
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-white/8 bg-[var(--color-surface)] p-3"
          >
            <ArrowLeft size={18} />
          </button>
        }
      />

      <div className="grid gap-4 px-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">
                {data.product.priceRub.toLocaleString("ru-RU")} ₽
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {autoKey
                  ? "После подтверждения оплаты система выдаст ключ прямо в тикет."
                  : "После оплаты админ отправит инструкции и доступ."}
              </p>
            </div>
            <div className="rounded-3xl bg-[var(--color-accent)]/18 p-4 text-[var(--color-accent)]">
              {autoKey ? <KeyRound size={24} /> : <MessageSquareMore size={24} />}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted)]">
            {data.product.description}
          </p>
        </Card>

        <Card className="space-y-4 p-5">
          <p className="text-base font-semibold">Как проходит покупка</p>
          <ol className="space-y-3 text-sm leading-6 text-[var(--color-muted)]">
            <li>1. Создаёшь тикет по этому товару.</li>
            <li>2. Получаешь реквизиты для оплаты.</li>
            <li>3. Отправляешь подтверждение оплаты.</li>
            <li>
              4.{" "}
              {autoKey
                ? "После подтверждения оплаты автоматически выдаётся следующий свободный ключ."
                : "Админ вручную подтверждает и выдаёт доступ/инструкцию."}
            </li>
          </ol>
          {autoKey ? (
            <p className="text-sm text-[var(--color-accent)]">
              Свободных ключей: {data.product.availableKeyCount ?? 0}
            </p>
          ) : null}
          <Button onClick={() => ticketMutation.mutate()} disabled={ticketMutation.isPending} className="w-full">
            {ticketMutation.isPending ? "Создание..." : "Открыть тикет"}
          </Button>
        </Card>
      </div>
    </Screen>
  )
}
