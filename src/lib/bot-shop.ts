import { OrderStatus, PaymentMethodType, Role } from "@prisma/client"
import { InlineKeyboard } from "grammy"

import { formatPrice } from "@/lib/format"
import type { TranslateFn } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/config"
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config"
import { createOrder, OrderCreateError } from "@/lib/order-create"
import { notifyManualPaymentRequested, notifyOrderCancelled } from "@/lib/order-notifications"
import { orderStatusKey } from "@/lib/order-status"
import { prisma } from "@/lib/prisma"
import { escapeHtml } from "@/lib/telegram-format"

const PAGE_SIZE = 8

export type BotUser = {
  id: string
  role: Role
  firstName: string
  username: string | null
  language?: string | null
  languageCode?: string | null
}

type View = { text: string; keyboard: InlineKeyboard }

// ------------------------------------------------------------------- menu

export function shopMenu(t: TranslateFn, shopName: string, isAdmin: boolean): View {
  const keyboard = new InlineKeyboard()
    .text(t("shop.menuCatalog"), "sc")
    .row()
    .text(t("shop.menuOrders"), "so")
    .text(t("shop.menuProfile"), "su")

  if (isAdmin) keyboard.row().text(t("shop.menuAdmin"), "m")

  return { text: t("shop.menuTitle", { shop: escapeHtml(shopName) }), keyboard }
}

// ---------------------------------------------------------------- catalog

export async function renderCatalog(t: TranslateFn, locale: Locale): Promise<View> {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: PAGE_SIZE,
  })

  const keyboard = new InlineKeyboard()
  for (const product of products) {
    keyboard
      .text(
        `${product.title.slice(0, 28)} · ${formatPrice(product.priceRub, locale)}`,
        `sc:${product.id}`,
      )
      .row()
  }
  keyboard.text(t("bot.back"), "sm")

  return {
    text: products.length
      ? t("shop.catalogTitle")
      : `${t("shop.catalogTitle")}\n${t("shop.catalogEmpty")}`,
    keyboard,
  }
}

export async function renderShopProduct(
  productId: string,
  t: TranslateFn,
  locale: Locale,
): Promise<View> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { keys: { where: { issuedAt: null } } } } },
  })

  if (!product) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "sc") }
  }

  const isAuto = product.deliveryType === "AUTO_KEY"
  const lines = [
    t("shop.productCard", {
      title: escapeHtml(product.title),
      category: escapeHtml(product.category || "—"),
      description: escapeHtml(product.description.slice(0, 600)),
      price: formatPrice(product.priceRub, locale),
      delivery: isAuto ? t("bot.deliveryAuto") : t("bot.deliveryManual"),
    }),
  ]

  if (isAuto && product._count.keys === 0) lines.push(t("shop.outOfStock"))

  return {
    text: lines.join("\n"),
    keyboard: new InlineKeyboard()
      .text(t("shop.buy"), `sb:${product.id}`)
      .row()
      .text(t("bot.back"), "sc"),
  }
}

// ---------------------------------------------------------------- payment

export async function renderPaymentOptions(
  productId: string,
  t: TranslateFn,
): Promise<View> {
  const [product, methods, settings] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId }, select: { title: true } }),
    prisma.paymentMethod.findMany({
      where: { isActive: true, type: PaymentMethodType.MANUAL },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.shopSettings.findUnique({ where: { id: 1 } }),
  ])

  if (!product) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "sc") }
  }

  const keyboard = new InlineKeyboard()
  for (const method of methods) {
    keyboard.text(method.title.slice(0, 30), `sq:${productId}:${method.id}`).row()
  }
  if (settings?.cryptoPayEnabled && settings.cryptoPayToken) {
    keyboard.text("Crypto Bot", `sq:${productId}:c`).row()
  }
  keyboard.text(t("bot.back"), `sc:${productId}`)

  return {
    text: t("shop.choosePayment", { title: escapeHtml(product.title) }),
    keyboard,
  }
}

/** Places the order through the same path the mini app uses. */
export async function placeOrder(
  user: BotUser,
  productId: string,
  methodToken: string,
  t: TranslateFn,
) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { title: true },
  })
  if (!product) throw new OrderCreateError(t("bot.notFound"), 404)

  return createOrder({
    paymentMethodId: methodToken === "c" ? undefined : methodToken,
    paymentMethodType: methodToken === "c" ? PaymentMethodType.CRYPTO_PAY : undefined,
    productId,
    subject: t("product.orderSubject", { title: product.title }),
    user,
  })
}

