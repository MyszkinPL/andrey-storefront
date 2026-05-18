import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  shopName: z.string().min(2),
  welcomeText: z.string().min(4),
  supportIntro: z.string().min(4),
  supportUsername: z.string().optional(),
  paymentMethods: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(2),
      details: z.string().min(4),
      isActive: z.boolean(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const payload = schema.parse(await request.json())

    await prisma.shopSettings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        shopName: payload.shopName,
        welcomeText: payload.welcomeText,
        supportIntro: payload.supportIntro,
        supportUsername: payload.supportUsername,
      },
      update: {
        shopName: payload.shopName,
        welcomeText: payload.welcomeText,
        supportIntro: payload.supportIntro,
        supportUsername: payload.supportUsername,
      },
    })

    await prisma.$transaction([
      prisma.paymentMethod.deleteMany(),
      prisma.paymentMethod.createMany({
        data: payload.paymentMethods.map((method, index) => ({
          title: method.title,
          details: method.details,
          isActive: method.isActive,
          sortOrder: index,
        })),
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Settings save failed" },
      { status: 400 },
    )
  }
}
