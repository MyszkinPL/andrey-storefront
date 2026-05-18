import { NextResponse } from "next/server"

import { getBot } from "@/lib/bot"

export async function POST(request: Request) {
  const update = await request.json()
  await getBot().handleUpdate(update)
  return NextResponse.json({ ok: true })
}
