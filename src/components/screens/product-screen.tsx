"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, KeyRound, ShieldCheck, Sparkles } from "lucide-react"

import { createTicket, getPaymentMethods, getProduct } from "@/lib/api"
import { Screen, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

export function ProductScreen({ productId }: { productId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
  const [paymentMethodId, setPaymentMethodId] = useState("")
  const { data } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = useMemo(
    () => (paymentData?.paymentMethods ?? []).filter((item) => item.isActive),
    [paymentData?.paymentMethods],
  )

  const selectedMethodId = paymentMethodId || methods[0]?.id || ""

  const ticketMutation = useMutation({
    mutationFn: () =>
      createTicket({
        productId,
        paymentMethodId: selectedMethodId || undefined,
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
    enabled: !ticketMutation.isPending && Boolean(data?.product) && Boolean(selectedMethodId),
    progress: ticketMutation.isPending,
  })

  if (!data?.product) return null

  const product = data.product
  const autoKey = product.deliveryType === "AUTO_KEY"

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader title={product.title} subtitle={product.category || "digital product"} />

      <div className="grid gap-3 px-4 pb-4">
        <section className="overflow-hidden rounded-[28px] bg-[var(--color-surface)]">
          <div className="aspect-square bg-[var(--color-bg)]">
            {product.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageDataUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-end bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_rgba(255,255,255,0.02)_60%)] p-4">
                <div className="rounded-full bg-black/20 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
                  {autoKey ? "Автовыдача ключей" : "Ручная выдача"}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  {product.category || "catalog"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                  {product.priceRub.toLocaleString("ru-RU")} ₽
                </p>
              </div>
              <div className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-muted)]">
                {autoKey ? `${product.availableKeyCount ?? 0} keys` : "support"}
              </div>
            </div>

            <p className="text-sm leading-6 text-[var(--color-muted)]">{product.description}</p>
          </div>
        </section>

        {product.specs.length > 0 ? (
          <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text)]">Характеристики</p>
            <div className="mt-3 grid gap-2">
              {product.specs.map((spec) => (
                <div
                  key={`${spec.label}-${spec.value}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-bg)] px-3 py-3"
                >
                  <span className="text-sm text-[var(--color-muted)]">{spec.label}</span>
                  <span className="text-sm font-medium text-[var(--color-text)]">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-3">
          <FeatureCard
            icon={ShieldCheck}
            title="Через Telegram"
            subtitle="Покупка, диалог и подтверждение оплаты в одном тикете"
          />
          <FeatureCard
            icon={autoKey ? KeyRound : Sparkles}
            title={autoKey ? "Автовыдача" : "Ручная выдача"}
            subtitle={
              autoKey
                ? `Свободных ключей: ${product.availableKeyCount ?? 0}`
                : "Продавец подтверждает оплату и выдает доступ вручную"
            }
          />
          <FeatureCard
            icon={CreditCard}
            title="Выбор оплаты"
            subtitle="Покупатель сам выбирает способ оплаты перед открытием тикета"
          />
        </section>

        <section className="rounded-[28px] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">Способ оплаты</p>
            <span className="text-[11px] text-[var(--color-muted)]">{methods.length} доступно</span>
          </div>

          <div className="mt-3 grid gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethodId(method.id)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  selectedMethodId === method.id
                    ? "border-[var(--color-accent)] bg-[var(--color-bg)]"
                    : "border-transparent bg-[var(--color-bg)]",
                )}
              >
                <PaymentMethodIcon iconDataUrl={method.iconDataUrl} title={method.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">{method.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                    {method.type === "CRYPTO_PAY"
                      ? method.cryptoAcceptedAssets
                        ? `Crypto Pay · ${method.cryptoAcceptedAssets}`
                        : "Crypto Pay"
                      : method.details}
                  </p>
                </div>
                <div
                  className={cn(
                    "size-4 rounded-full border",
                    selectedMethodId === method.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                      : "border-white/10",
                  )}
                />
              </button>
            ))}
          </div>
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
    <div className="rounded-[24px] bg-[var(--color-surface)] p-4">
      <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]">
        <Icon size={18} />
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{subtitle}</p>
    </div>
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
