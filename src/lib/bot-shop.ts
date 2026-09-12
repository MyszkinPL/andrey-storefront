import { OrderStatus, PaymentMethodType, Role } from "@prisma/client"
import { InlineKeyboard } from "grammy"

import { formatCryptoAmount, formatPrice } from "@/lib/format"
import type { TranslateFn } from "@/lib/i18n"
import type { Locale } from "@/lib/i18n/config"
import { LOCALE_LABELS, LOCALES } from "@/lib/i18n/config"
import { estimateCryptoAmount } from "@/lib/crypto-pay"
import { createOrder, OrderCreateError } from "@/lib/order-create"
import { expireStaleOrders } from "@/lib/order-expiry"
import { getShopCurrency } from "@/lib/shop-settings"
import { notifyManualPaymentRequested, notifyOrderCancelled } from "@/lib/order-notifications"
import { orderStatusKey } from "@/lib/order-status"
import { isOrderOnTimer, remainingMinutes, remainingMs } from "@/lib/order-timer"
import { prisma } from "@/lib/prisma"
import { recordProductView } from "@/lib/shop-stats"
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

/** Turns "@support" or "support" into a t.me link; null when unset. */
export function supportUrl(username: string | null | undefined) {
  const handle = username?.trim().replace(/^@/, "")
  return handle ? `https://t.me/${handle}` : null
}

// ------------------------------------------------------------------- menu

export function shopMenu(
  t: TranslateFn,
  shopName: string,
  isAdmin: boolean,
  appUrl: string,
  supportUsername?: string | null,
): View {
  const keyboard = new InlineKeyboard()
    .text(t("shop.menuCatalog"), "sc")
    .text(t("shop.menuOrders"), "so")
    .row()
    .text(t("shop.menuProfile"), "su")

  const support = supportUrl(supportUsername)
  if (support) keyboard.url(t("shop.support"), support)

  if (isAdmin) keyboard.row().text(t("shop.menuAdmin"), "m")

  // The web app lives in the same keyboard instead of a second message.
  keyboard.row().webApp(t("shop.menuOpenApp"), appUrl)

  return {
    text: [t("shop.menuTitle", { shop: escapeHtml(shopName) }), "", t("shop.menuIntro")].join("\n"),
    keyboard,
  }
}

// ---------------------------------------------------------------- catalog

export async function renderCatalog(t: TranslateFn, locale: Locale): Promise<View> {
  const currency = await getShopCurrency()
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: PAGE_SIZE,
    include: { _count: { select: { keys: { where: { issuedAt: null } } } } },
  })

  const keyboard = new InlineKeyboard()
  for (const product of products) {
    // Instant delivery gets the lightning bolt so the buyer knows before
    // opening the card whether they will wait for a person.
    const mark = product.deliveryType === "AUTO_KEY" ? "⚡" : "\u{1F4E6}"
    keyboard
      .text(
        `${mark} ${product.title.slice(0, 26)} · ${formatPrice(product.priceRub, locale, currency)}`,
        `sc:${product.id}`,
      )
      .row()
  }
  keyboard.text(t("bot.back"), "sm")

  const lines = [t("shop.catalogTitle")]
  lines.push(products.length ? t("shop.catalogLegend") : t("shop.catalogEmpty"))

  return { text: lines.join("\n"), keyboard }
}

