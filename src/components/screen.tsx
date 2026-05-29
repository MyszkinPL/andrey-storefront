import { Cell, List, Placeholder, Section } from "@telegram-apps/telegram-ui"

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
        "mx-auto flex min-h-dvh w-full max-w-5xl flex-col",
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
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  inlineTrailingMobile?: boolean
}) {
  return (
    <List className="px-4 pb-1 pt-2">
      <Section>
        <Cell multiline after={trailing} subtitle={subtitle}>
          {title}
        </Cell>
      </Section>
    </List>
  )
}

export function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <List className={cn("px-4 pb-3", className)}>{children}</List>
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
    <div className="flex min-h-[48dvh] flex-1 items-center justify-center px-4">
      <Placeholder header={title} description={subtitle}>
        {icon}
      </Placeholder>
    </div>
  )
}
