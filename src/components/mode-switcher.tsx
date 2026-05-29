"use client"

import { Shield, ShoppingBag } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { SegmentedControl } from "@telegram-apps/telegram-ui"

import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"

export function ModeSwitcher() {
  const { mode, setMode, canSwitch } = useMode()
  const haptic = useHaptic()
  const router = useRouter()
  const pathname = usePathname()

  if (!canSwitch) return null

  return (
    <div className="px-4 pb-2 pt-2">
      <SegmentedControl>
        <SegmentedControl.Item
          selected={mode === "buyer"}
          onClick={() => {
            if (mode === "buyer") return
            haptic.select()
            setMode("buyer")
            router.replace(resolveModePath(pathname, "buyer"))
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <ShoppingBag size={15} />
            Покупатель
          </span>
        </SegmentedControl.Item>
        <SegmentedControl.Item
          selected={mode === "admin"}
          onClick={() => {
            if (mode === "admin") return
            haptic.select()
            setMode("admin")
            router.replace(resolveModePath(pathname, "admin"))
          }}
        >
          <span className="inline-flex items-center gap-1.5">
            <Shield size={15} />
            Админ
          </span>
        </SegmentedControl.Item>
      </SegmentedControl>
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
