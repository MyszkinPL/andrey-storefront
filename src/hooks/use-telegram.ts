"use client"

import { useMemo } from "react"
import { hapticFeedback } from "@tma.js/sdk-react"
import { retrieveLaunchParams } from "@tma.js/sdk"

import { useTelegramContext } from "@/components/telegram-provider"
import { getRawInitData } from "@/lib/telegram"

export function useTelegram() {
  const { ready, isTelegram } = useTelegramContext()
  const launch = useMemo(() => {
    if (!ready || !isTelegram || typeof window === "undefined") {
      return { startParam: null as string | null, user: null as Record<string, unknown> | null }
    }

    try {
      const launchParams = retrieveLaunchParams()
      return {
        startParam: launchParams.tgWebAppStartParam ?? null,
        user: launchParams.tgWebAppData?.user ?? null,
      }
    } catch {
      return { startParam: null as string | null, user: null as Record<string, unknown> | null }
    }
  }, [isTelegram, ready])

  return {
    ready,
    isTelegram,
    initData: isTelegram ? (getRawInitData() ?? "") : "",
    startParam: launch.startParam,
    user: launch.user,
  }
}


export function useHaptic() {
  return {
    select: () => {
      try {
        if (hapticFeedback.selectionChanged.isAvailable()) {
          hapticFeedback.selectionChanged()
        }
      } catch {}
    },
    success: () => {
      try {
        if (hapticFeedback.notificationOccurred.isAvailable()) {
          hapticFeedback.notificationOccurred("success")
        }
      } catch {}
    },
  }
}
