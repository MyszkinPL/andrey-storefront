"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslate } from "@/components/i18n-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { getMe } from "@/lib/api"
import { cn } from "@/lib/utils"

/**
 * The account entry point. Profile used to occupy a third of the buyer tab
 * bar for two rows of settings; it lives on the avatar in the header instead,
 * which is where people already look for it.
 */
export function ProfileAvatarLink({ className }: { className?: string }) {
  const t = useTranslate()
  const haptic = useHaptic()
  const { data } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const name = data?.user.firstName || ""

  return (
    <Link
      aria-label={t("nav.profile")}
      className={cn(
        "-m-1 block rounded-full p-1 transition-colors hover:bg-accent/50",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        // Matches the 44px minimum coss gives buttons on touch.
        "pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2 pointer-coarse:after:content-['']",
        className,
      )}
      href="/profile"
      onClick={() => haptic.select()}
    >
      <Avatar className="size-10">
        {data?.user.photoUrl ? <AvatarImage alt={name} src={data.user.photoUrl} /> : null}
        <AvatarFallback>{(name || "S").slice(0, 1)}</AvatarFallback>
      </Avatar>
    </Link>
  )
}
