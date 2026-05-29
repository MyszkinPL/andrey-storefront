"use client"

import { Shield, ShoppingBag } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"

export function ModeSwitcher() {
  const { mode, setMode, canSwitch } = useMode()
  const haptic = useHaptic()
  const router = useRouter()
  const pathname = usePathname()

  if (!canSwitch) return null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-3">
      <Card size="sm">
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant={mode === "buyer" ? "default" : "ghost"}
            onClick={() => {
              if (mode === "buyer") return
              haptic.select()
              setMode("buyer")
              router.replace(resolveModePath(pathname, "buyer"))
            }}
          >
            <ShoppingBag data-icon="inline-start" />
            Покупатель
          </Button>
          <Button
            variant={mode === "admin" ? "default" : "ghost"}
            onClick={() => {
              if (mode === "admin") return
              haptic.select()
              setMode("admin")
              router.replace(resolveModePath(pathname, "admin"))
            }}
          >
            <Shield data-icon="inline-start" />
            Админ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function resolveModePath(pathname: string, nextMode: "buyer" | "admin") {
  if (nextMode === "admin") {
    if (pathname === "/orders" || pathname.startsWith("/orders/")) return "/admin/orders"
    if (pathname === "/profile") return "/admin/settings"
    return "/admin"
  }

  if (pathname === "/admin/orders") return "/orders"
  if (pathname === "/admin/settings") return "/profile"
  if (pathname === "/admin/products") return "/catalog"
  return "/catalog"
}
