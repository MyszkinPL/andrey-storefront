import { Bot, InlineKeyboard } from "grammy"

import { getServerEnv } from "@/lib/env"

let botInstance: Bot | null = null

export function getBot() {
  if (botInstance) return botInstance

  const env = getServerEnv()
  const bot = new Bot(env.BOT_TOKEN)

  bot.command("start", async (ctx) => {
    await ctx.reply("Открой магазин и выбери подписку или товар с ключом.", {
      reply_markup: new InlineKeyboard().webApp("Открыть магазин", env.APP_URL),
    })
  })

  const replyWithOrders = async (ctx: any) => {
    await ctx.reply("Переход к заказам:", {
      reply_markup: new InlineKeyboard().webApp("Открыть заказы", `${env.APP_URL}/orders`),
    })
  }

  bot.command("orders", replyWithOrders)

  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Через миниаппку можно смотреть каталог, оформлять заказы и получать ключи после подтверждения оплаты.",
    )
  })

  bot.on("message:text", async (ctx) => {
    if (ctx.message.text.startsWith("/")) return
    await ctx.reply("Для оформления открой миниаппку:", {
      reply_markup: new InlineKeyboard().webApp("Открыть", env.APP_URL),
    })
  })

  botInstance = bot
  return bot
}
