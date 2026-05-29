import { NextResponse } from "next/server"

import { upsertTelegramUser } from "@/lib/auth"
import { getServerEnv } from "@/lib/env"
import { setSession } from "@/lib/session"
import { validateInitData } from "@/lib/telegram-auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    let user
    if (body.dev) {
      if (!isDevAuthAllowed(request)) {
        return NextResponse.json({ error: "Dev auth disabled" }, { status: 403 })
      }
      const devTelegramId = getDevTelegramId()
      user = {
        id: devTelegramId,
        first_name: process.env.DEV_TELEGRAM_FIRST_NAME || "Dev",
        username: process.env.DEV_TELEGRAM_USERNAME || "dev_user",
        photo_url: process.env.DEV_TELEGRAM_PHOTO_URL,
      }
    } else {
      const env = getServerEnv()
      user = validateInitData(body.initData, env.BOT_TOKEN).user
    }

    const dbUser = await upsertTelegramUser(user)
    await setSession({
      userId: dbUser.id,
      telegramId: dbUser.telegramId.toString(),
      role: dbUser.role,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Authentication failed" },
      { status: 400 },
    )
  }
}

function isDevAuthAllowed(request: Request) {
  if (process.env.NODE_ENV !== "production") return true
  if (process.env.ALLOW_DEV_AUTH !== "true" || !process.env.DEV_TELEGRAM_ID) return false

  const host = request.headers.get("host") || ""
  return host.startsWith("localhost") || host.startsWith("127.0.0.1")
}

function getDevTelegramId() {
  const explicitId = process.env.DEV_TELEGRAM_ID || getFirstAdminTelegramId()
  const telegramId = Number(explicitId || "900000001")

  if (!Number.isFinite(telegramId) || telegramId <= 0) {
    throw new Error("Invalid dev telegram id")
  }

  return telegramId
}

function getFirstAdminTelegramId() {
  return (process.env.ADMIN_TELEGRAM_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .find(Boolean)
}
