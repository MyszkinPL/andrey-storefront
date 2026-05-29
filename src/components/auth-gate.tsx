"use client"

import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { authenticateWithTelegram } from "@/lib/api"
import { useTelegram } from "@/hooks/use-telegram"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, initData, isTelegram } = useTelegram()
  const [state, setState] = useState<"loading" | "ok" | "outside" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return

    fetch("/api/me", { credentials: "include" }).then(async (response) => {
      if (response.ok) {
        setState("ok")
        return
      }

      if (response.status === 403) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        setError(body?.error || "Доступ ограничен")
        setState("error")
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
        <LoaderCircle className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (state === "outside") {
    return (
      <AuthState
        title="Открой магазин из Telegram"
        description="Авторизация идёт через Telegram initData. Для локальной разработки можно включить dev auth."
      />
    )
  }

  if (state === "error") {
    return <AuthState title="Доступ ограничен" description={error} />
  }

  return <>{children}</>
}

function AuthState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Empty className="max-w-sm">
        <EmptyMedia variant="icon">
          <LoaderCircle />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
