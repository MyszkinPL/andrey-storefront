/**
 * Callback data protocol for the admin panel. Telegram caps `callback_data` at
 * 64 bytes, so actions are short prefixes followed by a cuid.
 */
export type Callback = {
  action: string
  id: string
}

export function parseCallback(data: string): Callback {
  const separator = data.indexOf(":")
  if (separator === -1) return { action: data, id: "" }
  return { action: data.slice(0, separator), id: data.slice(separator + 1) }
}

export function buildCallback(action: string, id?: string) {
  return id ? `${action}:${id}` : action
}

/**
 * Accepts what a human types for a price — spaces, a currency sign, a
 * thousands separator — and returns whole roubles, or null when there is no
 * number in there at all.
 */
export function parsePrice(input: string): number | null {
  const digits = input.replace(/[^\d]/g, "")
  if (!digits) return null

  const value = Number(digits)
  return Number.isSafeInteger(value) && value >= 0 ? value : null
}

/** Splits a pasted block of keys into trimmed, non-empty lines. */
export function parseKeys(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Buy callbacks carry both ids: `sq:<productId>:<methodId|c>`. Split from the
 * right, because only the trailing segment is the payment token.
 */
export function parseBuyToken(id: string) {
  const separator = id.lastIndexOf(":")
  if (separator === -1) return { productId: id, methodToken: "" }
  return {
    productId: id.slice(0, separator),
    methodToken: id.slice(separator + 1),
  }
}
