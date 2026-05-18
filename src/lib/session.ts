import crypto from "node:crypto"

import { cookies } from "next/headers"

import { getServerEnv } from "@/lib/env"

const COOKIE_NAME = "andrey_session"

type SessionPayload = {
  userId: string
  telegramId: string
  role: "USER" | "ADMIN"
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getServerEnv().SESSION_SECRET)
    .update(value)
    .digest("base64url")
}

export async function setSession(payload: SessionPayload) {
  const cookieStore = await cookies()
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  cookieStore.set(COOKIE_NAME, `${body}.${sign(body)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return null

  const [body, signature] = raw.split(".")
  if (!body || !signature || sign(body) !== signature) return null

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload
  } catch {
    return null
  }
}
