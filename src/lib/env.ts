import { z } from "zod"

const schema = z.object({
  BOT_TOKEN: z.string().min(1),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(24),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  ADMIN_TELEGRAM_IDS: z.string().default(""),
  ALLOW_DEV_AUTH: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  DEV_TELEGRAM_ID: z.string().optional(),
})

let cached: z.infer<typeof schema> | null = null

export function getServerEnv() {
  if (!cached) cached = schema.parse(process.env)
  return cached
}

export function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET
  if (process.env.NODE_ENV !== "production") {
    return "local-dev-session-secret-for-telegram-mock-only"
  }
  return getServerEnv().SESSION_SECRET
}
