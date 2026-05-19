import { spawn } from "node:child_process"

const port = process.env.PORT || "3001"
const appUrl = process.env.APP_URL
const botToken = process.env.BOT_TOKEN
const databaseUrl = process.env.DATABASE_URL?.trim()

const prismaCli =
  process.platform === "win32"
    ? ["node.exe", ["./node_modules/prisma/build/index.js"]]
    : ["node", ["./node_modules/prisma/build/index.js"]]

const dbPushArgs = ["db", "push", "--accept-data-loss"]
if (databaseUrl) {
  dbPushArgs.push("--url", databaseUrl)
}

await run(prismaCli[0], [...prismaCli[1], ...dbPushArgs])

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

const serverCommand =
  process.platform === "win32"
    ? ["node.exe", ["server.js"]]
    : ["node", ["server.js"]]

const server = spawn(serverCommand[0], serverCommand[1], {
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: port,
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
