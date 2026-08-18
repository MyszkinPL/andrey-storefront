"use client"

import { useCallback } from "react"

import { useI18n } from "@/components/i18n-provider"
import { toastManager } from "@/components/ui/toast"
import { useHaptic } from "@/hooks/use-telegram"
import type { TranslationKey } from "@/lib/i18n"

/**
 * Confirmation for actions whose result is otherwise invisible — saving
 * settings, banning someone, deleting a product. Without it the screen simply
 * re-renders and the admin is left guessing whether anything happened.
 */
export function useNotify() {
  const { t } = useI18n()
  const haptic = useHaptic()

  const success = useCallback(
    (key: TranslationKey) => {
      haptic.success()
      toastManager.add({ title: t(key), type: "success" })
    },
    [haptic, t],
  )

  const failure = useCallback(
    (error: unknown) => {
      toastManager.add({
        description: error instanceof Error ? error.message : undefined,
        title: t("errors.generic"),
        type: "error",
      })
    },
    [t],
  )

  return { failure, success }
}
