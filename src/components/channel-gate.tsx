"use client"

import { usePathname } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Megaphone } from "lucide-react"
import { EmptyState } from "sealui"

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
    <main className="shop-gate">
      <EmptyState
        actions={[
          { label: t("channelGate.open"), onClick: () => window.open(gate.url, "_blank", "noreferrer") },
          {
            label: t("channelGate.recheck"),
            onClick: () => void recheck(),
            variant: "outline",
            loading: isFetching,
          },
        ]}
        description={t("channelGate.description", { channel: gate.username })}
        icon={<Megaphone />}
        title={t("channelGate.title")}
      />
    </main>
  )
}
