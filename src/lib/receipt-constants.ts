export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024

export const RECEIPT_MAX_MB = RECEIPT_MAX_BYTES / (1024 * 1024)

export const RECEIPT_MIME_TYPE = "application/pdf"

export type ReceiptValidationError = "type" | "size" | "empty"

/**
 * Shared by the upload form and the API route so the buyer sees the same rule
 * the server enforces.
 */
export function validateReceiptFile(file: {
  type: string
  size: number
  name: string
}): ReceiptValidationError | null {
  const looksLikePdf =
    file.type === RECEIPT_MIME_TYPE || file.name.toLowerCase().endsWith(".pdf")

  if (!looksLikePdf) return "type"
  if (file.size <= 0) return "empty"
  if (file.size > RECEIPT_MAX_BYTES) return "size"
  return null
}
