// Profile is opened from the header avatar and gets a back button instead.
const BUYER_TAB_ROUTES = ["/catalog", "/orders"] as const
const ADMIN_TAB_ROUTES = [
  "/admin",
  "/admin/products",
  "/admin/orders",
  "/admin/users",
  "/admin/settings",
] as const

export function isBottomTabsRoute(pathname: string) {
  return (
    BUYER_TAB_ROUTES.some((route) => pathname === route) ||
    ADMIN_TAB_ROUTES.some((route) => pathname === route)
  )
}

export function resolveModePath(pathname: string, nextMode: "buyer" | "admin") {
  if (pathname.startsWith("/orders/")) return pathname

  if (nextMode === "admin") {
    if (pathname === "/orders") return "/admin/orders"
    if (pathname === "/profile") return "/admin/settings"
    if (pathname === "/catalog" || pathname.startsWith("/product/")) return "/admin/products"
    return pathname.startsWith("/admin") ? pathname : "/admin"
  }

  if (pathname === "/admin/orders") return "/orders"
  if (pathname === "/admin/settings" || pathname === "/admin/users") return "/profile"
  if (pathname === "/admin/products" || pathname.startsWith("/product/")) return "/catalog"
  return pathname.startsWith("/admin") ? "/catalog" : pathname
}

/**
 * Routes a required channel subscription can stand in front of: browsing and
 * buying. Orders and the profile stay open on purpose — turning the
 * requirement on must not lock a buyer away from an order they have already
 * paid for, or from the support link they would need to complain about it.
 */
export function isChannelGatedRoute(pathname: string) {
  return pathname === "/" || pathname === "/catalog" || pathname.startsWith("/product/")
}
