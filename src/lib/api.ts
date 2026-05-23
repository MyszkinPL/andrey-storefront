"use client"

import type { PaymentMethodType, TicketStatus } from "@prisma/client"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type ProductSpecInput = {
  label: string
  value: string
}

export type AdminProductKey = {
  id: string
  value: string
  createdAt: string
}

export type TicketMessageAttachment = {
  type: "image"
  url: string
}

export type PaymentMethodInput = {
  id?: string
  title: string
  type: Extract<PaymentMethodType, "MANUAL">
  details: string
  iconDataUrl?: string
  isActive: boolean
}

export type ShopSettingsPayload = {
  shopName: string
  supportIntro: string
  supportUsername?: string
  cryptoPayEnabled: boolean
  cryptoPayToken?: string
  cryptoPayUseTestnet: boolean
  cryptoPayFiat: string
  cryptoPayDefaultAssets?: string
  paymentMethods: PaymentMethodInput[]
}

export type CryptoPayCurrency = {
  code: string
  name: string
  isFiat: boolean
}

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.error || "Request failed")
  }

  return response.json()
}

export function authenticateWithTelegram(initData: string, isDev = false) {
  return api<{ ok: true }>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData, dev: isDev }),
  })
}

export function getMe() {
  return api<{
    user: {
      id: string
      telegramId: string
      firstName: string
      lastName: string | null
      username: string | null
      photoUrl: string | null
      role: "USER" | "ADMIN"
      isBanned?: boolean
      banReason?: string | null
    }
    settings: {
      shopName: string
      supportIntro: string
      supportUsername: string | null
      cryptoPayEnabled?: boolean
      cryptoPayToken?: string | null
      cryptoPayUseTestnet?: boolean
      cryptoPayFiat?: string
      cryptoPayDefaultAssets?: string | null
      appUrl?: string
    }
  }>("/api/me")
}

export function getProducts() {
  return api<{
    products: Array<{
      id: string
      slug: string
      title: string
      category: string | null
      description: string
      imageDataUrl: string | null
      priceRub: number
      deliveryType: "MANUAL" | "AUTO_KEY"
      isActive: boolean
      availableKeyCount?: number
      specs: ProductSpecInput[]
    }>
  }>("/api/products")
}

export function getProduct(id: string) {
  return api<{
    product: {
      id: string
      slug: string
      title: string
      category: string | null
      description: string
      imageDataUrl: string | null
      priceRub: number
      deliveryType: "MANUAL" | "AUTO_KEY"
      isActive: boolean
      availableKeyCount?: number
      editableKeys?: AdminProductKey[]
      specs: ProductSpecInput[]
    }
  }>(`/api/products/${id}`)
}

