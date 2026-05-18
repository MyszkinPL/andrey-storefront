"use client"

import type { TicketStatus } from "@prisma/client"

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
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
      role: "USER" | "ADMIN"
    }
    settings: {
      shopName: string
      welcomeText: string
      supportIntro: string
      supportUsername: string | null
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
      priceRub: number
      deliveryType: "MANUAL" | "AUTO_KEY"
      isActive: boolean
      availableKeyCount?: number
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
      priceRub: number
      deliveryType: "MANUAL" | "AUTO_KEY"
      isActive: boolean
      availableKeyCount?: number
    }
  }>(`/api/products/${id}`)
}

export function createTicket(payload: {
  subject: string
  message: string
  productId?: string
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
      updatedAt: string
      isPaid: boolean
      productTitle: string | null
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
      deliveredKey: string | null
      isAdmin: boolean
      messages: Array<{
        id: string
        body: string
        createdAt: string
        isMine: boolean
        senderName: string
        senderRole: "USER" | "ADMIN"
      }>
    }
  }>(`/api/tickets/${id}`)
}

export function sendTicketMessage(id: string, body: string) {
  return api<{ ok: true }>(`/api/tickets/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
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

export function getPaymentMethods() {
  return api<{
    paymentMethods: Array<{
      id: string
      title: string
      details: string
      isActive: boolean
    }>
  }>("/api/payment-methods")
}

export function saveAdminProduct(payload: {
  title: string
  category?: string
  description: string
  priceRub: number
  deliveryType: "MANUAL" | "AUTO_KEY"
  isActive: boolean
  keyPoolText?: string
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
    priceRub: number
    deliveryType: "MANUAL" | "AUTO_KEY"
    isActive: boolean
    keyPoolText?: string
  },
) {
  return api<{ ok: true }>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function saveSettings(payload: {
  shopName: string
  welcomeText: string
  supportIntro: string
  supportUsername?: string
  paymentMethods: Array<{
    id?: string
    title: string
    details: string
    isActive: boolean
  }>
}) {
  return api<{ ok: true }>("/api/admin/settings", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
