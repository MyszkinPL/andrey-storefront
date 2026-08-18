const DATA_URL = /^data:([^;,]+)(;base64)?,([\s\S]*)$/

export type DecodedImage = {
  body: Buffer
  contentType: string
}

/**
 * Splits a stored data URL into bytes and a content type so images can be
 * served as real files instead of being inlined into every JSON response.
 */
export function decodeDataUrl(value: string | null | undefined): DecodedImage | null {
  if (!value) return null

  const match = DATA_URL.exec(value.trim())
  if (!match) return null

  const [, contentType, base64Marker, payload] = match

  try {
    const body = base64Marker
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8")

    return body.length > 0 ? { body, contentType } : null
  } catch {
    return null
  }
}

/**
 * Image URL for a stored asset. `updatedAt` is the cache key: the response is
 * immutable, so a replaced image has to arrive under a new URL.
 */
export function mediaUrl(
  kind: "product" | "payment-method",
  id: string,
  imageUpdatedAt: Date | null,
) {
  if (!imageUpdatedAt) return null
  return `/api/media/${kind}/${id}?v=${imageUpdatedAt.getTime()}`
}
