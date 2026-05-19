"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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
  const summary = [
    product.category || "digital",
    product.deliveryType === "AUTO_KEY"
      ? `${product.availableKeyCount ?? 0} keys`
      : "manual delivery",
  ]

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader title={product.title} subtitle={summary.join(" · ")} />

      <div className="grid gap-3 px-4 pb-4">
        <section className="overflow-hidden rounded-[24px] bg-[var(--color-surface)]">
          <div className="aspect-square bg-[var(--color-surface-2)]">
            {product.imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageDataUrl} alt="" className="size-full object-cover" />
            ) : null}
          </div>

          <div className="grid gap-3 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-2xl font-semibold text-[var(--color-text)]">
                  {product.priceRub.toLocaleString("ru-RU")} ₽
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {summary.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-[11px] text-[var(--color-muted)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-sm leading-6 text-[var(--color-muted)]">{product.description}</p>
          </div>
        </section>

        {product.specs.length > 0 ? (
          <section className="rounded-[24px] bg-[var(--color-surface)] p-3">
            <div className="grid gap-2">
              {product.specs.map((spec) => (
                <div
                  key={`${spec.label}-${spec.value}`}
                  className="flex items-center justify-between gap-3 rounded-[18px] bg-[var(--color-surface-2)] px-3 py-3"
                >
                  <span className="text-sm text-[var(--color-muted)]">{spec.label}</span>
                  <span className="text-right text-sm font-medium text-[var(--color-text)]">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[24px] bg-[var(--color-surface)] p-3">
          <div className="flex items-center justify-between gap-3 px-1 pb-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">Оплата</p>
            <span className="text-[11px] text-[var(--color-muted)]">{methods.length} способ</span>
          </div>

          <div className="grid gap-2">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethodId(method.id)}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition-colors",
                  selectedMethodId === method.id
                    ? "border-[var(--color-accent)] bg-[var(--color-surface-2)]"
                    : "border-transparent bg-[var(--color-surface-2)]",
                )}
              >
                <PaymentMethodIcon iconDataUrl={method.iconDataUrl} title={method.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">{method.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-[var(--color-muted)]">
                    {method.type === "CRYPTO_PAY"
                      ? method.cryptoAcceptedAssets || "Crypto Pay"
                      : method.details}
                  </p>
                </div>
                <div
                  className={cn(
                    "size-4 rounded-full border",
                    selectedMethodId === method.id
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                      : "border-[var(--color-border)]",
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
      <img src={iconDataUrl} alt="" className="size-11 rounded-[16px] object-cover" />
    )
  }

  return (
    <div className="flex size-11 items-center justify-center rounded-[16px] bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}
