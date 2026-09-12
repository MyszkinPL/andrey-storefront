"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { useMode } from "@/components/mode-provider"
import { SCREEN_CONTAINER } from "@/components/screen"
import { useHaptic } from "@/hooks/use-telegram"
import { activeNavHref, navItemsFor } from "@/lib/nav-items"
import { isBottomTabsRoute } from "@/lib/navigation"
import { cn } from "@/lib/utils"

/**
 * Mobile navigation. Replaced by the side rail from `lg` up.
 *
 * Real links in a `<nav>`, not a tab list: this switches routes, so it needs
 * prefetching, an `aria-current` the screen reader can announce, and arrow
 * keys that move focus without navigating. The Tabs primitive it replaced
 * did none of that and fired a router push on every arrow press.
 */
export function BottomTabs() {
  const pathname = usePathname()
  const t = useTranslate()
  const haptic = useHaptic()
  const { mode, canAdmin } = useMode()

  if (!isBottomTabsRoute(pathname)) return null
  if (pathname.startsWith("/admin") && !canAdmin) return null

  const isAdmin = mode === "admin"
  const tabs = navItemsFor(mode)
  const activeHref = activeNavHref(tabs, pathname)

  return (
    <nav
      aria-label={t("nav.sections")}
      className={cn(
        SCREEN_CONTAINER,
        "fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 lg:hidden",
      )}
    >
      <ul className="flex items-center gap-0.5 rounded-lg bg-muted p-0.5 shadow-lg/10">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.href === activeHref

          return (
            <li className="min-w-0 flex-1" key={tab.href}>
              <Link
                aria-current={active ? "page" : undefined}
                aria-label={t(tab.labelKey)}
                className={cn(
                  "relative flex h-9 items-center justify-center gap-1.5 rounded-md px-2 font-medium text-base outline-none transition-colors sm:h-8 sm:text-sm",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  // 44px touch target on coarse pointers, same as coss buttons.
                  "pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11",
                  active
                    ? "bg-background text-foreground shadow-sm/5 dark:bg-input"
                    : "text-muted-foreground hover:text-foreground",
                )}
                href={tab.href}
                onClick={() => {
                  if (!active) haptic.select()
                }}
              >
                <Icon aria-hidden="true" className="size-4.5 shrink-0 sm:size-4" />
                {/* Five admin tabs will not fit a narrow phone with labels, so
                    they fall back to icon-only there. */}
                <span className={cn("truncate", isAdmin && "max-sm:hidden")}>
                  {t(tab.labelKey)}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
