"use client"

import { EllipsisVertical, X } from "lucide-react"
import { usePathname } from "next/navigation"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = pathname.startsWith("/admin") ? "snx.sell admin" : "snx.sell"

  return (
    <div className="app-shell">
      <header className="flex items-center justify-between px-5 pb-3 pt-5 md:px-6">
        <div className="min-w-0">
          <p className="truncate text-[1.9rem] font-semibold tracking-[-0.05em] text-white md:text-[2.1rem]">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[var(--color-muted)]">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-white/4 transition-colors hover:bg-white/7"
            aria-label="Menu"
          >
            <EllipsisVertical size={18} />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-white/4 transition-colors hover:bg-white/7"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </header>
      {children}
    </div>
  )
}
