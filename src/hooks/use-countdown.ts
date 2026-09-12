"use client"

import { useSyncExternalStore } from "react"

import { remainingMs } from "@/lib/order-timer"

/**
 * The wall clock, ticking once a second, as an external store. Rounded to
 * whole seconds so two reads inside one render agree with each other.
 */
function subscribeToClock(onTick: () => void) {
  const timer = window.setInterval(onTick, 1000)
  return () => window.clearInterval(timer)
}

function subscribeToNothing() {
  return () => {}
}

function readClock() {
  return Math.floor(Date.now() / 1000)
}

/**
 * Milliseconds left until `expiresAt`, re-evaluated every second while there
 * is a deadline to count down to. Returns null when there is none. The clock
 * only ticks for components that actually have a deadline, so a list of
 * finished orders costs nothing.
 */
export function useCountdown(expiresAt: string | null | undefined) {
  const nowSeconds = useSyncExternalStore(
    expiresAt ? subscribeToClock : subscribeToNothing,
    readClock,
    readClock,
  )

  if (!expiresAt) return null
  return remainingMs(expiresAt, new Date(nowSeconds * 1000))
}
