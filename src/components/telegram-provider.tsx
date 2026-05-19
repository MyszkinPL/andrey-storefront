"use client"

import "@telegram-apps/telegram-ui/dist/styles.css"

import { AppRoot } from "@telegram-apps/telegram-ui"
import {
  backButton,
  init,
  isTMA,
  mainButton,
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
  const [appearance, setAppearance] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const cleanup = init()
    const telegram = isTMA()

    try {
      if (themeParams.mount.isAvailable()) {
        themeParams.mount()
      }

      if (themeParams.bindCssVars.isAvailable()) {
        themeParams.bindCssVars((key) => `--tg-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`)
      }

      if (miniApp.mount.isAvailable()) {
        miniApp.mount()
      }

      if (backButton.mount.isAvailable()) {
        backButton.mount()
      }

      if (mainButton.mount.isAvailable()) {
        mainButton.mount()
      }

      if (swipeBehavior.mount.isAvailable()) {
        swipeBehavior.mount()
      }

      if (viewport.mount.isAvailable()) {
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

      if (themeParams.isDark()) {
        setAppearance("dark")
      } else {
        setAppearance("light")
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
      <AppRoot appearance={appearance} platform="base">
        {children}
      </AppRoot>
    </TelegramContext.Provider>
  )
}

export function useTelegramContext() {
  return useContext(TelegramContext)
}
