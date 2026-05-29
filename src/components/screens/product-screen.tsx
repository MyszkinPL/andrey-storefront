"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Button,
  Cell,
  Image as TgImage,
  Placeholder,
  Radio,
  Section,
} from "@telegram-apps/telegram-ui"
import { PackageSearch } from "lucide-react"

import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"
import { createOrder, getPaymentMethods, getProduct } from "@/lib/api"

export function ProductScreen({ productId }: { productId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
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
              title: paymentData.cryptoPay.title || "Crypto Bot",
              subtitle: paymentData.cryptoPay.acceptedAssets
                ? `Автооплата · ${paymentData.cryptoPay.acceptedAssets}`
                : "Автооплата через invoice",
              iconDataUrl: paymentData.cryptoPay.iconDataUrl || null,
            },
          ]
        : []),
    ],
    [methods, paymentData],
  )
  const selectedPayment = paymentOptions.find(
    (option) => option.key === (selectedPaymentKey || paymentOptions[0]?.key),
  )

  const orderMutation = useMutation({
    mutationFn: () =>
      createOrder({
        productId,
        paymentMethodId: selectedPayment?.type === "MANUAL" ? selectedPayment.id : undefined,
        subject: `Покупка: ${data?.product.title || "товар"}`,
        paymentMethodType: selectedPayment?.type,
      }),
    onSuccess: async ({ orderId }) => {
      haptic.success()
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      router.replace(`/orders/${orderId}`)
    },
  })

  useBackButton(() => router.back())
  useMainButton({
    text: orderMutation.isPending ? "Создаём..." : "Оформить заказ",
    onClick: () => orderMutation.mutate(),
    visible: true,
    enabled: !orderMutation.isPending && Boolean(data?.product) && Boolean(selectedPayment),
    progress: orderMutation.isPending,
  })

  if (!data?.product) {
    return (
      <Screen noTabBar>
        <Placeholder header="Загружаю товар">
          <PackageSearch size={32} />
        </Placeholder>
      </Screen>
    )
  }

  const product = data.product
  const category = product.category || "digital"
  const deliveryLabel = product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная выдача"

  return (
    <Screen noTabBar>
      <ScreenHeader title={product.title} subtitle={`${category} · ${deliveryLabel}`} />

      <ScreenBody>
        <Section header="Товар">
          <Cell
            multiline
            before={
              <TgImage
                size={96}
                src={product.imageDataUrl || undefined}
                alt=""
                fallbackIcon={<PackageSearch size={32} />}
              />
            }
            subtitle={category}
            description={product.description}
            after={`${product.priceRub.toLocaleString("ru-RU")} ₽`}
          >
            {product.title}
          </Cell>
          <Cell subtitle={deliveryLabel}>
            Выдача
          </Cell>
        </Section>

        {product.specs.length > 0 ? (
          <Section header="Характеристики">
            {product.specs.map((spec) => (
              <Cell key={`${spec.label}-${spec.value}`} subtitle={spec.value} multiline>
                {spec.label}
              </Cell>
            ))}
          </Section>
        ) : null}

        <Section
          header="Оплата"
          footer={
            product.deliveryType === "AUTO_KEY"
              ? `${product.availableKeyCount ?? 0} ключей в наличии`
              : "После оплаты продавец выдаст доступ"
          }
        >
          {paymentOptions.map((option) => {
            const checked = selectedPayment?.key === option.key
            return (
              <Cell
                key={option.key}
                multiline
                before={<PaymentMethodIcon iconDataUrl={option.iconDataUrl} title={option.title} />}
                subtitle={option.subtitle}
                after={<Radio checked={checked} readOnly />}
                onClick={() => setSelectedPaymentKey(option.key)}
              >
                {option.title}
              </Cell>
            )
          })}
        </Section>

        {orderMutation.error ? (
          <Section>
            <Cell multiline description={orderMutation.error.message}>
              Не удалось создать заказ
            </Cell>
          </Section>
        ) : null}

        <Section>
          <Cell
            after={
              <Button
                size="s"
                loading={orderMutation.isPending}
                disabled={!selectedPayment || orderMutation.isPending}
                onClick={() => orderMutation.mutate()}
              >
                Оформить
              </Button>
            }
          >
            Создать заказ
          </Cell>
        </Section>
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
