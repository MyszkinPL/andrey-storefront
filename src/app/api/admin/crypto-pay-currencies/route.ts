import { NextResponse } from "next/server"

import { errorResponse } from "@/lib/api-error"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { getCryptoPayCurrencies } from "@/lib/crypto-pay"

const schema = z.object({
  token: z.string().optional(),
  useTestnet: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const payload = schema.parse(await request.json())

    const currencies = await getCryptoPayCurrencies({
      token: payload.token?.trim() || undefined,
      useTestnet: payload.useTestnet,
    })

    return NextResponse.json({
      currencies,
      assets: currencies.filter((item) => !item.isFiat),
      fiats: currencies.filter((item) => item.isFiat),
    })
  } catch (error) {
    return errorResponse(error)
  }
}
