import { spawn } from "node:child_process"
import { createHmac } from "node:crypto"

const port = process.env.PORT || "3000"
const appUrl = process.env.APP_URL
const botToken = process.env.BOT_TOKEN
const databaseUrl = process.env.DATABASE_URL?.trim()

const prismaCli =
  process.platform === "win32"
    ? ["node.exe", ["./node_modules/prisma/build/index.js"]]
    : ["node", ["./node_modules/prisma/build/index.js"]]

// `db push --accept-data-loss` silently dropped whatever the schema no longer
// mentioned. `migrate deploy` only applies reviewed migrations and refuses to
// start on a mismatch, so a bad change fails the deploy instead of the data.
const migrateArgs = ["migrate", "deploy"]

await run(prismaCli[0], [...prismaCli[1], ...migrateArgs], {
  ...process.env,
  ...(databaseUrl ? { DATABASE_URL: databaseUrl } : {}),
})

if (appUrl && botToken) {
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`

  // Must match src/lib/webhook-secret.ts — the webhook drives the admin panel,
  // so Telegram has to prove that an update really came from it.
  const webhookSecret =
    process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ||
    (process.env.SESSION_SECRET
      ? createHmac("sha256", process.env.SESSION_SECRET)
          .update("telegram-webhook")
          .digest("hex")
      : null)

  if (!webhookSecret) {
    throw new Error(
      "SESSION_SECRET or TELEGRAM_WEBHOOK_SECRET is required to secure the Telegram webhook",
    )
  }

  await telegram("setWebhook", {
    url: webhookUrl,
    secret_token: webhookSecret,
    allowed_updates: ["message", "callback_query"],
  })
  // Telegram picks the command list by the client's language, so register the
  // English set as the default and Russian as a language-scoped override.
  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Open the shop" },
      { command: "orders", description: "My orders" },
      { command: "admin", description: "Admin panel" },
      { command: "help", description: "Help" },
    ],
  })
  await telegram("setMyCommands", {
    language_code: "ru",
    commands: [
      { command: "start", description: "Открыть магазин" },
      { command: "orders", description: "Мои заказы" },
      { command: "admin", description: "Админка" },
      { command: "help", description: "Помощь" },
    ],
  })
  // No chat menu button: the app is opened from the bot's own /start keyboard,
  // so a second Telegram-provided entry point is redundant.
  await telegram("setChatMenuButton", { menu_button: { type: "default" } })
}

const serverCommand =
  process.platform === "win32"
    ? ["node.exe", ["server.js"]]
    : ["node", ["server.js"]]

const server = spawn(serverCommand[0], serverCommand[1], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
    HOSTNAME: process.env.HOSTNAME || "0.0.0.0",
  },
})

server.on("exit", (code) => process.exit(code ?? 0))

async function telegram(method, payload) {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Telegram ${method} failed: ${text}`)
  }
}

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === "win32" ? `${command}.cmd` : command, args, {
      stdio: "inherit",
      env,
    })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`))
    })
  })
}
