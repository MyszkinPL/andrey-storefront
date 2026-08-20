import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { BackButton } from "@/components/back-button"
import { cn } from "@/lib/utils"

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
        "mx-auto box-border flex w-full max-w-5xl flex-col overflow-x-hidden px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-4",
        // From `lg` the side rail replaces the tab bar, so the space it
        // reserved at the bottom becomes ordinary page padding.
        "lg:px-8 lg:pt-8 lg:pb-10",
        !noTabBar && "min-h-[calc(100dvh-3rem)] lg:min-h-0",
        noTabBar && "min-h-0",
        // Clears the tab bar: 0.75rem offset + its natural coss height.
        !noTabBar && "pb-[calc(env(safe-area-inset-bottom)+4.5rem)]",
        noTabBar && "pb-[calc(env(safe-area-inset-bottom)+1rem)]",
        className,
      )}
    >
      {children}
    </main>
  )
}

export function ScreenHeader({
  back,
  before,
  title,
  subtitle,
  trailing,
}: {
  /** Renders an in-app back control; a string is the destination route. */
  back?: boolean | string
  before?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  inlineTrailingMobile?: boolean
}) {
  return (
    <header className="mb-2 flex items-center gap-3 px-1 lg:mb-4">
      {back ? (
        <BackButton className="-ms-1 shrink-0" href={typeof back === "string" ? back : undefined} />
      ) : null}
      {before ? <div className="shrink-0">{before}</div> : null}
      <div className="min-w-0 flex-1">
        <CardTitle className="truncate lg:text-2xl">{title}</CardTitle>
        {subtitle ? <CardDescription className="truncate">{subtitle}</CardDescription> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
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
  return <div className={cn("flex flex-col gap-2 lg:gap-3", className)}>{children}</div>
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
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            {subtitle ? <EmptyDescription>{subtitle}</EmptyDescription> : null}
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}
