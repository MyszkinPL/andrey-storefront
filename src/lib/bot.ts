import { Bot, InlineKeyboard, type Context } from "grammy"

import {
  addProductKeys,
  cancelOrder,
  cancelRow,
  clearPending,
  confirmOrder,
  createProduct,
  deliverKey,
  mainMenuKeyboard,
  rejectOrder,
  renderOrder,
  renderOrders,
  renderProduct,
  renderProducts,
  renderUser,
  renderUsers,
  setPending,
  setProductPrice,
  setUserBanned,
  takePending,
  toggleProduct,
  toggleUserRole,
} from "@/lib/bot-admin"
import { parseBuyToken, parseCallback, parseKeys, parsePrice } from "@/lib/bot-callback"
import {
  cancelOwnOrder,
  markOrderPaid,
  placeOrder,
  renderCatalog,
  renderMyOrder,
  renderMyOrders,
  renderProfile,
  renderShopProduct,
  setUserLanguage,
  shopMenu,
} from "@/lib/bot-shop"
import { resolveActor } from "@/lib/bot-locale"
import { replaceMessage } from "@/lib/bot-view"
import { isLocale } from "@/lib/i18n/config"
import { OrderCreateError } from "@/lib/order-create"
import { getServerEnv } from "@/lib/env"
import { getShopCurrency } from "@/lib/shop-settings"
import { formatPrice } from "@/lib/format"
import { prisma } from "@/lib/prisma"

let botInstance: Bot | null = null
let initPromise: Promise<void> | null = null

/**
 * grammy refuses to route an update until it knows who the bot is, so the
 * webhook has to await `init()` at least once per process. The promise is
 * cached: one extra getMe on cold start, none afterwards.
 */
export async function getReadyBot() {
  const bot = getBot()
  if (!initPromise) {
    initPromise = bot.init().catch((error) => {
      // Let the next request retry instead of caching a failed init.
      initPromise = null
      throw error
    })
  }
  await initPromise
  return bot
}

