import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { errorResponse } from "@/lib/api-error"
import type { OkResponse } from "@/lib/contracts"
import { recordProductView } from "@/lib/shop-stats"

/**
 * Counts a product card open. Deliberately forgiving: a view that cannot be
 * recorded — deleted product, race with a delete — is not worth an error on
 * the screen the buyer is looking at.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params

    await recordProductView(id, user.id).catch(() => {})

    return NextResponse.json({ ok: true } satisfies OkResponse)
  } catch (error) {
    return errorResponse(error)
  }
}
