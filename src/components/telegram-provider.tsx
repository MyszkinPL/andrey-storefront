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

      if (telegram) {
        if (miniApp.ready.isAvailable()) {
          miniApp.ready()
        }
        if (viewport.expand.isAvailable()) {
          viewport.expand()
        }
        if (miniApp.setBgColor.isAvailable()) {
          miniApp.setBgColor("bg_color")
        }
        if (miniApp.setHeaderColor.isAvailable()) {
          miniApp.setHeaderColor("bg_color")
        }
        if (swipeBehavior.disableVertical.isAvailable()) {
          swipeBehavior.disableVertical()
        }
      }

      document.documentElement.classList.toggle("dark", !telegram || themeParams.isDark())
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
