"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react"

import { createTicket, getProduct } from "@/lib/api"
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
    text: ticketMutation.isPending ? "Создаём..." : "Открыть тикет",
    onClick: () => ticketMutation.mutate(),
    visible: true,
    enabled: !ticketMutation.isPending && Boolean(data?.product),
    progress: ticketMutation.isPending,
  })

  if (!data?.product) return null

  const product = data.product
  const autoKey = product.deliveryType === "AUTO_KEY"

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader title={product.title} subtitle={product.category || "digital product"} />

      <div className="grid gap-3 px-4 pb-4">
        <section className="rounded-2xl bg-[var(--color-surface)] p-4">
          <div className="aspect-square rounded-2xl bg-[var(--color-bg)]" />
          <p className="mt-4 text-2xl font-semibold text-[var(--color-text)]">
            {product.priceRub.toLocaleString("ru-RU")} ₽
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{product.description}</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <FeatureCard
            icon={ShieldCheck}
            title="Покупка через тикет"
            subtitle="Оплата и вся переписка внутри магазина"
          />
          <FeatureCard
            icon={autoKey ? KeyRound : Sparkles}
            title={autoKey ? "Автовыдача ключа" : "Ручная выдача"}
            subtitle={
              autoKey
                ? `Доступно ключей: ${product.availableKeyCount ?? 0}`
                : "Продавец подтверждает и отправляет доступ вручную"
            }
          />
          <FeatureCard
            icon={Sparkles}
            title="Поддержка"
            subtitle="Если что-то не так — пишешь в этот же тикет"
          />
        </section>
      </div>
    </Screen>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof ShieldCheck
  title: string
  subtitle: string
}) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] p-4">
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
        <Icon size={18} />
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{subtitle}</p>
    </div>
  )
}
