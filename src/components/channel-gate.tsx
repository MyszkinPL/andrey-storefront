"use client"

import { usePathname } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Megaphone } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { useTranslate } from "@/components/i18n-provider"
import { useNotify } from "@/hooks/use-notify"
import { getMe } from "@/lib/api"
import { isChannelGatedRoute } from "@/lib/navigation"

/**
 * Holds the shop shut while the buyer is missing the channel subscription the
 * admin asked for. The check itself is the server's: `/api/me` only reports a
 * gate when Telegram says the person is not in the channel, and admins never
 * get one, so nobody can lock themselves out of their own shop.
 */
export function ChannelGate({ children }: { children: React.ReactNode }) {
  const t = useTranslate()
  const notify = useNotify()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { data, isFetching } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const gate = data?.channelGate

  if (!gate || !isChannelGatedRoute(pathname)) return <>{children}</>

  async function recheck() {
    const fresh = await queryClient.fetchQuery({ queryKey: ["me"], queryFn: getMe })
    if (fresh.channelGate) notify.success("channelGate.stillMissing")
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-6">
      <Card className="w-full">
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">
              <Megaphone />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t("channelGate.title")}</EmptyTitle>
              <EmptyDescription>
                {t("channelGate.description", { channel: gate.username })}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="w-full gap-2">
              <a
                className={buttonVariants({ className: "w-full" })}
                href={gate.url}
                rel="noreferrer"
                target="_blank"
              >
                {t("channelGate.open")}
              </a>
              <Button
                className="w-full"
                disabled={isFetching}
                onClick={() => void recheck()}
                variant="outline"
              >
                {t("channelGate.recheck")}
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </main>
  )
}
