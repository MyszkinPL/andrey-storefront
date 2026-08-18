"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, LifeBuoy } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslate } from "@/components/i18n-provider"
import { getMe, getPaymentMethods } from "@/lib/api"

export function ProfileScreen() {
  const t = useTranslate()
  const { data: meData, isLoading: isLoadingMe, isError: isErrorMe } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  })
  const {
    data: paymentData,
    isLoading: isLoadingPayments,
    isError: isErrorPayments,
  } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = (paymentData?.paymentMethods ?? []).filter((method) => method.isActive)
  const hasCryptoPay = Boolean(paymentData?.cryptoPay.enabled)

  return (
    <Screen>
      <ScreenHeader
        title={meData?.user.firstName || t("profile.title")}
        subtitle={
          meData?.user.username
            ? `@${meData.user.username}`
            : meData?.user.role === "ADMIN"
              ? t("profile.administrator")
              : t("profile.buyer")
        }
        trailing={
          <Avatar className="size-10">
            {meData?.user.photoUrl ? (
              <AvatarImage src={meData.user.photoUrl} alt={meData.user.firstName} />
            ) : null}
            <AvatarFallback>{(meData?.user.firstName || "S").slice(0, 1)}</AvatarFallback>
          </Avatar>
        }
      />

      <ScreenBody>
        {isLoadingMe || isLoadingPayments ? (
          <ProfileEmpty
            title={t("profile.loadingTitle")}
            description={t("profile.loadingDescription")}
          />
        ) : isErrorMe || isErrorPayments ? (
          <ProfileEmpty
            title={t("profile.errorTitle")}
            description={t("profile.errorDescription")}
          />
        ) : (
          <>
            <ItemGroup className="gap-2">
              <Item variant="muted" size="sm">
                <ItemMedia variant="icon">
                  <LifeBuoy />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{t("profile.account")}</ItemTitle>
                  <ItemDescription>
                    {meData?.user.role === "ADMIN"
                      ? t("profile.administrator")
                      : t("profile.buyer")}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>

            <Field className="gap-1 px-1">
              <FieldTitle>{t("language.label")}</FieldTitle>
              <FieldDescription>{t("language.description")}</FieldDescription>
              <LanguageSwitcher className="mt-1 w-full" />
            </Field>

            {methods.length === 0 && !hasCryptoPay ? (
              <ProfileEmpty
                title={t("profile.noMethodsTitle")}
                description={t("profile.noMethodsDescription")}
              />
            ) : (
              <>
                <Field className="gap-1 px-1">
                  <FieldTitle>{t("profile.paymentMethods")}</FieldTitle>
                  <FieldDescription>{t("profile.paymentMethodsHint")}</FieldDescription>
                </Field>
                <ItemGroup className="gap-2">
                  {methods.map((method) => (
                    <PaymentMethodRow
                      key={method.id}
                      iconDataUrl={method.iconDataUrl}
                      title={method.title}
                      subtitle={method.details}
                    />
                  ))}
                  {hasCryptoPay ? (
                    <PaymentMethodRow
                      iconDataUrl={paymentData?.cryptoPay.iconDataUrl || null}
                      title={paymentData?.cryptoPay.title || "Crypto Bot"}
                      subtitle={
                        paymentData?.cryptoPay.acceptedAssets
                          ? t("product.cryptoAutoWithAssets", {
                              assets: paymentData.cryptoPay.acceptedAssets,
                            })
                          : t("product.cryptoAuto")
                      }
                    />
                  ) : null}
                </ItemGroup>
              </>
            )}
          </>
        )}
      </ScreenBody>
    </Screen>
  )
}

function PaymentMethodRow({
  iconDataUrl,
  title,
  subtitle,
}: {
  iconDataUrl: string | null
  title: string
  subtitle: string
}) {
  return (
    <Item variant="muted" size="sm">
      <ItemMedia>
        <Avatar className="size-10">
          {iconDataUrl ? <AvatarImage src={iconDataUrl} alt={title} /> : null}
          <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{subtitle}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

function ProfileEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <CreditCard />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}
