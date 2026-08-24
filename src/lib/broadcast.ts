import { Role } from "@prisma/client"

import { getServerEnv } from "@/lib/env"
import { prisma } from "@/lib/prisma"

/**
 * Telegram allows roughly 30 messages a second to different chats. Sending in
 * small batches with a pause between them keeps a broadcast inside that
 * budget; going faster earns a 429 and a retry-after that costs more time than
 * the pause saves.
 */
const BATCH_SIZE = 25
const BATCH_PAUSE_MS = 1_100

export type BroadcastDraft = {
  text: string
  imageDataUrl?: string | null
  buttonLabel?: string | null
  buttonUrl?: string | null
}

export type BroadcastResult = {
  id: string
  sent: number
  failed: number
  total: number
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callTelegram(method: string, payload: unknown) {
  const { BOT_TOKEN } = getServerEnv()
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })
  return (await response.json()) as { ok?: boolean; description?: string }
}

/** Everyone the bot is allowed to write to: it has to have met them first. */
export async function getBroadcastAudience() {
  return prisma.user.findMany({
    where: { isBanned: false, botStartedAt: { not: null } },
    select: { telegramId: true },
    orderBy: { createdAt: "asc" },
  })
}

export async function countBroadcastAudience() {
  return prisma.user.count({
    where: { isBanned: false, botStartedAt: { not: null } },
  })
}

/**
 * Sends a post from the bot to every user who has started it.
 *
 * A blocked or deleted account answers with an error; that is expected and
 * only counted, never thrown, so one dead chat cannot stop the broadcast.
 */
export async function sendBroadcast(
  draft: BroadcastDraft,
  createdById?: string,
): Promise<BroadcastResult> {
  const audience = await getBroadcastAudience()

  const record = await prisma.broadcast.create({
    data: {
      text: draft.text,
      imageDataUrl: draft.imageDataUrl ?? null,
      buttonLabel: draft.buttonLabel ?? null,
      buttonUrl: draft.buttonUrl ?? null,
      totalCount: audience.length,
      createdById: createdById ?? null,
    },
  })

  const replyMarkup =
    draft.buttonLabel && draft.buttonUrl
      ? { inline_keyboard: [[{ text: draft.buttonLabel, url: draft.buttonUrl }]] }
      : undefined

  let sent = 0
  let failed = 0

  for (let index = 0; index < audience.length; index += BATCH_SIZE) {
    const batch = audience.slice(index, index + BATCH_SIZE)

    const results = await Promise.all(
      batch.map(async (person) => {
        const payload = {
          chat_id: Number(person.telegramId),
          parse_mode: "HTML" as const,
          reply_markup: replyMarkup,
        }

        const response = draft.imageDataUrl
          ? await callTelegram("sendPhoto", {
              ...payload,
              photo: draft.imageDataUrl,
              caption: draft.text,
            })
          : await callTelegram("sendMessage", { ...payload, text: draft.text })

        return Boolean(response.ok)
      }),
    )

    for (const ok of results) {
      if (ok) sent += 1
      else failed += 1
    }

    if (index + BATCH_SIZE < audience.length) await sleep(BATCH_PAUSE_MS)
  }

  await prisma.broadcast.update({
    where: { id: record.id },
    data: { sentCount: sent, failedCount: failed, finishedAt: new Date() },
  })

  return { id: record.id, sent, failed, total: audience.length }
}

/** Admins get the broadcast result even when it took a while to finish. */
export async function notifyAdmins(text: string) {
  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN, botStartedAt: { not: null } },
    select: { telegramId: true },
  })

  await Promise.all(
    admins.map((admin) =>
      callTelegram("sendMessage", {
        chat_id: Number(admin.telegramId),
        parse_mode: "HTML",
        text,
      }).catch(() => undefined),
    ),
  )
}
