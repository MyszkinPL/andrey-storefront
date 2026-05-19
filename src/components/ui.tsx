import {
  Avatar as TgAvatar,
  Badge as TgBadge,
  Button as TgButton,
  type ButtonProps as TgButtonProps,
  Cell,
  Input as TgInput,
  type InputProps as TgInputProps,
  List,
  Placeholder,
  Section,
  Switch as TgSwitch,
  Textarea as TgTextarea,
  type TextareaProps as TgTextareaProps,
} from "@telegram-apps/telegram-ui"
import type { ComponentProps } from "react"

import { cn } from "@/lib/cn"

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <Section className={cn(className)} {...props} />
}

export { Cell, List, Placeholder }

export function Button({
  className,
  variant = "primary",
  ...props
}: TgButtonProps & {
  variant?: "primary" | "secondary" | "ghost" | "danger"
}) {
  return (
    <TgButton
      mode={
        variant === "primary"
          ? "filled"
          : variant === "secondary"
            ? "bezeled"
            : variant === "ghost"
              ? "plain"
              : "outline"
      }
      size="l"
      className={cn(className)}
      {...props}
    />
  )
}

export function Input(props: TgInputProps) {
  return <TgInput {...props} className={cn(props.className)} />
}

export function Textarea(props: TgTextareaProps) {
  return <TgTextarea {...props} className={cn(props.className)} />
}

export function Switch(props: ComponentProps<typeof TgSwitch>) {
  return <TgSwitch {...props} className={cn(props.className)} />
}

export function Avatar(props: ComponentProps<typeof TgAvatar>) {
  return <TgAvatar {...props} className={cn(props.className)} />
}

export function Badge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <TgBadge type="number" mode="secondary" className={cn(className)}>
      {children}
    </TgBadge>
  )
}