export function getBot() {
  if (botInstance) return botInstance

  const env = getServerEnv()
  const bot = new Bot(env.BOT_TOKEN)

  // ------------------------------------------------------------- commands

  bot.command("start", async (ctx) => {
    const { t, isAdmin } = await resolveActor(ctx)
    const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
    const menu = shopMenu(t, settings?.shopName || "Shop", isAdmin, env.APP_URL)

    await ctx.reply(menu.text, {
      parse_mode: "HTML",
      reply_markup: menu.keyboard,
    })
  })

  bot.command("orders", async (ctx) => {
    const { t } = await resolveActor(ctx)
    await ctx.reply(t("bot.openOrders"), {
      reply_markup: new InlineKeyboard().webApp(
        t("bot.openOrders"),
        `${env.APP_URL}/orders`,
      ),
    })
  })

  bot.command("help", async (ctx) => {
    const { t } = await resolveActor(ctx)
    await ctx.reply(t("bot.help"))
  })

  bot.command("admin", async (ctx) => {
    const { t, isAdmin } = await resolveActor(ctx)
    if (!isAdmin) {
      await ctx.reply(t("bot.notAdmin"))
      return
    }
    await ctx.reply(t("bot.menuTitle"), {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard(t),
    })
  })

  bot.command("cancel", async (ctx) => {
    const { t } = await resolveActor(ctx)
    if (ctx.from) clearPending(ctx.from.id)
    await ctx.reply(t("bot.actionCancelled"))
  })

  // ------------------------------------------------------- inline buttons

  bot.on("callback_query:data", async (ctx) => {
    const { t, locale, isAdmin, user } = await resolveActor(ctx)

    if (!user) {
      await ctx.answerCallbackQuery({ text: t("bot.notAdmin"), show_alert: true })
      return
    }

    const { action, id } = parseCallback(ctx.callbackQuery.data)

    // Buyer actions are open to everyone; only the admin panel is gated.
    if (action.startsWith("s")) {
      switch (action) {
        case "sm": {
          const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
          await ctx.answerCallbackQuery()
          await replaceMessage(
            ctx,
            shopMenu(t, settings?.shopName || "Shop", isAdmin, env.APP_URL),
          )
          return
        }

        case "sc":
          await ctx.answerCallbackQuery()
          await replaceMessage(
            ctx,
            id ? await renderShopProduct(id, t, locale) : await renderCatalog(t, locale),
          )
          return


        case "sq": {
          const { methodToken, productId } = parseBuyToken(id)

          try {
            const order = await placeOrder(user, productId, methodToken, t)
            await ctx.answerCallbackQuery({ text: t("shop.orderCreated") })
            await replaceMessage(ctx, await renderMyOrder(order.id, user, t, locale))
          } catch (error) {
            const message =
              error instanceof OrderCreateError ? error.message : t("errors.generic")
            await ctx.answerCallbackQuery({ show_alert: true, text: message })
          }
          return
        }

        case "so":
          await ctx.answerCallbackQuery()
          await replaceMessage(
            ctx,
            id ? await renderMyOrder(id, user, t, locale) : await renderMyOrders(user.id, t),
          )
          return

        case "sd":
          await markOrderPaid(id, user.id)
          await ctx.answerCallbackQuery({ text: t("shop.paidNoted") })
          await replaceMessage(ctx, await renderMyOrder(id, user, t, locale))
          return

        case "sk":
          await cancelOwnOrder(id, user.id)
          await ctx.answerCallbackQuery({ text: t("shop.cancelled") })
          await replaceMessage(ctx, await renderMyOrder(id, user, t, locale))
          return

        case "su":
          await ctx.answerCallbackQuery()
          await replaceMessage(ctx, renderProfile(user, t, locale))
          return

        case "sl": {
          if (!isLocale(id)) {
            await ctx.answerCallbackQuery()
            return
          }
          await setUserLanguage(user.id, id)
          const next = await resolveActor(ctx)
          await ctx.answerCallbackQuery({ text: next.t("language.changed") })
          await replaceMessage(ctx, renderProfile(next.user ?? user, next.t, next.locale))
          return
        }

        default:
          await ctx.answerCallbackQuery()
          return
      }
    }

    if (!isAdmin) {
      await ctx.answerCallbackQuery({ text: t("bot.notAdmin"), show_alert: true })
      return
    }

    // Actions that mutate then re-render the card they were pressed on.
    const rerenderOrder = async (notice?: string) => {
      await ctx.answerCallbackQuery(notice ? { text: notice } : undefined)
      await replaceMessage(ctx, await renderOrder(id, t, locale))
    }
    const rerenderProduct = async (notice?: string) => {
      await ctx.answerCallbackQuery(notice ? { text: notice } : undefined)
      await replaceMessage(ctx, await renderProduct(id, t, locale))
    }
    const rerenderUser = async (notice?: string) => {
      await ctx.answerCallbackQuery(notice ? { text: notice } : undefined)
      await replaceMessage(ctx, await renderUser(id, t))
    }

    switch (action) {
      case "m":
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, {
          text: t("bot.menuTitle"),
          keyboard: mainMenuKeyboard(t),
        })
        return

      case "o":
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, id ? await renderOrder(id, t, locale) : await renderOrders(t))
        return

      case "oc":
        await confirmOrder(id, user.id)
        await rerenderOrder(t("bot.orderConfirmed"))
        return

      case "orj":
        await rejectOrder(id)
        await rerenderOrder(t("bot.orderRejected"))
        return

      case "ox":
        await cancelOrder(id)
        await rerenderOrder(t("bot.orderCancelled"))
        return

      case "od": {
        const order = await prisma.order.findUnique({
          where: { id },
          select: { number: true },
        })
        if (!order) {
          await ctx.answerCallbackQuery({ text: t("bot.notFound") })
          return
        }
        setPending(ctx.from.id, { kind: "deliverKey", orderId: id })
        await ctx.answerCallbackQuery()
        await ctx.reply(t("bot.promptKey", { number: order.number }), {
          reply_markup: cancelRow(t),
        })
        return
      }

      case "p":
        await ctx.answerCallbackQuery()
        await replaceMessage(
          ctx,
          id ? await renderProduct(id, t, locale) : await renderProducts(t),
        )
        return

      case "pt":
        await toggleProduct(id)
        await rerenderProduct(t("bot.done"))
        return

      case "pp": {
        const product = await prisma.product.findUnique({
          where: { id },
          select: { title: true },
        })
        if (!product) {
          await ctx.answerCallbackQuery({ text: t("bot.notFound") })
          return
        }
        setPending(ctx.from.id, { kind: "setPrice", productId: id })
        await ctx.answerCallbackQuery()
        await ctx.reply(t("bot.promptPrice", { title: product.title }), {
          reply_markup: cancelRow(t),
        })
        return
      }

      case "pk": {
        const product = await prisma.product.findUnique({
          where: { id },
          select: { title: true },
        })
        if (!product) {
          await ctx.answerCallbackQuery({ text: t("bot.notFound") })
          return
        }
        setPending(ctx.from.id, { kind: "addKeys", productId: id })
        await ctx.answerCallbackQuery()
        await ctx.reply(t("bot.promptKeys", { title: product.title }), {
          reply_markup: cancelRow(t),
        })
        return
      }

      case "pn":
        setPending(ctx.from.id, { kind: "newProductTitle" })
        await ctx.answerCallbackQuery()
        await ctx.reply(t("bot.promptNewTitle"), { reply_markup: cancelRow(t) })
        return

      case "u":
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, id ? await renderUser(id, t) : await renderUsers(t))
        return

      case "ub":
        await setUserBanned(id, true)
        await rerenderUser(t("bot.userBanned"))
        return

      case "uu":
        await setUserBanned(id, false)
        await rerenderUser(t("bot.userUnbanned"))
        return

      case "ur":
        await toggleUserRole(id)
        await rerenderUser(t("bot.roleChanged"))
        return

      case "x":
        clearPending(ctx.from.id)
        await ctx.answerCallbackQuery({ text: t("bot.actionCancelled") })
        return

      default:
        await ctx.answerCallbackQuery()
    }
  })

  // ------------------------------------------------- free-text follow-ups

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith("/")) return

    const { t, locale, isAdmin } = await resolveActor(ctx)
    const action = isAdmin ? takePending(ctx.from.id) : null

    if (!action) {
      await ctx.reply(t("bot.fallback"), {
        reply_markup: new InlineKeyboard().webApp(t("bot.openShop"), env.APP_URL),
      })
      return
    }

    switch (action.kind) {
      case "deliverKey": {
        const order = await deliverKey(action.orderId, text.trim())
        await ctx.reply(t("bot.keyDelivered", { number: order.number }))
        await replaceMessage(ctx, await renderOrder(action.orderId, t, locale))
        return
      }

      case "setPrice": {
        const price = parsePrice(text)
        if (price === null) {
          setPending(ctx.from.id, action)
          await ctx.reply(t("bot.invalidNumber"), { reply_markup: cancelRow(t) })
          return
        }
        await setProductPrice(action.productId, price)
        await ctx.reply(
          t("bot.priceUpdated", {
            price: formatPrice(price, locale, await getShopCurrency()),
          }),
        )
        await replaceMessage(ctx, await renderProduct(action.productId, t, locale))
        return
      }

      case "addKeys": {
        const count = await addProductKeys(action.productId, parseKeys(text))
        await ctx.reply(t("bot.keysAdded", { count }))
        await replaceMessage(ctx, await renderProduct(action.productId, t, locale))
        return
      }

      case "newProductTitle": {
        const title = text.trim()
        setPending(ctx.from.id, { kind: "newProductPrice", title })
        await ctx.reply(t("bot.promptNewPrice", { title }), {
          reply_markup: cancelRow(t),
        })
        return
      }

      case "newProductPrice": {
        const price = parsePrice(text)
        if (price === null) {
          setPending(ctx.from.id, action)
          await ctx.reply(t("bot.invalidNumber"), { reply_markup: cancelRow(t) })
          return
        }
        const product = await createProduct(action.title, price)
        await ctx.reply(t("bot.productCreated", { title: product.title }))
        await replaceMessage(ctx, await renderProducts(t))
        return
      }
    }
  })

  bot.catch((error) => {
    console.error("Bot handler failed", error)
  })

  botInstance = bot
  return bot
}

export type { Context }
