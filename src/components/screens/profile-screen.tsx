"use client"

import { useQuery } from "@tanstack/react-query"
import { Avatar, Text } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { Screen, ScreenBody, ScreenError, ScreenHeader, Section } from "@/components/screen"
import { getMe, getPaymentMethods } from "@/lib/api"

/** Who you are in the header, then the one setting and the ways to pay. */
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
  const roleLabel =
    meData?.user.role === "ADMIN" ? t("profile.administrator") : t("profile.buyer")

  return (
    <Screen narrow>
      <ScreenHeader
        back="/catalog"
        subtitle={[meData?.user.username ? `@${meData.user.username}` : null, roleLabel]
          .filter(Boolean)
          .join(" · ")}
        title={meData?.user.firstName || t("profile.title")}
        trailing={
          <Avatar name={meData?.user.firstName || "S"} size="lg" src={meData?.user.photoUrl} />
        }
      />

      <ScreenBody>
        {isLoadingMe || isLoadingPayments ? (
          <ListSkeleton rows={3} />
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
            {/* The control sits beside its caption, the size of its two words. */}
            <Section
              action={<LanguageSwitcher />}
              hint={t("language.description")}
              title={t("language.label")}
            />

            <Section hint={t("profile.paymentMethodsHint")} title={t("profile.paymentMethods")}>
              {methods.length === 0 && !hasCryptoPay ? (
                <Text as="p" size="sm" tone="muted">
                  {t("profile.noMethodsTitle")} · {t("profile.noMethodsDescription")}
                </Text>
              ) : (
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
              )}
            </Section>
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
      media={<Avatar name={title} size="md" src={iconUrl} />}
      title={title}
    />
  )
}