export function createTicket(payload: {
  subject: string
  message: string
  productId?: string
  paymentMethodId?: string
  paymentMethodType?: PaymentMethodType
}) {
  return api<{ ticketId: string }>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getTickets() {
  return api<{
    tickets: Array<{
      id: string
      number: number
      subject: string
      status: TicketStatus
      createdAt: string
      updatedAt: string
      isPaid: boolean
      productTitle: string | null
      productCategory: string | null
      paymentMethodTitle: string | null
      paymentMethodType: PaymentMethodType | null
      manualPaymentRequestedAt: string | null
      lastMessage: string | null
    }>
  }>("/api/tickets")
}

export function getTicket(id: string) {
  return api<{
    ticket: {
      id: string
      number: number
      subject: string
      status: TicketStatus
      createdAt: string
      isPaid: boolean
      productTitle: string | null
      productCategory: string | null
      deliveredKey: string | null
      manualPaymentRequestedAt: string | null
      isAdmin: boolean
      createdBy: {
        id: string
        firstName: string
        lastName: string | null
        username: string | null
        photoUrl: string | null
        isBanned: boolean
        banReason: string | null
      } | null
      assignedTo: {
        id: string
        firstName: string
        lastName: string | null
        username: string | null
      } | null
      paymentMethodTitle: string | null
      paymentMethodType: PaymentMethodType | null
      paymentMethodDetails: string | null
      paymentMethodIconDataUrl: string | null
      cryptoInvoiceFiat: string | null
      cryptoInvoiceUrl: string | null
      cryptoInvoiceStatus: string | null
      cryptoInvoiceAsset: string | null
      cryptoInvoiceAmount: string | null
      cryptoInvoiceExpiresAt: string | null
      messages: Array<{
        id: string
        body: string
        attachments: TicketMessageAttachment[]
        createdAt: string
        isMine: boolean
        senderName: string
        senderRole: "USER" | "ADMIN"
      }>
    }
  }>(`/api/tickets/${id}`)
}

export function sendTicketMessage(
  id: string,
  payload: {
    body?: string
    attachments?: TicketMessageAttachment[]
  },
) {
  return api<{ ok: true }>(`/api/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateTicketStatus(id: string, status: TicketStatus) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function confirmTicketPayment(id: string) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ confirmPayment: true }),
  })
}

export function refreshCryptoInvoice(id: string) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ refreshCryptoInvoice: true }),
  })
}

export function markManualTicketPaid(id: string) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ markManualPaid: true }),
  })
}

export function rejectManualTicketPayment(id: string) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ rejectManualPayment: true }),
  })
}

export function cancelOwnTicket(id: string) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ cancelByUser: true }),
  })
}

export function deleteAdminTicket(id: string) {
  return api<{ ok: true }>(`/api/tickets/${id}`, {
    method: "DELETE",
  })
}

export function updateAdminUserModeration(
  id: string,
  payload: { isBanned: boolean; banReason?: string },
) {
  return api<{ ok: true }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function getAdminUsers(params?: {
  q?: string
  filter?: "all" | "buyers" | "admins" | "banned"
  page?: number
  limit?: number
}) {
  const query = new URLSearchParams()
  if (params?.q) query.set("q", params.q)
  if (params?.filter) query.set("filter", params.filter)
  if (params?.page) query.set("page", String(params.page))
  if (params?.limit) query.set("limit", String(params.limit))

  return api<{
    pageInfo: {
      page: number
      limit: number
      total: number
      hasMore: boolean
    }
    summary: {
      total: number
      buyers: number
      admins: number
      banned: number
    }
    users: Array<{
      id: string
      telegramId: string
      firstName: string
      lastName: string | null
      username: string | null
      photoUrl: string | null
      role: "USER" | "ADMIN"
      isBanned: boolean
      bannedAt: string | null
      banReason: string | null
      activeOrderCount: number
      createdAt: string
      orders: Array<{
        id: string
        number: number
        status: TicketStatus
        isPaid: boolean
        createdAt: string
        updatedAt: string
        productTitle: string | null
        productCategory: string | null
        priceRub: number | null
      }>
    }>
  }>(`/api/admin/users${query.size ? `?${query.toString()}` : ""}`)
}

export function getAdminUser(id: string) {
  return api<{
    user: {
      id: string
      telegramId: string
      firstName: string
      lastName: string | null
      username: string | null
      photoUrl: string | null
      role: "USER" | "ADMIN"
      isBanned: boolean
      bannedAt: string | null
      activeOrderCount: number
      createdAt: string
      orders: Array<{
        id: string
        number: number
        status: TicketStatus
        isPaid: boolean
        updatedAt: string
        productTitle: string | null
        productCategory: string | null
        priceRub: number | null
      }>
    }
  }>(`/api/admin/users/${id}`)
}

export function getPaymentMethods() {
  return api<{
    paymentMethods: Array<{
      id: string
      title: string
      type: PaymentMethodType
      details: string
      iconDataUrl: string | null
      cryptoAcceptedAssets: string | null
      isActive: boolean
    }>
    cryptoPay: {
      enabled: boolean
      title: string
      details: string
      acceptedAssets: string | null
      iconDataUrl: string | null
    }
  }>("/api/payment-methods")
}

export function saveAdminProduct(payload: {
  title: string
  category?: string
  description: string
  imageDataUrl?: string
  priceRub: number
  deliveryType: "MANUAL" | "AUTO_KEY"
  isActive: boolean
  keyPoolText?: string
  specs: ProductSpecInput[]
}) {
  return api<{ ok: true }>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateAdminProduct(
  id: string,
  payload: {
    title: string
    category?: string
    description: string
    imageDataUrl?: string
    priceRub: number
    deliveryType: "MANUAL" | "AUTO_KEY"
    isActive: boolean
    keyPoolText?: string
    removeKeyIds?: string[]
    specs: ProductSpecInput[]
  },
) {
  return api<{ ok: true }>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function saveSettings(payload: ShopSettingsPayload) {
  return api<{ ok: true }>("/api/admin/settings", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getCryptoPayCurrencies(payload: {
  token?: string
  useTestnet?: boolean
}) {
  return api<{
    currencies: CryptoPayCurrency[]
    assets: CryptoPayCurrency[]
    fiats: CryptoPayCurrency[]
  }>("/api/admin/crypto-pay-currencies", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
