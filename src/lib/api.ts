"use client"

import type { ApiErrorCode } from "@/lib/api-error"
import type { PaymentMethodType, OrderStatus } from "@prisma/client"

import type {
  ClearedHistoryResponse,
  CreatedOrderResponse,
  MeResponse,
  OkResponse,
  OrderListResponse,
  OrderResponse,
  PaymentMethodsResponse,
  ProductListResponse,
  ProductResponse,
  ProductSpec,
  StatsResponse,
  ProductKeyItem,
  ReceiptUploadResponse,
} from "@/lib/contracts"
import { isLocalMockApiEnabled, mockApi } from "@/lib/mock-api"

export class ApiError extends Error {
  status: number
  /** Machine-readable reason, so callers branch on it instead of on prose. */
  code: ApiErrorCode

  constructor(status: number, message: string, code: ApiErrorCode = "UNKNOWN") {
    super(message)
    this.status = status
    this.code = code
  }
}

export type ProductSpecInput = ProductSpec
export type AdminProductKey = ProductKeyItem

export type PaymentMethodInput = {
  id?: string
  title: string
  type: Extract<PaymentMethodType, "MANUAL">
  details: string
  /** Omit to keep the current icon, null to clear it. */
  iconDataUrl?: string | null
  isActive: boolean
}

export type ShopSettingsPayload = {
  shopName: string
  supportUsername?: string
  cryptoPayEnabled: boolean
  cryptoPayToken?: string
  cryptoPayUseTestnet: boolean
  cryptoPayFiat: string
  cryptoPayDefaultAssets?: string
  requiredChannel?: string
  paymentMethods: PaymentMethodInput[]
}

export type CryptoPayCurrency = {
  code: string
  name: string
  isFiat: boolean
}

async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  if (isLocalMockApiEnabled()) {
    return mockApi<T>(input, init)
  }

  // FormData must set its own Content-Type so the multipart boundary is right.
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData

  const response = await fetch(input, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(response.status, body?.error || "Request failed", body?.code)
  }

  return response.json()
}

export function authenticateWithTelegram(initData: string, isDev = false) {
  return api<OkResponse>("/api/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData, dev: isDev }),
  })
}

export function getMe() {
  return api<MeResponse>("/api/me")
}

export function updateLanguage(language: string) {
  return api<OkResponse>("/api/me/language", {
    method: "PATCH",
    body: JSON.stringify({ language }),
  })
}

export function uploadOrderReceipt(orderId: string, file: File) {
  const body = new FormData()
  body.append("file", file)

  return api<ReceiptUploadResponse>(
    `/api/orders/${orderId}/receipt`,
    { method: "POST", body },
  )
}

export function getProducts() {
  return api<ProductListResponse>("/api/products")
}

export function getProduct(id: string) {
  return api<ProductResponse>(`/api/products/${id}`)
}

export function createOrder(payload: {
  subject: string
  productId?: string
  paymentMethodId?: string
  paymentMethodType?: PaymentMethodType
}) {
  return api<CreatedOrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function getOrders(params?: { scope?: "all"; limit?: number }) {
  const query = new URLSearchParams()
  if (params?.scope) query.set("scope", params.scope)
  if (params?.limit) query.set("limit", String(params.limit))

  return api<OrderListResponse>(`/api/orders${query.size ? `?${query.toString()}` : ""}`)
}

export function getOrder(id: string) {
  return api<OrderResponse>(`/api/orders/${id}`)
}

export function confirmOrderPayment(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ confirmPayment: true }),
  })
}

export function refreshCryptoInvoice(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ refreshCryptoInvoice: true }),
  })
}

export function markManualOrderPaid(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ markManualPaid: true }),
  })
}

export function changeOrderPaymentMethod(
  id: string,
  payload:
    | { paymentMethodId: string; paymentMethodType?: undefined }
    | { paymentMethodType: Extract<PaymentMethodType, "CRYPTO_PAY">; paymentMethodId?: undefined },
) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function rejectManualOrderPayment(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ rejectManualPayment: true }),
  })
}

export function cancelOwnOrder(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ cancelByUser: true }),
  })
}

export function getShopStats() {
  return api<StatsResponse>("/api/admin/stats")
}

/** Counts a product card open. Fire-and-forget: never blocks the screen. */
export function recordProductView(id: string) {
  return api<OkResponse>(`/api/products/${id}/view`, { method: "POST" }).catch(
    () => undefined,
  )
}

/** Hides one finished order from the caller's own history. */
export function hideOrderFromHistory(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ hideFromHistory: true }),
  })
}

/** Hides every finished order of the caller in one request. */
export function clearOrderHistory() {
  return api<ClearedHistoryResponse>("/api/orders/history", { method: "DELETE" })
}

export function deleteAdminOrder(id: string) {
  return api<OkResponse>(`/api/orders/${id}`, {
    method: "DELETE",
  })
}

export function updateAdminUserModeration(
  id: string,
  payload: { isBanned?: boolean; banReason?: string; role?: "USER" | "ADMIN" },
) {
  return api<OkResponse>(`/api/admin/users/${id}`, {
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
        status: OrderStatus
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
        status: OrderStatus
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
  return api<PaymentMethodsResponse>("/api/payment-methods")
}

export function saveAdminProduct(payload: {
  title: string
  category?: string
  description: string
  /** Omit to keep the current cover, null to clear it. */
  imageDataUrl?: string | null
  priceRub: number
  deliveryType: "MANUAL" | "AUTO_KEY"
  isActive: boolean
  keyPoolText?: string
  specs: ProductSpecInput[]
}) {
  return api<OkResponse>("/api/products", {
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
    /** Omit to keep the current cover, null to clear it. */
  imageDataUrl?: string | null
    priceRub: number
    deliveryType: "MANUAL" | "AUTO_KEY"
    isActive: boolean
    keyPoolText?: string
    removeKeyIds?: string[]
    specs: ProductSpecInput[]
  },
) {
  return api<OkResponse>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function deleteAdminProduct(id: string) {
  return api<OkResponse>(`/api/products/${id}`, {
    method: "DELETE",
  })
}

export function saveSettings(payload: ShopSettingsPayload) {
  return api<OkResponse>("/api/admin/settings", {
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
