"use client"

import { useEffect, useRef, useState } from "react"

import { applyTelegramTheme, getWebApp } from "@/lib/telegram"

export function useTelegram() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const webApp = getWebApp()
    if (!webApp) {
      queueMicrotask(() => setReady(true))
      return
    }

    try {
      webApp.ready()
      webApp.expand()
      webApp.setBackgroundColor("bg_color")
      webApp.setHeaderColor("bg_color")
      webApp.disableVerticalSwipes?.()
    } catch {}

    applyTelegramTheme(webApp.themeParams)
    const onTheme = () => applyTelegramTheme(webApp.themeParams)
    webApp.onEvent("themeChanged", onTheme)
    queueMicrotask(() => setReady(true))

    return () => {
      try {
        webApp.offEvent("themeChanged", onTheme)
      } catch {}
    }
  }, [])

  const webApp = getWebApp()
  return { webApp, ready, user: webApp?.initDataUnsafe.user ?? null }
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
    const webApp = getWebApp()
    if (!webApp) return
    const button = webApp.MainButton
    const handler = () => latestOnClick.current()

    if (!config.visible) {
      button.hide()
      button.hideProgress()
      return
    }

    button.setText(config.text)
    button.setParams({
      is_visible: config.visible ?? true,
      is_active: config.enabled ?? true,
    })
    if (config.progress) button.showProgress(false)
    else button.hideProgress()
    button.show()
    button.onClick(handler)

    return () => {
      try {
        button.offClick(handler)
      } catch {}
      button.hide()
      button.hideProgress()
    }
  }, [config.enabled, config.progress, config.text, config.visible])
}

export function useBackButton(onClick: () => void, visible = true) {
  const latestOnClick = useRef(onClick)

  useEffect(() => {
    latestOnClick.current = onClick
  }, [onClick])

  useEffect(() => {
    const webApp = getWebApp()
    if (!webApp) return
    const handler = () => latestOnClick.current()

    if (visible) webApp.BackButton.show()
    else webApp.BackButton.hide()
    webApp.BackButton.onClick(handler)

    return () => {
      try {
        webApp.BackButton.offClick(handler)
      } catch {}
      webApp.BackButton.hide()
    }
  }, [visible])
}

export function useHaptic() {
  return {
    select: () => {
      try {
        getWebApp()?.HapticFeedback.selectionChanged()
      } catch {}
    },
    success: () => {
      try {
        getWebApp()?.HapticFeedback.notificationOccurred("success")
      } catch {}
    },
  }
}
