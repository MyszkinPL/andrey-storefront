import {
  Home,
  LifeBuoy,
  Receipt,
  Settings,
  Shield,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { TranslationKey } from "@/lib/i18n"

export type NavItem = {
  href: string
  icon: LucideIcon
  labelKey: TranslationKey
}

/** Single source of nav items, shared by the mobile tab bar and desktop rail. */
export const BUYER_NAV: NavItem[] = [
  { href: "/catalog", icon: Store, labelKey: "nav.catalog" },
  { href: "/orders", icon: Receipt, labelKey: "nav.orders" },
  { href: "/profile", icon: LifeBuoy, labelKey: "nav.profile" },
]

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", icon: Home, labelKey: "nav.adminOverview" },
  { href: "/admin/products", icon: Store, labelKey: "nav.adminProducts" },
  { href: "/admin/orders", icon: Shield, labelKey: "nav.adminOrders" },
  { href: "/admin/users", icon: Users, labelKey: "nav.adminUsers" },
  { href: "/admin/settings", icon: Settings, labelKey: "nav.adminSettings" },
]

export function navItemsFor(mode: "buyer" | "admin") {
  return mode === "admin" ? ADMIN_NAV : BUYER_NAV
}

/**
 * The catalog and admin overview are section roots, so they only match
 * exactly; everything else also matches its nested routes.
 */
export function isNavItemActive(item: NavItem, pathname: string) {
  const isSectionRoot = item.href === "/catalog" || item.href === "/admin"
  if (isSectionRoot) return pathname === item.href
  return pathname === item.href || pathname.startsWith(item.href)
}

export function activeNavHref(items: NavItem[], pathname: string) {
  return items.find((item) => isNavItemActive(item, pathname))?.href || items[0]?.href
}
