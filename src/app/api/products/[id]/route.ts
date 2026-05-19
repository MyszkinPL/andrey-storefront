import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  title: z.string().min(2),
  category: z.string().optional(),
  description: z.string().min(8),
  imageDataUrl: z.string().optional(),
  priceRub: z.number().int().nonnegative(),
  deliveryType: z.enum(["MANUAL", "AUTO_KEY"]),
  keyPoolText: z.string().optional(),
  isActive: z.boolean(),
  specs: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
})

function parseKeys(input?: string) {
  return (input || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function cleanSpecs(
  specs: Array<{
    label: string
    value: string
  }>,
) {
  return specs
    .map((spec) => ({
      label: spec.label.trim(),
      value: spec.value.trim(),
    }))
    .filter((spec) => spec.label && spec.value)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      specs: {
        orderBy: { sortOrder: "asc" },
      },
      _count: {
        select: {
          keys: {
            where: { issuedAt: null },
          },
        },
      },
    },
  })

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    product: {
      id: product.id,
      slug: product.slug,
      title: product.title,
      category: product.category,
      description: product.description,
      imageDataUrl: product.imageDataUrl,
      priceRub: product.priceRub,
      deliveryType: product.deliveryType,
      isActive: product.isActive,
      availableKeyCount: product._count.keys,
      specs: product.specs.map((spec) => ({
        label: spec.label,
        value: spec.value,
      })),
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params
    const payload = schema.parse(await request.json())
    const keys = parseKeys(payload.keyPoolText)
    const specs = cleanSpecs(payload.specs)

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          title: payload.title,
          category: payload.category,
          description: payload.description,
          imageDataUrl: payload.imageDataUrl,
          priceRub: payload.priceRub,
          deliveryType: payload.deliveryType,
          isActive: payload.isActive,
        },
      })

      await tx.productSpec.deleteMany({
        where: { productId: id },
      })

      if (specs.length > 0) {
        await tx.productSpec.createMany({
          data: specs.map((spec, index) => ({
            productId: id,
            label: spec.label,
            value: spec.value,
            sortOrder: index,
          })),
        })
      }

      if (payload.deliveryType === "AUTO_KEY" && keys.length > 0) {
        await tx.productKey.createMany({
          data: keys.map((value) => ({ productId: id, value })),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    )
  }
}
