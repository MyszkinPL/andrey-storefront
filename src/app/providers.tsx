"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

import { I18nProvider } from "@/components/i18n-provider"
import { TelegramProvider } from "@/components/telegram-provider"

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
        <I18nProvider>{children}</I18nProvider>
      </TelegramProvider>
    </QueryClientProvider>
  )
}
