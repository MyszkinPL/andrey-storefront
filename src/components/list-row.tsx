"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Text } from "sealui"

/**
 * Every list in the app is the same flat stack of rows with hairlines
 * between them, straight on the page. A bordered panel around each list
 * was one frame too many inside a phone screen.
 */
export function ListGroup({ children }: { children: ReactNode }) {
  return <div className="shop-list">{children}</div>
}

export function ListRow({
  href,
  media,
  mediaBox = false,
  title,
  description,
  trailing,
  onClick,
}: {
  href?: string
  /** An icon, avatar or image at the start of the row. */
  media?: ReactNode
  /** Put the media in a 48px rounded tile: covers and rank numbers. */
  mediaBox?: boolean
  title: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <>
      {media ? (
        <span className={mediaBox ? "shop-item-media" : "shop-item-icon"}>{media}</span>
      ) : null}
      <span className="shop-item-copy">
        <Text as="span" size="sm" truncate>
          {title}
        </Text>
        {description ? (
          <Text as="span" size="xs" tone="muted" truncate>
            {description}
          </Text>
        ) : null}
      </span>
      {trailing ? <span className="shop-item-side">{trailing}</span> : null}
    </>
  )

  if (href) {
    return (
      <Link className="shop-item" href={href}>
        {body}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className="shop-item" onClick={onClick} type="button">
        {body}
      </button>
    )
  }

  return (
    <div className="shop-item" data-static="">
      {body}
    </div>
  )
}

/** Rows that stack two per line from `lg`. */
export function ListColumns({ children }: { children: ReactNode }) {
  return <div className="shop-two-col">{children}</div>
}

/**
 * Loading placeholder shaped like the rows it replaces, so the layout does
 * not jump once data lands.
 */
export function ListSkeleton({ rows = 4, media = true }: { rows?: number; media?: boolean }) {
  return (
    <div aria-hidden="true" className="shop-list">
      {Array.from({ length: rows }, (_, index) => (
        <div className="shop-item" data-static="" key={index}>
          {media ? <span className="shop-item-media" /> : null}
          <span className="shop-item-copy">
            <Text as="span" loading placeholderText="Loading a product name" size="sm" />
            <Text as="span" loading placeholderText="and a line of detail" size="xs" />
          </span>
        </div>
      ))}
    </div>
  )
}
