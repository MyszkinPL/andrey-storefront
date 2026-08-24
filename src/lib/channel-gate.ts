import { prisma } from "@/lib/prisma"
import { getServerEnv } from "@/lib/env"

/** Telegram's own words for "this person is in the chat". */
const MEMBER_STATUSES = new Set(["creator", "administrator", "member", "restricted"])

export type ChannelGate = {
  /** Without the "@", the way it is stored. */
  username: string
  /** The link a person can tap to join. */
  url: string
  joined: boolean
}

export function normalizeChannel(input: string | null | undefined) {
  const value = (input || "").trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "")
  return value ? value.replace(/\/.*$/, "") : null
}

export async function getRequiredChannel() {
  const settings = await prisma.shopSettings.findUnique({
    where: { id: 1 },
    select: { requiredChannel: true },
  })
  return normalizeChannel(settings?.requiredChannel)
}

/**
 * Asks Telegram whether someone is in the channel.
 *
 * A failure means "not blocked", never "blocked": if the bot was removed from
 * the channel or the username was mistyped, the shop must keep selling rather
 * than lock every buyer out over a misconfiguration.
 */
export async function isChannelMember(channel: string, telegramId: bigint | number) {
  try {
    const { BOT_TOKEN } = getServerEnv()
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: `@${channel}`,
          user_id: Number(telegramId),
        }),
      },
    )

    const payload = (await response.json()) as {
      ok?: boolean
      result?: { status?: string }
      description?: string
    }

    // "user not found" is a real answer: they are not in the channel.
    if (!payload.ok) {
      return /not found/i.test(payload.description || "") ? false : true
    }

    return MEMBER_STATUSES.has(payload.result?.status || "")
  } catch {
    return true
  }
}

/**
 * The gate for one person, or null when the shop does not ask for a
 * subscription at all.
 */
export async function checkChannelGate(
  telegramId: bigint | number,
): Promise<ChannelGate | null> {
  const channel = await getRequiredChannel()
  if (!channel) return null

  return {
    username: channel,
    url: `https://t.me/${channel}`,
    joined: await isChannelMember(channel, telegramId),
  }
}
