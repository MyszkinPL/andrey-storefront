import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth"
import { translate } from "@/lib/i18n"
import { DEFAULT_LOCALE, resolveUserLocale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()
  const [paymentMethods, settings] = await Promise.all([
    prisma.paymentMethod.findMany({
      where: {
        type: "MANUAL",
        ...(user?.role === "ADMIN" ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.shopSettings.findUnique({ where: { id: 1 } }),
  ])

  return NextResponse.json({
    paymentMethods,
    cryptoPay: {
      enabled: Boolean(settings?.cryptoPayEnabled && settings?.cryptoPayToken),
      title: "Crypto Bot",
      details: translate(
        user ? resolveUserLocale(user) : DEFAULT_LOCALE,
        "product.cryptoAuto",
      ),
      acceptedAssets: settings?.cryptoPayDefaultAssets || null,
      iconDataUrl: "/crypto-bot-logo.svg",
    },
  })
}
