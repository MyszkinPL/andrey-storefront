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
  inlineTrailingMobile = false,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  inlineTrailingMobile?: boolean
}) {
  return (
    <header className="px-4 pb-2 pt-2.5">
      <div
        className={cn(
          "ui-card px-3.5 py-2.5",
          inlineTrailingMobile
            ? "flex items-start justify-between gap-3"
            : "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="min-w-0 text-lg font-semibold text-[var(--color-text)]">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-[var(--color-muted)]">{subtitle}</div>
          ) : null}
        </div>
        {trailing ? (
          <div
            className={cn(
              "min-w-0 shrink-0",
              inlineTrailingMobile ? "w-auto" : "w-full sm:w-auto",
            )}
          >
            {trailing}
          </div>
        ) : null}
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
  return <div className={cn("grid gap-2.5 px-4 pb-3", className)}>{children}</div>
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
    <div className="flex flex-1 items-center justify-center px-4 pb-3">
      <div className="ui-card flex w-full max-w-sm flex-col items-center justify-center px-6 py-9 text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
          {icon}
        </div>
        <p className="text-base font-medium text-[var(--color-text)]">{title}</p>
        {subtitle ? <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p> : null}
      </div>
    </div>
  )
}
