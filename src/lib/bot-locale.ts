import type { Context } from "grammy"

import { createPluralTranslator, createTranslator } from "@/lib/i18n"
import { DEFAULT_LOCALE, resolveLocale, resolveUserLocale } from "@/lib/i18n/config"
import { ensureBotUser } from "@/lib/bot-user"

/**
 * Resolves who is talking to the bot and in which language. An explicit choice
 * made in the mini app wins; otherwise we follow the Telegram client language.
 */
export async function resolveActor(ctx: Context) {
  // Recording the person is part of resolving them: an unknown user used to
  // fall through every handler as "not an admin".
  const user = await ensureBotUser(ctx)

  const locale = user
    ? resolveUserLocale(user)
    : resolveLocale(ctx.from?.language_code ?? null)

  return {
    user,
    locale,
    isAdmin: user?.role === "ADMIN",
    t: createTranslator(locale),
    tp: createPluralTranslator(locale),
  }
}

export function fallbackTranslator() {
  return createTranslator(DEFAULT_LOCALE)
}
