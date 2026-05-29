import type { Metadata, Viewport } from "next"
import Script from "next/script"

import { AuthGate } from "@/components/auth-gate"
import { BottomTabs } from "@/components/bottom-tabs"
import { ModeProvider } from "@/components/mode-provider"
import { ModeSwitcher } from "@/components/mode-switcher"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "Store",
  description: "Telegram storefront for digital goods",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#17212b",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="min-h-dvh bg-[var(--tgui--bg_color)]">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <AuthGate>
            <ModeProvider>
              <ModeSwitcher />
              {children}
              <BottomTabs />
            </ModeProvider>
          </AuthGate>
        </Providers>
      </body>
    </html>
  )
}
