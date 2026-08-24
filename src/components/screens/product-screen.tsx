"use client"

import { Fragment, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, PackageSearch, ShoppingBag } from "lucide-react"

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
import { Empty, EmptyMedia } from "@/components/ui/empty"
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
import { BackButton } from "@/components/back-button"
import { Screen, ScreenBody, ScreenState } from "@/components/screen"
import { useHaptic } from "@/hooks/use-telegram"
import { useI18n, useTranslate } from "@/components/i18n-provider"
import { createOrder, getPaymentMethods, getProduct } from "@/lib/api"
import { formatPrice } from "@/lib/format"

export function ProductScreen({ productId }: { productId: string }) {
  const { t, tp, locale, currency } = useI18n()
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
  const [selectedPaymentKey, setSelectedPaymentKey] = useState("")

  const { data, isLoading, refetch } = useQuery({
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
        iconUrl: method.iconUrl,
      })),
      ...(paymentData?.cryptoPay.enabled
        ? [
            {
              key: "crypto:auto",
              type: "CRYPTO_PAY" as const,
              id: undefined,
              title: paymentData.cryptoPay.title || "Crypto Bot",
              subtitle: paymentData.cryptoPay.acceptedAssets
                ? t("product.cryptoAutoWithAssets", {
                    assets: paymentData.cryptoPay.acceptedAssets,
                  })
                : t("product.cryptoAuto"),
              iconUrl: paymentData.cryptoPay.iconUrl || null,
            },
          ]
        : []),
    ],
    [methods, paymentData, t],
  )
  const selectedPayment = paymentOptions.find(
    (option) => option.key === (selectedPaymentKey || paymentOptions[0]?.key),
  )

  const orderMutation = useMutation({
    mutationFn: () =>
      createOrder({
        productId,
        paymentMethodId: selectedPayment?.type === "MANUAL" ? selectedPayment.id : undefined,
        subject: t("product.orderSubject", {
          title: data?.product.title || t("product.fallbackTitle"),
        }),
        paymentMethodType: selectedPayment?.type,
      }),
    onSuccess: async ({ orderId }) => {
      haptic.success()
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      router.replace(`/orders/${orderId}`)
    },
  })


  // A missing product used to sit on "loading" forever with no way back: the
  // branch could not tell a pending request from a deleted or wrong id.
  if (isLoading) {
    return <ScreenState back="/catalog" title={t("product.loading")} />
  }

  if (!data?.product) {
    return (
      <ScreenState
        back="/catalog"
        description={t("product.errorDescription")}
        onRetry={() => refetch()}
        title={t("product.errorTitle")}
      />
    )
  }

  const product = data.product
  const category = product.category || "digital"
  const deliveryLabel =
    product.deliveryType === "AUTO_KEY"
      ? t("product.autoDelivery")
      : t("product.manualDelivery")

  return (
    <Screen noTabBar className="min-h-[calc(100dvh-3rem)]">
      <ScreenBody className="mx-auto w-full max-w-2xl flex-1">
        <BackButton className="-ms-1 self-start" href="/catalog" />
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>{product.title}</CardTitle>
            <CardDescription>{category}</CardDescription>
            <CardAction>
              <Badge variant="secondary">{formatPrice(product.priceRub, locale, currency)}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <ProductImage imageUrl={product.imageUrl} title={product.title} />
            <CardDescription>{product.description}</CardDescription>
            <Separator />
            <Field orientation="horizontal">
              <KeyRound className="size-4 text-muted-foreground" />
              <FieldContent>
                <FieldTitle>{deliveryLabel}</FieldTitle>
              </FieldContent>
              {product.deliveryType === "AUTO_KEY" ? (
                <Badge variant="outline">{tp("catalog.keys", product.availableKeyCount ?? 0)}</Badge>
              ) : null}
            </Field>

            {product.specs.length > 0 ? (
              <>
                <Separator />
                {/* A real two-column grid: right-aligned values left a ragged
                    edge as soon as one wrapped, and the label column collapsed
                    onto two lines. */}
                <dl className="grid grid-cols-[minmax(6rem,8rem)_1fr] gap-x-4 gap-y-2 sm:grid-cols-[minmax(8rem,10rem)_1fr]">
                  {product.specs.map((spec) => (
                    <Fragment key={`${spec.label}-${spec.value}`}>
                      <dt className="text-muted-foreground text-xs leading-5">
                        {spec.label}
                      </dt>
                      <dd className="text-sm leading-5">{spec.value}</dd>
                    </Fragment>
                  ))}
                </dl>
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
                  <FieldTitle>{t("product.orderFailed")}</FieldTitle>
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
                t("product.placingOrder")
              ) : (
                <>
                  <ShoppingBag data-icon="inline-start" />
                  {t("product.placeOrder")}
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
  imageUrl,
  title,
}: {
  imageUrl: string | null
  title: string
}) {
  return (
    <div className="mx-auto aspect-square w-full max-w-64 overflow-hidden">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={title} className="size-full object-cover" />
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <PackageSearch />
          </EmptyMedia>
        </Empty>
      )}
    </div>
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
    iconUrl: string | null
  }>
  selectedKey: string
  onSelect: (key: string) => void
}) {
  const t = useTranslate()
  const [open, setOpen] = useState(false)
  const selectedOption = options.find((option) => option.key === selectedKey)

  return (
    <Field>
      <FieldLabel>{t("product.paymentMethod")}</FieldLabel>
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
        <SelectTrigger size="lg">
          {selectedOption ? (
            <Avatar className="size-6">
              {selectedOption.iconUrl ? (
                <AvatarImage src={selectedOption.iconUrl} alt={selectedOption.title} />
              ) : null}
              <AvatarFallback>{getAvatarFallback(selectedOption.title)}</AvatarFallback>
            </Avatar>
          ) : null}
          <SelectValue placeholder={t("product.choosePayment")} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.key} value={option.key} label={option.title}>
                <Avatar className="size-6">
                  {option.iconUrl ? <AvatarImage src={option.iconUrl} alt={option.title} /> : null}
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
