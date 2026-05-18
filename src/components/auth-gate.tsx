"use client"

import { useEffect, useState } from "react"

import { authenticateWithTelegram } from "@/lib/api"
import { isInTelegram } from "@/lib/telegram"
import { useTelegram } from "@/hooks/use-telegram"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, webApp } = useTelegram()
  const [state, setState] = useState<"loading" | "ok" | "outside" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return

    fetch("/api/me", { credentials: "include" }).then((response) => {
      if (response.ok) {
        setState("ok")
        return
      }

      if (!isInTelegram()) {
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

      authenticateWithTelegram(webApp?.initData || "")
        .then(() => setState("ok"))
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : "Auth failed")
          setState("error")
        })
    })
  }, [ready, webApp])

  if (state === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
      </div>
    )
  }

  if (state === "outside") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6 text-center">
        <div className="glass-card rounded-[28px] px-6 py-5">
          <p className="text-lg font-semibold">Открой магазин из Telegram</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Авторизация идёт через Telegram `initData`. Для локальной разработки можно включить dev auth.
          </p>
        </div>
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
