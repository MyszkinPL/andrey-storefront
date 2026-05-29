"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { useTelegram } from "@/hooks/use-telegram"

function resolveStartTarget(raw: string | null) {
  const value = (raw || "").trim()
  if (!value || value === "catalog") return "/catalog"
  if (value === "orders") return "/orders"
  if (value === "profile") return "/profile"
  const product = /^product_(.+)$/.exec(value)
  if (product) return `/product/${product[1]}`
  const order = /^order_(.+)$/.exec(value)
  if (order) return `/orders/${order[1]}`
  return "/catalog"
}

export default function RootPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { startParam } = useTelegram()

  useEffect(() => {
    router.replace(resolveStartTarget(startParam ?? searchParams.get("tgWebAppStartParam")))
  }, [router, searchParams, startParam])

  return null
}