export async function renderShopProduct(
  productId: string,
  t: TranslateFn,
  locale: Locale,
  viewerId?: string,
): Promise<View> {
  // The bot is a shopfront too, so its card opens belong in the same counter.
  if (viewerId) await recordProductView(productId, viewerId).catch(() => {})

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
      delivery: isAuto
        ? t("shop.deliveryAuto", { keys: product._count.keys })
        : t("shop.deliveryManual"),
    }),
  )

  if (isAuto && product._count.keys === 0) lines.push(t("shop.outOfStock"))

  const hasMethods = methods.length > 0 || Boolean(settings?.cryptoPayEnabled && settings.cryptoPayToken)
  lines.push("", hasMethods ? t("shop.choosePayment") : t("shop.noPayment"))

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
      ? `💎 Crypto Bot · ≈ ${formatCryptoAmount(estimate)} ${asset}`
      : "💎 Crypto Bot"
    keyboard.text(label, `sq:${product.id}:c`).row()
  }
  const support = supportUrl(settings?.supportUsername)
  if (!hasMethods && support) keyboard.url(t("shop.support"), support).row()
  keyboard.text(t("shop.backToCatalog"), "sc")

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
  await expireStaleOrders().catch(() => {})
  const orders = await prisma.order.findMany({
    where: { createdById: userId, hiddenByBuyerAt: null },
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

  const lines = [t("shop.ordersTitle")]
  if (orders.length === 0) {
    lines.push(t("shop.ordersEmpty"))
  } else {
    const waiting = orders.filter(isOrderOnTimer).length
    if (waiting > 0) lines.push(t("shop.ordersWaiting", { count: waiting }))
    lines.push("", t("shop.ordersLegend"))
  }

  return { text: lines.join("\n"), keyboard }
}

/** A glanceable state marker for order cards and list buttons. */
export function orderStatusIcon(order: {
  status: string
  isPaid: boolean
  expiredAt?: Date | null
}) {
  if (order.status === "CANCELLED" && order.expiredAt) return "⌛"
  if (order.status === "CANCELLED") return "\u{1F6AB}"
  if (order.status === "PAYMENT_REVIEW") return "\u{1F50D}"
  if (order.status === "CLOSED") return order.isPaid ? "✅" : "⚪"
  if (order.isPaid) return "\u{1F4E6}"
  return "⏳"
}

export async function renderMyOrder(
  orderId: string,
  user: BotUser,
  t: TranslateFn,
  locale: Locale,
): Promise<View> {
  await expireStaleOrders().catch(() => {})
  const [order, currency, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, deliveredKey: true },
    }),
    getShopCurrency(),
    prisma.shopSettings.findUnique({ where: { id: 1 } }),
  ])

  if (!order || order.createdById !== user.id) {
    return { text: t("bot.notFound"), keyboard: new InlineKeyboard().text(t("bot.back"), "so") }
  }

  const title = order.product?.title || order.productTitleSnapshot || order.subject
  const amount = order.priceRubSnapshot ?? order.product?.priceRub ?? null
  const amountLabel = amount === null ? "—" : formatPrice(amount, locale, currency)
  const key = order.deliveredKey?.value || order.deliveredKeyValue || ""
  const isClosed =
    order.status === OrderStatus.CLOSED || order.status === OrderStatus.CANCELLED
  const isManual = order.paymentMethodType === PaymentMethodType.MANUAL
  const awaitingManual =
    !order.isPaid && !isClosed && isManual && order.status !== OrderStatus.PAYMENT_REVIEW

  const lines = [
    t("shop.orderCard", {
      title: escapeHtml(title),
      number: order.number,
      statusIcon: orderStatusIcon(order),
      status: t(orderStatusKey(order)),
      amount: amountLabel,
      method: escapeHtml(order.paymentMethodTitle || "—"),
    }),
  ]

  // The requisites and the three steps only while a transfer is still the
  // thing to do; afterwards they are noise under a finished order.
  if (awaitingManual && order.paymentMethodDetails) {
    lines.push(
      t("shop.requisites", { details: escapeHtml(order.paymentMethodDetails) }),
      "",
      t("shop.payHow", { amount: amountLabel }),
    )
  }
  if (!order.isPaid && !isClosed && order.paymentMethodType === PaymentMethodType.CRYPTO_PAY) {
    lines.push("", t("shop.payHowCrypto"))
  }
  if (order.status === OrderStatus.PAYMENT_REVIEW) {
    lines.push("", t("shop.reviewHint"))
  }
  if (isOrderOnTimer(order) && order.expiresAt) {
    lines.push(
      "",
      t("shop.timeLeft", { minutes: remainingMinutes(remainingMs(order.expiresAt)) }),
    )
  }
  if (order.status === OrderStatus.CANCELLED && order.expiredAt) {
    lines.push("", t("shop.expiredHint"))
  }
  if (order.isPaid && !key) lines.push("", t("shop.paidHint"))
  if (key) lines.push(t("shop.keyIssued", { key: escapeHtml(key) }))

  const keyboard = new InlineKeyboard()

  if (order.cryptoInvoiceUrl && !order.isPaid && !isClosed) {
    keyboard.url(t("shop.openInvoice"), order.cryptoInvoiceUrl).row()
  }
  if (awaitingManual) {
    keyboard.text(t("shop.markPaid"), `sd:${order.id}`).row()
  }
  if (!order.isPaid && !isClosed) {
    keyboard.text(t("shop.cancel"), `sk:${order.id}`).row()
  }
  // Same rule as the mini app: only a finished order can leave the history.
  if (isClosed) {
    keyboard.text(t("shop.hideFromHistory"), `sx:${order.id}`).row()
  }
  const support = supportUrl(settings?.supportUsername)
  if (support) keyboard.url(t("shop.support"), support)
  keyboard.text(t("bot.back"), "so")

  return { text: lines.join("\n"), keyboard }
}

