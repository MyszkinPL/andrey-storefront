const BUYER_TAB_ROUTES = ["/catalog", "/orders", "/profile"] as const
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
