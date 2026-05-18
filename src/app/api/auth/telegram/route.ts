import { NextResponse } from "next/server"

import { upsertTelegramUser } from "@/lib/auth"
import { getServerEnv } from "@/lib/env"
import { setSession } from "@/lib/session"
import { validateInitData } from "@/lib/telegram-auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const env = getServerEnv()

    let user
    if (body.dev) {
      if (!env.ALLOW_DEV_AUTH || !env.DEV_TELEGRAM_ID) {
        return NextResponse.json({ error: "Dev auth disabled" }, { status: 403 })
      }
      user = {
        id: Number(env.DEV_TELEGRAM_ID),
        first_name: "Dev",
        username: "dev_user",
      }
    } else {
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
