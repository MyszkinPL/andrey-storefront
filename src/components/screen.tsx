import { List, Section, Subheadline, Title } from "@telegram-apps/telegram-ui"

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
      <List>{children}</List>
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
    <Section
      header={
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Title level="2">{title}</Title>
            {subtitle ? <Subheadline level="2">{subtitle}</Subheadline> : null}
          </div>
          {trailing}
        </div>
      }
      className="!bg-transparent"
    >
      <div />
    </Section>
  )
}
