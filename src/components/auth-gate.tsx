"use client"

import { useEffect, useState } from "react"
import { LoaderCircle } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
import { useTranslate } from "@/components/i18n-provider"
import { ApiError, authenticateWithTelegram, getMe } from "@/lib/api"
import { useTelegram } from "@/hooks/use-telegram"

export function AuthGate({ children }: { children: React.ReactNode }) {
  const t = useTranslate()
  const { ready, initData, isTelegram } = useTelegram()
  const [state, setState] = useState<"loading" | "ok" | "outside" | "error">("loading")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return

    let cancelled = false

    async function fetchMe() {
      try {
        await getMe()
        return { status: 200, message: "", code: "" }
      } catch (err) {
        if (err instanceof ApiError) {
          return { status: err.status, message: err.message, code: err.code }
        }
        return { status: 500, message: "", code: "" }
      }
    }

    function settle(result: { status: number; message: string; code: string }) {
      if (cancelled) return
      if (result.status === 200) {
        setState("ok")
        return
      }
      if (result.status === 403) {
        setError(result.message || t("auth.restrictedTitle"))
        setState("error")
        return
      }
      setState("outside")
    }

    async function run() {
      const first = await fetchMe()
      if (first.status === 200) {
        settle(first)
        return
      }

      // A stale session reports USERNAME_REQUIRED for a username the user has
      // since added, because the Telegram profile only reaches the server
      // through initData. That one code is worth re-authenticating for; a ban
      // is final and needs no retry.
      if (first.code === "BANNED") {
        settle(first)
        return
      }

      try {
        await authenticateWithTelegram(isTelegram ? initData : "", !isTelegram)
      } catch (err) {
        if (first.status === 403) {
          settle(first)
          return
        }
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("auth.failed"))
          setState(isTelegram ? "error" : "outside")
        }
        return
      }

      settle(await fetchMe())
    }

    void run()

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
