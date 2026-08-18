import crypto from "node:crypto"

/**
 * Secret token Telegram echoes back in `x-telegram-bot-api-secret-token`.
 *
 * The webhook drives the admin panel, so it must be authenticated: without a
 * shared secret anyone who knows the URL could post a forged update carrying
 * an admin's `from.id`. When no dedicated variable is configured the secret is
 * derived from SESSION_SECRET, so the protection is on by default rather than
 * depending on someone remembering to set one more env var.
 *
 * `scripts/start.mjs` derives the same value when registering the webhook —
 * keep the two in sync.
 */
export function getWebhookSecret() {
  const explicit = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
  if (explicit) return explicit

  const base = process.env.SESSION_SECRET
  if (!base) return null

  return crypto
    .createHmac("sha256", base)
    .update("telegram-webhook")
    .digest("hex")
}
