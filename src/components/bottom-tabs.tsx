"use client"

import { Home, LifeBuoy, Settings, Shield, Store, Ticket } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/cn"
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
  const haptic = useHaptic()
  const { mode } = useMode()

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null
  const tabs = mode === "admin" ? ADMIN_TABS : BUYER_TABS

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5"
      style={{
        background: "color-mix(in srgb, var(--color-surface) 92%, transparent)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-stretch justify-around px-2 py-1">
        {tabs.map((tab) => {
          const active =
            pathname === tab.href ||
            (tab.href !== "/admin" && pathname.startsWith(`${tab.href}/`))
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => haptic.select()}
              className={cn(
                "flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors",
                active ? "text-[var(--color-accent)]" : "text-[var(--color-muted)]",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
