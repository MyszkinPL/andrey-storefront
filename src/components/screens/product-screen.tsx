"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CreditCard, KeyRound, LifeBuoy, PackageCheck, PackageSearch } from "lucide-react"
import { Banner, Button, Heading, Pill, Text } from "sealui"

import { CheckoutSheet } from "@/components/checkout-sheet"
import { useI18n } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import { ListGroup, ListRow } from "@/components/list-row"
import type { PaymentOption } from "@/components/order-detail/types"
import { areOrderInstructionsDismissed } from "@/components/order-instructions-dialog"
import {
  ActionStack,
  Screen,
  ScreenBody,
  ScreenHeader,
  ScreenState,
  Section,
  StickyActions,
} from "@/components/screen"
import { useHaptic } from "@/hooks/use-telegram"
import {
  createOrder,
  getMe,
  getPaymentMethods,
  getProduct,
  recordProductView,
} from "@/lib/api"
import { formatPrice } from "@/lib/format"

/**
 * A product page the way a store app lays it out: photo, name, price,
 * what you get, and one "Buy" button in the bottom bar. Choosing how to
 * pay happens in the checkout sheet that button opens.
 */
export function ProductScreen({ productId }: { productId: string }) {
  const { t, tp, locale, currency } = useI18n()
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
  })

  // One view per card open, not per render: React Strict Mode mounts effects
  // twice in development and would otherwise double every number.
  const viewedProductId = useRef<string | null>(null)
  useEffect(() => {
    if (viewedProductId.current === productId) return
    viewedProductId.current = productId
    void recordProductView(productId)
  }, [productId])
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const supportLink = meData?.settings.supportUsername
    ? `https://t.me/${meData.settings.supportUsername.replace(/^@/, "")}`
    : null

  const paymentOptions = useMemo<PaymentOption[]>(
    () => [
      ...(paymentData?.paymentMethods ?? [])
        .filter((item) => item.isActive)
        .map((method) => ({
          key: `manual:${method.id}`,
          type: "MANUAL" as const,
          id: method.id,
          title: method.title,
          // The requisites arrive with the order; the sheet only names the method.
          subtitle: method.details ?? t("product.requisitesLater"),
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
    [paymentData, t],
  )

  const orderMutation = useMutation({
    mutationFn: (option: PaymentOption) =>
      createOrder({
        productId,
        paymentMethodId: option.type === "MANUAL" ? option.id : undefined,
        subject: t("product.orderSubject", {
          title: data?.product.title || t("product.fallbackTitle"),
        }),
        paymentMethodType: option.type,
      }),
    onSuccess: async ({ orderId }) => {
      haptic.success()
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      router.replace(`/orders/${orderId}`)
    },
    // The failure reads better on the page than inside a sheet.
    onError: () => setCheckoutOpen(false),
  })

  // One way to pay and nothing left to read: straight to the order. Any
  // choice, or a transfer how-to still to be read, goes through the sheet.
  function buy() {
    const only = paymentOptions.length === 1 ? paymentOptions[0] : null
    if (only && (only.type !== "MANUAL" || areOrderInstructionsDismissed())) {
      orderMutation.mutate(only)
      return
    }
    setCheckoutOpen(true)
  }

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
  const priceLabel = formatPrice(product.priceRub, locale, currency)
  const isAuto = product.deliveryType === "AUTO_KEY"
  const keyCount = product.availableKeyCount ?? 0
  const canBuy = paymentOptions.length > 0
  const stockPill = isAuto ? (
    <Pill color={keyCount > 0 ? "green" : "yellow"}>
      {keyCount > 0 ? tp("catalog.keys", keyCount) : t("product.outOfStock")}
    </Pill>
  ) : (
    <Pill color="gray">{t("product.manualDelivery")}</Pill>
  )

  // An admin who deactivates every method leaves the buyer with nothing to
  // buy with: then support is the only sensible button.
  const buyButton = canBuy ? (
    <Button
      disabled={orderMutation.isPending}
      fullWidth
      loading={orderMutation.isPending}
      onClick={buy}
      size="lg"
    >
      {orderMutation.isPending ? t("product.placingOrder") : t("product.buy")}
    </Button>
  ) : supportLink ? (
    <LinkButton
      external
      fullWidth
      href={supportLink}
      icon={<LifeBuoy size={16} aria-hidden />}
      size="lg"
      variant="secondary"
    >
      {t("orderDetail.telegramSupport")}
    </LinkButton>
  ) : null

  return (
    <Screen narrow noTabBar>
      <ScreenHeader back="/catalog" title={category} />

      <ScreenBody grow>
        <div className="shop-cover" data-size="hero">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={product.title} src={product.imageUrl} />
          ) : (
            <PackageSearch aria-hidden />
          )}
        </div>

        {/* The two facts a buyer decides on, in the largest type on the page. */}
        <div className="shop-status">
          <Heading as="h1" size="md">
            {product.title}
          </Heading>
          <div className="shop-status-row">
            <span className="shop-price">{priceLabel}</span>
            {stockPill}
          </div>
          {product.description ? (
            <Text as="p" size="sm" tone="secondary">
              {product.description}
            </Text>
          ) : null}
        </div>

        <ListGroup>
          {/* A key icon next to "manual delivery" promised a key that a
              manual product may never have. */}
          <ListRow
            description={isAuto ? t("orderComplete.descriptionKeyReady") : t("orderComplete.deliveryPending")}
            media={isAuto ? <KeyRound aria-hidden /> : <PackageCheck aria-hidden />}
            title={isAuto ? t("product.autoDelivery") : t("product.manualDelivery")}
          />
          {canBuy ? (
            <ListRow
              description={paymentOptions.map((option) => option.title).join(" · ")}
              media={<CreditCard aria-hidden />}
              title={t("product.paymentMethod")}
            />
          ) : null}
        </ListGroup>

        {product.specs.length > 0 ? (
          <Section title={t("product.details")}>
            {/* A real two-column grid: right-aligned values left a ragged
                edge as soon as one wrapped. */}
            <dl className="shop-specs">
              {product.specs.map((spec) => (
                <Fragment key={`${spec.label}-${spec.value}`}>
                  <dt>{spec.label}</dt>
                  <dd>{spec.value}</dd>
                </Fragment>
              ))}
            </dl>
          </Section>
        ) : null}

        {!canBuy ? (
          <Banner
            description={t("product.noPaymentDescription")}
            title={t("product.noPaymentTitle")}
            variant="warning"
          />
        ) : null}

        {orderMutation.error ? (
          <Banner
            description={orderMutation.error.message}
            title={t("product.orderFailed")}
            variant="danger"
          />
        ) : null}

        {buyButton ? (
          <div className="shop-desktop-only">
            <ActionStack>{buyButton}</ActionStack>
          </div>
        ) : null}
      </ScreenBody>

      {buyButton ? (
        <StickyActions>
          <div className="shop-buy">
            <div>
              <Text as="span" size="xs" tone="muted" truncate>
                {product.title}
              </Text>
              <Text as="strong" size="lg" tabularNums>
                {priceLabel}
              </Text>
            </div>
            {buyButton}
          </div>
        </StickyActions>
      ) : null}

      <CheckoutSheet
        loading={orderMutation.isPending}
        onConfirm={(option) => orderMutation.mutate(option)}
        onOpenChange={setCheckoutOpen}
        open={checkoutOpen}
        options={paymentOptions}
        priceLabel={priceLabel}
      />
    </Screen>
  )
}
