"use client"

import { Shield, ShoppingBag } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { resolveModePath } from "@/lib/navigation"
import { cn } from "@/lib/utils"

export function ModeSwitcher({ className }: { className?: string }) {
  const { mode, setMode, canSwitch } = useMode()
  const t = useTranslate()
  const haptic = useHaptic()
  const router = useRouter()
  const pathname = usePathname()

  if (!canSwitch) return null

  return (
    <Tabs
      className={cn("mx-auto w-full max-w-md px-3 pt-3 sm:px-4", className)}
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
