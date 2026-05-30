import type { ReactNode } from "react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { getCurrentUser } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  if (user && user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title="Админка закрыта"
        description="Этот раздел доступен только администраторам магазина."
      />
    )
  }

  return children
}
