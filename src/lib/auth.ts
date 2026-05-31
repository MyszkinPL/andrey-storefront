import { Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { WebAppUser } from "@/lib/telegram"

export const USERNAME_REQUIRED_MESSAGE =
  "Добавь username в Telegram, затем открой магазин заново. Без @username мы не сможем выдать заказ."

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

function requireTelegramUsername(user: { username: string | null }) {
  if (!hasTelegramUsername(user)) throw new Error(USERNAME_REQUIRED_MESSAGE)
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
      ...(shouldPromoteToAdmin ? { role: Role.ADMIN } : {}),
    },
    create: {
      telegramId: BigInt(user.id),
      username: user.username ?? null,
      firstName: user.first_name,
      lastName: user.last_name ?? null,
      photoUrl: user.photo_url ?? null,
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
    throw new Error(user.banReason ? `Аккаунт заблокирован: ${user.banReason}` : "Аккаунт заблокирован")
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
