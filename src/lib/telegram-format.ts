/** Escapes text for Telegram's HTML parse mode. */
export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** The subset of Telegram's MessageEntity this converter reads. */
export type MessageEntityLike = {
  type: string
  offset: number
  length: number
  url?: string
  language?: string
  custom_emoji_id?: string
}

function openTag(entity: MessageEntityLike) {
  switch (entity.type) {
    case "bold":
      return "<b>"
    case "italic":
      return "<i>"
    case "underline":
      return "<u>"
    case "strikethrough":
      return "<s>"
    case "spoiler":
      return "<tg-spoiler>"
    case "code":
      return "<code>"
    case "pre":
      return entity.language
        ? `<pre><code class="language-${escapeHtml(entity.language)}">`
        : "<pre>"
    case "text_link":
      return entity.url ? `<a href="${escapeHtml(entity.url)}">` : ""
    case "blockquote":
      return "<blockquote>"
    case "expandable_blockquote":
      return "<blockquote expandable>"
    case "custom_emoji":
      return entity.custom_emoji_id
        ? `<tg-emoji emoji-id="${escapeHtml(entity.custom_emoji_id)}">`
        : ""
    default:
      return ""
  }
}

function closeTag(entity: MessageEntityLike) {
  switch (entity.type) {
    case "bold":
      return "</b>"
    case "italic":
      return "</i>"
    case "underline":
      return "</u>"
    case "strikethrough":
      return "</s>"
    case "spoiler":
      return "</tg-spoiler>"
    case "code":
      return "</code>"
    case "pre":
      return entity.language ? "</code></pre>" : "</pre>"
    case "text_link":
      return entity.url ? "</a>" : ""
    case "blockquote":
    case "expandable_blockquote":
      return "</blockquote>"
    case "custom_emoji":
      return entity.custom_emoji_id ? "</tg-emoji>" : ""
    default:
      return ""
  }
}

/**
 * Re-creates the HTML for a message an admin formatted in Telegram itself,
 * so a broadcast keeps the bold, links and spoilers they applied instead of
 * asking them to type tags by hand. Offsets are UTF-16 code units, which is
 * also what JavaScript string indices are, so slicing needs no conversion.
 */
export function entitiesToHtml(
  text: string,
  entities: readonly MessageEntityLike[] | undefined,
) {
  if (!entities || entities.length === 0) return escapeHtml(text)

  // Outer entities open first and close last; Telegram guarantees proper
  // nesting, so sorting by start (then by longest) is enough.
  const ordered = [...entities].sort(
    (a, b) => a.offset - b.offset || b.length - a.length,
  )
  const opens = new Map<number, string[]>()
  const closes = new Map<number, string[]>()

  for (const entity of ordered) {
    const open = openTag(entity)
    if (!open) continue
    const end = entity.offset + entity.length
    opens.set(entity.offset, [...(opens.get(entity.offset) ?? []), open])
    // Closing tags come out innermost first.
    closes.set(end, [closeTag(entity), ...(closes.get(end) ?? [])])
  }

  let html = ""
  let cursor = 0
  const points = Array.from(new Set([...opens.keys(), ...closes.keys()])).sort(
    (a, b) => a - b,
  )

  for (const point of points) {
    html += escapeHtml(text.slice(cursor, point))
    html += (closes.get(point) ?? []).join("")
    html += (opens.get(point) ?? []).join("")
    cursor = point
  }

  return html + escapeHtml(text.slice(cursor))
}
