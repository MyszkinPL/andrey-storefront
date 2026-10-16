"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { activeNavHref, navItemsFor } from "@/lib/nav-items"
import { isBottomTabsRoute } from "@/lib/navigation"

/**
 * Mobile navigation, docked to the bottom edge like a native tab bar: full
 * width, its own surface with a top border, icon over label, safe-area
 * padding underneath. Replaced by the side rail from `lg` up.
 *
 * Real links in a <nav>, not a tab list: this switches routes, so it needs
 * prefetching, an aria-current the screen reader can announce, and arrow
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
    <nav aria-label={t("nav.sections")} className="shop-tabbar">
      <ul className="shop-tabbar-list">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.href === activeHref

          return (
            <li className="shop-tabbar-item" key={tab.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className="shop-tabbar-link"
                href={tab.href}
                onClick={() => {
                  if (!active) haptic.select()
                }}
              >
                <Icon aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                <span>{t(tab.labelKey)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