// ----------------------------------------------------------------- orders

export async function renderMyOrders(
  userId: string,
  t: TranslateFn,
): Promise<View> {
  const orders = await prisma.order.findMany({
    where: { createdById: userId },
    orderBy: { updatedAt: "desc" },
    take: PAGE_SIZE,
    include: { product: true },
  })

  const keyboard = new InlineKeyboard()
  for (const order of orders) {
    const title = order.product?.title || order.productTitleSnapshot || order.subject
    keyboard
      .text(`#${order.number} · ${title.slice(0, 22)} · ${t(orderStatusKey(order))}`, `so:${order.id}`)
      .row()
  }
  keyboard.text(t("bot.back"), "sm")

  return {
    text: orders.length
      ? t("shop.ordersTitle")
      : `${t("shop.ordersTitle")}\n${t("shop.ordersEmpty")}`,
    keyboard,
  }
}

export async function renderMyOrder(
  orderId: string,
  user: BotUser,
  t: TranslateFn,
  locale: Locale,
): Promise<View> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true, deliveredKey: true },
  })

  if (!order || order.createdById !== user.id) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "so") }
  }

  const title = order.product?.title || order.productTitleSnapshot || order.subject
  const amount = order.priceRubSnapshot ?? order.product?.priceRub ?? null
  const key = order.deliveredKey?.value || order.deliveredKeyValue || ""

  const lines = [
    t("shop.orderCard", {
      title: escapeHtml(title),
      number: order.number,
      status: t(orderStatusKey(order)),
      amount: amount === null ? "—" : formatPrice(amount, locale),
      method: escapeHtml(order.paymentMethodTitle || "—"),
    }),
  ]

  const isClosed =
    order.status === OrderStatus.CLOSED || order.status === OrderStatus.CANCELLED

  if (!order.isPaid && order.paymentMethodDetails) {
    lines.push(t("shop.requisites", { details: escapeHtml(order.paymentMethodDetails) }))
  }
  if (key) lines.push(t("shop.keyIssued", { key: escapeHtml(key) }))

  const keyboard = new InlineKeyboard()

  if (order.cryptoInvoiceUrl && !order.isPaid) {
    keyboard.url(t("shop.openInvoice"), order.cryptoInvoiceUrl).row()
  }
  if (
    !order.isPaid &&
    !isClosed &&
    order.paymentMethodType === PaymentMethodType.MANUAL &&
    order.status !== OrderStatus.PAYMENT_REVIEW
  ) {
    keyboard.text(t("shop.markPaid"), `sd:${order.id}`).row()
  }
  if (!order.isPaid && !isClosed) {
    keyboard.text(t("shop.cancel"), `sk:${order.id}`).row()
  }
  keyboard.text(t("bot.back"), "so")

  return { text: lines.join("\n"), keyboard }
}

export async function markOrderPaid(orderId: string, userId: string) {
  const updated = await prisma.order.updateMany({
    where: { id: orderId, createdById: userId, isPaid: false },
    data: { status: OrderStatus.PAYMENT_REVIEW, manualPaymentRequestedAt: new Date() },
  })

  if (updated.count > 0) await notifyManualPaymentRequested(orderId).catch(() => {})
  return updated.count > 0
}

export async function cancelOwnOrder(orderId: string, userId: string) {
  const updated = await prisma.order.updateMany({
    where: { id: orderId, createdById: userId, isPaid: false },
    data: { status: OrderStatus.CANCELLED, closedAt: new Date() },
  })

  if (updated.count > 0) await notifyOrderCancelled(orderId).catch(() => {})
  return updated.count > 0
}

// ---------------------------------------------------------------- profile

export function renderProfile(user: BotUser, t: TranslateFn, locale: Locale): View {
  const name = user.username ? `@${user.username}` : user.firstName
  const keyboard = new InlineKeyboard()

  for (const value of LOCALES) {
    if (value === locale) continue
    keyboard.text(t("shop.language", { language: LOCALE_LABELS[value].native }), `sl:${value}`)
  }
  keyboard.row().text(t("bot.back"), "sm")

  return {
    text: t("shop.profileTitle", {
      name: escapeHtml(name),
      role: user.role === Role.ADMIN ? t("shop.roleAdmin") : t("shop.roleBuyer"),
    }),
    keyboard,
  }
}

export async function setUserLanguage(userId: string, language: Locale) {
  return prisma.user.update({ where: { id: userId }, data: { language } })
}
