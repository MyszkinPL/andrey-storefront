"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { useHaptic } from "@/hooks/use-telegram"

/**
 * In-app back control. Screens without the tab bar used to rely on
 * Telegram's own header arrow, which meant navigation lived outside the
 * interface and looked nothing like the rest of it.
 */
export function BackButton({ href }: { href?: string }) {
  const router = useRouter()
  const t = useTranslate()
  const haptic = useHaptic()

  return (
    <Button
      aria-label={t("common.back")}
      onClick={() => {
        haptic.select()
        if (href) router.push(href)
        else router.back()
      }}
      size="icon"
      variant="ghost"
    >
      <ArrowLeft size={20} aria-hidden />
    </Button>
  )
}
