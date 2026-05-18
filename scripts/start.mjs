import { spawn } from "node:child_process"

const port = process.env.PORT || "3001"
const appUrl = process.env.APP_URL
const botToken = process.env.BOT_TOKEN

await run("npx", ["prisma", "generate"])
await run("npx", [
  "prisma",
  "db",
  "push",
  "--accept-data-loss",
  "--url",
  process.env.DATABASE_URL,
])

if (appUrl && botToken) {
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`
  await telegram("setWebhook", { url: webhookUrl })
  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть магазин" },
      { command: "tickets", description: "Мои тикеты" },
      { command: "help", description: "Помощь" },
    ],
  })
  await telegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "Открыть магазин",
      web_app: { url: appUrl },
    },
  })
}

const server = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", port], {
  stdio: "inherit",
  env: process.env,
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

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === "win32" ? `${command}.cmd` : command, args, {
      stdio: "inherit",
      env: process.env,
    })
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`))
    })
  })
}
