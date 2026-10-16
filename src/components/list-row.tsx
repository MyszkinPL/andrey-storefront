"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { List, ListItem, Text } from "sealui"

/**
 * List rows across the app are the same shape: optional media, a title with
 * one line of detail, and something trailing. Built on sealui's List panel
 * at its default size (16/24 padding, 32px radius), so lists read exactly
 * like Polar's.
 */
export function ListGroup({ children }: { children: ReactNode }) {
  return <List>{children}</List>
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
  /** Wrap the media in a 40px rounded box: for images and rank numbers. */
  mediaBox?: boolean
  title: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <div className="shop-row">
      {media ? (
        mediaBox ? (
          <div className="shop-row-media">{media}</div>
        ) : (
          <div className="shop-row-icon">{media}</div>
        )
      ) : null}
      <div className="shop-row-copy">
        <Text as="span" size="sm" truncate>
          {title}
        </Text>
        {description ? (
          <Text as="span" size="xs" tone="muted" truncate>
            {description}
          </Text>
        ) : null}
      </div>
      {trailing ? <div className="shop-row-trailing">{trailing}</div> : null}
    </div>
  )

  if (href) {
    return (
      <Link className="shop-link" href={href}>
        <ListItem onSelect={() => undefined}>{body}</ListItem>
      </Link>
    )
  }

  if (onClick) {
    return <ListItem onSelect={onClick}>{body}</ListItem>
  }

  return <ListItem>{body}</ListItem>
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
    <div aria-hidden="true">
      <List>
        {Array.from({ length: rows }, (_, index) => (
          <ListItem key={index}>
            <div className="shop-row">
              {media ? <div className="shop-row-media" /> : null}
              <div className="shop-row-copy">
                <Text as="span" loading placeholderText="Loading a product name" size="sm" />
                <Text as="span" loading placeholderText="and a line of detail" size="xs" />
              </div>
            </div>
          </ListItem>
        ))}
      </List>
    </div>
  )
}
