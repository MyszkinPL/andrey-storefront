"use client"

import { Home, LifeBuoy, Receipt, Settings, Shield, Store, Users } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { isBottomTabsRoute } from "@/lib/navigation"

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

export function BottomTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const haptic = useHaptic()
  const { mode, canAdmin } = useMode()

  if (!isBottomTabsRoute(pathname)) return null
  if (pathname.startsWith("/admin") && !canAdmin) return null

  const tabs = mode === "admin" ? ADMIN_TABS : BUYER_TABS
  const activeTab =
    tabs.find((tab) => {
      const isHomeRoot = tab.href === "/catalog" || tab.href === "/admin"
      return isHomeRoot ? pathname === tab.href : pathname === tab.href || pathname.startsWith(tab.href)
    })?.href || tabs[0]?.href

  return (
    <Tabs
      value={activeTab}
      onValueChange={(href) => {
        haptic.select()
        router.push(href)
      }}
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto w-full max-w-md px-3 sm:max-w-lg sm:px-4"
    >
      <TabsList className={cn("grid !h-14 w-full", mode === "admin" ? "grid-cols-5" : "grid-cols-3")}>
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <TabsTrigger
              key={tab.href}
              value={tab.href}
              className="!h-full min-w-0 flex-col gap-1 px-1 py-1 text-[11px] leading-none sm:text-xs"
            >
              <Icon aria-hidden="true" />
              {tab.label}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
