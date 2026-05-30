"use client"

import { Shield, ShoppingBag } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { resolveModePath } from "@/lib/navigation"

export function ModeSwitcher() {
  const { mode, setMode, canSwitch } = useMode()
  const haptic = useHaptic()
  const router = useRouter()
  const pathname = usePathname()

  if (!canSwitch) return null

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => {
        const nextMode = value as "buyer" | "admin"
        if (nextMode === mode) return
        haptic.select()
        setMode(nextMode)
        router.replace(resolveModePath(pathname, nextMode))
      }}
      className="mx-auto w-full max-w-md px-3 pt-3 sm:px-4"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="buyer">
          <ShoppingBag data-icon="inline-start" />
          Покупатель
        </TabsTrigger>
        <TabsTrigger value="admin">
          <Shield data-icon="inline-start" />
          Админ
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
