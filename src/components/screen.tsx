import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
        "mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]",
        !noTabBar && "pb-[calc(env(safe-area-inset-bottom)+5.75rem)]",
        noTabBar && "pb-[calc(env(safe-area-inset-bottom)+1rem)]",
        className,
      )}
    >
      {children}
    </main>
  )
}

export function ScreenHeader({
  before,
  title,
  subtitle,
  trailing,
}: {
  before?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  inlineTrailingMobile?: boolean
}) {
  return (
    <Card size="sm" className="mb-3">
      <CardHeader className="grid-cols-[auto_1fr_auto] items-center">
        {before ? <div className="row-span-2">{before}</div> : null}
        <CardTitle className="min-w-0 truncate">{title}</CardTitle>
        {trailing ? <CardAction>{trailing}</CardAction> : null}
        {subtitle ? (
          <CardDescription className="min-w-0 truncate">{subtitle}</CardDescription>
        ) : null}
      </CardHeader>
    </Card>
  )
}

export function ScreenBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("flex flex-col gap-3", className)}>{children}</div>
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
