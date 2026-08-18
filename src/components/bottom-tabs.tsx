"use client"

import { usePathname, useRouter } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { activeNavHref, navItemsFor } from "@/lib/nav-items"
import { isBottomTabsRoute } from "@/lib/navigation"

/** Mobile navigation. Replaced by the side rail from `lg` up. */
export function BottomTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslate()
  const haptic = useHaptic()
  const { mode, canAdmin } = useMode()

  if (!isBottomTabsRoute(pathname)) return null
  if (pathname.startsWith("/admin") && !canAdmin) return null

  const tabs = navItemsFor(mode)
  const activeTab = activeNavHref(tabs, pathname)

  return (
    <Tabs
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 mx-auto w-full max-w-md px-3 sm:max-w-lg sm:px-4 lg:hidden"
      onValueChange={(href) => {
        haptic.select()
        router.push(href)
      }}
      value={activeTab}
    >
      <TabsList className={cn("grid !h-14 w-full", mode === "admin" ? "grid-cols-5" : "grid-cols-3")}>
        {tabs.map((tab) => {
          const Icon = tab.icon

          return (
            <TabsTrigger
              className="!h-full min-w-0 flex-col gap-1 px-1 py-1 text-[11px] leading-none sm:text-xs"
              key={tab.href}
              value={tab.href}
            >
              <Icon aria-hidden="true" />
              {t(tab.labelKey)}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
