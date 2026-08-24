"use client"

import { CircleDashed, RotateCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
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
import { useTranslate } from "@/components/i18n-provider"
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
  action,
  icon,
  title,
  subtitle,
}: {
  action?: React.ReactNode
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
          {action ? <EmptyContent>{action}</EmptyContent> : null}
        </Empty>
      </CardContent>
    </Card>
  )
}

/**
 * A failed fetch used to look exactly like an empty list, and offered no way
 * out short of restarting the app. It gets its own icon and a retry button.
 */
export function ScreenError({
  onRetry,
  title,
  subtitle,
}: {
  onRetry?: () => void
  title: string
  subtitle?: string
}) {
  const t = useTranslate()

  return (
    <ScreenEmpty
      action={
        onRetry ? (
          <Button onClick={onRetry} variant="outline">
            <RotateCw data-icon="inline-start" />
            {t("common.retry")}
          </Button>
        ) : undefined
      }
      icon={<TriangleAlert />}
      subtitle={subtitle}
      title={title}
    />
  )
}

/**
 * Whole-screen placeholder for a detail route with nothing to show yet. It
 * keeps the back control, because a screen that failed to load is otherwise a
 * dead end when it was opened straight from a bot link.
 */
export function ScreenState({
  back,
  description,
  icon,
  onRetry,
  title,
}: {
  back?: boolean | string
  description?: string
  icon?: React.ReactNode
  /** Renders a retry button and switches the icon to the failure one. */
  onRetry?: () => void
  title: string
}) {
  return (
    <Screen noTabBar>
      {back ? (
        <BackButton
          className="-ms-1 mb-2 self-start"
          href={typeof back === "string" ? back : undefined}
        />
      ) : null}
      {onRetry ? (
        <ScreenError onRetry={onRetry} subtitle={description} title={title} />
      ) : (
        <ScreenEmpty
          icon={icon ?? <CircleDashed />}
          subtitle={description}
          title={title}
        />
      )}
    </Screen>
  )
}
