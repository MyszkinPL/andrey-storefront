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
        "mx-auto flex min-h-[calc(100dvh-96px)] w-full max-w-6xl flex-col px-4 md:px-6",
        !noTabBar && "pb-[94px]",
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
    <header className="px-1 pb-4 pt-2">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.9rem] font-semibold tracking-[-0.05em] text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {trailing}
      </div>
    </header>
  )
}
