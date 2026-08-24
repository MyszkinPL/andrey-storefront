"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ImagePlus, PencilLine, Plus, RefreshCcw } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { ListGroup, ListRow } from "@/components/list-row"
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useTranslate } from "@/components/i18n-provider"
import { useNotify } from "@/hooks/use-notify"
import { getCryptoPayCurrencies, getMe, getPaymentMethods, saveSettings } from "@/lib/api"

/** Fiat currencies Crypto Pay supports, shown until the live list loads. */
const FALLBACK_FIATS = [
  "AED", "AMD", "AZN", "BRL", "BYN", "EUR", "GBP", "GEL", "IDR", "ILS",
  "INR", "KZT", "PLN", "RUB", "THB", "TRY", "UAH", "USD", "UZS",
]

export function AdminSettingsScreen() {
  const t = useTranslate()
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

  return (
    <Screen>
      <ScreenHeader
        title={t("adminSettings.title")}
        subtitle={t("adminSettings.subtitle")}
        trailing={
          <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? t("common.saving") : t("common.save")}
          </Button>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{t("adminSettings.shopSection")}</CardTitle>
            <CardDescription>{t("adminSettings.shopSectionHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="shop-name">{t("adminSettings.name")}</FieldLabel>
                <Input id="shop-name" value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="snx.sell" />
              </Field>
              <Field>
                <FieldLabel htmlFor="shop-support">{t("adminSettings.support")}</FieldLabel>
                <Input id="shop-support" value={supportUsername} onChange={(event) => setSupportUsername(event.target.value)} placeholder="@username" />
              </Field>
              <Field>
                <FieldLabel htmlFor="shop-channel">{t("admin.channelLabel")}</FieldLabel>
                <Input
                  id="shop-channel"
                  onChange={(event) => setRequiredChannel(event.target.value)}
                  placeholder={t("admin.channelPlaceholder")}
                  value={requiredChannel}
                />
                <FieldDescription>{t("admin.channelHint")}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MethodPreview iconUrl="/crypto-bot-logo.svg" title="Crypto Bot" />
            <CardTitle>Crypto Bot</CardTitle>
            <CardDescription>{t("adminSettings.cryptoHint")}</CardDescription>
            <CardAction>
              <Switch
                checked={cryptoPayEnabled}
                onCheckedChange={setCryptoPayEnabled}
                aria-label={t("adminSettings.cryptoToggle")}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="crypto-token">API token</FieldLabel>
                <Input id="crypto-token" value={cryptoPayToken} onChange={(event) => setCryptoPayToken(event.target.value)} placeholder={t("adminSettings.cryptoTokenPlaceholder")} />
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="crypto-testnet">Testnet</FieldLabel>
                <Switch id="crypto-testnet" checked={cryptoPayUseTestnet} onCheckedChange={setCryptoPayUseTestnet} />
              </Field>
              <Field>
                <FieldLabel htmlFor="crypto-fiat">
                  {t("adminSettings.currencyLabel")}
                </FieldLabel>
                <Select
                  value={cryptoPayFiat}
                  onValueChange={(value) => setCryptoPayFiat(String(value))}
                >
                  <SelectTrigger className="w-full" id="crypto-fiat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectPopup className="max-h-72">
                    {fiatOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
              </Field>
              <Field>
                <FieldLabel>{t("adminSettings.coins")}</FieldLabel>
                {assetOptions.length > 0 ? (
                  <ToggleGroup
                    className="flex flex-wrap gap-1.5"
                    onValueChange={(value) => setCryptoPayDefaultAssets(value.join(","))}
                    size="sm"
                    value={selectedCryptoAssets}
                    variant="default"
                  >
                    {assetOptions.map((asset) => (
                      <ToggleGroupItem
                        className="shrink-0 rounded-full px-3"
                        key={asset.code}
                        value={asset.code}
                        variant="outline"
                      >
                        {asset.code}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ) : (
                  <Badge variant="secondary">
                    {cryptoPayTokenValue ? t("adminSettings.pressRefresh") : t("adminSettings.tokenFirst")}
                  </Badge>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="crypto-webhook">Webhook</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="crypto-webhook" readOnly value={cryptoWebhookUrl || t("adminSettings.webhookPlaceholder")} />
                  {cryptoWebhookUrl ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton onClick={() => void navigator.clipboard.writeText(cryptoWebhookUrl)}>
                        {t("common.copy")}
                      </InputGroupButton>
                    </InputGroupAddon>
                  ) : null}
                </InputGroup>
              </Field>
              <Button
                variant="secondary"
                disabled={!cryptoPayTokenValue}
                onClick={() => void refetchCurrencies()}
              >
                <RefreshCcw data-icon="inline-start" />
                {isFetchingCurrencies ? t("adminSettings.refreshingCurrencies") : t("adminSettings.refreshCurrencies")}
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("adminSettings.manualSection")}</CardTitle>
            <CardDescription>{paymentMethods.length} всего · {activeCount} активных</CardDescription>
            <CardAction className="flex gap-2">
              <Link
                href="/admin/settings/payments/new?template=bank"
                className={buttonVariants({ size: "sm", variant: "secondary" })}
              >
                {t("adminSettings.template")}
              </Link>
              <Link href="/admin/settings/payments/new" className={buttonVariants({ size: "sm" })}>
                <Plus data-icon="inline-start" />
                {t("adminSettings.add")}
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ListGroup>
              {paymentMethods.map((method) => (
                <ListRow
                  description={method.details || t("adminSettings.noDetails")}
                  key={method.id}
                  media={
                    <MethodPreview
                      iconUrl={method.iconUrl}
                      title={method.title}
                    />
                  }
                  title={method.title}
                  trailing={
                    <div className="flex items-center gap-1">
                      {!method.isActive ? (
                        <Badge variant="secondary">{t("adminSettings.hidden")}</Badge>
                      ) : null}
                      <Link
                        href={`/admin/settings/payments/${method.id}`}
                        className={buttonVariants({ size: "icon-sm", variant: "secondary" })}
                        aria-label={t("adminSettings.editMethod")}
                      >
                        <PencilLine />
                      </Link>
                    </div>
                  }
                />
              ))}
            </ListGroup>
            {paymentMethods.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{t("adminSettings.noMethodsTitle")}</EmptyTitle>
                  <EmptyDescription>{t("adminSettings.noMethodsDescription")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : null}
          </CardContent>
        </Card>
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
  return (
    <Avatar className="size-10">
      {iconUrl ? <AvatarImage src={iconUrl} alt={title} /> : null}
      <AvatarFallback>
        {title ? title.slice(0, 2).toUpperCase() : <ImagePlus />}
      </AvatarFallback>
    </Avatar>
  )
}
