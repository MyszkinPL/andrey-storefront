"use client"

import { FileCheck2, Paperclip } from "lucide-react"
import { Avatar, Pill } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ListGroup, ListRow } from "@/components/list-row"
import type { Order } from "@/components/order-detail/types"
import { Section } from "@/components/screen"
import { formatBytes } from "@/lib/telegram-format"

/**
 * What only an admin sees on an order: who is buying, and whether their
 * receipt arrived. The levers (confirm, reject, check) live in the bottom
 * bar with the rest of the primary actions.
 */
export function AdminOrderPanel({ order, showReceipt }: { order: Order; showReceipt: boolean }) {
  const { t, locale } = useI18n()
  const buyer = order.createdBy
  const receipt = order.receipt
  const uploadedAtLabel = receipt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(receipt.uploadedAt),
      )
    : ""

  if (!buyer && !showReceipt) return null

  return (
    <Section title={t("orderDetail.buyer")}>
      <ListGroup>
        {buyer ? (
          <ListRow
            description={buyer.username ? `@${buyer.username}` : t("auth.noUsername")}
            href={`/admin/users/${buyer.id}`}
            media={<Avatar name={buyer.firstName} size="md" src={buyer.photoUrl} />}
            title={[buyer.firstName, buyer.lastName || ""].join(" ").trim()}
            trailing={buyer.isBanned ? <Pill color="red">{t("orderDetail.banned")}</Pill> : undefined}
          />
        ) : null}
        {/* The PDF itself lands in the admin's Telegram chat; the row only
            says whether one arrived. */}
        {showReceipt ? (
          <ListRow
            description={
              receipt
                ? `${t("receipt.fileInfo", {
                    name: receipt.fileName,
                    size: formatBytes(receipt.fileSize),
                  })} · ${uploadedAtLabel}`
                : t("receipt.pending")
            }
            media={
              receipt ? (
                <FileCheck2 aria-hidden style={{ color: "var(--seal-text-success)" }} />
              ) : (
                <Paperclip aria-hidden />
              )
            }
            title={t("receipt.title")}
          />
        ) : null}
      </ListGroup>
    </Section>
  )
}
