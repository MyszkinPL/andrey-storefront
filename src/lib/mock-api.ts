"use client"

import type { PaymentMethodType } from "@prisma/client"

const now = new Date().toISOString()

const productImage = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#111827"/>
      <stop offset=".55" stop-color="#1f2937"/>
      <stop offset="1" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="bottle" x1="0" x2="1">
      <stop stop-color="#e5e7eb"/>
      <stop offset=".35" stop-color="#94a3b8"/>
      <stop offset="1" stop-color="#111827"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="270" r="145" fill="#020617" opacity=".35"/>
  <path d="M205 155h102l22 53v204c0 23-19 42-42 42h-62c-23 0-42-19-42-42V208z" fill="url(#bottle)"/>
  <path d="M214 83h84l9 72H205z" fill="#111827"/>
  <path d="M190 258h132v103H190z" fill="#14b8a6"/>
  <text x="256" y="314" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="white">SNX</text>
  <text x="256" y="346" text-anchor="middle" font-family="Arial" font-size="18" fill="#ccfbf1">license</text>
</svg>`)

const productImageAlt = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#18181b"/>
      <stop offset=".55" stop-color="#27272a"/>
      <stop offset="1" stop-color="#525252"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="128" y="132" width="256" height="248" rx="42" fill="#09090b" opacity=".55"/>
  <path d="M174 210h164v116H174z" fill="#fafafa"/>
  <path d="M206 244h100M206 278h64" stroke="#18181b" stroke-width="18" stroke-linecap="round"/>
  <circle cx="338" cy="326" r="46" fill="#18181b"/>
  <path d="m318 326 14 14 28-34" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`)

