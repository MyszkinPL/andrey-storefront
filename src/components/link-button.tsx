"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import type { ButtonSize, ButtonVariant } from "sealui"

/**
 * A Next.js link that looks exactly like a sealui Button.
 *
 * sealui's Button is sealed and renders a <button>, so a navigation that
 * should prefetch and open in a new tab needs its own anchor. The classes
 * are sealui's own, so any change to the button look carries over.
 */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  external = false,
  children,
  "aria-label": ariaLabel,
}: {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  icon?: ReactNode
  /** Opens in a new tab with the usual rel guard. */
  external?: boolean
  children: ReactNode
  "aria-label"?: string
}) {
  const body = (
    <>
      {icon ? <span className="seal-button-lead-icon">{icon}</span> : null}
      {children}
    </>
  )

  if (external) {
    return (
      <a
        aria-label={ariaLabel}
        className="seal-button"
        data-full-width={fullWidth ? "" : undefined}
        data-size={size}
        data-variant={variant}
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {body}
      </a>
    )
  }

  return (
    <Link
      aria-label={ariaLabel}
      className="seal-button"
      data-full-width={fullWidth ? "" : undefined}
      data-size={size}
      data-variant={variant}
      href={href}
    >
      {body}
    </Link>
  )
}
