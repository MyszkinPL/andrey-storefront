"use client"

import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { KeyRound, LifeBuoy, PackageCheck, PackageSearch, ShoppingBag } from "lucide-react"
import {
  Avatar,
  Banner,
  Button,
  Field,
  Pill,
  SelectParts,
  Separator,
  Text,
  Well,
} from "sealui"

import { useI18n, useTranslate } from "@/components/i18n-provider"
import { LinkButton } from "@/components/link-button"
import {
  areOrderInstructionsDismissed,
  OrderInstructionsDialog,
} from "@/components/order-instructions-dialog"
import {
  Screen,
  ScreenBody,
  ScreenHeader,
  ScreenState,
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

export function ProductScreen({ productId }: { productId: string }) {
  const { t, tp, locale, currency } = useI18n()
  const router = useRouter()
  const queryClient = useQueryClient()
  const haptic = useHaptic()
  const [selectedPaymentKey, setSelectedPaymentKey] = useState("")
  const [instructionsOpen, setInstructionsOpen] = useState(false)

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
        // The requisites arrive with the order; the menu only names the method.
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
    // The failure reads better on the card than inside a sheet.
    onError: () => setInstructionsOpen(false),
  })

  // A manual transfer gets the how-to first; the invoice flow explains itself
  // inside Crypto Bot, and anyone who ticked "do not show again" skips it.
  function placeOrder() {
    if (selectedPayment?.type === "MANUAL" && !areOrderInstructionsDismissed()) {
      setInstructionsOpen(true)
      return
    }
    orderMutation.mutate()
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
  const deliveryLabel =
    product.deliveryType === "AUTO_KEY"
      ? t("product.autoDelivery")
      : t("product.manualDelivery")
  const keyCount = product.availableKeyCount ?? 0

  // The same actions sit in the card on desktop and float above the bottom
  // edge on a phone, so the buyer never hunts for the button under a long
  // description. An admin who deactivates every method leaves the buyer with
  // nothing to buy with: then support is the only sensible button, and a
  // button that can never be pressed is worse than none.
  const actions = (
    <>
      {paymentOptions.length === 0 && supportLink ? (
        <LinkButton
          external
          fullWidth
          href={supportLink}
          icon={<LifeBuoy size={16} aria-hidden />}
          variant="secondary"
        >
          {t("orderDetail.telegramSupport")}
        </LinkButton>
      ) : null}
      {paymentOptions.length > 0 ? (
        <Button
          disabled={!selectedPayment || orderMutation.isPending}
          fullWidth
          icon={<ShoppingBag size={16} aria-hidden />}
          loading={orderMutation.isPending}
          onClick={placeOrder}
        >
          {orderMutation.isPending ? t("product.placingOrder") : t("product.placeOrder")}
        </Button>
      ) : null}
    </>
  )
  const hasActions = paymentOptions.length > 0 || Boolean(supportLink)

  return (
    <Screen noTabBar>
      <ScreenHeader
        back="/catalog"
        subtitle={category}
        title={product.title}
        trailing={<Pill color="gray">{formatPrice(product.priceRub, locale, currency)}</Pill>}
      />

      <ScreenBody grow>
        <Well>
          <div className="shop-cover">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={product.title} src={product.imageUrl} />
            ) : (
              <PackageSearch aria-hidden />
            )}
          </div>

          {product.description ? (
            <Text as="p" size="sm" tone="secondary">
              {product.description}
            </Text>
          ) : null}

          <Separator />

          <div className="shop-row">
            {/* A key icon next to "manual delivery" promised a key that a
                manual product may never have. */}
            <div className="shop-row-media">
              {product.deliveryType === "AUTO_KEY" ? (
                <KeyRound aria-hidden />
              ) : (
                <PackageCheck aria-hidden />
              )}
            </div>
            <div className="shop-row-copy">
              <Text as="span" size="sm">
                {deliveryLabel}
              </Text>
            </div>
            {product.deliveryType === "AUTO_KEY" ? (
              <div className="shop-row-trailing">
                <Pill color={keyCount > 0 ? "green" : "yellow"}>{tp("catalog.keys", keyCount)}</Pill>
              </div>
            ) : null}
          </div>

          {product.specs.length > 0 ? (
            <>
              <Separator />
              {/* A real two-column grid: right-aligned values left a ragged
                  edge as soon as one wrapped, and the label column collapsed
                  onto two lines. */}
              <dl className="shop-specs">
                {product.specs.map((spec) => (
                  <Fragment key={`${spec.label}-${spec.value}`}>
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </Fragment>
                ))}
              </dl>
            </>
          ) : null}
        </Well>

        <Well>
          {paymentOptions.length === 0 ? (
            <Banner
              description={t("product.noPaymentDescription")}
              title={t("product.noPaymentTitle")}
              variant="warning"
            />
          ) : (
            <PaymentMethodSelect
              onSelect={setSelectedPaymentKey}
              options={paymentOptions}
              selectedKey={selectedPayment?.key || ""}
            />
          )}

          {orderMutation.error ? (
            <Banner
              description={orderMutation.error.message}
              title={t("product.orderFailed")}
              variant="danger"
            />
          ) : null}

          {hasActions ? (
            <div className="shop-hide-desktop-actions">
              <div className="shop-card-foot" data-static="">
                {actions}
              </div>
            </div>
          ) : null}
        </Well>
      </ScreenBody>

      {hasActions ? <StickyActions>{actions}</StickyActions> : null}

      <OrderInstructionsDialog
        loading={orderMutation.isPending}
        onOpenChange={setInstructionsOpen}
        onProceed={() => orderMutation.mutate()}
        open={instructionsOpen}
      />
    </Screen>
  )
}

