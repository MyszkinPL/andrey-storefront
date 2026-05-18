import crypto from "node:crypto"

import type { WebAppUser } from "@/lib/telegram"

export function validateInitData(initData: string, botToken: string) {
  const searchParams = new URLSearchParams(initData)
  const hash = searchParams.get("hash")
  if (!hash) throw new Error("Telegram hash is missing")

  const dataCheckString = Array.from(searchParams.entries())
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(dataCheckString)
    .digest("hex")

  if (computedHash !== hash) throw new Error("Telegram init data hash mismatch")

  const authDate = Number(searchParams.get("auth_date"))
  if (!authDate || Number.isNaN(authDate)) throw new Error("Invalid auth date")
  if (Date.now() / 1000 - authDate > 60 * 60 * 12) {
    throw new Error("Telegram init data is too old")
  }

  const userRaw = searchParams.get("user")
  if (!userRaw) throw new Error("Telegram user payload is missing")

  return { user: JSON.parse(userRaw) as WebAppUser, authDate }
}
