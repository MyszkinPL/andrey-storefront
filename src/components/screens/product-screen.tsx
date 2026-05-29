"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, PackageSearch, ShoppingBag } from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
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
        <Card>
          <CardContent>
            <Empty>
              <EmptyMedia variant="icon">
                <PackageSearch />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Загружаю товар</EmptyTitle>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      </Screen>
    )
  }

  const product = data.product
  const category = product.category || "digital"
  const deliveryLabel = product.deliveryType === "AUTO_KEY" ? "Автовыдача" : "Ручная выдача"

  return (
    <Screen noTabBar>
      <ScreenHeader title={product.title} subtitle={`${category} · ${deliveryLabel}`} />

      <ScreenBody className="mx-auto w-full max-w-4xl lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card size="sm">
          <CardHeader>
            <CardTitle>{product.title}</CardTitle>
            <CardDescription>{category}</CardDescription>
            <CardAction>
              <Badge variant="secondary">{product.priceRub.toLocaleString("ru-RU")} ₽</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="mx-auto w-full max-w-64 overflow-hidden rounded-3xl border">
              <ProductImage imageDataUrl={product.imageDataUrl} title={product.title} />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{product.description}</p>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <KeyRound className="size-4 text-muted-foreground" />
                {deliveryLabel}
              </div>
              {product.deliveryType === "AUTO_KEY" ? (
                <Badge variant="outline">{product.availableKeyCount ?? 0} ключей</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3">
          {product.specs.length > 0 ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Характеристики</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {product.specs.map((spec) => (
                  <div key={`${spec.label}-${spec.value}`} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="text-right font-medium">{spec.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card size="sm">
            <CardHeader>
              <CardTitle>Оплата</CardTitle>
              <CardDescription>Выбери способ перед созданием заказа.</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPayment?.key} onValueChange={setSelectedPaymentKey}>
                <FieldGroup>
                  {paymentOptions.map((option) => {
                    const inputId = `payment-${option.key}`
                    return (
                      <Field key={option.key} orientation="horizontal">
                        <RadioGroupItem id={inputId} value={option.key} />
                        <PaymentIcon iconDataUrl={option.iconDataUrl} title={option.title} />
                        <FieldContent>
                          <FieldLabel htmlFor={inputId}>{option.title}</FieldLabel>
                          <FieldDescription>{option.subtitle}</FieldDescription>
                        </FieldContent>
                      </Field>
                    )
                  })}
                </FieldGroup>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                disabled={!selectedPayment || orderMutation.isPending}
                onClick={() => orderMutation.mutate()}
              >
                {orderMutation.isPending ? (
                  "Создаём..."
                ) : (
                  <>
                    <ShoppingBag data-icon="inline-start" />
                    Оформить заказ
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {orderMutation.error ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Не удалось создать заказ</CardTitle>
                <CardDescription>{orderMutation.error.message}</CardDescription>
              </CardHeader>
            </Card>
          ) : null}
        </div>
      </ScreenBody>
    </Screen>
  )
}

function ProductImage({
  imageDataUrl,
  title,
}: {
  imageDataUrl: string | null
  title: string
}) {
  return (
    <AspectRatio ratio={1} className="overflow-hidden">
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageDataUrl} alt={title} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <PackageSearch className="size-10" />
        </div>
      )}
    </AspectRatio>
  )
}

function PaymentIcon({
  iconDataUrl,
  title,
}: {
  iconDataUrl: string | null
  title: string
}) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted text-xs font-medium">
      {iconDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconDataUrl} alt={title} className="size-full object-cover" />
      ) : (
        title.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}
