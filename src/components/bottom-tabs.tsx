"use client"

import { Home, LifeBuoy, Receipt, Settings, Shield, Store, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useHaptic } from "@/hooks/use-telegram"
import { useMode } from "@/components/mode-provider"
import { cn } from "@/lib/cn"

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
  const haptic = useHaptic()
  const { mode } = useMode()

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null
  const tabs = mode === "admin" ? ADMIN_TABS : BUYER_TABS

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 px-3"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div
        className="ui-card mx-auto mb-2 flex max-w-4xl items-stretch justify-around px-2 py-1.5"
      >
        {tabs.map((tab) => {
          const isHomeRoot = tab.href === "/catalog" || tab.href === "/admin"
          const active =
            isHomeRoot
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => {
                haptic.select()
              }}
              className={cn(
                "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 transition-colors duration-150 active:scale-[0.97]",
                active
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-muted)]",
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
