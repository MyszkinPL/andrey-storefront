"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { I18nProvider } from "@/components/i18n-provider"
import { TelegramProvider } from "@/components/telegram-provider"
import { ToastProvider } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <TelegramProvider>
        <I18nProvider>
          {/* Bottom-centre keeps toasts clear of the desktop rail and within
              thumb reach on a phone. */}
          <ToastProvider position="bottom-center">{children}</ToastProvider>
        </I18nProvider>
      </TelegramProvider>
    </QueryClientProvider>
  )
}
