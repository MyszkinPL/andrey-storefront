import { Role } from "@prisma/client"
import type { Context } from "grammy"

import { parseAdminIds } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Records whoever is talking to the bot.
 *
 * Only the mini app used to create users, so anyone who pressed /start without
 * ever opening the app stayed unknown — and since every callback handler bails
 * out on an unknown user, the whole bot answered them with "not an admin". It
 * also meant the shop had no idea how many people had actually started the bot.
 */
export async function ensureBotUser(ctx: Context) {
  const from = ctx.from
  if (!from || from.is_bot) return null

  const telegramId = BigInt(from.id)
  const now = new Date()
  const seedAdmins = parseAdminIds()
  const isSeedAdmin = seedAdmins.has(String(from.id))

  return prisma.user.upsert({
    where: { telegramId },
    update: {
      username: from.username ?? null,
      firstName: from.first_name,
      lastName: from.last_name ?? null,
      languageCode: from.language_code ?? null,
      botLastSeenAt: now,
      // Only ever fills in, so the first-contact time stays the first one.
      ...(isSeedAdmin ? { role: Role.ADMIN } : {}),
    },
    create: {
      telegramId,
      username: from.username ?? null,
      firstName: from.first_name,
      lastName: from.last_name ?? null,
      languageCode: from.language_code ?? null,
      botStartedAt: now,
      botLastSeenAt: now,
      // A bot conversation never grants admin on its own; only the seed list
      // does. Promotion by "first user wins" stays with the mini app, which
      // has verified init data behind it.
      role: isSeedAdmin ? Role.ADMIN : Role.USER,
    },
  })
}

/** Backfills botStartedAt for someone who reached the app before the bot. */
export async function markBotStarted(userId: string) {
  await prisma.user.updateMany({
    where: { id: userId, botStartedAt: null },
    data: { botStartedAt: new Date() },
  })
}
