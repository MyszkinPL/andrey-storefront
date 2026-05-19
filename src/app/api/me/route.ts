import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth"
import { getServerEnv } from "@/lib/env"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    },
    settings:
      user.role === "ADMIN"
        ? {
            ...settings,
            appUrl: env.APP_URL,
          }
        : {
            shopName: settings.shopName,
            welcomeText: settings.welcomeText,
            supportIntro: settings.supportIntro,
            supportUsername: settings.supportUsername,
          },
  })
}
