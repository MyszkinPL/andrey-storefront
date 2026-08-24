import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth"
import { translate } from "@/lib/i18n"
import { DEFAULT_LOCALE, resolveUserLocale } from "@/lib/i18n/config"
import type { PaymentMethodsResponse } from "@/lib/contracts"
import { mediaUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()
  const isAdmin = user?.role === "ADMIN"
  const [paymentMethods, settings] = await Promise.all([
    prisma.paymentMethod.findMany({
      where: {
        type: "MANUAL",
        ...(isAdmin ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        type: true,
        details: true,
        isActive: true,
        sortOrder: true,
        cryptoAcceptedAssets: true,
        iconUpdatedAt: true,
      },
    }),
    prisma.shopSettings.findUnique({ where: { id: 1 } }),
  ])

  return NextResponse.json({
    paymentMethods: paymentMethods.map((method) => ({
      ...method,
      // Requisites are handed out with an order, not with the menu.
      details: isAdmin ? method.details : null,
      iconUrl: mediaUrl("payment-method", method.id, method.iconUpdatedAt),
    })),
    cryptoPay: {
      enabled: Boolean(settings?.cryptoPayEnabled && settings?.cryptoPayToken),
      title: "Crypto Bot",
      details: translate(
        user ? resolveUserLocale(user) : DEFAULT_LOCALE,
        "product.cryptoAuto",
      ),
      acceptedAssets: settings?.cryptoPayDefaultAssets || null,
      iconUrl: "/crypto-bot-logo.svg",
    },
  } satisfies PaymentMethodsResponse)
}
