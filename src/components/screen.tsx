"use client"

import { CircleDashed, RotateCw, TriangleAlert } from "lucide-react"
import type { ReactNode } from "react"
import { EmptyState, Heading, Text } from "sealui"

import { BackButton } from "@/components/back-button"
import { useTranslate } from "@/components/i18n-provider"

/**
 * One horizontal container shared by every phone-layout element: screens,
 * the mode switcher above them and the tab bar below.
 */
export function Screen({
  children,
  noTabBar = false,
  narrow = false,
}: {
  children: ReactNode
  noTabBar?: boolean
  /** One phone-width column even on desktop: detail screens and editors. */
  narrow?: boolean
}) {
  return (
    <main
      className="shop-screen"
      data-narrow={narrow ? "" : undefined}
      data-no-tab-bar={noTabBar ? "" : undefined}
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
  before?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <header className="shop-header">
      {back ? <BackButton href={typeof back === "string" ? back : undefined} /> : null}
      {before ? <div className="shop-header-side">{before}</div> : null}
      <div className="shop-header-copy">
        {/* A top-level screen opens with Polar's page heading; a detail
            screen that already has a back arrow keeps the compact one. */}
        <Heading as="h1" size={back ? "sm" : "md"} truncate>
          {title}
        </Heading>
        {subtitle ? (
          <Text as="p" size="sm" tone="muted" truncate>
            {subtitle}
          </Text>
        ) : null}
      </div>
      {trailing ? <div className="shop-header-side">{trailing}</div> : null}
    </header>
  )
}

export function ScreenBody({
  children,
  grow = false,
}: {
  children: ReactNode
  /** Fills the screen so a card can push its footer to the bottom. */
  grow?: boolean
}) {
  return (
    <div className="shop-body" data-grow={grow ? "" : undefined}>
      {children}
    </div>
  )
}

export function ScreenEmpty({
  action,
  icon,
  title,
  subtitle,
}: {
  action?: { label: string; onClick: () => void; icon?: ReactNode }
  icon: ReactNode
  title: string
  subtitle?: string
}) {
  return (
    <EmptyState
      actions={action ? [{ ...action, variant: "outline" }] : undefined}
      description={subtitle}
      icon={icon}
      title={title}
    />
  )
}

/**
 * A failed fetch gets its own icon and a retry button, so it never looks
 * like an empty list.
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
        onRetry ? { label: t("common.retry"), onClick: onRetry, icon: <RotateCw size={16} /> } : undefined
      }
      icon={<TriangleAlert />}
      subtitle={subtitle}
      title={title}
    />
  )
}

/**
 * Whole-screen placeholder for a detail route with nothing to show yet. It
 * keeps the back control, because a screen that failed to load is otherwise
 * a dead end when it was opened straight from a bot link.
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
  icon?: ReactNode
  /** Renders a retry button and switches the icon to the failure one. */
  onRetry?: () => void
  title: string
}) {
  return (
    <Screen narrow noTabBar>
      {back ? (
        <div className="shop-header">
          <BackButton href={typeof back === "string" ? back : undefined} />
        </div>
      ) : null}
      {onRetry ? (
        <ScreenError onRetry={onRetry} subtitle={description} title={title} />
      ) : (
        <ScreenEmpty icon={icon ?? <CircleDashed />} subtitle={description} title={title} />
      )}
    </Screen>
  )
}

/**
 * Primary actions pinned above the bottom edge on a phone, so a long form
 * never sends the admin back up to the header to save. Hidden from `sm`,
 * where the header actions are within reach.
 */
export function StickyActions({ children }: { children: ReactNode }) {
  return <div className="shop-sticky">{children}</div>
}

/** Section label above a group of rows or tiles. */
export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="shop-header" style={{ minHeight: 0 }}>
      <div className="shop-header-copy">
        <Text as="h2" size="sm">
          {title}
        </Text>
        {hint ? (
          <Text as="p" size="xs" tone="muted">
            {hint}
          </Text>
        ) : null}
      </div>
    </div>
  )
}
