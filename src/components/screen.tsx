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
        !noTabBar && "pb-[92px]",
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
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <header className="px-4 pb-3 pt-3">
      <div className="ui-card flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="min-w-0 text-lg font-semibold text-[var(--color-text)]">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</div>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </header>
  )
}

export function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("grid gap-3 px-4 pb-4", className)}>{children}</div>
}

export function ScreenEmpty({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 pb-4">
      <div className="ui-card flex w-full max-w-md flex-col items-center justify-center px-8 py-12 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
          {icon}
        </div>
        <p className="text-base font-medium text-[var(--color-text)]">{title}</p>
        {subtitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
      </div>
    </div>
  )
}
