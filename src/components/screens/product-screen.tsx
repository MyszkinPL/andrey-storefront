"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Card,
  Cell,
  Image as TgImage,
  Modal,
  Placeholder,
  Radio,
  Section,
} from "@telegram-apps/telegram-ui"
import { Expand, KeyRound, PackageSearch } from "lucide-react"

import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton, useHaptic, useMainButton } from "@/hooks/use-telegram"
import { createOrder, getPaymentMethods, getProduct } from "@/lib/api"

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
    <Screen noTabBar className="pb-6">
      <ScreenHeader title={product.title} subtitle={`${category} · ${deliveryLabel}`} />

      <ScreenBody className="gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-3">
          <Card type="plain" className="overflow-hidden">
            <button
              type="button"
              onClick={() => product.imageDataUrl && setIsImageOpen(true)}
              className="relative aspect-square w-full overflow-hidden"
            >
              {product.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.imageDataUrl} alt="" className="size-full object-contain" />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <TgImage size={96} fallbackIcon={<PackageSearch size={40} />} />
                </div>
              )}
              {product.imageDataUrl ? (
                <span className="absolute bottom-3 right-3">
                  <Badge type="number" mode="secondary">
                    <Expand size={13} />
                  </Badge>
                </span>
              ) : null}
            </button>
            <Card.Cell
              subtitle={category}
              after={`${product.priceRub.toLocaleString("ru-RU")} ₽`}
            >
              {product.title}
            </Card.Cell>
          </Card>

          <Section header="Описание">
            <Cell multiline description={product.description}>
              {deliveryLabel}
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
        </div>

        <div className="grid content-start gap-3">
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

          <Button
            stretched
            size="l"
            loading={orderMutation.isPending}
            disabled={!selectedPayment || orderMutation.isPending}
            onClick={() => orderMutation.mutate()}
          >
            Оформить заказ
          </Button>
        </div>
      </ScreenBody>

      <Modal
        open={isImageOpen}
        onOpenChange={setIsImageOpen}
        header={<Modal.Header>{product.title}</Modal.Header>}
      >
        {product.imageDataUrl ? (
          <div className="flex max-h-[82dvh] items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.imageDataUrl} alt="" className="max-h-[78dvh] max-w-full object-contain" />
          </div>
        ) : null}
      </Modal>
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
