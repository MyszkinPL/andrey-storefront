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
import { ListGroup, ListRow, ListRowMedia } from "@/components/list-row"
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
            <ListGroup>
              <ListRow
                description={
                  meData?.user.role === "ADMIN"
                    ? t("profile.administrator")
                    : t("profile.buyer")
                }
                media={
                  <ListRowMedia>
                    <LifeBuoy />
                  </ListRowMedia>
                }
                title={t("profile.account")}
              />
            </ListGroup>

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
                <ListGroup>
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
                </ListGroup>
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
    <ListRow
      description={subtitle}
      media={
        <Avatar className="size-10">
          {iconDataUrl ? <AvatarImage src={iconDataUrl} alt={title} /> : null}
          <AvatarFallback>{title.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
      }
      title={title}
    />
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