const manualIcon = svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="28" fill="#fff"/>
  <circle cx="64" cy="64" r="43" fill="none" stroke="#22c55e" stroke-width="12"/>
  <path d="M40 64l17 17 34-39" fill="none" stroke="#0ea5e9" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`)

const cryptoIcon = "/crypto-bot-logo.svg"

const products = [
  {
    id: "mock-product-1",
    slug: "snx-lite",
    title: "биба боба",
    category: "пися попа",
    description: "Лицензия с автоматической выдачей ключа после оплаты.",
    imageDataUrl: productImage,
    priceRub: 12,
    deliveryType: "AUTO_KEY" as const,
    isActive: true,
    availableKeyCount: 7,
    editableKeys: [
      { id: "key-1", value: "SNX-LITE-TEST-001", createdAt: now },
      { id: "key-2", value: "SNX-LITE-TEST-002", createdAt: now },
    ],
    specs: [
      { label: "Срок", value: "Lifetime" },
      { label: "Выдача", value: "Автоматически" },
    ],
  },
  {
    id: "mock-product-2",
    slug: "drip-lite-lifetime",
    title: "DRIP LITE LIFETIME",
    category: "майнкрафт",
    description: "Lifetime-доступ с ручной выдачей после оплаты.",
    imageDataUrl: productImageAlt,
    priceRub: 4990,
    deliveryType: "MANUAL" as const,
    isActive: true,
    availableKeyCount: 0,
    editableKeys: [],
    specs: [
      { label: "Versions", value: "1.8.9 - 1.21.4" },
      { label: "Clients", value: "Fabric, Lunar, Forge" },
    ],
  },
]

const paymentMethods = [
  {
    id: "manual-sber",
    title: "сберхуйс",
    type: "MANUAL" as PaymentMethodType,
    details: "+38099999999",
    iconDataUrl: manualIcon,
    cryptoAcceptedAssets: null,
    isActive: true,
  },
]

const mockUser = {
  id: "mock-user-admin",
  telegramId: "7374948454",
  firstName: "Мышкин",
  lastName: null,
  username: "myszk_in",
  photoUrl: null,
  role: "ADMIN" as const,
  isBanned: false,
  banReason: null,
}

let orders = [
  makeOrder({
    id: "mock-open-manual",
    number: 12,
    product: products[0],
    paymentMethodType: "MANUAL",
    paymentMethodTitle: "сберхуйс",
    paymentMethodDetails: "+38099999999",
    paymentMethodIconDataUrl: manualIcon,
  }),
  makeOrder({
    id: "mock-review-manual",
    number: 13,
    status: "PAYMENT_REVIEW",
    product: products[0],
    paymentMethodType: "MANUAL",
    paymentMethodTitle: "сберхуйс",
    paymentMethodDetails: "+38099999999",
    paymentMethodIconDataUrl: manualIcon,
    manualPaymentRequestedAt: now,
  }),
  makeOrder({
    id: "mock-crypto",
    number: 14,
    product: products[1],
    paymentMethodType: "CRYPTO_PAY",
    paymentMethodTitle: "Crypto Bot",
    paymentMethodDetails: "Crypto Pay invoice",
    paymentMethodIconDataUrl: cryptoIcon,
    cryptoInvoiceUrl: "https://t.me/CryptoBot/app?startapp=invoice-demo",
    cryptoInvoiceStatus: "active",
    cryptoInvoiceAsset: "USDT",
    cryptoInvoiceAmount: "12",
    cryptoInvoiceFiat: "RUB",
  }),
]

export function isLocalMockApiEnabled() {
  return process.env.NODE_ENV === "development" && typeof window !== "undefined"
}

export async function mockApi<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const url = typeof input === "string" ? input : input.url
  const method = (init?.method || "GET").toUpperCase()
  const path = new URL(url, window.location.origin).pathname
  const search = new URL(url, window.location.origin).searchParams
  const body = init?.body ? JSON.parse(String(init.body)) : null

  if (path === "/api/auth/telegram") return { ok: true } as T

  if (path === "/api/me") {
    return {
      user: mockUser,
      settings: {
        shopName: "snx.sell",
        supportUsername: "andreytestmyszkinbot",
        cryptoPayEnabled: true,
        cryptoPayToken: null,
        cryptoPayUseTestnet: false,
        cryptoPayFiat: "RUB",
        cryptoPayDefaultAssets: "USDT",
        appUrl: "http://localhost:3000",
      },
    } as T
  }

  if (path === "/api/products" && method === "GET") return { products } as T
  if (path === "/api/products" && method === "POST") return { ok: true } as T
  if (path.startsWith("/api/products/")) {
    const product = products.find((item) => item.id === path.split("/").at(-1)) || products[0]
    return method === "GET" ? ({ product } as T) : ({ ok: true } as T)
  }

  if (path === "/api/payment-methods") {
    return {
      paymentMethods,
      cryptoPay: {
        enabled: true,
        title: "Crypto Bot",
        details: "Crypto Pay",
        acceptedAssets: "USDT",
        iconDataUrl: cryptoIcon,
      },
    } as T
  }

  if (path === "/api/orders" && method === "GET") {
    const scope = search.get("scope")
    return { orders: scope === "all" ? orders : orders.filter((order) => order.isOwner) } as T
  }

  if (path === "/api/orders" && method === "POST") {
    const product = products.find((item) => item.id === body?.productId) || products[0]
    const order = makeOrder({
      id: `mock-order-${Date.now()}`,
      number: orders.length + 20,
      product,
      paymentMethodType: body?.paymentMethodType === "CRYPTO_PAY" ? "CRYPTO_PAY" : "MANUAL",
      paymentMethodTitle: body?.paymentMethodType === "CRYPTO_PAY" ? "Crypto Bot" : "сберхуйс",
      paymentMethodDetails: body?.paymentMethodType === "CRYPTO_PAY" ? "Crypto Pay invoice" : "+38099999999",
      paymentMethodIconDataUrl: body?.paymentMethodType === "CRYPTO_PAY" ? cryptoIcon : manualIcon,
      cryptoInvoiceUrl: body?.paymentMethodType === "CRYPTO_PAY" ? "https://t.me/CryptoBot/app?startapp=invoice-demo" : null,
      cryptoInvoiceAmount: body?.paymentMethodType === "CRYPTO_PAY" ? String(product.priceRub) : null,
    })
    orders = [order, ...orders]
    return { orderId: order.id } as T
  }

  if (path.startsWith("/api/orders/")) {
    const id = path.split("/").at(-1) || ""
    const order = orders.find((item) => item.id === id) || orders[0]
    if (method === "GET") return { order } as T
    if (method === "DELETE") {
      orders = orders.filter((item) => item.id !== id)
      return { ok: true } as T
    }
    if (method === "PATCH") {
      if (body?.markManualPaid) order.status = "PAYMENT_REVIEW"
      if (body?.confirmPayment) {
        order.isPaid = true
        order.status = "CLOSED"
        order.deliveredKey = order.deliveredKey || "SNX-LITE-TEST-001"
      }
      if (body?.rejectManualPayment) order.status = "OPEN"
      if (body?.cancelByUser) order.status = "CANCELLED"
      if (body?.paymentMethodType === "CRYPTO_PAY") {
        order.paymentMethodType = "CRYPTO_PAY"
        order.paymentMethodTitle = "Crypto Bot"
        order.paymentMethodDetails = "Crypto Pay invoice"
        order.paymentMethodIconDataUrl = cryptoIcon
        order.cryptoInvoiceUrl = "https://t.me/CryptoBot/app?startapp=invoice-demo"
        order.cryptoInvoiceAmount = String(products.find((item) => item.title === order.productTitle)?.priceRub || 12)
      }
      if (body?.paymentMethodId) {
        const methodItem = paymentMethods[0]
        order.paymentMethodType = "MANUAL"
        order.paymentMethodId = methodItem.id
        order.paymentMethodTitle = methodItem.title
        order.paymentMethodDetails = methodItem.details
        order.paymentMethodIconDataUrl = methodItem.iconDataUrl
        order.cryptoInvoiceUrl = null
      }
      return { ok: true } as T
    }
  }

  if (path === "/api/admin/users") {
    return {
      pageInfo: { page: 1, limit: 30, total: 3, hasMore: false },
      summary: { total: 3, buyers: 2, admins: 1, banned: 0 },
      users: mockUsers,
    } as T
  }

  if (path.startsWith("/api/admin/users/")) {
    return { user: mockUsers.find((user) => user.id === path.split("/").at(-1)) || mockUsers[0] } as T
  }

  if (path === "/api/admin/settings") return { ok: true } as T
  if (path === "/api/admin/crypto-pay-currencies") {
    return {
      currencies: [
        { code: "USDT", name: "Tether", isFiat: false },
        { code: "TON", name: "Toncoin", isFiat: false },
        { code: "RUB", name: "Russian Ruble", isFiat: true },
      ],
      assets: [
        { code: "USDT", name: "Tether", isFiat: false },
        { code: "TON", name: "Toncoin", isFiat: false },
      ],
      fiats: [{ code: "RUB", name: "Russian Ruble", isFiat: true }],
    } as T
  }

  throw new Error(`Mock API route not implemented: ${method} ${path}`)
}

const mockUsers = [
  {
    ...mockUser,
    bannedAt: null,
    activeOrderCount: 1,
    createdAt: now,
    orders: orders.slice(0, 2).map(orderListItem),
  },
  {
    id: "mock-user-buyer",
    telegramId: "1000000001",
    firstName: "Покупатель",
    lastName: null,
    username: "buyer",
    photoUrl: null,
    role: "USER" as const,
    isBanned: false,
    bannedAt: null,
    banReason: null,
    activeOrderCount: 1,
    createdAt: now,
    orders: [orderListItem(orders[2])],
  },
]

function makeOrder({
  id,
  number,
  status = "OPEN",
  product,
  paymentMethodType,
  paymentMethodTitle,
  paymentMethodDetails,
  paymentMethodIconDataUrl,
  manualPaymentRequestedAt = null,
  cryptoInvoiceUrl = null,
  cryptoInvoiceStatus = null,
  cryptoInvoiceAsset = null,
  cryptoInvoiceAmount = null,
  cryptoInvoiceFiat = "RUB",
}: {
  id: string
  number: number
  status?: "OPEN" | "PAYMENT_REVIEW" | "CLOSED" | "CANCELLED"
  product: (typeof products)[number]
  paymentMethodType: PaymentMethodType
  paymentMethodTitle: string
  paymentMethodDetails: string
  paymentMethodIconDataUrl: string
  manualPaymentRequestedAt?: string | null
  cryptoInvoiceUrl?: string | null
  cryptoInvoiceStatus?: string | null
  cryptoInvoiceAsset?: string | null
  cryptoInvoiceAmount?: string | null
  cryptoInvoiceFiat?: string | null
}) {
  return {
    id,
    number,
    subject: `Покупка: ${product.title}`,
    status,
    createdAt: now,
    updatedAt: now,
    isPaid: status === "CLOSED",
    productTitle: product.title,
    productCategory: product.category,
    priceRub: product.priceRub,
    deliveredKey: status === "CLOSED" ? "SNX-LITE-TEST-001" : null,
    manualPaymentRequestedAt,
    isAdmin: true,
    isOwner: true,
    createdBy: {
      id: mockUser.id,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      username: mockUser.username,
      photoUrl: mockUser.photoUrl,
      isBanned: false,
      banReason: null,
    },
    assignedTo: null,
    paymentMethodId: paymentMethodType === "MANUAL" ? "manual-sber" : null,
    paymentMethodType,
    paymentMethodTitle,
    paymentMethodDetails,
    paymentMethodIconDataUrl,
    cryptoInvoiceFiat,
    cryptoInvoiceUrl,
    cryptoInvoiceStatus,
    cryptoInvoiceAsset,
    cryptoInvoiceAmount,
    cryptoInvoiceExpiresAt: null,
  }
}

function orderListItem(order: (typeof orders)[number]) {
  return {
    id: order.id,
    number: order.number,
    subject: order.subject,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    isPaid: order.isPaid,
    productTitle: order.productTitle,
    productCategory: order.productCategory,
    paymentMethodTitle: order.paymentMethodTitle,
    paymentMethodType: order.paymentMethodType,
    manualPaymentRequestedAt: order.manualPaymentRequestedAt,
    priceRub: products.find((product) => product.title === order.productTitle)?.priceRub || null,
  }
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}
