import { Role } from "@prisma/client"
import { InputFile } from "grammy"

import { getBot } from "@/lib/bot"
import { translate } from "@/lib/i18n"
import { resolveUserLocale } from "@/lib/i18n/config"
import { prisma } from "@/lib/prisma"
import { escapeHtml, formatBytes } from "@/lib/telegram-format"

type ReceiptUpload = {
  orderId: string
  fileName: string
  fileSize: number
  buffer: Buffer
}

/**
 * Sends the PDF to the admins through the bot and stores only the resulting
 * Telegram file reference. The first successful send yields a `file_id` that
 * the remaining admins are served with, so the document is uploaded once.
 */
export async function deliverReceiptToAdmins({
  orderId,
  fileName,
  fileSize,
  buffer,
}: ReceiptUpload) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { createdBy: true, product: true },
  })

  if (!order) throw new Error("Order not found")

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { telegramId: true, language: true, languageCode: true },
  })

  const title =
    order.product?.title || order.productTitleSnapshot || order.subject
  const buyerName = order.createdBy.username
    ? `@${order.createdBy.username}`
    : order.createdBy.firstName

  const bot = getBot()
  let telegramFileId: string | null = null
  let telegramFileUniqueId: string | null = null

  for (const admin of admins) {
    const locale = resolveUserLocale(admin)
    const caption = [
      translate(locale, "receipt.notifyAdmin"),
      `<b>${escapeHtml(title)}</b> · #${order.number}`,
      escapeHtml(buyerName),
      escapeHtml(formatBytes(fileSize)),
    ].join("\n")

    try {
      const message = await bot.api.sendDocument(
        Number(admin.telegramId),
        telegramFileId ?? new InputFile(buffer, fileName),
        { caption, parse_mode: "HTML" },
      )

      if (!telegramFileId && message.document) {
        telegramFileId = message.document.file_id
        telegramFileUniqueId = message.document.file_unique_id
      }
    } catch (error) {
      console.error("Receipt delivery failed", {
        telegramId: admin.telegramId.toString(),
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (!telegramFileId) {
    throw new Error("Receipt could not be delivered to any admin")
  }

  return prisma.orderReceipt.upsert({
    where: { orderId },
    update: {
      fileName,
      fileSize,
      telegramFileId,
      telegramFileUniqueId,
      uploadedAt: new Date(),
    },
    create: {
      orderId,
      fileName,
      fileSize,
      telegramFileId,
      telegramFileUniqueId,
    },
  })
}
