"use client"

import { Shield, ShoppingBag } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { useMode } from "@/components/mode-provider"
import { SCREEN_CONTAINER } from "@/components/screen"
import { useHaptic } from "@/hooks/use-telegram"
import { resolveModePath } from "@/lib/navigation"
import { cn } from "@/lib/utils"

const MODES = [
  { value: "buyer", icon: ShoppingBag, labelKey: "mode.buyer" },
  { value: "admin", icon: Shield, labelKey: "mode.admin" },
] as const

/**
 * Buyer / admin toggle. A segmented control of two pressed-state buttons,
 * not a tab list: it changes which app you are in, there are no panels to
 * announce, and arrow keys should move focus without flipping the mode
 * (the Tabs primitive it replaced flipped it and pushed a route each time).
 *
 * `page`: sits above a phone screen and shares its container. `rail`: lives
 * inside the desktop side panel, which has its own padding.
 */
export function ModeSwitcher({
  className,
  variant = "page",
}: {
  className?: string
  variant?: "page" | "rail"
}) {
  const { mode, setMode, canSwitch } = useMode()
  const t = useTranslate()
  const haptic = useHaptic()
  const router = useRouter()
  const pathname = usePathname()

  if (!canSwitch) return null

  return (
    <div
      aria-label={t("mode.label")}
      className={cn(variant === "page" ? [SCREEN_CONTAINER, "pt-3"] : "w-full", className)}
      role="group"
    >
      <div className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5">
        {MODES.map((item) => {
          const Icon = item.icon
          const active = item.value === mode

          return (
            <button
              aria-pressed={active}
              className={cn(
                "relative flex h-9 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 font-medium text-base outline-none transition-colors sm:h-8 sm:text-sm",
                "focus-visible:ring-2 focus-visible:ring-ring",
                "pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11",
                active
                  ? "bg-background text-foreground shadow-sm/5 dark:bg-input"
                  : "text-muted-foreground hover:text-foreground",
              )}
              key={item.value}
              onClick={() => {
                if (active) return
                haptic.select()
                setMode(item.value)
                router.replace(resolveModePath(pathname, item.value))
              }}
              type="button"
            >
              <Icon aria-hidden="true" className="size-4.5 shrink-0 sm:size-4" />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
