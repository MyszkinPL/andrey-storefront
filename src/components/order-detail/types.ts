import type { OrderDetail } from "@/lib/contracts"

export type Order = OrderDetail

export type PaymentOption = {
  key: string
  id?: string
  type: "MANUAL" | "CRYPTO_PAY"
  title: string
  subtitle: string
  iconUrl: string | null
}
