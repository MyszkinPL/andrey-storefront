"use client"

import { usePathname, useRouter } from "next/navigation"
import { SegmentedControl } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { useMode } from "@/components/mode-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { resolveModePath } from "@/lib/navigation"

/**
 * Buyer / admin toggle: a sealui segmented control in its full-width
 * "tabs" variant. It changes which app you are in, so the route follows.
 *
 * `page`: sits above a phone screen inside the screen gutters. `rail`:
 * lives inside the desktop side panel, which has its own padding.
 */
export function ModeSwitcher({ variant = "page" }: { variant?: "page" | "rail" }) {
  const { mode, setMode, canSwitch } = useMode()
  const t = useTranslate()
  const haptic = useHaptic()
  const router = useRouter()
  const pathname = usePathname()

  if (!canSwitch) return null

  const control = (
    <SegmentedControl
      aria-label={t("mode.label")}
      onValueChange={(value) => {
        if (value !== "buyer" && value !== "admin") return
        if (value === mode) return
        haptic.select()
        setMode(value)
        router.replace(resolveModePath(pathname, value))
      }}
      options={[
        { value: "buyer", label: t("mode.buyer") },
        { value: "admin", label: t("mode.admin") },
      ]}
      size="md"
      value={mode}
      variant="tabs"
    />
  )

  if (variant === "rail") return control

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "var(--shop-max-width)",
        marginInline: "auto",
        padding: "var(--seal-space-3) var(--shop-gutter) 0",
        boxSizing: "border-box",
      }}
    >
      {control}
    </div>
  )
}
