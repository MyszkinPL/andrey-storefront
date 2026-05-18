import type { ComponentProps } from "react"

import { cn } from "@/lib/cn"

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass-card rounded-[24px] p-4", className)} {...props} />
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  return (
    <button
      className={cn(
        "rounded-2xl px-4 py-3 text-sm font-semibold transition-transform active:scale-[0.985] disabled:opacity-50",
        variant === "primary" && "bg-[var(--color-accent)] text-[var(--color-accent-text)]",
        variant === "secondary" &&
          "border border-white/8 bg-[var(--color-surface)] text-[var(--color-text)]",
        variant === "ghost" && "bg-transparent text-[var(--color-muted)]",
        variant === "danger" && "bg-[var(--color-destructive)] text-white",
        className,
      )}
      {...props}
    />
  )
}

export function Input(props: ComponentProps<"input">) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-2xl border border-white/8 bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]",
        props.className,
      )}
    />
  )
}

export function Textarea(props: ComponentProps<"textarea">) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-28 w-full rounded-2xl border border-white/8 bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]",
        props.className,
      )}
    />
  )
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/8 px-2.5 py-1 text-[11px] font-medium text-[var(--color-muted)]",
        className,
      )}
    >
      {children}
    </span>
  )
}
