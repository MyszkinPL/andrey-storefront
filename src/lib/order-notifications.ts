import { Role } from "@prisma/client"

import { getBot } from "@/lib/bot"
import { createTranslator, type TranslateFn } from "@/lib/i18n"
import { resolveUserLocale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"
import { escapeHtml } from "@/lib/telegram-format"

type Recipient = {
  telegramId: bigint
  language: string | null
  languageCode: string | null
}

async function getOrderContext(orderId: string) {
  const [order, admins] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        createdBy: true,
        deliveredKey: true,
      },
    }),
    prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { telegramId: true, language: true, languageCode: true },
    }),
  ])

  if (!order) return null

  const title =
    order.product?.title ||
    order.productTitleSnapshot ||
    order.subject ||
    `#${order.number}`
  const buyerName = order.createdBy.username
    ? `@${order.createdBy.username}`
    : order.createdBy.firstName

  return {
    order,
    admins: admins as Recipient[],
    buyer: order.createdBy as Recipient,
    title,
    buyerName,
  }
}

/**
 * Sends one message per recipient, each rendered in that person's own
 * language, so an English-speaking admin and a Russian buyer both read the
 * same event in their own words.
 */
async function sendLocalized(
  recipients: Recipient[],
  build: (t: TranslateFn) => string,
) {
  if (recipients.length === 0) return
  const bot = getBot()

  const results = await Promise.allSettled(
    recipients.map((recipient) => {
      const t = createTranslator(resolveUserLocale(recipient))
      return bot.api.sendMessage(Number(recipient.telegramId), build(t), {
        parse_mode: "HTML",
      })
    }),
  )

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error("Telegram notification failed", {
        telegramId: recipients[index].telegramId.toString(),
        error:
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason),
      })
    }
  })
}

function heading(title: string, number: number) {
  return `<b>${escapeHtml(title)}</b> · #${number}`
}

export async function notifyManualPaymentRequested(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  await sendLocalized(context.admins, (t) =>
    [
      t("notify.manualRequested"),
      heading(context.title, context.order.number),
      escapeHtml(context.buyerName),
    ].join("\n"),
  )
}

export async function notifyOrderPaid(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  const isAutoKey = context.order.product?.deliveryType === "AUTO_KEY"
  const deliveredKey =
    context.order.deliveredKey?.value || context.order.deliveredKeyValue || ""

  await Promise.allSettled([
    sendLocalized([context.buyer], (t) => {
      const head = heading(context.title, context.order.number)

      if (deliveredKey) {
        const [first, second] = t("notify.paidBuyerDelivered").split("\n")
        return [
          first,
          head,
          second,
          `${t("notify.keyLabel")} <code>${escapeHtml(deliveredKey)}</code>`,
        ].join("\n")
      }

      const template = isAutoKey
        ? t("notify.paidBuyerNoKeys")
        : t("notify.paidBuyerPending")
      const [first, second] = template.split("\n")
      return [first, head, second].join("\n")
    }),

    sendLocalized(context.admins, (t) => {
      const lines = [
        t("notify.paidAdmin"),
        heading(context.title, context.order.number),
        t("notify.buyerLabel", { buyer: escapeHtml(context.buyerName) }),
      ]

      if (deliveredKey) lines.push(t("notify.paidAdminAuto"))
      else if (isAutoKey) lines.push(t("notify.paidAdminNoKeys"))

      return lines.join("\n")
    }),
  ])
}

export async function notifyManualPaymentRejected(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  await sendLocalized([context.buyer], (t) => {
    const [first, second] = t("notify.rejected").split("\n")
    return [first, heading(context.title, context.order.number), second].join("\n")
  })
}

export async function notifyOrderCancelled(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  await Promise.allSettled([
    sendLocalized([context.buyer], (t) =>
      [
        t("notify.cancelledBuyer"),
        heading(context.title, context.order.number),
      ].join("\n"),
    ),
    sendLocalized(context.admins, (t) =>
      [
        t("notify.cancelledAdmin"),
        heading(context.title, context.order.number),
        escapeHtml(context.buyerName),
      ].join("\n"),
    ),
  ])
}
