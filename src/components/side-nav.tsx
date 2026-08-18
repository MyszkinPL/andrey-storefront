"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useMode } from "@/components/mode-provider"
import { ModeSwitcher } from "@/components/mode-switcher"
import { ShopLogo } from "@/components/shop-logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getMe } from "@/lib/api"
import { isNavItemActive, navItemsFor } from "@/lib/nav-items"
import { cn } from "@/lib/utils"

/**
 * Desktop navigation rail. Hidden below `lg`, where the bottom tab bar takes
 * over — both render, and CSS picks one, so there is no hydration flash.
 */
export function SideNav() {
  const pathname = usePathname()
  const t = useTranslate()
  const { mode, canSwitch } = useMode()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })

  const items = navItemsFor(mode)
  const shopName = meData?.settings.shopName || "snx.sell"
  const displayName = meData?.user.firstName || ""
  const roleLabel = meData?.user.role === "ADMIN" ? t("mode.admin") : t("mode.buyer")

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-border border-r bg-card/40 lg:flex">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <ShopLogo />
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">{shopName}</p>
          <p className="truncate text-muted-foreground text-xs">{roleLabel}</p>
        </div>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon
          const active = isNavItemActive(item, pathname)

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{t(item.labelKey)}</span>
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="flex flex-col gap-3 p-3">
        {canSwitch ? <ModeSwitcher className="w-full px-0 pt-0" /> : null}

        <LanguageSwitcher className="w-full" />

        {displayName ? (
          <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
            <Avatar className="size-8">
              {meData?.user.photoUrl ? (
                <AvatarImage alt={displayName} src={meData.user.photoUrl} />
              ) : null}
              <AvatarFallback>{displayName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">{displayName}</p>
              <p className="truncate text-muted-foreground text-xs">
                {meData?.user.username
                  ? `@${meData.user.username}`
                  : t("auth.noUsername")}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
