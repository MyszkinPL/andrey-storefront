"use client"

import type { ReactNode } from "react"
import { Switch, Text } from "sealui"

/** A switch with its caption in one row: no card around a single control. */
export function ToggleRow({
  id,
  title,
  hint,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string
  title: ReactNode
  hint?: ReactNode
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="shop-toggle">
      <label className="shop-row-copy" htmlFor={id}>
        <Text as="span" size="sm">
          {title}
        </Text>
        {hint ? (
          <Text as="span" size="xs" tone="muted">
            {hint}
          </Text>
        ) : null}
      </label>
      <Switch checked={checked} disabled={disabled} id={id} onCheckedChange={onCheckedChange} />
    </div>
  )
}
