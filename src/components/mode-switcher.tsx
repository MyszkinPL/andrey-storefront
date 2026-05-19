"use client"

import { Shield, ShoppingBag } from "lucide-react"

import { useHaptic } from "@/hooks/use-telegram"
import { useMode } from "@/components/mode-provider"
import { cn } from "@/lib/cn"

export function ModeSwitcher() {
  const { mode, setMode, canSwitch } = useMode()
  const haptic = useHaptic()

  if (!canSwitch) return null

  const items: Array<{ key: "buyer" | "admin"; label: string; icon: typeof ShoppingBag }> = [
    { key: "buyer", label: "Покупатель", icon: ShoppingBag },
    { key: "admin", label: "Админ", icon: Shield },
  ]

  return (
    <div
      className="flex justify-center px-3 pb-2 pt-2"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="inline-flex rounded-full p-0.5"
        style={{ background: "var(--color-surface)" }}
      >
        {items.map((item) => {
          return (
            <PillButton
              key={item.key}
              active={mode === item.key}
              onClick={() => {
                if (mode !== item.key) {
                  haptic.select()
                  setMode(item.key)
                }
              }}
              label={item.label}
              icon={item.icon}
            />
          )
        })}
      </div>
    </div>
  )
}

function PillButton({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon: typeof ShoppingBag
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "text-[var(--color-accent-text)]"
          : "text-[var(--color-muted)]",
      )}
      style={active ? { background: "var(--color-accent)" } : undefined}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}
