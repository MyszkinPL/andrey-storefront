import { cn } from "@/lib/cn"

export function Screen({
  children,
  className,
  noTabBar = false,
}: {
  children: React.ReactNode
  className?: string
  noTabBar?: boolean
}) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-dvh w-full max-w-6xl flex-col",
        !noTabBar && "pb-[88px]",
        className,
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      {children}
    </main>
  )
}

export function ScreenHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string
  subtitle?: string
  trailing?: React.ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-3 px-4 pb-3 pt-3">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {trailing}
    </header>
  )
}
