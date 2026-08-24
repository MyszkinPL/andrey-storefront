import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/auth"
import { errorResponse } from "@/lib/api-error"
import type { StatsResponse } from "@/lib/contracts"
import { getShopStats } from "@/lib/shop-stats"

export async function GET() {
  try {
    await requireAdmin()
    const stats = await getShopStats(5)

    return NextResponse.json({ stats } satisfies StatsResponse)
  } catch (error) {
    return errorResponse(error)
  }
}
