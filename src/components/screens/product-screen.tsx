"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, PackageSearch, ShoppingBag } from "lucide-react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  FieldTitle,
} from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Screen, ScreenBody } from "@/components/screen"
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
    <Screen noTabBar className="min-h-[calc(100dvh-3rem)]">
      <ScreenBody className="mx-auto w-full max-w-2xl flex-1">
        <Card size="sm" className="flex-1">
          <CardHeader>
            <CardTitle>{product.title}</CardTitle>
            <CardDescription>{category}</CardDescription>
            <CardAction>
              <Badge variant="secondary">{product.priceRub.toLocaleString("ru-RU")} ₽</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ProductImage imageDataUrl={product.imageDataUrl} title={product.title} />
            <CardDescription>{product.description}</CardDescription>
            <Separator />
            <Field orientation="horizontal">
              <KeyRound className="size-4 text-muted-foreground" />
              <FieldContent>
                <FieldTitle>{deliveryLabel}</FieldTitle>
              </FieldContent>
              {product.deliveryType === "AUTO_KEY" ? (
                <Badge variant="outline">{product.availableKeyCount ?? 0} ключей</Badge>
              ) : null}
            </Field>

            {product.specs.length > 0 ? (
              <>
                <Separator />
                <FieldGroup className="gap-2">
                  {product.specs.map((spec) => (
                    <Field key={`${spec.label}-${spec.value}`} orientation="horizontal">
                      <FieldDescription>{spec.label}</FieldDescription>
                      <FieldTitle className="justify-end text-right">{spec.value}</FieldTitle>
                    </Field>
                  ))}
                </FieldGroup>
              </>
            ) : null}

            <FieldGroup className="mt-auto gap-4">
              <Separator />
              <PaymentMethodSelect
                options={paymentOptions}
                selectedKey={selectedPayment?.key || ""}
                onSelect={setSelectedPaymentKey}
              />
              {orderMutation.error ? (
                <Field>
                  <FieldTitle>Не удалось создать заказ</FieldTitle>
                  <FieldDescription>{orderMutation.error.message}</FieldDescription>
                </Field>
              ) : null}
            </FieldGroup>
          </CardContent>
          <CardFooter className="mt-auto">
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
    <AspectRatio ratio={1} className="mx-auto w-full max-w-64 overflow-hidden">
      {imageDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageDataUrl} alt={title} className="size-full object-cover" />
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <PackageSearch />
          </EmptyMedia>
        </Empty>
      )}
    </AspectRatio>
  )
}

function PaymentMethodSelect({
  options,
  selectedKey,
  onSelect,
}: {
  options: Array<{
    key: string
    title: string
    subtitle: string
    iconDataUrl: string | null
  }>
  selectedKey: string
  onSelect: (key: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.key === selectedKey)

  return (
    <Field>
      <FieldLabel>Способ оплаты</FieldLabel>
      <Select
        open={open}
        onOpenChange={(nextOpen) => setOpen(nextOpen)}
        value={selectedKey}
        onValueChange={(value) => {
          if (value) {
            onSelect(String(value))
            setOpen(false)
          }
        }}
        items={options.map((option) => ({ value: option.key, label: option.title }))}
      >
        <SelectTrigger className="h-11 w-full">
          {selectedOption ? (
            <Avatar size="sm">
              {selectedOption.iconDataUrl ? (
                <AvatarImage src={selectedOption.iconDataUrl} alt={selectedOption.title} />
              ) : null}
              <AvatarFallback>{getAvatarFallback(selectedOption.title)}</AvatarFallback>
            </Avatar>
          ) : null}
          <SelectValue placeholder="Выбрать способ" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.key} value={option.key} label={option.title}>
                <Avatar size="sm">
                  {option.iconDataUrl ? <AvatarImage src={option.iconDataUrl} alt={option.title} /> : null}
                  <AvatarFallback>{getAvatarFallback(option.title)}</AvatarFallback>
                </Avatar>
                {option.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {selectedOption?.subtitle ? <FieldDescription>{selectedOption.subtitle}</FieldDescription> : null}
    </Field>
  )
}

function getAvatarFallback(title: string) {
  return title.slice(0, 2).toUpperCase()
}
