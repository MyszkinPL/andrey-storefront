"use client"

import { useEffect, useState } from "react"
import { Placeholder, Spinner } from "@telegram-apps/telegram-ui"

import { authenticateWithTelegram } from "@/lib/api"
import { useTelegram } from "@/hooks/use-telegram"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, initData, isTelegram } = useTelegram()
  const [state, setState] = useState<"loading" | "ok" | "outside" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return

    fetch("/api/me", { credentials: "include" }).then((response) => {
      if (response.ok) {
        setState("ok")
        return
      }

      if (!isTelegram) {
        if (process.env.NEXT_PUBLIC_ALLOW_DEV_AUTH === "true") {
          authenticateWithTelegram("", true)
            .then(() => setState("ok"))
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : "Dev auth failed")
              setState("error")
            })
          return
        }

        setState("outside")
        return
      }

      authenticateWithTelegram(initData)
        .then(() => setState("ok"))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Auth failed")
          setState("error")
        })
    })
  }, [initData, isTelegram, ready])

  if (state === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size="m" />
      </div>
    )
  }

  if (state === "outside") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <Placeholder
          header="Открой магазин из Telegram"
          description="Авторизация идёт через Telegram initData. Для локальной разработки можно включить dev auth."
        />
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <p className="text-base font-medium text-[var(--color-destructive)]">{error}</p>
      </div>
    )
  }

  return <>{children}</>
}
