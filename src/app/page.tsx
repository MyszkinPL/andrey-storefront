"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { getWebApp } from "@/lib/telegram"

function resolveStartTarget(raw: string | null) {
  const value = (raw || "").trim()
  if (!value || value === "catalog") return "/catalog"
  if (value === "tickets") return "/tickets"
  if (value === "profile") return "/profile"
  const product = /^product_(.+)$/.exec(value)
  if (product) return `/product/${product[1]}`
  const ticket = /^ticket_(.+)$/.exec(value)
  if (ticket) return `/tickets/${ticket[1]}`
  return "/catalog"
}

export default function RootPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const webApp = getWebApp()
    const startParam =
      webApp?.initDataUnsafe.start_param ?? searchParams.get("tgWebAppStartParam")
    router.replace(resolveStartTarget(startParam))
  }, [router, searchParams])

  return null
}
