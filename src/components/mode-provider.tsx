"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { getMe } from "@/lib/api"

type Mode = "buyer" | "admin"

type ModeContextValue = {
  mode: Mode
  setMode: (mode: Mode) => void
  canAdmin: boolean
  canSwitch: boolean
}

const ModeContext = createContext<ModeContextValue | null>(null)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("buyer")
  const [canAdmin, setCanAdmin] = useState(false)

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        const admin = user.role === "ADMIN"
        setCanAdmin(admin)
        if (!admin) {
          setMode("buyer")
          return
        }
        const stored = window.localStorage.getItem("andrey_mode")
        setMode(stored === "admin" ? "admin" : "buyer")
      })
      .catch(() => {})
  }, [])

  const value = useMemo(
    () => ({
      mode,
      setMode: (nextMode: Mode) => {
        if (nextMode === "admin" && !canAdmin) return
        setMode(nextMode)
        window.localStorage.setItem("andrey_mode", nextMode)
      },
      canAdmin,
      canSwitch: canAdmin,
    }),
    [canAdmin, mode],
  )

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

export function useMode() {
  const context = useContext(ModeContext)
  if (!context) throw new Error("ModeProvider is missing")
  return context
}
