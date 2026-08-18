import Link from "next/link"

import {
  Frame,
  FrameDescription,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import { cn } from "@/lib/utils"

/**
 * List rows across the app are the same shape — optional media, a title with
 * one or two lines of detail, and something trailing. Composed from coss's
 * Frame primitives so every list shares the design system's panel styling.
 */
export function ListGroup({
  className,
  ...props
}: React.ComponentProps<typeof Frame>) {
  return <Frame className={cn("gap-1", className)} {...props} />
}

export function ListRow({
  href,
  media,
  title,
  description,
  trailing,
  className,
  onClick,
}: {
  href?: string
  media?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  trailing?: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const panel = (
    <FramePanel
      className={cn(
        "flex h-full items-center gap-3 p-3",
        (href || onClick) && "transition-colors hover:bg-accent/40",
        className,
      )}
    >
      {media ? <div className="shrink-0">{media}</div> : null}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <FrameTitle className="truncate">{title}</FrameTitle>
        {description ? (
          <FrameDescription className="truncate text-xs">
            {description}
          </FrameDescription>
        ) : null}
      </div>

      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </FramePanel>
  )

  if (href) {
    return (
      <Link className="block" href={href}>
        {panel}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className="block w-full text-left" onClick={onClick} type="button">
        {panel}
      </button>
    )
  }

  return panel
}

/** Square media box for thumbnails and icons inside a row. */
export function ListRowMedia({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
    >
      {children}
    </div>
  )
}
