import { NextResponse } from "next/server"
import { z } from "zod"

import { getCurrentUser, requireAdmin } from "@/lib/auth"
import type { ProductResponse } from "@/lib/contracts"
import { mediaUrl } from "@/lib/media"
import { errorResponse } from "@/lib/api-error"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  title: z.string().trim().min(1),
  category: z.string().optional(),
  description: z.string().trim().min(1),
  // Absent keeps the stored image, null clears it.
  imageDataUrl: z.string().nullish(),
  priceRub: z.number().int().nonnegative(),
  deliveryType: z.enum(["MANUAL", "AUTO_KEY"]),
  keyPoolText: z.string().optional(),
  removeKeyIds: z.array(z.string()).optional(),
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
  const user = await getCurrentUser()
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      specs: {
        orderBy: { sortOrder: "asc" },
      },
      keys:
        user?.role === "ADMIN"
          ? {
              where: { issuedAt: null },
              orderBy: { createdAt: "desc" },
              take: 200,
            }
          : false,
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
      imageUrl: mediaUrl("product", product.id, product.imageUpdatedAt),
      priceRub: product.priceRub,
      deliveryType: product.deliveryType,
      isActive: product.isActive,
      availableKeyCount: product._count.keys,
      editableKeys:
        user?.role === "ADMIN"
          ? product.keys.map((key) => ({
              id: key.id,
              value: key.value,
              createdAt: key.createdAt.toISOString(),
            }))
          : undefined,
      specs: product.specs.map((spec) => ({
        label: spec.label,
        value: spec.value,
      })),
    },
  } satisfies ProductResponse)
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
          // undefined keeps the current cover, null clears it — the editor
          // only sends the field when the admin actually changed it.
          imageDataUrl: payload.imageDataUrl,
          imageUpdatedAt:
            payload.imageDataUrl === undefined
              ? undefined
              : payload.imageDataUrl
                ? new Date()
                : null,
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

      if (payload.deliveryType === "AUTO_KEY") {
        if (payload.removeKeyIds?.length) {
          await tx.productKey.deleteMany({
            where: {
              id: { in: payload.removeKeyIds },
              productId: id,
              issuedAt: null,
            },
          })
        }

        if (keys.length > 0) {
          await tx.productKey.createMany({
            data: keys.map((value) => ({ productId: id, value })),
          })
        }
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()
    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        priceRub: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: { productId: id },
        select: {
          id: true,
          deliveredKeyValue: true,
          deliveredKey: {
            select: {
              value: true,
            },
          },
        },
      })

      for (const order of orders) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            productId: null,
            productTitleSnapshot: product.title,
            productCategorySnapshot: product.category,
            priceRubSnapshot: product.priceRub,
            deliveredKeyValue: order.deliveredKey?.value || order.deliveredKeyValue,
          },
        })
      }

      await tx.product.delete({
        where: { id },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
