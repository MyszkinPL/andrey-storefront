import { OrderStatus, Role } from "@prisma/client"
import { InlineKeyboard } from "grammy"

import { resolveActor } from "@/lib/bot-locale"
import { clearPending, setPending, takePending } from "@/lib/bot-pending"
import { formatPrice } from "@/lib/format"
import type { Locale } from "@/lib/i18n/config"
import type { TranslateFn } from "@/lib/i18n"
import {
  notifyManualPaymentRejected,
  notifyOrderCancelled,
  notifyOrderPaid,
} from "@/lib/order-notifications"
import { confirmOrderPaymentFlow } from "@/lib/order-payment"
import { orderStatusKey } from "@/lib/order-status"
import { prisma } from "@/lib/prisma"
import { escapeHtml } from "@/lib/telegram-format"
import { replaceMessage } from "@/lib/bot-view"

const PAGE_SIZE = 8

function cancelRow(t: TranslateFn) {
  return new InlineKeyboard().text(t("bot.cancelAction"), "x")
}

// ---------------------------------------------------------------- main menu

export function mainMenuKeyboard(t: TranslateFn) {
  return new InlineKeyboard()
    .text(t("bot.menuOrders"), "o")
    .text(t("bot.menuProducts"), "p")
    .row()
    .text(t("bot.menuUsers"), "u")
    .row()
    // Back to the shop menu, so the admin panel is not a dead end.
    .text(t("bot.back"), "sm")
}

// ------------------------------------------------------------------ orders

function orderStatusLabel(
  order: { status: string; isPaid: boolean },
  t: TranslateFn,
) {
  return t(orderStatusKey(order))
}

export async function renderOrders(t: TranslateFn) {
  const orders = await prisma.order.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    take: PAGE_SIZE,
    include: { product: true },
  })

  if (orders.length === 0) {
    return {
      text: `${t("bot.ordersTitle")}\n${t("bot.ordersEmpty")}`,
      keyboard: new InlineKeyboard().text(t("bot.back"), "m"),
    }
  }

  const keyboard = new InlineKeyboard()
  for (const order of orders) {
    const title = order.product?.title || order.productTitleSnapshot || order.subject
    keyboard
      .text(
        `#${order.number} · ${title.slice(0, 24)} · ${orderStatusLabel(order, t)}`,
        `o:${order.id}`,
      )
      .row()
  }
  keyboard.text(t("bot.back"), "m")

  return { text: t("bot.ordersTitle"), keyboard }
}

export async function renderOrder(orderId: string, t: TranslateFn, locale: Locale) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, createdBy: true, receipt: true },
  })

  if (!order) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "o") }
  }

  const title = order.product?.title || order.productTitleSnapshot || order.subject
  const buyer = order.createdBy.username
    ? `@${order.createdBy.username}`
    : order.createdBy.firstName
  const amount =
    order.priceRubSnapshot ?? order.product?.priceRub ?? null

  const text = [
    t("bot.orderCard", {
      title: escapeHtml(title),
      number: order.number,
      buyer: escapeHtml(buyer),
      status: orderStatusLabel(order, t),
      amount: amount === null ? "—" : formatPrice(amount, locale),
      method: escapeHtml(order.paymentMethodTitle || "—"),
    }),
    order.receipt ? t("bot.receiptAttached") : t("bot.receiptMissing"),
  ].join("\n")

  const keyboard = new InlineKeyboard()
  const isClosed =
    order.status === OrderStatus.CLOSED || order.status === OrderStatus.CANCELLED

  if (!order.isPaid && !isClosed) {
    keyboard.text(t("bot.actionConfirm"), `oc:${order.id}`).row()
  }
  if (order.status === OrderStatus.PAYMENT_REVIEW) {
    keyboard.text(t("bot.actionReject"), `orj:${order.id}`).row()
  }
  if (!order.deliveredKeyValue && !isClosed) {
    keyboard.text(t("bot.actionDeliver"), `od:${order.id}`).row()
  }
  if (!isClosed) {
    keyboard.text(t("bot.actionCancelOrder"), `ox:${order.id}`).row()
  }
  keyboard.text(t("bot.back"), "o")

  return { text, keyboard }
}

export async function confirmOrder(orderId: string, adminUserId: string) {
  await prisma.$transaction((tx) => confirmOrderPaymentFlow(tx, orderId, adminUserId))
  await notifyOrderPaid(orderId).catch(() => {})
}

export async function rejectOrder(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.OPEN, manualPaymentRequestedAt: null },
  })
  await notifyManualPaymentRejected(orderId).catch(() => {})
}

export async function cancelOrder(orderId: string) {
  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED, closedAt: new Date() },
  })
  await notifyOrderCancelled(orderId).catch(() => {})
}

export async function deliverKey(orderId: string, value: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveredKeyValue: value,
      isPaid: true,
      paymentConfirmedAt: new Date(),
      status: OrderStatus.CLOSED,
      closedAt: new Date(),
    },
  })
  await notifyOrderPaid(orderId).catch(() => {})
  return order
}

