"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, Languages, LifeBuoy } from "lucide-react"

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
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslate } from "@/components/i18n-provider"
import { getMe, getPaymentMethods } from "@/lib/api"

export function ProfileScreen() {
  const t = useTranslate()
  const {
    data: meData,
    isLoading: isLoadingMe,
    isError: isErrorMe,
    refetch: refetchMe,
  } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
  })
  const {
    data: paymentData,
    isLoading: isLoadingPayments,
    isError: isErrorPayments,
    refetch: refetchPayments,
  } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: getPaymentMethods,
  })

  const methods = (paymentData?.paymentMethods ?? []).filter((method) => method.isActive)
  const hasCryptoPay = Boolean(paymentData?.cryptoPay.enabled)

  return (
    <Screen>
      <ScreenHeader
        back="/catalog"
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
              <AvatarImage alt={meData.user.firstName} src={meData.user.photoUrl} />
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
          <ScreenError
            onRetry={() => {
              refetchMe()
              refetchPayments()
            }}
            subtitle={t("profile.errorDescription")}
            title={t("profile.errorTitle")}
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

            {/* The language control sits in the same panel as every other
                row, so the screen keeps one rhythm instead of alternating
                between panels and bare form controls. */}
            <ListGroup>
              <ListRow
                description={t("language.description")}
                media={
                  <ListRowMedia>
                    <Languages />
                  </ListRowMedia>
                }
                title={t("language.label")}
                trailing={<LanguageSwitcher className="w-36" />}
              />
            </ListGroup>

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
                      iconUrl={method.iconUrl}
                      title={method.title}
                      subtitle={method.details ?? t("product.requisitesLater")}
                    />
                  ))}
                  {hasCryptoPay ? (
                    <PaymentMethodRow
                      iconUrl={paymentData?.cryptoPay.iconUrl || null}
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
  iconUrl,
  title,
  subtitle,
}: {
  iconUrl: string | null
  title: string
  subtitle: string
}) {
  return (
    <ListRow
      description={subtitle}
      media={
        <Avatar className="size-10">
          {iconUrl ? <AvatarImage src={iconUrl} alt={title} /> : null}
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
