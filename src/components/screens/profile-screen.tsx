"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, Languages, UserRound } from "lucide-react"
import { Avatar, EmptyState } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import {
  Screen,
  ScreenBody,
  ScreenError,
  ScreenHeader,
  SectionTitle,
} from "@/components/screen"
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
  const roleLabel =
    meData?.user.role === "ADMIN" ? t("profile.administrator") : t("profile.buyer")

  return (
    <Screen narrow>
      <ScreenHeader
        back="/catalog"
        subtitle={meData?.user.username ? `@${meData.user.username}` : roleLabel}
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
            <ListGroup>
              <ListRow
                description={roleLabel}
                media={<UserRound />}
                title={t("profile.account")}
              />
            </ListGroup>

            {/* The language control sits in the same panel as every other
                row, so the screen keeps one rhythm instead of alternating
                between panels and bare form controls. */}
            <ListGroup>
              <ListRow
                description={t("language.description")}
                media={<Languages />}
                title={t("language.label")}
                trailing={<LanguageSwitcher />}
              />
            </ListGroup>

            {methods.length === 0 && !hasCryptoPay ? (
              <EmptyState
                description={t("profile.noMethodsDescription")}
                icon={<CreditCard />}
                title={t("profile.noMethodsTitle")}
              />
            ) : (
              <>
                <SectionTitle
                  hint={t("profile.paymentMethodsHint")}
                  title={t("profile.paymentMethods")}
                />
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
      media={<Avatar name={title} size="md" src={iconUrl} />}
      title={title}
    />
  )
}
