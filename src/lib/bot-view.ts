import { InputFile, type Context, type InlineKeyboard } from "grammy"

/** Telegram's hard limits: 4096 for a message, 1024 for a photo caption. */
export const MESSAGE_LIMIT = 4096
export const CAPTION_LIMIT = 1024

export type View = {
  text: string
  keyboard: InlineKeyboard
  /** Rendered as a photo with the text as its caption. */
  photo?: Buffer
}

/** Decodes the base64 data URLs product images are stored as. */
export function dataUrlToBuffer(dataUrl: string | null | undefined) {
  if (!dataUrl) return undefined
  const comma = dataUrl.indexOf(",")
  if (comma === -1 || !dataUrl.startsWith("data:")) return undefined

  try {
    return Buffer.from(dataUrl.slice(comma + 1), "base64")
  } catch {
    return undefined
  }
}

export function clamp(value: string, limit: number) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`
}

function hasPhoto(ctx: Context) {
  const message = ctx.callbackQuery?.message
  return Boolean(message && "photo" in message && message.photo)
}

/**
 * Replaces the message a button belongs to, keeping the conversation to a
 * single card. Telegram cannot turn a text message into a photo message or
 * back, so those transitions delete and re-send instead of editing.
 */
export async function replaceMessage(ctx: Context, view: View) {
  const wasPhoto = hasPhoto(ctx)
  const caption = clamp(view.text, view.photo ? CAPTION_LIMIT : MESSAGE_LIMIT)

  try {
    if (view.photo) {
      if (wasPhoto) {
        await ctx.editMessageMedia(
          {
            caption,
            media: new InputFile(view.photo),
            parse_mode: "HTML",
            type: "photo",
          },
          { reply_markup: view.keyboard },
        )
        return
      }

      await ctx.deleteMessage().catch(() => {})
      await ctx.replyWithPhoto(new InputFile(view.photo), {
        caption,
        parse_mode: "HTML",
        reply_markup: view.keyboard,
      })
      return
    }

    if (wasPhoto) {
      await ctx.deleteMessage().catch(() => {})
      await ctx.reply(caption, {
        parse_mode: "HTML",
        reply_markup: view.keyboard,
      })
      return
    }

    await ctx.editMessageText(caption, {
      parse_mode: "HTML",
      reply_markup: view.keyboard,
    })
  } catch {
    // "message is not modified" and expired-edit errors both end up here; a
    // fresh message is always an acceptable fallback.
    await ctx.reply(caption, {
      parse_mode: "HTML",
      reply_markup: view.keyboard,
    })
  }
}
