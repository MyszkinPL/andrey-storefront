import { InlineKeyboard, type Context } from "grammy"

import { CAPTION_LIMIT } from "@/lib/bot-view"
import type { TranslateFn } from "@/lib/i18n"

/** A broadcast being put together: text, an optional photo, an optional button. */
export type BroadcastComposition = {
  /** Already HTML, as Telegram's parse mode wants it. */
  text: string
  /** Telegram file_id of a photo the admin sent to the bot. */
  photoFileId: string | null
  buttonLabel: string | null
  buttonUrl: string | null
}

const EMPTY: BroadcastComposition = {
  text: "",
  photoFileId: null,
  buttonLabel: null,
  buttonUrl: null,
}

/**
 * One draft per admin, in memory with a TTL, beside the pending actions and
 * for the same reason: cheap to redo, not worth a table until it is sent.
 */
const drafts = new Map<number, { draft: BroadcastComposition; at: number }>()
const DRAFT_TTL_MS = 30 * 60 * 1000

export function getBroadcastDraft(telegramId: number): BroadcastComposition | null {
  const entry = drafts.get(telegramId)
  if (!entry) return null
  if (Date.now() - entry.at > DRAFT_TTL_MS) {
    drafts.delete(telegramId)
    return null
  }
  return entry.draft
}

export function updateBroadcastDraft(
  telegramId: number,
  patch: Partial<BroadcastComposition>,
): BroadcastComposition {
  const draft = { ...(getBroadcastDraft(telegramId) ?? EMPTY), ...patch }
  drafts.set(telegramId, { draft, at: Date.now() })
  return draft
}

export function clearBroadcastDraft(telegramId: number) {
  drafts.delete(telegramId)
}

export function isBroadcastEmpty(draft: BroadcastComposition | null) {
  return !draft || (!draft.text.trim() && !draft.photoFileId)
}

/** A photo caption is capped well below a plain message. */
export function broadcastTooLongForPhoto(draft: BroadcastComposition) {
  return Boolean(draft.photoFileId) && draft.text.length > CAPTION_LIMIT
}

/**
 * "Label | https://…" typed by an admin. A newline works as the separator
 * too, because that is what a phone keyboard makes easy.
 */
export function parseButtonInput(input: string): { label: string; url: string } | null {
  const parts = input
    .split(/\||\n/)
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.length < 2) return null

  const url = parts[parts.length - 1]
  const label = parts.slice(0, -1).join(" ").slice(0, 64)
  if (!label) return null
  if (!/^(https?:\/\/|tg:\/\/)\S+$/i.test(url)) return null

  return { label, url }
}

/** The recipient-facing keyboard: just the post's own button, if any. */
export function broadcastPostKeyboard(draft: BroadcastComposition) {
  if (!draft.buttonLabel || !draft.buttonUrl) return undefined
  return new InlineKeyboard().url(draft.buttonLabel, draft.buttonUrl)
}

/** The admin's controls under the preview. */
export function broadcastControls(draft: BroadcastComposition, t: TranslateFn) {
  const keyboard = new InlineKeyboard().text(t("bot.broadcastSend"), "bs").row()

  keyboard
    .text(draft.photoFileId ? t("bot.broadcastReplacePhoto") : t("bot.broadcastAddPhoto"), "bp")
    .text(draft.buttonLabel ? t("bot.broadcastEditButton") : t("bot.broadcastAddButton"), "bb")
    .row()

  if (draft.photoFileId || draft.buttonLabel) {
    if (draft.photoFileId) keyboard.text(t("bot.broadcastRemovePhoto"), "bx")
    if (draft.buttonLabel) keyboard.text(t("bot.broadcastRemoveButton"), "bk")
    keyboard.row()
  }

  keyboard.text(t("bot.broadcastEditText"), "bt").text(t("bot.cancelAction"), "b")
  return keyboard
}

/**
 * Shows the post exactly as recipients will get it — its own message, its
 * own button — followed by a short note with the controls. One message
 * cannot carry both the post's button and the admin's, so it is two.
 */
export async function sendBroadcastPreview(
  ctx: Context,
  draft: BroadcastComposition,
  count: number,
  t: TranslateFn,
) {
  const postKeyboard = broadcastPostKeyboard(draft)

  if (draft.photoFileId) {
    await ctx.replyWithPhoto(draft.photoFileId, {
      caption: draft.text || undefined,
      parse_mode: "HTML",
      reply_markup: postKeyboard,
    })
  } else {
    await ctx.reply(draft.text, { parse_mode: "HTML", reply_markup: postKeyboard })
  }

  await ctx.reply(t("bot.broadcastPreview", { count }), {
    parse_mode: "HTML",
    reply_markup: broadcastControls(draft, t),
  })
}
