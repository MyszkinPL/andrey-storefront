import type { Metadata, Viewport } from "next"
import Script from "next/script"

import { AppShell } from "@/components/app-shell"
import { AuthGate } from "@/components/auth-gate"
import { BottomTabs } from "@/components/bottom-tabs"
import { ModeProvider } from "@/components/mode-provider"
import { ModeSwitcher } from "@/components/mode-switcher"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "snx.sell",
  description: "Telegram + desktop storefront for software subscriptions",
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
    <html lang="ru">
      <body className="min-h-dvh">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <AuthGate>
            <ModeProvider>
              <AppShell>
                <ModeSwitcher />
                {children}
                <BottomTabs />
              </AppShell>
            </ModeProvider>
          </AuthGate>
        </Providers>
      </body>
    </html>
  )
}
