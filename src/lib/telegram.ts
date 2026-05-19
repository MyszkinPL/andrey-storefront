import { isTMA, retrieveRawInitData } from "@tma.js/sdk"
import type { User } from "@tma.js/types"

export type WebAppUser = User

export function isInTelegram() {
  try {
    return isTMA()
  } catch {
    return false
  }
}

export function getRawInitData() {
  try {
    return retrieveRawInitData()
  } catch {
    return ""
  }
}
