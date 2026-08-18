import { createHash } from "node:crypto"

import { NextResponse } from "next/server"

import { decodeDataUrl } from "@/lib/media"
import { prisma } from "@/lib/prisma"

const KINDS = ["product", "payment-method"] as const
type Kind = (typeof KINDS)[number]

function isKind(value: string): value is Kind {
  return (KINDS as readonly string[]).includes(value)
}

async function loadDataUrl(kind: Kind, id: string) {
  if (kind === "product") {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { imageDataUrl: true },
    })
    return product?.imageDataUrl ?? null
  }

  const method = await prisma.paymentMethod.findUnique({
    where: { id },
    select: { iconDataUrl: true },
  })
  return method?.iconDataUrl ?? null
}

/**
 * Serves a stored image as a real file. Covers used to travel as base64 inside
 * every catalogue response, which meant re-downloading them on each load and
 * no browser caching at all. The URL carries the record's updatedAt, so the
 * response can be immutable and a replaced image simply gets a new URL.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params
  if (!isKind(kind)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const image = decodeDataUrl(await loadDataUrl(kind, id))
  if (!image) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const etag = `"${createHash("sha1").update(image.body).digest("base64url")}"`
  if (request.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } })
  }

  return new NextResponse(new Uint8Array(image.body), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(image.body.length),
      "Content-Type": image.contentType,
      ETag: etag,
    },
  })
}