export async function markOrderPaid(orderId: string, userId: string) {
  // The same guard the API has: a timed-out order cannot be marked paid.
  await expireStaleOrders().catch(() => {})
  const updated = await prisma.order.updateMany({
    where: {
      id: orderId,
      createdById: userId,
      isPaid: false,
      status: OrderStatus.OPEN,
      paymentMethodType: PaymentMethodType.MANUAL,
    },
    data: { status: OrderStatus.PAYMENT_REVIEW, manualPaymentRequestedAt: new Date() },
  })

  if (updated.count > 0) await notifyManualPaymentRequested(orderId).catch(() => {})
  return updated.count > 0
}

export async function cancelOwnOrder(orderId: string, userId: string) {
  const updated = await prisma.order.updateMany({
    where: {
      id: orderId,
      createdById: userId,
      isPaid: false,
      status: { in: [OrderStatus.OPEN, OrderStatus.PAYMENT_REVIEW] },
    },
    data: { status: OrderStatus.CANCELLED, closedAt: new Date() },
  })

  if (updated.count > 0) await notifyOrderCancelled(orderId).catch(() => {})
  return updated.count > 0
}

// ---------------------------------------------------------------- profile

export async function renderProfile(
  user: BotUser,
  t: TranslateFn,
  locale: Locale,
  appUrl: string,
): Promise<View> {
  const name = user.username ? `@${user.username}` : user.firstName
  const keyboard = new InlineKeyboard()

  for (const value of LOCALES) {
    if (value === locale) continue
    keyboard.text(t("shop.language", { language: LOCALE_LABELS[value].native }), `sl:${value}`)
  }

  const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
  const support = supportUrl(settings?.supportUsername)
  if (support) keyboard.row().url(t("shop.support"), support)

  keyboard.row().webApp(t("shop.menuOpenApp"), `${appUrl}/profile`)
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

/**
 * Drops a finished order from the buyer's own list. The order itself stays —
 * the shop still needs the record if the payment is ever disputed.
 */
export async function hideOrderFromHistory(orderId: string, userId: string) {
  const updated = await prisma.order.updateMany({
    where: {
      id: orderId,
      createdById: userId,
      hiddenByBuyerAt: null,
      status: { in: [OrderStatus.CLOSED, OrderStatus.CANCELLED] },
    },
    data: { hiddenByBuyerAt: new Date() },
  })

  return updated.count > 0
}
