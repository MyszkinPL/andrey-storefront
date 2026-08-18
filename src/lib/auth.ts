import { Role } from "@prisma/client"

import { translate } from "@/lib/i18n"
import { DEFAULT_LOCALE, resolveUserLocale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { WebAppUser } from "@/lib/telegram"

/** Rendered in the reader's own language, so the gate explains itself. */
export function usernameRequiredMessage(user?: {
  language?: string | null
  languageCode?: string | null
}) {
  return translate(
    user ? resolveUserLocale(user) : DEFAULT_LOCALE,
    "auth.usernameRequired",
  )
}

export function bannedMessage(user: {
  banReason: string | null
  language?: string | null
  languageCode?: string | null
}) {
  const locale = resolveUserLocale(user)
  return user.banReason
    ? translate(locale, "auth.bannedWithReason", { reason: user.banReason })
    : translate(locale, "auth.banned")
}

function parseAdminIds() {
  return new Set(
    (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

export function hasTelegramUsername(user: { username: string | null }) {
  return Boolean(user.username?.trim())
}

function requireTelegramUsername(user: {
  username: string | null
  language?: string | null
  languageCode?: string | null
}) {
  if (!hasTelegramUsername(user)) throw new Error(usernameRequiredMessage(user))
}

export async function upsertTelegramUser(user: WebAppUser) {
  const explicitAdmins = parseAdminIds()
  const hasSeedAdmins = explicitAdmins.size > 0
  const explicitAdmin = explicitAdmins.has(String(user.id))
  const existingAdmin = hasSeedAdmins
    ? true
    : Boolean(
        await prisma.user.findFirst({
          where: { role: Role.ADMIN },
          select: { id: true },
        }),
      )
  const shouldPromoteToAdmin = explicitAdmin || (!hasSeedAdmins && !existingAdmin)

  return prisma.user.upsert({
    where: { telegramId: BigInt(user.id) },
    update: {
      username: user.username ?? null,
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      photoUrl: user.photo_url ?? null,
      languageCode: user.language_code ?? null,
      ...(shouldPromoteToAdmin ? { role: Role.ADMIN } : {}),
    },
    create: {
      telegramId: BigInt(user.id),
      username: user.username ?? null,
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      photoUrl: user.photo_url ?? null,
      languageCode: user.language_code ?? null,
      role: shouldPromoteToAdmin ? Role.ADMIN : Role.USER,
    },
  })
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  return prisma.user.findUnique({ where: { id: session.userId } })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error("Unauthorized")
  if (user.isBanned) {
    throw new Error(bannedMessage(user))
  }
  return user
}

export async function requireInteractiveUser() {
  const user = await requireUser()
  requireTelegramUsername(user)
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  requireTelegramUsername(user)
  if (user.role !== Role.ADMIN) throw new Error("Forbidden")
  return user
}
