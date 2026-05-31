import { NextResponse } from "next/server"
import { z } from "zod"

import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  title: z.string().trim().min(1),
  category: z.string().optional(),
  description: z.string().trim().min(1),
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

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "")
}

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

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
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

  return NextResponse.json({
    products: products.map((product) => ({
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
    })),
  })
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const payload = schema.parse(await request.json())
    const keys = parseKeys(payload.keyPoolText)
    const specs = cleanSpecs(payload.specs)

    await prisma.product.create({
      data: {
        title: payload.title,
        category: payload.category,
        description: payload.description,
        imageDataUrl: payload.imageDataUrl,
        priceRub: payload.priceRub,
        deliveryType: payload.deliveryType,
        isActive: payload.isActive,
        slug: `${slugify(payload.title)}-${Date.now().toString(36)}`,
        specs:
          specs.length > 0
            ? {
                createMany: {
                  data: specs.map((spec, index) => ({
                    label: spec.label,
                    value: spec.value,
                    sortOrder: index,
                  })),
                },
              }
            : undefined,
        keys:
          payload.deliveryType === "AUTO_KEY" && keys.length > 0
            ? {
                createMany: {
                  data: keys.map((value) => ({ value })),
                },
              }
            : undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Save failed" },
      { status: 400 },
    )
  }
}
