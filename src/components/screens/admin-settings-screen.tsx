"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Copy, CreditCard, ImagePlus, PencilLine, Plus, RefreshCcw } from "lucide-react"
import {
  Avatar,
  Button,
  Card,
  Cluster,
  EmptyState,
  Field,
  Input,
  Pill,
  SegmentedControl,
  Select,
  Setting,
  Stack,
  Switch,
  Well,
  WellContent,
  WellFooter,
  WellHeader,
} from "sealui"

import { AccessStateScreen } from "@/components/access-state-screen"
import { LinkButton } from "@/components/link-button"
import { ListGroup, ListRow } from "@/components/list-row"
import { Screen, ScreenBody, ScreenHeader, StickyActions } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { useNotify } from "@/hooks/use-notify"
import { getCryptoPayCurrencies, getMe, getPaymentMethods, saveSettings } from "@/lib/api"

/** Fiat currencies Crypto Pay supports, shown until the live list loads. */
const FALLBACK_FIATS = [
  "AED", "AMD", "AZN", "BRL", "BYN", "EUR", "GBP", "GEL", "IDR", "ILS",
  "INR", "KZT", "PLN", "RUB", "THB", "TRY", "UAH", "USD", "UZS",
]

export function AdminSettingsScreen() {
  const { t, tp } = useI18n()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const [shopName, setShopName] = useState("")
  const [supportUsername, setSupportUsername] = useState("")
  const [requiredChannel, setRequiredChannel] = useState("")
  const [cryptoPayEnabled, setCryptoPayEnabled] = useState(false)
  const [cryptoPayToken, setCryptoPayToken] = useState("")
  const [cryptoPayUseTestnet, setCryptoPayUseTestnet] = useState(false)
  const [cryptoPayFiat, setCryptoPayFiat] = useState("RUB")
  const [cryptoPayDefaultAssets, setCryptoPayDefaultAssets] = useState("")

  const paymentMethods = useMemo(
    () => paymentData?.paymentMethods ?? [],
    [paymentData?.paymentMethods],
  )
  const cryptoPayTokenValue = cryptoPayToken.trim()

  const {
    data: cryptoCurrencyData,
    isFetching: isFetchingCurrencies,
    refetch: refetchCurrencies,
  } = useQuery({
    queryKey: ["crypto-pay-currencies", cryptoPayTokenValue, cryptoPayUseTestnet],
    queryFn: () =>
      getCryptoPayCurrencies({
        token: cryptoPayTokenValue,
        useTestnet: cryptoPayUseTestnet,
      }),
    enabled: Boolean(cryptoPayEnabled && cryptoPayTokenValue),
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  useEffect(() => {
    if (!meData) return
    queueMicrotask(() => {
      setShopName(meData.settings.shopName)
      setSupportUsername(meData.settings.supportUsername || "")
      setRequiredChannel(meData.settings.requiredChannel || "")
      setCryptoPayEnabled(Boolean(meData.settings.cryptoPayEnabled))
      setCryptoPayToken(meData.settings.cryptoPayToken || "")
      setCryptoPayUseTestnet(Boolean(meData.settings.cryptoPayUseTestnet))
      setCryptoPayFiat(meData.settings.cryptoPayFiat || "RUB")
      setCryptoPayDefaultAssets(meData.settings.cryptoPayDefaultAssets || "")
    })
  }, [meData])

  const mutation = useMutation({
    mutationFn: () =>
      saveSettings({
        shopName,
        supportUsername,
        requiredChannel,
        cryptoPayEnabled,
        cryptoPayToken,
        cryptoPayUseTestnet,
        cryptoPayFiat,
        cryptoPayDefaultAssets,
        paymentMethods: paymentMethods.map((method) => ({
          id: method.id,
          title: method.title,
          type: "MANUAL" as const,
          details: method.details ?? "",
          iconDataUrl: undefined,
          isActive: method.isActive,
        })),
      }),
    onError: notify.failure,
    onSuccess: async () => {
      notify.success("uiNotify.saved")
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      await queryClient.invalidateQueries({ queryKey: ["payment-methods"] })
    },
  })

  const activeCount = useMemo(
    () => paymentMethods.filter((method) => method.isActive).length,
    [paymentMethods],
  )
  const selectedCryptoAssets = useMemo(
    () =>
      cryptoPayDefaultAssets
        .split(",")
        .map((asset) => asset.trim().toUpperCase())
        .filter(Boolean),
    [cryptoPayDefaultAssets],
  )
  const cryptoWebhookUrl = meData?.settings.appUrl
    ? `${meData.settings.appUrl}/api/crypto-pay/webhook`
    : ""
  const assetOptions = cryptoCurrencyData?.assets ?? []
  // Currencies Crypto Pay accepts as fiat; the API list wins once loaded so
  // the choice always matches what invoices can actually be issued in.
  const fiatOptions = useMemo(() => {
    const fetched = (cryptoCurrencyData?.fiats ?? []).map((item) => item.code)
    const merged = new Set(fetched.length > 0 ? fetched : FALLBACK_FIATS)
    if (cryptoPayFiat) merged.add(cryptoPayFiat.toUpperCase())
    return Array.from(merged).sort()
  }, [cryptoCurrencyData?.fiats, cryptoPayFiat])

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title={t("admin.deniedTitle")}
        description={t("adminSettings.deniedDescription")}
      />
    )
  }

  const saveLabel = mutation.isPending ? t("common.saving") : t("common.save")

  return (
    <Screen>
      <ScreenHeader
        title={t("adminSettings.title")}
        subtitle={t("adminSettings.subtitle")}
        trailing={
          <div className="shop-desktop-only">
            <Button disabled={mutation.isPending} onClick={() => mutation.mutate()} size="sm">
              {saveLabel}
            </Button>
          </div>
        }
      />

      <ScreenBody>
        <Well>
          <WellHeader
            description={t("adminSettings.shopSectionHint")}
            title={t("adminSettings.shopSection")}
          />
          <WellContent>
            <Stack gap="4">
              <Field label={t("adminSettings.name")}>
                <Input
                  id="shop-name"
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder={t("adminSettings.name")}
                  value={shopName}
                />
              </Field>
              <Field label={t("adminSettings.support")}>
                <Input
                  id="shop-support"
                  onChange={(event) => setSupportUsername(event.target.value)}
                  placeholder="@username"
                  value={supportUsername}
                />
              </Field>
              <Field description={t("admin.channelHint")} label={t("admin.channelLabel")}>
                <Input
                  id="shop-channel"
                  onChange={(event) => setRequiredChannel(event.target.value)}
                  placeholder={t("admin.channelPlaceholder")}
                  value={requiredChannel}
                />
              </Field>
            </Stack>
          </WellContent>
        </Well>

        <Well>
          <WellHeader
            action={
              // The switch has no visible caption of its own; the hidden
              // label text keeps its accessible name and makes it clickable.
              <label className="shop-inline" htmlFor="crypto-enabled">
                <span className="shop-visually-hidden">{t("adminSettings.cryptoToggle")}</span>
                <Switch checked={cryptoPayEnabled} id="crypto-enabled" onCheckedChange={setCryptoPayEnabled} />
              </label>
            }
            description={t("adminSettings.cryptoHint")}
            title={
              <span className="shop-inline">
                <Avatar name="Crypto Bot" size="md" src="/crypto-bot-logo.svg" />
                Crypto Bot
              </span>
            }
          />
          <WellContent>
            <Stack gap="4">
              <Field label="API token">
                <Input
                  id="crypto-token"
                  onChange={(event) => setCryptoPayToken(event.target.value)}
                  placeholder={t("adminSettings.cryptoTokenPlaceholder")}
                  value={cryptoPayToken}
                />
              </Field>
              <Card>
                <Setting layout="inline" title={<label htmlFor="crypto-testnet">Testnet</label>}>
                  <Switch checked={cryptoPayUseTestnet} id="crypto-testnet" onCheckedChange={setCryptoPayUseTestnet} />
                </Setting>
              </Card>
              <Field label={t("adminSettings.currencyLabel")} nativeLabel={false}>
                <Select
                  onValueChange={(value) => setCryptoPayFiat(String(value))}
                  options={fiatOptions.map((code) => ({ value: code, label: code }))}
                  value={cryptoPayFiat}
                />
              </Field>
              <Field label={t("adminSettings.coins")} nativeLabel={false}>
                {assetOptions.length > 0 ? (
                  // `multiple`: without it the group was a radio, so a shop
                  // could never accept more than one coin at a time.
                  <div className="shop-scroll-x">
                    <SegmentedControl
                      aria-label={t("adminSettings.coins")}
                      multiple
                      onValueChange={(value) => setCryptoPayDefaultAssets(value.join(","))}
                      options={assetOptions.map((asset) => ({ value: asset.code, label: asset.code }))}
                      size="sm"
                      value={selectedCryptoAssets}
                    />
                  </div>
                ) : (
                  <Cluster>
                    <Pill color="gray">
                      {cryptoPayTokenValue ? t("adminSettings.pressRefresh") : t("adminSettings.tokenFirst")}
                    </Pill>
                  </Cluster>
                )}
              </Field>
              <Field label="Webhook">
                <Input
                  id="crypto-webhook"
                  postSlot={
                    cryptoWebhookUrl ? (
                      <Button
                        aria-label={t("common.copy")}
                        onClick={() => void navigator.clipboard.writeText(cryptoWebhookUrl)}
                        size="icon"
                        variant="ghost"
                      >
                        <Copy size={16} aria-hidden />
                      </Button>
                    ) : undefined
                  }
                  readOnly
                  value={cryptoWebhookUrl || t("adminSettings.webhookPlaceholder")}
                />
              </Field>
            </Stack>
          </WellContent>
          <WellFooter>
            <Cluster>
              <Button
                disabled={!cryptoPayTokenValue}
                icon={<RefreshCcw size={16} aria-hidden />}
                onClick={() => void refetchCurrencies()}
                variant="secondary"
              >
                {isFetchingCurrencies ? t("adminSettings.refreshingCurrencies") : t("adminSettings.refreshCurrencies")}
              </Button>
            </Cluster>
          </WellFooter>
        </Well>

        <Well>
          <WellHeader
            action={
              <Cluster gap="2">
                <LinkButton href="/admin/settings/payments/new?template=bank" size="sm" variant="secondary">
                  {t("adminSettings.template")}
                </LinkButton>
                <LinkButton href="/admin/settings/payments/new" icon={<Plus size={16} aria-hidden />} size="sm">
                  {t("adminSettings.add")}
                </LinkButton>
              </Cluster>
            }
            description={[
              tp("adminSettings.methodsTotal", paymentMethods.length),
              tp("adminSettings.methodsActive", activeCount),
            ].join(" · ")}
            title={t("adminSettings.manualSection")}
          />
          <WellContent>
            {paymentMethods.length === 0 ? (
              <EmptyState
                description={t("adminSettings.noMethodsDescription")}
                icon={<CreditCard />}
                title={t("adminSettings.noMethodsTitle")}
              />
            ) : (
              <ListGroup>
                {paymentMethods.map((method) => (
                  <ListRow
                    description={method.details || t("adminSettings.noDetails")}
                    key={method.id}
                    media={<MethodPreview iconUrl={method.iconUrl} title={method.title} />}
                    title={method.title}
                    trailing={
                      <>
                        {!method.isActive ? <Pill color="gray">{t("adminSettings.hidden")}</Pill> : null}
                        <LinkButton
                          aria-label={t("adminSettings.editMethod")}
                          href={`/admin/settings/payments/${method.id}`}
                          size="sm"
                          variant="secondary"
                        >
                          <PencilLine size={16} aria-hidden />
                        </LinkButton>
                      </>
                    }
                  />
                ))}
              </ListGroup>
            )}
          </WellContent>
        </Well>

        <StickyActions>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {saveLabel}
          </Button>
        </StickyActions>
      </ScreenBody>
    </Screen>
  )
}

function MethodPreview({
  iconUrl,
  title,
}: {
  iconUrl?: string | null
  title: string
}) {
  const initials = title.trim().slice(0, 2).toUpperCase()

  return (
    <Avatar
      fallback={initials || <ImagePlus size={16} aria-hidden />}
      name={title || "PM"}
      size="md"
      src={iconUrl}
    />
  )
}
