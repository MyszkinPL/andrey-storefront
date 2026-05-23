import { NextResponse } from "next/server"

import { getBot } from "@/lib/bot"
import { getServerEnv } from "@/lib/env"

export async function POST(request: Request) {
  const env = getServerEnv()
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const secret = request.headers.get("x-telegram-bot-api-secret-token")
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 })
    }
  }

  const update = await request.json()
  await getBot().handleUpdate(update)
  return NextResponse.json({ ok: true })
}