// ---------------------------------------------------------------- products

export async function renderProducts(t: TranslateFn) {
  const products = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: PAGE_SIZE,
  })

  const keyboard = new InlineKeyboard()
  for (const product of products) {
    keyboard
      .text(
        `${product.isActive ? "" : "• "}${product.title.slice(0, 30)}`,
        `p:${product.id}`,
      )
      .row()
  }
  keyboard.text(t("bot.actionNewProduct"), "pn").row()
  keyboard.text(t("bot.back"), "m")

  return {
    text: products.length ? t("bot.productsTitle") : `${t("bot.productsTitle")}\n${t("bot.productsEmpty")}`,
    keyboard,
  }
}

export async function renderProduct(productId: string, t: TranslateFn, locale: Locale) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { keys: { where: { issuedAt: null } } } } },
  })

  if (!product) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "p") }
  }

  const text = t("bot.productCard", {
    title: escapeHtml(product.title),
    category: escapeHtml(product.category || "—"),
    price: formatPrice(product.priceRub, locale),
    delivery:
      product.deliveryType === "AUTO_KEY"
        ? t("bot.deliveryAuto")
        : t("bot.deliveryManual"),
    keys: product._count.keys,
    state: product.isActive ? t("bot.stateActive") : t("bot.stateHidden"),
  })

  const keyboard = new InlineKeyboard()
    .text(
      product.isActive ? t("bot.actionHide") : t("bot.actionShow"),
      `pt:${product.id}`,
    )
    .row()
    .text(t("bot.actionPrice"), `pp:${product.id}`)
    .row()
    .text(t("bot.actionAddKeys"), `pk:${product.id}`)
    .row()
    .text(t("bot.back"), "p")

  return { text, keyboard }
}

export async function toggleProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return null
  return prisma.product.update({
    where: { id: productId },
    data: { isActive: !product.isActive },
  })
}

export async function setProductPrice(productId: string, priceRub: number) {
  return prisma.product.update({ where: { id: productId }, data: { priceRub } })
}

export async function addProductKeys(productId: string, values: string[]) {
  if (values.length === 0) return 0
  const result = await prisma.productKey.createMany({
    data: values.map((value) => ({ productId, value })),
  })
  return result.count
}

export async function createProduct(title: string, priceRub: number) {
  const slug = `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "product"}-${Math.abs(hash(title)).toString(36)}`

  return prisma.product.create({
    data: {
      slug,
      title,
      description: "",
      priceRub,
      // Created hidden so an incomplete card never reaches the catalog.
      isActive: false,
    },
  })
}

function hash(value: string) {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0
  }
  return result
}

// ------------------------------------------------------------------- users

export async function renderUsers(t: TranslateFn) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
  })

  const keyboard = new InlineKeyboard()
  for (const user of users) {
    const name = user.username ? `@${user.username}` : user.firstName
    const marks = [user.role === Role.ADMIN ? "★" : "", user.isBanned ? "⛔" : ""]
      .filter(Boolean)
      .join("")
    keyboard.text(`${marks}${name}`.slice(0, 32), `u:${user.id}`).row()
  }
  keyboard.text(t("bot.back"), "m")

  return {
    text: users.length ? t("bot.usersTitle") : `${t("bot.usersTitle")}\n${t("bot.usersEmpty")}`,
    keyboard,
  }
}

export async function renderUser(userId: string, t: TranslateFn) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "u") }
  }

  const text = t("bot.userCard", {
    name: escapeHtml(user.firstName),
    username: user.username ? `@${escapeHtml(user.username)}` : "—",
    telegramId: user.telegramId.toString(),
    role: user.role === Role.ADMIN ? t("bot.roleAdmin") : t("bot.roleUser"),
    state: user.isBanned ? t("bot.stateBanned") : t("bot.stateOk"),
  })

  const keyboard = new InlineKeyboard()
    .text(
      user.isBanned ? t("bot.actionUnban") : t("bot.actionBan"),
      `${user.isBanned ? "uu" : "ub"}:${user.id}`,
    )
    .row()
    .text(
      user.role === Role.ADMIN ? t("bot.actionMakeUser") : t("bot.actionMakeAdmin"),
      `ur:${user.id}`,
    )
    .row()
    .text(t("bot.back"), "u")

  return { text, keyboard }
}

export async function setUserBanned(userId: string, banned: boolean) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: banned,
      bannedAt: banned ? new Date() : null,
      banReason: banned ? null : null,
    },
  })
}

export async function toggleUserRole(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null
  return prisma.user.update({
    where: { id: userId },
    data: { role: user.role === Role.ADMIN ? Role.USER : Role.ADMIN },
  })
}

// ------------------------------------------------------------------ shared

export { cancelRow, resolveActor, PAGE_SIZE, replaceMessage }
export { clearPending, setPending, takePending }

