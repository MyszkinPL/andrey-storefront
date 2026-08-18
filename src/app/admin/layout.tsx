import type { ReactNode } from "react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { getCurrentUser } from "@/lib/auth"
import { translate } from "@/lib/i18n"
import { DEFAULT_LOCALE, resolveUserLocale } from "@/lib/i18n/config"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  if (user && user.role !== "ADMIN") {
    const locale = user ? resolveUserLocale(user) : DEFAULT_LOCALE

    return (
      <AccessStateScreen
        title={translate(locale, "errors.adminClosedTitle")}
        description={translate(locale, "errors.adminClosedDescription")}
      />
    )
  }

  return children
}
