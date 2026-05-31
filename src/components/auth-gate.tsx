"use client"

import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { authenticateWithTelegram } from "@/lib/api"
import { useTelegram } from "@/hooks/use-telegram"
import { isLocalMockApiEnabled } from "@/lib/mock-api"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, initData, isTelegram } = useTelegram()
  const [state, setState] = useState<"loading" | "ok" | "outside" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return

    let cancelled = false

    async function loadMe() {
      const response = await fetch("/api/me", { credentials: "include" })
      if (response.ok) {
        if (!cancelled) setState("ok")
        return response.status
      }

      if (response.status === 403) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        if (!cancelled) {
          setError(body?.error || "Доступ ограничен")
          setState("error")
        }
        return response.status
      }

      return response.status
    }

    async function authenticateAndLoad(initDataValue: string, dev = false) {
      await authenticateWithTelegram(initDataValue, dev)
      await loadMe()
    }

    if (!isTelegram && isLocalMockApiEnabled()) {
      authenticateAndLoad("", true)
        .catch(() => setState("outside"))
      return () => {
        cancelled = true
      }
    }

    loadMe().then((status) => {
      if (status === 200 || status === 403) {
        return
      }

      if (!isTelegram) {
        authenticateAndLoad("", true)
          .catch(() => setState("outside"))
        return
      }

      authenticateAndLoad(initData)
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Auth failed")
            setState("error")
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [initData, isTelegram, ready])

  if (state === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoaderCircle className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state === "outside") {
    return (
      <AccessStateScreen
        title="Открой магазин из Telegram"
        description="Авторизация идёт через Telegram initData. Для локальной разработки можно включить dev auth."
        icon={<LoaderCircle />}
      />
    )
  }

  if (state === "error") {
    return <AccessStateScreen title="Доступ ограничен" description={error} />
  }

  return <>{children}</>
}
