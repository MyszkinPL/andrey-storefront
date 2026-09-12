"use client"

import {
  init,
  isTMA,
  miniApp,
  swipeBehavior,
  themeParams,
  viewport,
} from "@tma.js/sdk-react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type TelegramContextValue = {
  ready: boolean
  isTelegram: boolean
}

/** Hex twins of --background in globals.css; Telegram only takes hex. */
const APP_BACKGROUND = {
  dark: "#0a0a0a",
  light: "#ffffff",
} as const

const TelegramContext = createContext<TelegramContextValue>({
  ready: false,
  isTelegram: false,
})

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const telegram = isTMA()
    const cleanup = telegram ? init() : () => {}

    try {
      if (telegram && themeParams.mount.isAvailable()) {
        themeParams.mount()
      }

      if (telegram && miniApp.mount.isAvailable()) {
        miniApp.mount()
      }

      if (telegram && swipeBehavior.mount.isAvailable()) {
        swipeBehavior.mount()
      }

      if (telegram && viewport.mount.isAvailable()) {
        viewport.mount().catch(() => {})
      }

      // Always dark. Following Telegram's theme meant a light-theme user got
      // a white app under a dark logo and a dark Telegram header — the
      // "background is not fixed" complaint. One palette, everywhere.
      const isDark = true
      document.documentElement.classList.add("dark")

      if (telegram) {
        if (miniApp.ready.isAvailable()) {
          miniApp.ready()
        }
        if (viewport.expand.isAvailable()) {
          viewport.expand()
        }
        // Telegram paints its own header, bottom bar and overscroll areas.
        // Asking for its "bg_color" gave those areas Telegram's theme colour,
        // a visibly different grey from the app's --background, so the page
        // looked like a card floating on a mismatched backdrop. The exact
        // page colour keeps everything one surface.
        const pageColor = isDark ? APP_BACKGROUND.dark : APP_BACKGROUND.light
        if (miniApp.setBgColor.isAvailable()) {
          miniApp.setBgColor(pageColor)
        }
        if (miniApp.setHeaderColor.isAvailable()) {
          miniApp.setHeaderColor(pageColor)
        }
        if (miniApp.setBottomBarColor.isAvailable()) {
          miniApp.setBottomBarColor(pageColor)
        }
        if (swipeBehavior.disableVertical.isAvailable()) {
          swipeBehavior.disableVertical()
        }
      }
    } finally {
      setReady(true)
    }

    return () => {
      cleanup()
    }
  }, [])

  const value = useMemo(
    () => ({
      ready,
      isTelegram: typeof window !== "undefined" ? isTMA() : false,
    }),
    [ready],
  )

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegramContext() {
  return useContext(TelegramContext)
}
