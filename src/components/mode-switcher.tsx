"use client"

import { Shield, ShoppingBag } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { SCREEN_CONTAINER } from "@/components/screen"
import { resolveModePath } from "@/lib/navigation"
import { cn } from "@/lib/utils"

/**
 * `page`: sits above a phone screen and shares its container. `rail`: lives
 * inside the desktop side panel, which has its own padding, so the page
 * container's margins would only squeeze it.
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
    <Tabs
      className={cn(variant === "page" ? [SCREEN_CONTAINER, "pt-3"] : "w-full", className)}
      onValueChange={(value) => {
        const nextMode = value as "buyer" | "admin"
        if (nextMode === mode) return
        haptic.select()
        setMode(nextMode)
        router.replace(resolveModePath(pathname, nextMode))
      }}
      value={mode}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="buyer">
          <ShoppingBag data-icon="inline-start" />
          {t("mode.buyer")}
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Shield data-icon="inline-start" />
          {t("mode.admin")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
