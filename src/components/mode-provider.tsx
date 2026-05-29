"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

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
  const pathname = usePathname()
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

  const effectiveMode = resolveRouteMode(pathname, mode, canAdmin)

  const value = useMemo(
    () => ({
      mode: effectiveMode,
      setMode: (nextMode: Mode) => {
        if (nextMode === "admin" && !canAdmin) return
        setMode(nextMode)
        window.localStorage.setItem("andrey_mode", nextMode)
      },
      canAdmin,
      canSwitch: canAdmin,
    }),
    [canAdmin, effectiveMode],
  )

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>
}

function resolveRouteMode(pathname: string, storedMode: Mode, canAdmin: boolean): Mode {
  if (!canAdmin) return "buyer"
  if (pathname.startsWith("/admin")) return "admin"
  if (
    pathname === "/catalog" ||
    pathname === "/orders" ||
    pathname === "/profile" ||
    pathname.startsWith("/product/")
  ) {
    return "buyer"
  }
  return storedMode
}

export function useMode() {
  const context = useContext(ModeContext)
  if (!context) throw new Error("ModeProvider is missing")
  return context
}
