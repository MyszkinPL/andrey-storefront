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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { getCryptoPayCurrencies, getMe, getPaymentMethods, saveSettings } from "@/lib/api"

export function AdminSettingsScreen() {
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data: paymentData } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const [shopName, setShopName] = useState("")
  const [supportUsername, setSupportUsername] = useState("")
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
        cryptoPayEnabled,
        cryptoPayToken,
        cryptoPayUseTestnet,
        cryptoPayFiat,
        cryptoPayDefaultAssets,
        paymentMethods: paymentMethods.map((method) => ({
          id: method.id,
          title: method.title,
          type: "MANUAL" as const,
          details: method.details,
          iconDataUrl: method.iconDataUrl || undefined,
          isActive: method.isActive,
        })),
      }),
    onSuccess: async () => {
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

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title="Доступ закрыт"
        description="Настройки магазина доступны только админу."
      />
    )
  }

  return (
    <Screen>
      <ScreenHeader
        title="Настройки"
        subtitle="Магазин и платежи"
        trailing={
          <Button size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Сохраняю..." : "Сохранить"}
          </Button>
        }
      />

      <ScreenBody className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Магазин</CardTitle>
            <CardDescription>Базовая информация и Telegram-поддержка.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="shop-name">Название</FieldLabel>
                <Input id="shop-name" value={shopName} onChange={(event) => setShopName(event.target.value)} placeholder="snx.sell" />
              </Field>
              <Field>
                <FieldLabel htmlFor="shop-support">Поддержка</FieldLabel>
                <Input id="shop-support" value={supportUsername} onChange={(event) => setSupportUsername(event.target.value)} placeholder="@username" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <MethodPreview iconDataUrl="/crypto-bot-logo.svg" title="Crypto Bot" />
            <CardTitle>Crypto Bot</CardTitle>
            <CardDescription>Автооплата через invoice и webhook.</CardDescription>
            <CardAction>
              <Switch
                checked={cryptoPayEnabled}
                onCheckedChange={setCryptoPayEnabled}
                aria-label="Включить Crypto Bot"
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="crypto-token">API token</FieldLabel>
                <Input id="crypto-token" value={cryptoPayToken} onChange={(event) => setCryptoPayToken(event.target.value)} placeholder="Token из Crypto Bot" />
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="crypto-testnet">Testnet</FieldLabel>
                <Switch id="crypto-testnet" checked={cryptoPayUseTestnet} onCheckedChange={setCryptoPayUseTestnet} />
              </Field>
              <Field>
                <FieldLabel htmlFor="crypto-fiat">Fiat</FieldLabel>
                <Input id="crypto-fiat" value={cryptoPayFiat} onChange={(event) => setCryptoPayFiat(event.target.value.toUpperCase())} placeholder="RUB" />
              </Field>
              <Field>
                <FieldLabel>Монеты</FieldLabel>
                {assetOptions.length > 0 ? (
                  <ToggleGroup
                    value={selectedCryptoAssets}
                    onValueChange={(value) => setCryptoPayDefaultAssets(value.join(","))}
                    variant="outline"
                    size="sm"
                    className="flex-wrap"
                  >
                    {assetOptions.map((asset) => (
                      <ToggleGroupItem key={asset.code} value={asset.code}>
                        {asset.code}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                ) : (
                  <Badge variant="secondary">
                    {cryptoPayTokenValue ? "Нажми обновить" : "Сначала API token"}
                  </Badge>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="crypto-webhook">Webhook</FieldLabel>
                <InputGroup>
                  <InputGroupInput id="crypto-webhook" readOnly value={cryptoWebhookUrl || "Появится после открытия на домене деплоя"} />
                  {cryptoWebhookUrl ? (
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton onClick={() => void navigator.clipboard.writeText(cryptoWebhookUrl)}>
                        Копировать
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
                {isFetchingCurrencies ? "Обновляю..." : "Обновить валюты"}
              </Button>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ручная оплата</CardTitle>
            <CardDescription>{paymentMethods.length} всего · {activeCount} активных</CardDescription>
            <CardAction className="flex gap-2">
              <Link
                href="/admin/settings/payments/new?template=bank"
                className={buttonVariants({ size: "sm", variant: "secondary" })}
              >
                Шаблон
              </Link>
              <Link href="/admin/settings/payments/new" className={buttonVariants({ size: "sm" })}>
                <Plus data-icon="inline-start" />
                Добавить
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-2">
              {paymentMethods.map((method) => (
                <Item key={method.id} variant="muted" size="sm">
                  <ItemMedia>
                    <MethodPreview iconDataUrl={method.iconDataUrl || ""} title={method.title} />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <ItemTitle>{method.title}</ItemTitle>
                    <ItemDescription>{method.details || "Без реквизитов"}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {!method.isActive ? <Badge variant="secondary">Скрыт</Badge> : null}
                    <Link
                      href={`/admin/settings/payments/${method.id}`}
                      className={buttonVariants({ size: "icon-sm", variant: "secondary" })}
                      aria-label="Править способ оплаты"
                    >
                      <PencilLine />
                    </Link>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
            {paymentMethods.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Способов оплаты нет</EmptyTitle>
                  <EmptyDescription>Добавь СБП, карту или другой ручной способ.</EmptyDescription>
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
  iconDataUrl,
  title,
}: {
  iconDataUrl?: string
  title: string
}) {
  return (
    <Avatar size="lg">
      {iconDataUrl ? <AvatarImage src={iconDataUrl} alt={title} /> : null}
      <AvatarFallback>
        {title ? title.slice(0, 2).toUpperCase() : <ImagePlus />}
      </AvatarFallback>
    </Avatar>
  )
}
