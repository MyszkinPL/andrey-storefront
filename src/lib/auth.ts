import { Role } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import type { WebAppUser } from "@/lib/telegram"

function parseAdminIds() {
  return new Set(
    (process.env.ADMIN_TELEGRAM_IDS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  )
}

export async function upsertTelegramUser(user: WebAppUser) {
  const explicitAdmins = parseAdminIds()
  const hasSeedAdmins = explicitAdmins.size > 0
  const existingAdmin = hasSeedAdmins
    ? true
    : Boolean(
        await prisma.user.findFirst({
          where: { role: Role.ADMIN },
          select: { id: true },
        }),
      )
  const role =
    explicitAdmins.has(String(user.id)) || (!hasSeedAdmins && !existingAdmin)
      ? Role.ADMIN
      : Role.USER

  return prisma.user.upsert({
    where: { telegramId: BigInt(user.id) },
    update: {
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      role,
    },
    create: {
      telegramId: BigInt(user.id),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      photoUrl: user.photo_url,
      role,
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

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== Role.ADMIN) throw new Error("Forbidden")
  return user
}
