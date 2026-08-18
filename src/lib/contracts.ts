import type { OrderStatus, PaymentMethodType, Role } from "@prisma/client"

/**
 * The shape of every API response, declared once.
 *
 * Route handlers assert their payload with `satisfies`, the client types its
 * fetches from the same names, and the local mock is typed against them too.
 * Before this existed the same shape was written out in the route and again in
 * the client, and every added field meant editing both — a field added in one
 * place and forgotten in the other type-checked cleanly and broke at runtime.
 */

export type ProductSpec = {
  label: string
  value: string
}

export type ProductKeyItem = {
  id: string
  value: string
  createdAt: string
}

export type ProductSummary = {
  id: string
  slug: string
  title: string
  category: string | null
  description: string
  imageUrl: string | null
  priceRub: number
  deliveryType: "MANUAL" | "AUTO_KEY"
  isActive: boolean
  availableKeyCount?: number
  specs: ProductSpec[]
}

export type ProductDetail = ProductSummary & {
  /** Admin-only: the raw key pool behind an auto-delivery product. */
  editableKeys?: ProductKeyItem[]
}

export type ProductListResponse = { products: ProductSummary[] }
export type ProductResponse = { product: ProductDetail }

export type MeResponse = {
  user: {
    id: string
    telegramId: string
    firstName: string
    lastName: string | null
    username: string | null
    photoUrl: string | null
    role: Role
    isBanned?: boolean
    banReason?: string | null
    language: string | null
  }
  settings: {
    shopName: string
    supportUsername: string | null
    /** Fiat the shop prices in; every price label follows it. */
    currency: string
    cryptoPayEnabled?: boolean
    cryptoPayToken?: string | null
    cryptoPayUseTestnet?: boolean
    cryptoPayFiat?: string
    cryptoPayDefaultAssets?: string | null
    appUrl?: string
  }
}

export type OrderSummary = {
  id: string
  number: number
  subject: string
  status: OrderStatus
  createdAt: string
  updatedAt: string
  isPaid: boolean
  productTitle: string | null
  productCategory: string | null
  paymentMethodTitle: string | null
  paymentMethodType: PaymentMethodType | null
  manualPaymentRequestedAt: string | null
}

export type OrderReceiptInfo = {
  fileName: string
  fileSize: number
  uploadedAt: string
}

export type OrderDetail = {
  id: string
  number: number
  subject: string
  status: OrderStatus
  createdAt: string
  isPaid: boolean
  productTitle: string | null
  productCategory: string | null
  priceRub: number | null
  deliveredKey: string | null
  manualPaymentRequestedAt: string | null
  receipt: OrderReceiptInfo | null
  isAdmin: boolean
  isOwner: boolean
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
  paymentMethodId: string | null
  paymentMethodType: PaymentMethodType | null
  paymentMethodDetails: string | null
  paymentMethodIconDataUrl: string | null
  cryptoInvoiceFiat: string | null
  cryptoInvoiceUrl: string | null
  cryptoInvoiceStatus: string | null
  cryptoInvoiceAsset: string | null
  cryptoInvoiceAmount: string | null
  cryptoInvoiceExpiresAt: string | null
}

export type OrderListResponse = {
  hasMore: boolean
  orders: OrderSummary[]
}

export type OrderResponse = { order: OrderDetail }

export type PaymentMethodSummary = {
  id: string
  title: string
  type: PaymentMethodType
  details: string
  iconUrl: string | null
  cryptoAcceptedAssets: string | null
  isActive: boolean
}

export type PaymentMethodsResponse = {
  paymentMethods: PaymentMethodSummary[]
  cryptoPay: {
    enabled: boolean
    title: string
    details: string
    acceptedAssets: string | null
    iconUrl: string | null
  }
}

export type ReceiptUploadResponse = { receipt: OrderReceiptInfo }

export type OkResponse = { ok: true }
export type CreatedOrderResponse = { orderId: string }
