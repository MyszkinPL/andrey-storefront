import { NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth"
import { LOCALES } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  language: z.enum(LOCALES),
})

export async function PATCH(request: Request) {
  try {
    const user = await requireUser()
    const { language } = schema.parse(await request.json())

    await prisma.user.update({
      where: { id: user.id },
      data: { language },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Language update failed" },
      { status: 400 },
    )
  }
}
