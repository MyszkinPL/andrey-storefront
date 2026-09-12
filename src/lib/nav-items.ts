import {
  ClipboardList,
  Home,
  ReceiptText,
  Settings,
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
/** Profile is reached from the avatar in the header, not from a tab. */
export const BUYER_NAV: NavItem[] = [
  { href: "/catalog", icon: Store, labelKey: "nav.catalog" },
  // A plain receipt: the dollar-sign one advertised a currency the shop does
  // not price in.
  { href: "/orders", icon: ReceiptText, labelKey: "nav.orders" },
]

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", icon: Home, labelKey: "nav.adminOverview" },
  { href: "/admin/products", icon: Store, labelKey: "nav.adminProducts" },
  // The shield already means "admin mode" in the mode switcher; reusing it
  // for one tab made that tab look like the switch.
  { href: "/admin/orders", icon: ClipboardList, labelKey: "nav.adminOrders" },
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
