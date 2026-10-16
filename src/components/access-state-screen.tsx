"use client"

import { CircleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { EmptyState } from "sealui"

export function AccessStateScreen({
  title,
  description,
  icon = <CircleAlert />,
}: {
  title: string
  description: string
  icon?: ReactNode
}) {
  return (
    <main className="shop-gate">
      <EmptyState description={description} icon={icon} title={title} />
    </main>
  )
}
