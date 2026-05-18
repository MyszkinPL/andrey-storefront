export type WebAppUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export type WebAppThemeParams = {
  bg_color?: string
  text_color?: string
  hint_color?: string
  link_color?: string
  button_color?: string
  button_text_color?: string
  secondary_bg_color?: string
  header_bg_color?: string
  accent_text_color?: string
  section_bg_color?: string
  section_header_text_color?: string
  subtitle_text_color?: string
  destructive_text_color?: string
}

export type WebAppInitData = {
  user?: WebAppUser
  auth_date?: number
  hash?: string
  start_param?: string
}

type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft"
type HapticNotificationType = "error" | "success" | "warning"

export type TelegramWebApp = {
  initData: string
  initDataUnsafe: WebAppInitData
  version: string
  platform: string
  colorScheme: "light" | "dark"
  themeParams: WebAppThemeParams
  ready: () => void
  expand: () => void
  close: () => void
  setHeaderColor: (color: string | "bg_color" | "secondary_bg_color") => void
  setBackgroundColor: (color: string | "bg_color" | "secondary_bg_color") => void
  showAlert: (message: string, cb?: () => void) => void
  showConfirm: (message: string, cb: (ok: boolean) => void) => void
  disableVerticalSwipes?: () => void
  MainButton: {
    setText: (text: string) => void
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
    show: () => void
    hide: () => void
    hideProgress: () => void
    showProgress: (leaveActive?: boolean) => void
    setParams: (params: {
      text?: string
      color?: string
      text_color?: string
      is_active?: boolean
      is_visible?: boolean
    }) => void
  }
  BackButton: {
    onClick: (cb: () => void) => void
    offClick: (cb: () => void) => void
    show: () => void
    hide: () => void
  }
  HapticFeedback: {
    impactOccurred: (style: HapticImpactStyle) => void
    notificationOccurred: (type: HapticNotificationType) => void
    selectionChanged: () => void
  }
  onEvent: (event: string, cb: (...args: unknown[]) => void) => void
  offEvent: (event: string, cb: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null
  return window.Telegram?.WebApp ?? null
}

export function applyTelegramTheme(params: WebAppThemeParams) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  const set = (key: string, value: string | undefined) => {
    if (value) root.style.setProperty(key, value)
  }

  set("--tg-bg-color", params.bg_color)
  set("--tg-text-color", params.text_color)
  set("--tg-hint-color", params.hint_color)
  set("--tg-link-color", params.link_color)
  set("--tg-button-color", params.button_color)
  set("--tg-button-text-color", params.button_text_color)
  set("--tg-secondary-bg-color", params.secondary_bg_color)
  set("--tg-header-bg-color", params.header_bg_color)
  set("--tg-accent-text-color", params.accent_text_color)
  set("--tg-section-bg-color", params.section_bg_color)
  set("--tg-section-header-text-color", params.section_header_text_color)
  set("--tg-subtitle-text-color", params.subtitle_text_color)
  set("--tg-destructive-text-color", params.destructive_text_color)
}

export function isInTelegram() {
  return getWebApp() !== null
}
