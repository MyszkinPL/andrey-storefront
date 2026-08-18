import { PaymentMethodType } from "@prisma/client"
import { NextResponse } from "next/server"

import { requireInteractiveUser } from "@/lib/auth"
import { translate } from "@/lib/i18n"
import { resolveUserLocale } from "@/lib/i18n/config"
import { deliverReceiptToAdmins } from "@/lib/order-receipt"
import { errorResponse } from "@/lib/api-error"
import { prisma } from "@/lib/prisma"
import { validateReceiptFile, RECEIPT_MAX_MB } from "@/lib/receipt-constants"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireInteractiveUser()
    const { id } = await params
    const locale = resolveUserLocale(user)

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        isPaid: true,
        status: true,
        paymentMethodType: true,
      },
    })

    if (!order || order.createdById !== user.id) {
      return NextResponse.json(
        { error: translate(locale, "errors.notFound") },
        { status: 404 },
      )
    }

    // A receipt only proves a manual transfer, and only while the order is
    // still awaiting confirmation.
    const acceptsReceipt =
      !order.isPaid &&
      order.status !== "CANCELLED" &&
      order.status !== "CLOSED" &&
      order.paymentMethodType !== PaymentMethodType.CRYPTO_PAY

    if (!acceptsReceipt) {
      return NextResponse.json(
        { error: translate(locale, "receipt.errorOrderState") },
        { status: 409 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: translate(locale, "receipt.errorFailed") },
        { status: 400 },
      )
    }

    const validationError = validateReceiptFile({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    if (validationError) {
      const message =
        validationError === "size"
          ? translate(locale, "receipt.errorSize", { limit: RECEIPT_MAX_MB })
          : validationError === "empty"
            ? translate(locale, "receipt.errorEmpty")
            : translate(locale, "receipt.errorType")

      return NextResponse.json({ error: message }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase().endsWith(".pdf")
      ? file.name
      : `${file.name}.pdf`

    const receipt = await deliverReceiptToAdmins({
      orderId: order.id,
      fileName,
      fileSize: file.size,
      buffer,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { manualPaymentRequestedAt: new Date() },
    })

    return NextResponse.json({
      receipt: {
        fileName: receipt.fileName,
        fileSize: receipt.fileSize,
        uploadedAt: receipt.uploadedAt.toISOString(),
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}
