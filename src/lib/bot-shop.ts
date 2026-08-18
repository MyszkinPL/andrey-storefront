import { OrderStatus, PaymentMethodType, Role } from "@prisma/client"
import { InlineKeyboard } from "grammy"

import { formatCryptoAmount, formatPrice } from "@/lib/format"
import type { TranslateFn } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/config"
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config"
import { estimateCryptoAmount } from "@/lib/crypto-pay"
import { createOrder, OrderCreateError } from "@/lib/order-create"
import { getShopCurrency } from "@/lib/shop-settings"
import { notifyManualPaymentRequested, notifyOrderCancelled } from "@/lib/order-notifications"
import { orderStatusKey } from "@/lib/order-status"
import { prisma } from "@/lib/prisma"
import { escapeHtml } from "@/lib/telegram-format"
import { CAPTION_LIMIT, clamp, dataUrlToBuffer, type View } from "@/lib/bot-view"

const PAGE_SIZE = 8

export type BotUser = {
  id: string
  role: Role
  firstName: string
  username: string | null
  language?: string | null
  languageCode?: string | null
}

// ------------------------------------------------------------------- menu

export function shopMenu(
  t: TranslateFn,
  shopName: string,
  isAdmin: boolean,
  appUrl: string,
): View {
  const keyboard = new InlineKeyboard()
    .text(t("shop.menuCatalog"), "sc")
    .row()
    .text(t("shop.menuOrders"), "so")
    .text(t("shop.menuProfile"), "su")

  if (isAdmin) keyboard.row().text(t("shop.menuAdmin"), "m")

  // The web app lives in the same keyboard instead of a second message.
  keyboard.row().webApp(t("shop.menuOpenApp"), appUrl)

  return { text: t("shop.menuTitle", { shop: escapeHtml(shopName) }), keyboard }
}

// ---------------------------------------------------------------- catalog

export async function renderCatalog(t: TranslateFn, locale: Locale): Promise<View> {
  const currency = await getShopCurrency()
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: PAGE_SIZE,
  })

  const keyboard = new InlineKeyboard()
  for (const product of products) {
    keyboard
      .text(
        `${product.title.slice(0, 26)} · ${formatPrice(product.priceRub, locale, currency)}`,
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
  const [product, methods, settings] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { keys: { where: { issuedAt: null } } } },
        specs: { orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.paymentMethod.findMany({
      where: { isActive: true, type: PaymentMethodType.MANUAL },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.shopSettings.findUnique({ where: { id: 1 } }),
  ])

  if (!product) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "sc") }
  }

  const isAuto = product.deliveryType === "AUTO_KEY"
  const photo = dataUrlToBuffer(product.imageDataUrl)
  const currency = (settings?.cryptoPayFiat || "RUB").toUpperCase()

  const lines = [
    t("shop.productCard", {
      title: escapeHtml(product.title),
      category: escapeHtml(product.category || "—"),
      // A caption is capped at 1024 characters, so the description gets the
      // room left over once the rest of the card is accounted for.
      description: escapeHtml(clamp(product.description, photo ? 400 : 1200)),
    }),
  ]

  if (product.specs.length > 0) {
    lines.push(
      "",
      ...product.specs
        .slice(0, 8)
        .map((spec) => `▪️ ${escapeHtml(spec.label)} — ${escapeHtml(spec.value)}`),
    )
  }

  lines.push(
    "",
    t("shop.productMeta", {
      price: formatPrice(product.priceRub, locale, currency),
      delivery: isAuto ? t("bot.deliveryAuto") : t("bot.deliveryManual"),
    }),
  )

  if (isAuto && product._count.keys === 0) lines.push(t("shop.outOfStock"))

  // Payment methods sit right on the card, each priced in what the buyer
  // would actually pay with it.
  const fiatLabel = formatPrice(product.priceRub, locale, currency)
  const keyboard = new InlineKeyboard()
  for (const method of methods) {
    keyboard
      .text(
        `💳 ${method.title.slice(0, 20)} · ${fiatLabel}`,
        `sq:${product.id}:${method.id}`,
      )
      .row()
  }
  if (settings?.cryptoPayEnabled && settings.cryptoPayToken) {
    const asset =
      (settings.cryptoPayDefaultAssets || "USDT")
        .split(",")[0]
        ?.trim()
        .toUpperCase() || "USDT"
    const estimate = await estimateCryptoAmount({
      amountFiat: product.priceRub,
      asset,
      fiat: currency,
      token: settings.cryptoPayToken,
      useTestnet: settings.cryptoPayUseTestnet,
    })
    const label = estimate
      ? `💳 Crypto Bot · ≈ ${formatCryptoAmount(estimate)} ${asset}`
      : "💳 Crypto Bot"
    keyboard.text(label, `sq:${product.id}:c`).row()
  }
  keyboard.text(t("bot.back"), "sc")

  return {
    photo,
    text: clamp(lines.join("\n"), photo ? CAPTION_LIMIT : 4096),
    keyboard,
  }
}

// ---------------------------------------------------------------- payment

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
  if (!product) throw new OrderCreateError("NOT_FOUND", t("bot.notFound"))

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
      .text(
        `${orderStatusIcon(order)} #${order.number} · ${title.slice(0, 24)}`,
        `so:${order.id}`,
      )
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

/** A glanceable state marker for order cards and list buttons. */
function orderStatusIcon(order: { status: string; isPaid: boolean }) {
  if (order.status === "CANCELLED") return "\u{1F6AB}"
  if (order.status === "PAYMENT_REVIEW") return "\u{1F50D}"
  if (order.status === "CLOSED") return order.isPaid ? "\u2705" : "\u26AA"
  if (order.isPaid) return "\u2705"
  return "\u23F3"
}

export async function renderMyOrder(
  orderId: string,
  user: BotUser,
  t: TranslateFn,
  locale: Locale,
): Promise<View> {
  const [order, currency] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, deliveredKey: true },
    }),
    getShopCurrency(),
  ])

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
      statusIcon: orderStatusIcon(order),
      status: t(orderStatusKey(order)),
      amount: amount === null ? "—" : formatPrice(amount, locale, currency),
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
      language: LOCALE_LABELS[locale].native,
      name: escapeHtml(name),
      role: user.role === Role.ADMIN ? t("shop.roleAdmin") : t("shop.roleBuyer"),
    }),
    keyboard,
  }
}

export async function setUserLanguage(userId: string, language: Locale) {
  return prisma.user.update({ where: { id: userId }, data: { language } })
}
