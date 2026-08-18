import crypto from "node:crypto"

import { NextResponse } from "next/server"

import { getReadyBot } from "@/lib/bot"
import { getWebhookSecret } from "@/lib/webhook-secret"

/** Constant-time compare so the secret cannot be probed byte by byte. */
function matches(received: string | null, expected: string) {
  if (!received) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  const expected = getWebhookSecret()

  // Fail closed: this endpoint can drive the whole admin panel, so an
  // unverifiable request is refused rather than trusted.
  if (!expected) {
    console.error("Webhook secret is not configured; refusing update")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 })
  }

  if (!matches(request.headers.get("x-telegram-bot-api-secret-token"), expected)) {
    return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 })
  }

  const update = await request.json()

  try {
    const bot = await getReadyBot()
    await bot.handleUpdate(update)
  } catch (error) {
    // Telegram retries on a non-2xx, which would replay the same failing
    // update forever. Log and acknowledge instead.
    console.error("Telegram update failed", error)
  }

  return NextResponse.json({ ok: true })
}
