import { spawn } from "node:child_process"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import pg from "pg"

const port = process.env.PORT || "3000"
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
await ensureBootstrapData()

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

async function ensureBootstrapData() {
  if (!databaseUrl) return

  const pool = new pg.Pool({ connectionString: databaseUrl })
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: ["error"],
  })

  const description = `DRIP LITE — это мощный чит-клиент для Minecraft, разработанный для соревновательной игры. Он включает в себя широкий спектр боевых, транспортных и визуальных модулей, оптимизированных как для режима «Хэллоуин против Хэллоуина», так и для честной игры. Клиент регулярно обновляется и поддерживает все основные загрузчики модов.

Характеристики
+ Support versions 1.8.9 - 1.21.4
+ Support clients: Fabric, Lunar, Feather, Labymod4, Forge, BLC
+ Advanced combat modules (KillAura, Velocity, Criticals)
+ Movement modules (Speed, Flight, Scaffold, Strafe)
+ Visual modules (ESP, Tracers, Nametags, Chams)
+ Built-in config system with cloud sync
+ Anti-cheat bypass (Intave, Vulcan, Grim, Matrix)
+ Lifetime updates included`

  try {
    await prisma.shopSettings.upsert({
      where: { id: 1 },
      update: {
        shopName: "snx.sell",
        welcomeText: "Лицензии, ключи и lifetime-доступы через Telegram.",
        supportIntro:
          "Выбери товар, открой тикет и получи реквизиты. После подтверждения оплаты продавец выдаст доступ или ключ.",
      },
      create: {
        id: 1,
        shopName: "snx.sell",
        welcomeText: "Лицензии, ключи и lifetime-доступы через Telegram.",
        supportIntro:
          "Выбери товар, открой тикет и получи реквизиты. После подтверждения оплаты продавец выдаст доступ или ключ.",
      },
    })

    const existing = await prisma.product.findFirst({
      where: { title: "DRIP LITE LIFETIME" },
    })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          category: "майнкрафт",
          description,
          priceRub: 4990,
          deliveryType: "MANUAL",
          isActive: true,
          sortOrder: 0,
        },
      })
    } else {
      await prisma.product.create({
        data: {
          slug: `drip-lite-lifetime-${Date.now().toString(36)}`,
          title: "DRIP LITE LIFETIME",
          category: "майнкрафт",
          description,
          priceRub: 4990,
          deliveryType: "MANUAL",
          isActive: true,
          sortOrder: 0,
        },
      })
    }
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}