type PaymentChoice = {
  key: string
  title: string
  subtitle: string
  iconUrl: string | null
}

/** The option row: icon, name, one-line hint. Shared by trigger and list. */
function OptionRow({ option, hint }: { option: PaymentChoice; hint?: boolean }) {
  return (
    <span className="shop-inline">
      <Avatar name={option.title} size="sm" src={option.iconUrl} />
      <span className="shop-row-copy">
        <Text as="span" size="sm" truncate>
          {option.title}
        </Text>
        {hint && option.subtitle ? (
          <Text as="span" size="xs" tone="muted" truncate>
            {option.subtitle}
          </Text>
        ) : null}
      </span>
    </span>
  )
}

/**
 * The order-detail selector wants an option `type`; here the choice is only
 * a key, so the same row is built locally on the Select parts.
 */
function PaymentMethodSelect({
  options,
  selectedKey,
  onSelect,
}: {
  options: PaymentChoice[]
  selectedKey: string
  onSelect: (key: string) => void
}) {
  const t = useTranslate()
  const selectedOption = options.find((option) => option.key === selectedKey)

  return (
    <Field
      description={selectedOption?.subtitle || undefined}
      label={t("product.paymentMethod")}
      nativeLabel={false}
    >
      <SelectParts.Root
        items={options.map((option) => ({ value: option.key, label: option.title }))}
        onValueChange={(value) => {
          if (typeof value === "string" && value) onSelect(value)
        }}
        value={selectedKey}
      >
        <SelectParts.Trigger>
          {selectedOption ? (
            <OptionRow option={selectedOption} />
          ) : (
            <SelectParts.Value placeholder={t("product.choosePayment")} />
          )}
          <SelectParts.Icon />
        </SelectParts.Trigger>
        <SelectParts.Portal>
          <SelectParts.Positioner>
            <SelectParts.Popup>
              <SelectParts.List>
                {options.map((option) => (
                  <SelectParts.Item key={option.key} value={option.key}>
                    <SelectParts.ItemIndicator />
                    <SelectParts.ItemText>
                      <OptionRow hint option={option} />
                    </SelectParts.ItemText>
                  </SelectParts.Item>
                ))}
              </SelectParts.List>
            </SelectParts.Popup>
          </SelectParts.Positioner>
        </SelectParts.Portal>
      </SelectParts.Root>
    </Field>
  )
}
