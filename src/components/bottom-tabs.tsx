"use client"

import { Home, LifeBuoy, Receipt, Settings, Shield, Store, Users } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"

const BUYER_TABS = [
  { href: "/catalog", label: "Каталог", icon: Store },
  { href: "/orders", label: "Заказы", icon: Receipt },
  { href: "/profile", label: "Профиль", icon: LifeBuoy },
]

const ADMIN_TABS = [
  { href: "/admin", label: "Обзор", icon: Home },
  { href: "/admin/products", label: "Товары", icon: Store },
  { href: "/admin/orders", label: "Заказы", icon: Shield },
  { href: "/admin/users", label: "Юзеры", icon: Users },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
]

const HIDDEN_PREFIXES = ["/product/", "/orders/"]

export function BottomTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const haptic = useHaptic()
  const { mode } = useMode()

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null

  const tabs = mode === "admin" ? ADMIN_TABS : BUYER_TABS

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-5xl p-4 pt-0">
      <Card size="sm">
        <CardContent className={cn("grid gap-1", mode === "admin" ? "grid-cols-5" : "grid-cols-3")}>
          {tabs.map((tab) => {
            const isHomeRoot = tab.href === "/catalog" || tab.href === "/admin"
            const selected = isHomeRoot
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href)
            const Icon = tab.icon

            return (
              <Button
                key={tab.href}
                variant={selected ? "secondary" : "ghost"}
                size="sm"
                className="h-auto min-w-0 flex-col gap-1 py-2"
                onClick={() => {
                  haptic.select()
                  router.push(tab.href)
                }}
              >
                <Icon />
                <span className="max-w-full truncate text-xs">{tab.label}</span>
              </Button>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
