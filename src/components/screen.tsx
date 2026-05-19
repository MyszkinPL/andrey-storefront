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
        !noTabBar && "pb-[80px]",
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
    <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-[var(--color-muted)]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing}
    </header>
  )
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
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div
        className="mb-4 flex size-20 items-center justify-center rounded-full"
        style={{ background: "var(--color-surface)" }}
      >
        {icon}
      </div>
      <p className="text-base font-medium text-[var(--color-text)]">{title}</p>
      {subtitle ? (
        <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
      ) : null}
    </div>
  )
}
