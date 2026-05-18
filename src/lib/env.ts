import { z } from "zod"

const schema = z.object({
  BOT_TOKEN: z.string().min(1),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(24),
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
