"use client"

import { Home, LifeBuoy, Receipt, Settings, Shield, Store, Users } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Tabbar } from "@telegram-apps/telegram-ui"

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
    <Tabbar>
      {tabs.map((tab) => {
        const isHomeRoot = tab.href === "/catalog" || tab.href === "/admin"
        const selected = isHomeRoot
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href)
        const Icon = tab.icon

        return (
          <Tabbar.Item
            key={tab.href}
            selected={selected}
            text={tab.label}
            onClick={() => {
              haptic.select()
              router.push(tab.href)
            }}
          >
            <Icon size={28} />
          </Tabbar.Item>
        )
      })}
    </Tabbar>
  )
}
