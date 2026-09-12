import { Bot, InlineKeyboard, type Context } from "grammy"

import {
  addProductKeys,
  broadcastPreview,
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
  renderBroadcastIntro,
  renderChannelGate,
  renderProducts,
  renderStats,
  renderUser,
  renderUsers,
  setRequiredChannel,
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
  hideOrderFromHistory,
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
import { markBotStarted } from "@/lib/bot-user"
import { countBroadcastAudience, notifyAdmins, sendBroadcast } from "@/lib/broadcast"
import { checkChannelGate, normalizeChannel } from "@/lib/channel-gate"
import type { TranslateFn } from "@/lib/i18n"
import { replaceMessage } from "@/lib/bot-view"
import { isLocale } from "@/lib/i18n/config"
import { OrderCreateError } from "@/lib/order-create"
import { getServerEnv } from "@/lib/env"
import { getShopCurrency } from "@/lib/shop-settings"
import { formatPrice } from "@/lib/format"
import { deliverReceiptToAdmins } from "@/lib/order-receipt"
import { RECEIPT_MAX_MB, validateReceiptFile } from "@/lib/receipt-constants"
import { prisma } from "@/lib/prisma"

let botInstance: Bot | null = null
let initPromise: Promise<void> | null = null

/** Buyer actions a channel subscription can stand in front of. */
const GATED_ACTIONS = new Set(["sc", "sq"])

/**
 * A composed post waiting for its confirm button. Kept beside the pending
 * actions and for the same reason: cheap to retype, not worth a table.
 */
const broadcastDrafts = new Map<number, { text: string; at: number }>()
const BROADCAST_DRAFT_TTL_MS = 30 * 60 * 1000

function putBroadcastDraft(telegramId: number, text: string) {
  broadcastDrafts.set(telegramId, { text, at: Date.now() })
}

function takeBroadcastDraft(telegramId: number) {
  const entry = broadcastDrafts.get(telegramId)
  if (!entry) return null

  broadcastDrafts.delete(telegramId)
  return Date.now() - entry.at > BROADCAST_DRAFT_TTL_MS ? null : entry.text
}

function channelGateView(channel: string, url: string, t: TranslateFn) {
  return {
    text: `${t("bot.gateTitle")}\n${t("bot.gateBody", { channel })}`,
    keyboard: new InlineKeyboard()
      .url(t("bot.gateOpen"), url)
      .row()
      .text(t("bot.gateRecheck"), "sg"),
  }
}

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
    const { t, isAdmin, user } = await resolveActor(ctx)
    // Someone who reached the mini app first has no start time yet.
    if (user) await markBotStarted(user.id)
    const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
    const menu = shopMenu(
      t,
      settings?.shopName || "Shop",
      isAdmin,
      env.APP_URL,
      settings?.supportUsername,
    )

    await ctx.reply(menu.text, {
      parse_mode: "HTML",
      reply_markup: menu.keyboard,
    })
  })

  bot.command("orders", async (ctx) => {
    const { t, user } = await resolveActor(ctx)
    // The list itself, not a button to go and find it somewhere else.
    if (user) {
      const view = await renderMyOrders(user.id, t)
      view.keyboard.row().webApp(t("bot.openOrders"), `${env.APP_URL}/orders`)
      await ctx.reply(view.text, { parse_mode: "HTML", reply_markup: view.keyboard })
      return
    }
    await ctx.reply(t("bot.openOrders"), {
      reply_markup: new InlineKeyboard().webApp(
        t("bot.openOrders"),
        `${env.APP_URL}/orders`,
      ),
    })
  })

  bot.command("help", async (ctx) => {
    const { t } = await resolveActor(ctx)
    await ctx.reply(t("bot.help"), {
      parse_mode: "HTML",
      reply_markup: new InlineKeyboard().webApp(t("bot.openShop"), env.APP_URL),
    })
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
    const { t, tp, locale, isAdmin, user } = await resolveActor(ctx)

    if (!user) {
      await ctx.answerCallbackQuery({ text: t("bot.notAdmin"), show_alert: true })
      return
    }

    if (user.isBanned) {
      await ctx.answerCallbackQuery({ text: t("auth.banned"), show_alert: true })
      return
    }

    const { action, id } = parseCallback(ctx.callbackQuery.data)

    // Shopping sits behind the channel subscription when one is configured.
    // Profile and language stay reachable, so a gated buyer can at least read
    // the reason in their own language.
    if (GATED_ACTIONS.has(action)) {
      const gate = await checkChannelGate(BigInt(ctx.from.id))
      if (gate && !gate.joined) {
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, channelGateView(gate.username, gate.url, t))
        return
      }
    }

    // Buyer actions are open to everyone; only the admin panel is gated.
    if (action.startsWith("s")) {
      switch (action) {
        case "sm": {
          const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
          await ctx.answerCallbackQuery()
          await replaceMessage(
            ctx,
            shopMenu(
              t,
              settings?.shopName || "Shop",
              isAdmin,
              env.APP_URL,
              settings?.supportUsername,
            ),
          )
          return
        }

        case "sc":
          await ctx.answerCallbackQuery()
          await replaceMessage(
            ctx,
            id
              ? await renderShopProduct(id, t, locale, user.id)
              : await renderCatalog(t, locale),
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

        case "sd": {
          // The receipt comes first. Without one the button only asks for
          // the PDF; the mark happens when the document arrives.
          const receipt = await prisma.orderReceipt.findUnique({
            where: { orderId: id },
            select: { id: true },
          })
          if (!receipt) {
            const own = await prisma.order.findFirst({
              where: { id, createdById: user.id, isPaid: false, status: "OPEN" },
              select: { id: true },
            })
            if (!own) {
              await ctx.answerCallbackQuery({ show_alert: true, text: t("shop.markPaidFailed") })
              return
            }
            setPending(ctx.from.id, { kind: "sendReceipt", orderId: id })
            await ctx.answerCallbackQuery()
            await ctx.reply(t("shop.receiptPrompt"), { reply_markup: cancelRow(t) })
            return
          }

          // A stale card (timer ran out, admin already acted) must say why
          // nothing happened instead of cheerfully confirming.
          const marked = await markOrderPaid(id, user.id)
          await ctx.answerCallbackQuery(
            marked
              ? { text: t("shop.paidNoted") }
              : { show_alert: true, text: t("shop.markPaidFailed") },
          )
          await replaceMessage(ctx, await renderMyOrder(id, user, t, locale))
          return
        }

        case "sk": {
          const cancelled = await cancelOwnOrder(id, user.id)
          await ctx.answerCallbackQuery(
            cancelled
              ? { text: t("shop.cancelled") }
              : { show_alert: true, text: t("shop.cancelFailed") },
          )
          await replaceMessage(ctx, await renderMyOrder(id, user, t, locale))
          return
        }

        case "sx": {
          const hidden = await hideOrderFromHistory(id, user.id)
          await ctx.answerCallbackQuery({
            text: hidden ? t("shop.hiddenFromHistory") : t("shop.hideFailed"),
          })
          await replaceMessage(ctx, await renderMyOrders(user.id, t))
          return
        }

        case "sg": {
          const gate = await checkChannelGate(BigInt(ctx.from.id))
          if (gate && !gate.joined) {
            await ctx.answerCallbackQuery({
              show_alert: true,
              text: t("bot.gateStillMissing"),
            })
            return
          }
          const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
          await ctx.answerCallbackQuery({ text: t("bot.gateJoined") })
          await replaceMessage(
            ctx,
            shopMenu(
              t,
              settings?.shopName || "Shop",
              isAdmin,
              env.APP_URL,
              settings?.supportUsername,
            ),
          )
          return
        }

        case "su":
          await ctx.answerCallbackQuery()
          await replaceMessage(ctx, await renderProfile(user, t, locale, env.APP_URL))
          return

        case "sl": {
          if (!isLocale(id)) {
            await ctx.answerCallbackQuery()
            return
          }
          await setUserLanguage(user.id, id)
          const next = await resolveActor(ctx)
          await ctx.answerCallbackQuery({ text: next.t("language.changed") })
          await replaceMessage(
            ctx,
            await renderProfile(next.user ?? user, next.t, next.locale, env.APP_URL),
          )
          return
        }

        default:
          await ctx.answerCallbackQuery()
          return
      }
    }

    // Cancel is for everyone: a buyer asked for a receipt needs a way out.
    if (action === "x") {
      clearPending(ctx.from.id)
      await ctx.answerCallbackQuery({ text: t("bot.actionCancelled") })
      return
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
          id ? await renderProduct(id, t, locale) : await renderProducts(t, locale),
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

      case "t":
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, await renderStats(t, tp, locale))
        return

      case "b":
        clearPending(ctx.from.id)
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, await renderBroadcastIntro(t))
        return

      case "bc": {
        const audience = await countBroadcastAudience()
        if (audience === 0) {
          await ctx.answerCallbackQuery({
            show_alert: true,
            text: t("bot.broadcastNoAudience"),
          })
          return
        }
        setPending(ctx.from.id, { kind: "broadcastText" })
        await ctx.answerCallbackQuery()
        await ctx.reply(t("bot.broadcastPrompt"), { reply_markup: cancelRow(t) })
        return
      }

      case "bs": {
        const draft = takeBroadcastDraft(ctx.from.id)
        if (!draft) {
          await ctx.answerCallbackQuery({
            show_alert: true,
            text: t("bot.broadcastEmpty"),
          })
          return
        }

        await ctx.answerCallbackQuery({ text: t("bot.broadcastSending") })
        await replaceMessage(ctx, await renderBroadcastIntro(t))

        // Deliberately not awaited: a large audience takes longer than
        // Telegram will wait for the webhook to answer, so the result comes
        // back as its own message instead.
        void sendBroadcast({ text: draft }, user.id)
          .then((result) =>
            notifyAdmins(
              t("bot.broadcastDone", {
                failed: result.failed,
                sent: result.sent,
                total: result.total,
              }),
            ),
          )
          .catch((error) => console.error("Broadcast failed", error))
        return
      }

      case "g":
        clearPending(ctx.from.id)
        await ctx.answerCallbackQuery()
        await replaceMessage(ctx, await renderChannelGate(t))
        return

      case "gc":
        setPending(ctx.from.id, { kind: "requiredChannel" })
        await ctx.answerCallbackQuery()
        await ctx.reply(t("bot.channelPrompt"), { reply_markup: cancelRow(t) })
        return

      case "gx":
        await setRequiredChannel(null)
        await ctx.answerCallbackQuery({ text: t("bot.channelCleared") })
        await replaceMessage(ctx, await renderChannelGate(t))
        return

      case "x":
        clearPending(ctx.from.id)
        await ctx.answerCallbackQuery({ text: t("bot.actionCancelled") })
        return

      default:
        await ctx.answerCallbackQuery()
    }
  })

  // ------------------------------------------------------ receipt PDFs

  bot.on("message:document", async (ctx) => {
    const { t, locale, user } = await resolveActor(ctx)
    if (!user) return

    const action = takePending(ctx.from.id)
    if (!action) return
    if (action.kind !== "sendReceipt") {
      // An admin mid-way through typing a price gets to keep that.
      setPending(ctx.from.id, action)
      return
    }

    const document = ctx.message.document
    const problem = validateReceiptFile({
      name: document.file_name || "",
      size: document.file_size || 0,
      type: document.mime_type || "",
    })
    if (problem) {
      setPending(ctx.from.id, action)
      await ctx.reply(
        problem === "size"
          ? t("receipt.errorSize", { limit: RECEIPT_MAX_MB })
          : problem === "empty"
            ? t("receipt.errorEmpty")
            : t("receipt.errorType"),
        { reply_markup: cancelRow(t) },
      )
      return
    }

    try {
      // The file already lives on Telegram; admins get it by id, no download.
      await deliverReceiptToAdmins({
        orderId: action.orderId,
        fileName: document.file_name || "receipt.pdf",
        fileSize: document.file_size || 0,
        telegramFileId: document.file_id,
      })
    } catch (error) {
      console.error("Receipt delivery failed", error)
      setPending(ctx.from.id, action)
      await ctx.reply(t("receipt.errorFailed"), { reply_markup: cancelRow(t) })
      return
    }

    const marked = await markOrderPaid(action.orderId, user.id)
    await ctx.reply(marked ? t("shop.receiptReceived") : t("shop.markPaidFailed"))
    const view = await renderMyOrder(action.orderId, user, t, locale)
    await ctx.reply(view.text, { parse_mode: "HTML", reply_markup: view.keyboard })
  })

  // ------------------------------------------------- free-text follow-ups

  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith("/")) return

    const { t, locale, isAdmin, user } = await resolveActor(ctx)
    const action = user ? takePending(ctx.from.id) : null

    // A buyer who owes a receipt and types instead gets reminded, and the
    // request stays armed for the file that follows.
    if (action?.kind === "sendReceipt") {
      setPending(ctx.from.id, action)
      await ctx.reply(t("shop.receiptPrompt"), { reply_markup: cancelRow(t) })
      return
    }

    // Every remaining pending action writes as an admin.
    if (!action || !user || !isAdmin) {
      // Any stray text brings the menu back, so a lost buyer is never left
      // with a bare "open the app" and nothing else to press.
      const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
      const menu = shopMenu(
        t,
        settings?.shopName || "Shop",
        isAdmin,
        env.APP_URL,
        settings?.supportUsername,
      )
      await ctx.reply(`${t("bot.fallback")}\n\n${menu.text}`, {
        parse_mode: "HTML",
        reply_markup: menu.keyboard,
      })
      return
    }

    switch (action.kind) {
      case "deliverKey": {
        const order = await deliverKey(action.orderId, text.trim(), user.id)
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

      case "broadcastText": {
        const draft = text.trim()
        if (!draft) {
          setPending(ctx.from.id, action)
          await ctx.reply(t("bot.broadcastEmpty"), { reply_markup: cancelRow(t) })
          return
        }

        putBroadcastDraft(ctx.from.id, draft)
        const audience = await countBroadcastAudience()
        const preview = broadcastPreview(draft, audience, t)
        await ctx.reply(preview.text, {
          parse_mode: "HTML",
          reply_markup: preview.keyboard,
        })
        return
      }

      case "requiredChannel": {
        const channel = normalizeChannel(text)
        if (!channel) {
          setPending(ctx.from.id, action)
          await ctx.reply(t("bot.channelInvalid"), { reply_markup: cancelRow(t) })
          return
        }

        await setRequiredChannel(channel)
        await ctx.reply(t("bot.channelSaved", { channel }))
        await replaceMessage(ctx, await renderChannelGate(t))
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
        await replaceMessage(ctx, await renderProducts(t, locale))
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
