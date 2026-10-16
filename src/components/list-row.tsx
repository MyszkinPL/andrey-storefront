"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { List, ListItem, Text } from "sealui"

/**
 * List rows across the app are the same shape: optional media, a title with
 * one line of detail, and something trailing. Built on sealui's List panel,
 * so every list shares the design system's border, radius and dividers.
 */
export function ListGroup({ children }: { children: ReactNode }) {
  return (
    <List size="small">
      {children}
    </List>
  )
}

export function ListRow({
  href,
  media,
  title,
  description,
  trailing,
  onClick,
}: {
  href?: string
  media?: ReactNode
  title: ReactNode
  description?: ReactNode
  trailing?: ReactNode
  onClick?: () => void
}) {
  const body = (
    <div className="shop-row">
      {media ? <div className="shop-row-media">{media}</div> : null}
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
        <ListItem size="small" onSelect={() => undefined}>
          {body}
        </ListItem>
      </Link>
    )
  }

  if (onClick) {
    return (
      <ListItem size="small" onSelect={onClick}>
        {body}
      </ListItem>
    )
  }

  return <ListItem size="small">{body}</ListItem>
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
      <List size="small">
        {Array.from({ length: rows }, (_, index) => (
          <ListItem key={index} size="small">
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
