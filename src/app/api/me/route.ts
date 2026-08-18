import { NextResponse } from "next/server"

import { bannedMessage, getCurrentUser, hasTelegramUsername, usernameRequiredMessage } from "@/lib/auth"
import { getServerEnv } from "@/lib/env"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.isBanned) {
    return NextResponse.json(
      { error: bannedMessage(user) },
      { status: 403 },
    )
  }
  if (!hasTelegramUsername(user)) {
    return NextResponse.json({ error: usernameRequiredMessage(user) }, { status: 403 })
  }

  const env = getServerEnv()

  const settings =
    (await prisma.shopSettings.findUnique({ where: { id: 1 } })) ||
    (await prisma.shopSettings.create({ data: { id: 1 } }))

  return NextResponse.json({
    user: {
      id: user.id,
      telegramId: user.telegramId.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      photoUrl: user.photoUrl,
      role: user.role,
      language: user.language,
    },
    settings:
      user.role === "ADMIN"
        ? {
            ...settings,
            appUrl: env.APP_URL,
            currency: settings.cryptoPayFiat || "RUB",
          }
        : {
            shopName: settings.shopName,
            supportUsername: settings.supportUsername,
            // Prices are entered in the shop's fiat, so buyers need it too.
            currency: settings.cryptoPayFiat || "RUB",
          },
  })
}
