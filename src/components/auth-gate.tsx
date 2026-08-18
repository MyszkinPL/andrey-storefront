"use client"

import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { useTranslate } from "@/components/i18n-provider"
import { ApiError, authenticateWithTelegram, getMe } from "@/lib/api"
import { useTelegram } from "@/hooks/use-telegram"
import { isLocalMockApiEnabled } from "@/lib/mock-api"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const t = useTranslate()
  const { ready, initData, isTelegram } = useTelegram()
  const [state, setState] = useState<"loading" | "ok" | "outside" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return

    let cancelled = false

    async function loadMe() {
      try {
        await getMe()
        if (!cancelled) setState("ok")
        return 200
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          if (!cancelled) {
            setError(err.message || t("auth.restrictedTitle"))
            setState("error")
          }
          return err.status
        }

        return err instanceof ApiError ? err.status : 500
      }
    }

    async function authenticateAndLoad(initDataValue: string, dev = false) {
      await authenticateWithTelegram(initDataValue, dev)
      const status = await loadMe()
      if (status !== 200 && status !== 403 && !cancelled) setState("outside")
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
            setError(err instanceof Error ? err.message : t("auth.failed"))
            setState("error")
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [initData, isTelegram, ready, t])

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
        title={t("auth.outsideTitle")}
        description={t("auth.outsideDescription")}
        icon={<LoaderCircle />}
      />
    )
  }

  if (state === "error") {
    return <AccessStateScreen title={t("auth.restrictedTitle")} description={error} />
  }

  return <>{children}</>
}
