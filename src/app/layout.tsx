import type { Metadata, Viewport } from "next"
import Script from "next/script"

import { AppShell } from "@/components/app-shell"
import { AuthGate } from "@/components/auth-gate"
import { ModeProvider } from "@/components/mode-provider"
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
    <html lang="ru" suppressHydrationWarning className="dark font-sans">
      <body className="min-h-dvh bg-background text-foreground">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Providers>
          <AuthGate>
            <ModeProvider>
              <AppShell>{children}</AppShell>
            </ModeProvider>
          </AuthGate>
        </Providers>
      </body>
    </html>
  )
}
