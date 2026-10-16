"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, Text } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useMode } from "@/components/mode-provider"
import { ModeSwitcher } from "@/components/mode-switcher"
import { ShopLogo } from "@/components/shop-logo"
import { getMe } from "@/lib/api"
import { isNavItemActive, navItemsFor } from "@/lib/nav-items"

/**
 * Desktop navigation rail. Hidden below `lg`, where the bottom tab bar
 * takes over; both render and CSS picks one, so there is no hydration flash.
 */
export function SideNav() {
  const pathname = usePathname()
  const t = useTranslate()
  const { mode, canSwitch } = useMode()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })

  const items = navItemsFor(mode)
  const shopName = meData?.settings.shopName || ""
  const displayName = meData?.user.firstName || ""

  return (
    <aside className="shop-rail">
      <div className="shop-rail-head">
        <ShopLogo aria-label={shopName} className="h-7" />
      </div>

      {canSwitch ? (
        <div className="shop-rail-section">
          <ModeSwitcher variant="rail" />
        </div>
      ) : null}

      <div className="shop-rail-section" data-grow="">
        <nav className="shop-rail-nav">
          {items.map((item) => {
            const Icon = item.icon
            const active = isNavItemActive(item, pathname)

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className="shop-rail-link"
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="shop-rail-section" data-stack="">
        <LanguageSwitcher />

        {displayName ? (
          <Link
            aria-current={pathname === "/profile" ? "page" : undefined}
            className="shop-rail-link"
            href="/profile"
          >
            <Avatar name={displayName} size="md" src={meData?.user.photoUrl} />
            <div className="shop-row-copy">
              <Text as="span" size="sm" truncate>
                {displayName}
              </Text>
              <Text as="span" size="xs" tone="muted" truncate>
                {meData?.user.username ? `@${meData.user.username}` : t("auth.noUsername")}
              </Text>
            </div>
          </Link>
        ) : null}
      </div>
    </aside>
  )
}
