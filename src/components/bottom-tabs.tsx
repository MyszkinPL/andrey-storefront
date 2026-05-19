"use client"

import { Tabbar } from "@telegram-apps/telegram-ui"
import { Home, LifeBuoy, Settings, Shield, Store, Ticket } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { useHaptic } from "@/hooks/use-telegram"
import { useMode } from "@/components/mode-provider"

const BUYER_TABS = [
  { href: "/catalog", label: "Каталог", icon: Store },
  { href: "/tickets", label: "Тикеты", icon: Ticket },
  { href: "/profile", label: "Профиль", icon: LifeBuoy },
]

const ADMIN_TABS = [
  { href: "/admin", label: "Обзор", icon: Home },
  { href: "/admin/products", label: "Товары", icon: Store },
  { href: "/admin/tickets", label: "Тикеты", icon: Shield },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
]

const HIDDEN_PREFIXES = ["/product/", "/tickets/"]

export function BottomTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const haptic = useHaptic()
  const { mode } = useMode()

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null
  const tabs = mode === "admin" ? ADMIN_TABS : BUYER_TABS

  return (
    <div className="fixed inset-x-0 bottom-0 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
      <Tabbar>
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/admin" && pathname.startsWith(`${tab.href}/`))
          const Icon = tab.icon
          return (
            <Tabbar.Item
              key={tab.href}
              selected={active}
              text={tab.label}
              onClick={() => {
                haptic.select()
                router.push(tab.href)
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            </Tabbar.Item>
          )
        })}
      </Tabbar>
    </div>
  )
}
