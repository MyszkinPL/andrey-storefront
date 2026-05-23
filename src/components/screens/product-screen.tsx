"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Expand, KeyRound, X } from "lucide-react"

import { createTicket, getPaymentMethods, getProduct } from "@/lib/api"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"
import { cn } from "@/lib/cn"

export function ProductScreen({ productId }: { productId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
  const [isImageOpen, setIsImageOpen] = useState(false)
  const [selectedPaymentKey, setSelectedPaymentKey] = useState("")
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
  const paymentOptions = useMemo(
    () => [
      ...methods.map((method) => ({
        key: `manual:${method.id}`,
        type: "MANUAL" as const,
        id: method.id,
        title: method.title,
        subtitle: method.details,
        iconDataUrl: method.iconDataUrl,
      })),
      ...(paymentData?.cryptoPay.enabled
        ? [
            {
              key: "crypto:auto",
              type: "CRYPTO_PAY" as const,
              id: undefined,
              title: paymentData?.cryptoPay.title || "Crypto Bot",
              subtitle:
                paymentData?.cryptoPay.acceptedAssets
                  ? `Автооплата · ${paymentData.cryptoPay.acceptedAssets}`
                  : "Автооплата через invoice",
              iconDataUrl: paymentData?.cryptoPay.iconDataUrl || null,
            },
          ]
        : []),
    ],
    [methods, paymentData],
  )
  const selectedPayment = paymentOptions.find(
    (option) => option.key === (selectedPaymentKey || paymentOptions[0]?.key),
  )

  const ticketMutation = useMutation({
    mutationFn: () =>
      createTicket({
        productId,
        paymentMethodId: selectedPayment?.type === "MANUAL" ? selectedPayment.id : undefined,
        subject: `Покупка: ${data?.product.title || "товар"}`,
        paymentMethodType: selectedPayment?.type,
      }),
    onSuccess: async ({ ticketId }) => {
      haptic.success()
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      router.replace(`/tickets/${ticketId}`)
    },
  })

  useBackButton(() => router.back())
  useMainButton({
    text: ticketMutation.isPending ? "Создаём..." : "Оформить заказ",
    onClick: () => ticketMutation.mutate(),
    visible: true,
    enabled: !ticketMutation.isPending && Boolean(data?.product) && Boolean(selectedPayment),
    progress: ticketMutation.isPending,
  })

  if (!data?.product) return null

  const product = data.product
  const category = product.category || "digital"
  const deliveryLabel =
    product.deliveryType === "AUTO_KEY" ? "Автовыдача ключа" : "Ручная выдача"
  const deliveryHint =
    product.deliveryType === "AUTO_KEY"
      ? `${product.availableKeyCount ?? 0} ключей в остатке`
      : "Оплата и активация через заказ"

  return (
    <Screen noTabBar className="pb-6">
      <ScreenHeader title={product.title} subtitle={`${category} · ${deliveryLabel}`} />

      <ScreenBody className="gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(350px,0.92fr)]">
        <section className="ui-card overflow-hidden">
          <div className="p-3 sm:p-4">
            <button
              type="button"
              onClick={() => product.imageDataUrl && setIsImageOpen(true)}
              className={cn(
                "group relative flex h-[260px] w-full items-center justify-center overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-2)] sm:h-[320px] xl:h-[360px]",
                product.imageDataUrl ? "cursor-zoom-in" : "cursor-default",
              )}
            >
            {product.imageDataUrl ? (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_52%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18))]" />
                <Image
                  src={product.imageDataUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 1280px) 100vw, 60vw"
                  className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03] sm:p-6"
                />
              </>
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_44%),linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_58%),linear-gradient(180deg,var(--color-surface-2),color-mix(in_srgb,var(--color-bg)_78%,var(--color-surface)_22%))]" />
            )}

            <div className="absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-4 sm:p-5">
              <div className="flex flex-wrap gap-2">
                <span className="ui-pill border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_74%,transparent)] text-[var(--color-text)]">
                  {category}
                </span>
                <span className="ui-pill border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_74%,transparent)] text-[var(--color-text)]">
                  {deliveryLabel}
                </span>
              </div>
              {product.deliveryType === "AUTO_KEY" ? (
                <div className="ui-pill border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_74%,transparent)] text-[var(--color-text)]">
                  <KeyRound size={12} />
                  {product.availableKeyCount ?? 0} keys
                </div>
              ) : null}
            </div>

              {product.imageDataUrl ? (
                <div className="absolute bottom-4 right-4 flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_76%,transparent)] text-[var(--color-text)] backdrop-blur sm:bottom-5 sm:right-5">
                  <Expand size={16} />
                </div>
              ) : null}
            </button>
          </div>

            <div className="grid gap-5 p-4 sm:p-5">
              <div className="flex flex-col gap-3">
                <p className="text-[30px] font-semibold leading-none text-[var(--color-text)]">
                  {product.priceRub.toLocaleString("ru-RU")} ₽
                </p>
                <p className="text-sm leading-6 text-[var(--color-muted)]">{deliveryHint}</p>
              </div>

            <div className="grid gap-3">
              <SectionTitle title="Описание" />
              <div className="ui-card-soft p-4 sm:p-5">
                <p className="text-sm leading-7 text-[var(--color-text)]/92">{product.description}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4">
          {product.specs.length > 0 ? (
            <section className="ui-card p-3 sm:p-4">
              <SectionTitle
                title="Характеристики"
                subtitle={undefined}
                trailing={
                  <span className="ui-pill bg-[var(--color-bg)] text-[var(--color-text)]">
                    {product.specs.length}
                  </span>
                }
              />
              <div className="mt-3 grid gap-2">
                {product.specs.map((spec, index) => (
                  <div
                    key={`${spec.label}-${spec.value}`}
                    className="ui-card-soft grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] sm:items-center sm:px-4"
                  >
                    <div className="flex items-center gap-2 text-[var(--color-muted)]">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[11px] font-semibold text-[var(--color-text)]">
                        {index + 1}
                      </div>
                      <span className="text-sm">{spec.label}</span>
                    </div>
                    <div className="text-sm font-medium leading-6 text-[var(--color-text)] sm:text-right">
                      {spec.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="ui-card p-3 sm:p-4">
            <SectionTitle
              title="Оплата"
              subtitle="Выбери удобный способ"
              trailing={
                <span className="text-[11px] text-[var(--color-muted)]">
                  {paymentOptions.length} {paymentOptions.length === 1 ? "способ" : "способа"}
                </span>
              }
            />

            <div className="mt-3 grid gap-2">
              {paymentOptions.map((option) => {
                const isActive = selectedPayment?.key === option.key

                return (
                  <button
                    key={option.key}
                    onClick={() => setSelectedPaymentKey(option.key)}
                    className={cn(
                      "ui-card-soft relative overflow-hidden px-3 py-3 text-left transition-all duration-150 active:scale-[0.99] sm:px-4",
                      isActive && "border-[var(--color-accent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--color-accent)_18%,transparent)]",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute inset-0 opacity-0 transition-opacity",
                        isActive &&
                          "opacity-100 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-accent)_16%,transparent),transparent_62%)]",
                      )}
                    />
                    <div className="relative flex items-center gap-3">
                      <PaymentMethodIcon iconDataUrl={option.iconDataUrl} title={option.title} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                            {option.title}
                          </p>
                          <span className="ui-pill bg-[var(--color-bg)] text-[var(--color-text)]">
                            {option.type === "CRYPTO_PAY" ? "Автооплата" : "Ручная"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--color-muted)]">
                          {option.subtitle}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                          isActive
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                            : "border-[var(--color-border)] text-transparent",
                        )}
                      >
                        <Check size={13} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {ticketMutation.error ? (
              <div className="mt-3 rounded-[18px] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-destructive)]">
                {ticketMutation.error.message}
              </div>
            ) : null}
          </section>
        </div>
      </ScreenBody>

      {product.imageDataUrl && isImageOpen ? (
        <ImagePreviewModal
          src={product.imageDataUrl}
          title={product.title}
          onClose={() => setIsImageOpen(false)}
        />
      ) : null}
    </Screen>
  )
}

function SectionTitle({
  title,
  subtitle,
  trailing,
}: {
  title: string
  subtitle?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-1">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
        {subtitle ? <p className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</p> : null}
      </div>
      {trailing}
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
      <div className="relative size-12 overflow-hidden rounded-[18px]">
        <Image src={iconDataUrl} alt="" fill unoptimized sizes="48px" className="object-cover" />
      </div>
    )
  }

  return (
    <div className="flex size-12 items-center justify-center rounded-[18px] bg-[var(--color-bg)] text-xs font-semibold text-[var(--color-text)]">
      {title.slice(0, 2).toUpperCase()}
    </div>
  )
}

function ImagePreviewModal({
  src,
  title,
  onClose,
}: {
  src: string
  title: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-bg)_90%,transparent)] p-3 backdrop-blur"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(90vh,920px)] w-full max-w-6xl items-center justify-center overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_76%,transparent)] text-[var(--color-text)]"
        >
          <X size={16} />
        </button>

        <div className="absolute left-4 top-4 z-10 max-w-[calc(100%-80px)] rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_76%,transparent)] px-3 py-2 text-xs text-[var(--color-text)]">
          {title}
        </div>

        <div className="relative h-full w-full">
          <Image src={src} alt="" fill unoptimized sizes="100vw" className="object-contain" />
        </div>
      </div>
    </div>
  )
}
