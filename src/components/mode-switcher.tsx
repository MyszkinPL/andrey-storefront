"use client"

import { SegmentedControl } from "@telegram-apps/telegram-ui"
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
    <div className="px-3 pt-2">
      <SegmentedControl>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <SegmentedControl.Item
              key={item.key}
              selected={mode === item.key}
              onClick={() => {
                haptic.select()
                setMode(item.key)
              }}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} />
                {item.label}
              </span>
            </SegmentedControl.Item>
          )
        })}
      </SegmentedControl>
    </div>
  )
}
