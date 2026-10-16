"use client"

const STORAGE_KEY = "andrey_order_instructions_dismissed"

/** The buyer asked not to see the how-to-pay steps again. */
export function areOrderInstructionsDismissed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

export function dismissOrderInstructions() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1")
  } catch {}
}
