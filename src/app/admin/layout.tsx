import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { getCurrentUser } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getCurrentUser()

  if (user && user.role !== "ADMIN") {
    redirect("/catalog")
  }

  return children
}
