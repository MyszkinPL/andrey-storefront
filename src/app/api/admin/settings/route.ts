import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { errorResponse } from "@/lib/api-error"
import { normalizeChannel } from "@/lib/channel-gate"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  shopName: z.string().min(2),
  supportUsername: z.string().optional(),
  cryptoPayEnabled: z.boolean(),
  cryptoPayToken: z.string().optional(),
  cryptoPayUseTestnet: z.boolean(),
  cryptoPayFiat: z.string().min(3).max(6),
  cryptoPayDefaultAssets: z.string().optional(),
  requiredChannel: z.string().optional(),
  paymentMethods: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string().min(2),
      type: z.literal("MANUAL"),
      details: z.string(),
      // Absent keeps the stored image, null clears it.
  iconDataUrl: z.string().nullish(),
      isActive: z.boolean(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const payload = schema.parse(await request.json())
    // Stored bare, so "@shop", "t.me/shop" and "shop" all mean one channel.
    const requiredChannel = normalizeChannel(payload.requiredChannel)
    const paymentMethods = payload.paymentMethods.map((method) => ({
      ...method,
      details: method.details.trim(),
      iconDataUrl: method.iconDataUrl?.trim() || undefined,
    }))

    await prisma.$transaction(async (tx) => {
      await tx.shopSettings.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          shopName: payload.shopName,
          supportUsername: payload.supportUsername,
          cryptoPayEnabled: payload.cryptoPayEnabled,
          cryptoPayToken: payload.cryptoPayToken,
          cryptoPayUseTestnet: payload.cryptoPayUseTestnet,
          cryptoPayFiat: payload.cryptoPayFiat.toUpperCase(),
          cryptoPayDefaultAssets: payload.cryptoPayDefaultAssets,
          requiredChannel,
        },
        update: {
          shopName: payload.shopName,
          supportUsername: payload.supportUsername,
          cryptoPayEnabled: payload.cryptoPayEnabled,
          cryptoPayToken: payload.cryptoPayToken,
          cryptoPayUseTestnet: payload.cryptoPayUseTestnet,
          cryptoPayFiat: payload.cryptoPayFiat.toUpperCase(),
          cryptoPayDefaultAssets: payload.cryptoPayDefaultAssets,
          requiredChannel,
        },
      })

      const existing = await tx.paymentMethod.findMany({
        select: { id: true },
      })

      const nextIds = new Set(paymentMethods.map((method) => method.id).filter(Boolean))
      const removeIds = existing
        .map((method) => method.id)
        .filter((id) => !nextIds.has(id))

      for (const [index, method] of paymentMethods.entries()) {
        if (method.id) {
          await tx.paymentMethod.update({
            where: { id: method.id },
            data: {
              title: method.title,
              type: method.type,
              details: method.details,
              iconDataUrl: method.iconDataUrl,
              iconUpdatedAt: method.iconDataUrl ? new Date() : null,
              cryptoAcceptedAssets: null,
              isActive: method.isActive,
              sortOrder: index,
            },
          })
        } else {
          await tx.paymentMethod.create({
            data: {
              title: method.title,
              type: method.type,
              details: method.details,
              iconDataUrl: method.iconDataUrl,
              iconUpdatedAt: method.iconDataUrl ? new Date() : null,
              cryptoAcceptedAssets: null,
              isActive: method.isActive,
              sortOrder: index,
            },
          })
        }
      }

      if (removeIds.length > 0) {
        await tx.paymentMethod.deleteMany({
          where: { id: { in: removeIds } },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
