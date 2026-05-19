"use client"

import { Shield, ShoppingBag } from "lucide-react"

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
    <div className="px-4 pb-3 md:px-6">
      <div className="flex rounded-[1.35rem] border border-white/5 bg-[var(--color-panel)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        {items.map((item) => {
          const Icon = item.icon
          const active = mode === item.key
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => {
                haptic.select()
                setMode(item.key)
              }}
              className={[
                "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-[var(--color-soft)] text-white shadow-[0_10px_24px_rgba(0,0,0,0.22)]"
                  : "text-[var(--color-muted)] hover:text-white",
              ].join(" ")}
            >
              <span className="flex items-center gap-2 truncate">
                <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
