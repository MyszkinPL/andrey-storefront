"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Avatar } from "sealui"

import { useTranslate } from "@/components/i18n-provider"
import { useHaptic } from "@/hooks/use-telegram"
import { getMe } from "@/lib/api"

/**
 * The account entry point, on the avatar in the header, which is where
 * people already look for it.
 */
export function ProfileAvatarLink() {
  const t = useTranslate()
  const haptic = useHaptic()
  const { data } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const name = data?.user.firstName || ""

  return (
    <Link
      aria-label={t("nav.profile")}
      className="shop-link"
      data-rounded=""
      href="/profile"
      onClick={() => haptic.select()}
      style={{ borderRadius: "9999px", display: "inline-flex" }}
    >
      <Avatar name={name || "S"} size="lg" src={data?.user.photoUrl} />
    </Link>
  )
}
