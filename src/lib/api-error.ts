import { NextResponse } from "next/server"

import { translate, type TranslationKey } from "@/lib/i18n"
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config"

/**
 * Machine-readable reason for a failed request.
 *
 * The client used to tell these apart by HTTP status and by matching the
 * message text, which is how the auth gate ended up branching blindly on 403
 * and trapping users behind a screen they could not clear. A code lets the UI
 * react to *what* happened rather than guess from prose.
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BANNED"
  | "USERNAME_REQUIRED"
  | "ORDER_LIMIT"
  | "ORDER_STATE"
  | "PAYMENT_METHOD"
  | "RECEIPT_INVALID"
  | "VALIDATION"
  | "UNKNOWN"

const STATUS: Record<ApiErrorCode, number> = {
  BANNED: 403,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  ORDER_LIMIT: 400,
  ORDER_STATE: 409,
  PAYMENT_METHOD: 400,
  RECEIPT_INVALID: 400,
  UNAUTHORIZED: 401,
  UNKNOWN: 400,
  USERNAME_REQUIRED: 403,
  VALIDATION: 400,
}

export class ApiFailure extends Error {
  readonly code: ApiErrorCode
  readonly status: number

  constructor(code: ApiErrorCode, message: string, status?: number) {
    super(message)
    this.name = "ApiFailure"
    this.code = code
    this.status = status ?? STATUS[code]
  }
}

/** Builds a failure whose message is already in the reader's language. */
export function failure(
  code: ApiErrorCode,
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
) {
  return new ApiFailure(code, translate(locale, key, params))
}

/**
 * Turns anything thrown inside a route into a response carrying both a
 * human-readable message and its code.
 */
export function errorResponse(error: unknown, locale: Locale = DEFAULT_LOCALE) {
  if (error instanceof ApiFailure) {
    return NextResponse.json(
      { code: error.code, error: error.message },
      { status: error.status },
    )
  }

  const message =
    error instanceof Error ? error.message : translate(locale, "errors.generic")

  return NextResponse.json({ code: "UNKNOWN", error: message }, { status: 400 })
}
