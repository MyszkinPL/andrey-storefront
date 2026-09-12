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
 * Mobile navigation, docked to the bottom edge like a native tab bar: full
 * width, its own surface with a top border, icon over label, safe-area
 * padding underneath. It used to float as a rounded pill with a gap below
 * it, which on a phone read as a control that had come loose from the
 * screen. Replaced by the side rail from `lg` up.
 *
 * Real links in a `<nav>`, not a tab list: this switches routes, so it needs
 * prefetching, an `aria-current` the screen reader can announce, and arrow
 * keys that move focus without navigating.
 */
export function BottomTabs() {
  const pathname = usePathname()
  const t = useTranslate()
  const haptic = useHaptic()
  const { mode, canAdmin } = useMode()

  if (!isBottomTabsRoute(pathname)) return null
  if (pathname.startsWith("/admin") && !canAdmin) return null

  const tabs = navItemsFor(mode)
  const activeHref = activeNavHref(tabs, pathname)

  return (
    <nav
      aria-label={t("nav.sections")}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className={cn(SCREEN_CONTAINER, "flex items-stretch px-0 sm:px-0")}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.href === activeHref

          return (
            <li className="min-w-0 flex-1" key={tab.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] leading-none outline-none transition-colors",
                  "focus-visible:bg-accent/50",
                  active ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
                )}
                href={tab.href}
                onClick={() => {
                  if (!active) haptic.select()
                }}
              >
                <Icon
                  aria-hidden="true"
                  className="size-6 shrink-0"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="max-w-full truncate">{t(tab.labelKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
