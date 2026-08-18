import type { Context } from "grammy"

import { createPluralTranslator, createTranslator } from "@/lib/i18n"
import { DEFAULT_LOCALE, resolveLocale, resolveUserLocale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"

/**
 * Resolves who is talking to the bot and in which language. An explicit choice
 * made in the mini app wins; otherwise we follow the Telegram client language.
 */
export async function resolveActor(ctx: Context) {
  const telegramId = ctx.from?.id
  const user = telegramId
    ? await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } })
    : null

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
