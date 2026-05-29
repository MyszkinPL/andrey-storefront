import { Role } from "@prisma/client"

import { getBot } from "@/lib/bot"
import { prisma } from "@/lib/prisma"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
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
      select: { telegramId: true },
    }),
  ])

  if (!order) return null

  const title = order.product?.title || order.subject || `Заказ #${order.number}`
  const buyerName = order.createdBy.username
    ? `@${order.createdBy.username}`
    : order.createdBy.firstName

  return {
    order,
    admins: admins.map((item) => Number(item.telegramId)),
    buyerTelegramId: Number(order.createdBy.telegramId),
    title,
    buyerName,
  }
}

async function sendMany(telegramIds: number[], text: string) {
  if (telegramIds.length === 0) return
  const bot = getBot()
  await Promise.allSettled(
    telegramIds.map((telegramId) =>
      bot.api.sendMessage(telegramId, text, { parse_mode: "HTML" }),
    ),
  )
}

export async function notifyManualPaymentRequested(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  await sendMany(
    context.admins,
    `Покупатель отметил ручную оплату.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\n${escapeHtml(context.buyerName)}`,
  )
}

export async function notifyOrderPaid(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  const keyLine = context.order.deliveredKey?.value
    ? `\nКлюч: <tg-spoiler>${escapeHtml(context.order.deliveredKey.value)}</tg-spoiler>`
    : ""
  const buyerText = context.order.deliveredKey?.value
    ? `Оплата подтверждена.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\nДоступ выдан.${keyLine}`
    : `Оплата подтверждена.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\nЗаказ передан на выдачу.`

  const adminText = context.order.deliveredKey?.value
    ? `Оплата подтверждена.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\nПокупатель: ${escapeHtml(context.buyerName)}\nКлюч выдан автоматически.`
    : `Оплата подтверждена.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\nПокупатель: ${escapeHtml(context.buyerName)}`

  await Promise.allSettled([
    sendMany([context.buyerTelegramId], buyerText),
    sendMany(context.admins, adminText),
  ])
}

export async function notifyManualPaymentRejected(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  await sendMany(
    [context.buyerTelegramId],
    `Проверка оплаты не подтверждена.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\nПроверь реквизиты и оплату, затем попробуй снова.`,
  )
}

export async function notifyOrderCancelled(orderId: string) {
  const context = await getOrderContext(orderId)
  if (!context) return

  const buyerText = `Заказ отменён.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}`
  const adminText = `Покупатель отменил заказ.\n<b>${escapeHtml(context.title)}</b> · #${context.order.number}\n${escapeHtml(context.buyerName)}`

  await Promise.allSettled([
    sendMany([context.buyerTelegramId], buyerText),
    sendMany(context.admins, adminText),
  ])
}
