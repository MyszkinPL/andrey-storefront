"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { useTranslate } from "@/components/i18n-provider"
import { Button } from "@/components/ui/button"
import { useHaptic } from "@/hooks/use-telegram"

/**
 * In-app back control. Screens without the tab bar used to rely on Telegram's
 * own header arrow, which meant navigation lived outside the interface and
 * looked nothing like the rest of it.
 */
export function BackButton({
  className,
  href,
}: {
  className?: string
  /** Where to go; defaults to the previous entry in history. */
  href?: string
}) {
  const router = useRouter()
  const t = useTranslate()
  const haptic = useHaptic()

  return (
    <Button
      aria-label={t("common.back")}
      className={className}
      onClick={() => {
        haptic.select()
        if (href) router.push(href)
        else router.back()
      }}
      size="icon-lg"
      type="button"
      variant="ghost"
    >
      <ArrowLeft />
    </Button>
  )
}
