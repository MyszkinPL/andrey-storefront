import Link from "next/link"

import {
  Frame,
  FrameDescription,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame"
import { Skeleton } from "@/components/ui/skeleton"
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

/**
 * Loading placeholder shaped like the rows it replaces. Every list used to show
 * the same "nothing here" card while fetching, which reads as an empty result
 * and makes the layout jump once data lands.
 */
export function ListSkeleton({
  className,
  media = true,
  mediaClassName,
  rows = 4,
  trailing = true,
}: {
  className?: string
  media?: boolean
  /** Match the real row's media box so the layout does not jump. */
  mediaClassName?: string
  rows?: number
  trailing?: boolean
}) {
  // Fixed widths rather than random ones: a skeleton has to render the same on
  // the server and the client, and the variation only needs to look organic.
  const widths = ["w-2/5", "w-1/2", "w-1/3", "w-2/5", "w-5/12"]

  return (
    <ListGroup aria-hidden="true" className={className}>
      {Array.from({ length: rows }, (_, index) => (
        <FramePanel className="flex h-full items-center gap-3 p-3" key={index}>
          {media ? (
            <Skeleton className={cn("size-10 shrink-0 rounded-xl", mediaClassName)} />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className={cn("h-3.5 max-w-40", widths[index % widths.length])} />
            <Skeleton className="h-3 w-3/5 max-w-56" />
          </div>
          {trailing ? <Skeleton className="h-5 w-16 shrink-0 rounded-full" /> : null}
        </FramePanel>
      ))}
    </ListGroup>
  )
}
