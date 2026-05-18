"use client"

import { Shield, ShoppingBag } from "lucide-react"

import { cn } from "@/lib/cn"
import { useHaptic } from "@/hooks/use-telegram"
import { useMode } from "@/components/mode-provider"

export function ModeSwitcher() {
  const { mode, setMode, canSwitch } = useMode()
  const haptic = useHaptic()

  if (!canSwitch) return null

  const items = [
    { key: "buyer" as const, label: "Покупатель", icon: ShoppingBag },
    { key: "admin" as const, label: "Админ", icon: Shield },
  ]

  return (
    <div className="px-3 pt-2">
      <div className="mx-auto inline-flex rounded-full border border-white/8 bg-[var(--color-surface)] p-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = mode === item.key
          return (
            <button
              key={item.key}
              onClick={() => {
                haptic.select()
                setMode(item.key)
              }}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active ? "text-[var(--color-accent-text)]" : "text-[var(--color-muted)]",
              )}
              style={active ? { background: "var(--color-accent)" } : undefined}
            >
              <Icon size={16} />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
