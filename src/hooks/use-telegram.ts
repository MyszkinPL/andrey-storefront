"use client"

import { useEffect, useMemo, useRef } from "react"
import { backButton, hapticFeedback, mainButton } from "@tma.js/sdk-react"
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

export function useMainButton(config: {
  text: string
  onClick: () => void
  visible?: boolean
  enabled?: boolean
  progress?: boolean
}) {
  const latestOnClick = useRef(config.onClick)

  useEffect(() => {
    latestOnClick.current = config.onClick
  }, [config.onClick])

  useEffect(() => {
    const handler = () => latestOnClick.current()

    if (!config.visible) {
      if (mainButton.hide.isAvailable()) {
        mainButton.hide()
      }
      if (mainButton.hideLoader.isAvailable()) {
        mainButton.hideLoader()
      }
      return
    }

    if (mainButton.setText.isAvailable()) {
      mainButton.setText(config.text)
    }
    if (mainButton.setParams.isAvailable()) {
      mainButton.setParams({
        isVisible: config.visible ?? true,
        isEnabled: config.enabled ?? true,
      })
    }
    if (config.progress) {
      if (mainButton.showLoader.isAvailable()) {
        mainButton.showLoader()
      }
    } else if (mainButton.hideLoader.isAvailable()) {
      mainButton.hideLoader()
    }
    if (mainButton.show.isAvailable()) {
      mainButton.show()
    }
    if (mainButton.onClick.isAvailable()) {
      mainButton.onClick(handler)
    }

    return () => {
      try {
        if (mainButton.offClick.isAvailable()) {
          mainButton.offClick(handler)
        }
      } catch {}
      if (mainButton.hide.isAvailable()) {
        mainButton.hide()
      }
      if (mainButton.hideLoader.isAvailable()) {
        mainButton.hideLoader()
      }
    }
  }, [config.enabled, config.progress, config.text, config.visible])
}

export function useBackButton(onClick: () => void, visible = true) {
  const latestOnClick = useRef(onClick)

  useEffect(() => {
    latestOnClick.current = onClick
  }, [onClick])

  useEffect(() => {
    const handler = () => latestOnClick.current()

    if (visible) {
      if (backButton.show.isAvailable()) {
        backButton.show()
      }
    } else if (backButton.hide.isAvailable()) {
      backButton.hide()
    }
    if (backButton.onClick.isAvailable()) {
      backButton.onClick(handler)
    }

    return () => {
      try {
        if (backButton.offClick.isAvailable()) {
          backButton.offClick(handler)
        }
      } catch {}
      if (backButton.hide.isAvailable()) {
        backButton.hide()
      }
    }
  }, [visible])
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
