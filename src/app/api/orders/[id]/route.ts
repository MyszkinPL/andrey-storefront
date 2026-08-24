import { PaymentMethodType, Role, OrderStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { createCryptoInvoice, getCryptoInvoice } from "@/lib/crypto-pay"
import { requireAdmin, requireInteractiveUser, requireUser } from "@/lib/auth"
import {
  notifyManualPaymentRejected,
  notifyManualPaymentRequested,
  notifyOrderCancelled,
  notifyOrderPaid,
} from "@/lib/order-notifications"
import { translate } from "@/lib/i18n"
import { resolveUserLocale } from "@/lib/i18n/config"
import type { OrderResponse } from "@/lib/contracts"
import { errorResponse, failure } from "@/lib/api-error"
import { prisma } from "@/lib/prisma"
import { confirmOrderPaymentFlow } from "@/lib/order-payment"

const schema = z.object({
  confirmPayment: z.boolean().optional(),
  refreshCryptoInvoice: z.boolean().optional(),
  markManualPaid: z.boolean().optional(),
  rejectManualPayment: z.boolean().optional(),
  cancelByUser: z.boolean().optional(),
  hideFromHistory: z.boolean().optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodType: z.nativeEnum(PaymentMethodType).optional(),
})

async function syncCryptoInvoice(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      number: true,
      isPaid: true,
      productId: true,
      paymentMethodType: true,
      paymentMethodTitle: true,
      cryptoInvoiceId: true,
      product: {
        select: {
          title: true,
          priceRub: true,
        },
      },
      paymentMethod: {
        select: {
          cryptoAcceptedAssets: true,
        },
      },
    },
  })

  if (!order) return

  if (
    !order.isPaid &&
    order.paymentMethodType === PaymentMethodType.CRYPTO_PAY &&
    !order.cryptoInvoiceId &&
    order.product
  ) {
    const createdInvoice = await createCryptoInvoice({
      amountRub: order.product.priceRub,
      description: `${order.product.title} · order #${order.number}`,
      acceptedAssets: order.paymentMethod?.cryptoAcceptedAssets,
    }).catch(() => null)

    if (createdInvoice) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          cryptoInvoiceId: createdInvoice.invoiceId,
          cryptoInvoiceUrl: createdInvoice.url,
          cryptoInvoiceStatus: createdInvoice.status,
          cryptoInvoiceAsset: createdInvoice.asset,
          cryptoInvoiceAmount: createdInvoice.amount,
          cryptoInvoiceExpiresAt: createdInvoice.expiresAt,
        },
      })
    }
  }

  const refreshedOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      isPaid: true,
      cryptoInvoiceId: true,
    },
  })

  if (!refreshedOrder?.cryptoInvoiceId) return

  const invoice = await getCryptoInvoice(refreshedOrder.cryptoInvoiceId)
  if (!invoice) return

  await prisma.order.update({
    where: { id: orderId },
    data: {
      cryptoInvoiceUrl: invoice.url,
      cryptoInvoiceStatus: invoice.status,
      cryptoInvoiceAsset: invoice.asset,
      cryptoInvoiceAmount: invoice.amount,
      cryptoInvoiceExpiresAt: invoice.expiresAt,
    },
  })

  if (invoice.status === "paid" && !refreshedOrder.isPaid) {
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

      if (admin) {
        await prisma.$transaction((tx) =>
          confirmOrderPaymentFlow(tx, orderId, admin.id),
        )
        await notifyOrderPaid(orderId)
      }
    }
  }

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser()
  const { id } = await params
  const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })

  await syncCryptoInvoice(id).catch(() => {})

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      product: true,
      createdBy: true,
      assignedTo: true,
      deliveredKey: true,
      receipt: true,
    },
  })

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "ADMIN" && order.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    order: {
      id: order.id,
      number: order.number,
      subject: order.subject,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
      isPaid: order.isPaid,
      productTitle: order.product?.title || order.productTitleSnapshot || null,
      productCategory: order.product?.category || order.productCategorySnapshot || null,
      priceRub: order.product?.priceRub ?? order.priceRubSnapshot ?? null,
      deliveredKey: order.deliveredKey?.value || order.deliveredKeyValue || null,
      manualPaymentRequestedAt: order.manualPaymentRequestedAt?.toISOString() || null,
      receipt: order.receipt
        ? {
            fileName: order.receipt.fileName,
            fileSize: order.receipt.fileSize,
            uploadedAt: order.receipt.uploadedAt.toISOString(),
          }
        : null,
      isAdmin: user.role === "ADMIN",
      isOwner: order.createdById === user.id,
      createdBy:
        user.role === "ADMIN"
          ? {
              id: order.createdBy.id,
              firstName: order.createdBy.firstName,
              lastName: order.createdBy.lastName,
              username: order.createdBy.username,
              photoUrl: order.createdBy.photoUrl,
              isBanned: order.createdBy.isBanned,
              banReason: order.createdBy.banReason,
            }
          : null,
      assignedTo:
        user.role === "ADMIN" && order.assignedTo
          ? {
              id: order.assignedTo.id,
              firstName: order.assignedTo.firstName,
              lastName: order.assignedTo.lastName,
              username: order.assignedTo.username,
            }
          : null,
      paymentMethodTitle: order.paymentMethodTitle || null,
      paymentMethodId: order.paymentMethodId || null,
      paymentMethodType: order.paymentMethodType || null,
      paymentMethodDetails: order.paymentMethodDetails || null,
      paymentMethodIconDataUrl: order.paymentMethodIconDataUrl || null,
      cryptoInvoiceFiat: settings?.cryptoPayFiat || "RUB",
      cryptoInvoiceUrl: order.cryptoInvoiceUrl || null,
      cryptoInvoiceStatus: order.cryptoInvoiceStatus || null,
      cryptoInvoiceAsset: order.cryptoInvoiceAsset || null,
      cryptoInvoiceAmount: order.cryptoInvoiceAmount || null,
      cryptoInvoiceExpiresAt: order.cryptoInvoiceExpiresAt?.toISOString() || null,
    },
  } satisfies OrderResponse)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireInteractiveUser()
    const locale = resolveUserLocale(user)
    const { id } = await params
    const payload = schema.parse(await request.json())

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        status: true,
        isPaid: true,
        paymentMethodType: true,
      },
    })

    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Removing an order from your own history is not a deletion: the record
    // stays for the shop, the buyer just stops seeing it.
    if (payload.hideFromHistory) {
      if (order.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      if (order.status !== "CLOSED" && order.status !== "CANCELLED") {
        throw failure("ORDER_STATE", locale, "orderDetail.hideOnlyFinished")
      }

      await prisma.order.update({
        where: { id },
        data: { hiddenByBuyerAt: new Date() },
      })
      return NextResponse.json({ ok: true })
    }

    if (payload.refreshCryptoInvoice) {
      if (user.role !== "ADMIN" && order.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      await syncCryptoInvoice(id)
      return NextResponse.json({ ok: true })
    }

    if (payload.markManualPaid) {
      if (order.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const manualOrder = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          isPaid: true,
          paymentMethodType: true,
          manualPaymentRequestedAt: true,
        },
      })

      if (!manualOrder) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (manualOrder.status === "CLOSED") {
        return NextResponse.json({ error: translate(locale, "errors.orderClosed") }, { status: 400 })
      }

      if (manualOrder.status === OrderStatus.CANCELLED) {
        return NextResponse.json({ error: translate(locale, "errors.orderCancelled") }, { status: 400 })
      }

      if (manualOrder.paymentMethodType !== PaymentMethodType.MANUAL) {
        return NextResponse.json({ error: translate(locale, "errors.noManualReview") }, { status: 400 })
      }

      if (manualOrder.isPaid || manualOrder.manualPaymentRequestedAt) {
        return NextResponse.json({ ok: true })
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.PAYMENT_REVIEW,
            manualPaymentRequestedAt: new Date(),
          },
        })
      })

      await notifyManualPaymentRequested(id)

      return NextResponse.json({ ok: true })
    }

    if (payload.paymentMethodId || payload.paymentMethodType) {
      if (order.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const ownOrder = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          isPaid: true,
          manualPaymentRequestedAt: true,
          product: {
            select: {
              priceRub: true,
              title: true,
            },
          },
        },
      })

      if (!ownOrder) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (ownOrder.isPaid) {
        return NextResponse.json({ error: translate(locale, "errors.methodLockedPaid") }, { status: 400 })
      }

      if (ownOrder.status === OrderStatus.CLOSED || ownOrder.status === OrderStatus.CANCELLED) {
        return NextResponse.json({ error: translate(locale, "errors.orderAlreadyClosed") }, { status: 400 })
      }

      if (ownOrder.manualPaymentRequestedAt) {
        return NextResponse.json(
          { error: translate(locale, "errors.methodLockedReview") },
          { status: 400 },
        )
      }

      if (!ownOrder.product) {
        return NextResponse.json({ error: translate(locale, "errors.orderHasNoProduct") }, { status: 400 })
      }

      if (payload.paymentMethodId) {
        const manualMethod = await prisma.paymentMethod.findFirst({
          where: {
            id: payload.paymentMethodId,
            type: PaymentMethodType.MANUAL,
            isActive: true,
          },
        })

        if (!manualMethod) {
          return NextResponse.json({ error: translate(locale, "errors.methodNotFound") }, { status: 404 })
        }

        await prisma.order.update({
          where: { id },
          data: {
            paymentMethodId: manualMethod.id,
            paymentMethodType: PaymentMethodType.MANUAL,
            paymentMethodTitle: manualMethod.title,
            paymentMethodDetails: manualMethod.details,
            paymentMethodIconDataUrl: manualMethod.iconDataUrl,
            manualPaymentRequestedAt: null,
            cryptoInvoiceId: null,
            cryptoInvoiceUrl: null,
            cryptoInvoiceStatus: null,
            cryptoInvoiceAsset: null,
            cryptoInvoiceAmount: null,
            cryptoInvoiceExpiresAt: null,
          },
        })

        return NextResponse.json({ ok: true })
      }

      if (payload.paymentMethodType === PaymentMethodType.CRYPTO_PAY) {
        const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })

        if (!settings?.cryptoPayEnabled || !settings.cryptoPayToken) {
          return NextResponse.json({ error: translate(locale, "errors.cryptoUnavailable") }, { status: 400 })
        }

        await prisma.order.update({
          where: { id },
          data: {
            paymentMethodId: null,
            paymentMethodType: PaymentMethodType.CRYPTO_PAY,
            paymentMethodTitle: "Crypto Bot",
            paymentMethodDetails: translate(locale, "product.cryptoAuto"),
            paymentMethodIconDataUrl: "/crypto-bot-logo.svg",
            manualPaymentRequestedAt: null,
            cryptoInvoiceId: null,
            cryptoInvoiceUrl: null,
            cryptoInvoiceStatus: null,
            cryptoInvoiceAsset: null,
            cryptoInvoiceAmount: null,
            cryptoInvoiceExpiresAt: null,
          },
        })

        await syncCryptoInvoice(id)

        return NextResponse.json({ ok: true })
      }

      return NextResponse.json({ error: translate(locale, "errors.invalidMethod") }, { status: 400 })
    }

    if (payload.cancelByUser) {
      if (order.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const ownOrder = await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          isPaid: true,
        },
      })

      if (!ownOrder) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (ownOrder.isPaid) {
        return NextResponse.json({ error: translate(locale, "errors.cantCancelPaid") }, { status: 400 })
      }

      if (ownOrder.status === OrderStatus.CLOSED || ownOrder.status === OrderStatus.CANCELLED) {
        return NextResponse.json({ ok: true })
      }

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            closedAt: new Date(),
          },
        })
      })

      await notifyOrderCancelled(id)

      return NextResponse.json({ ok: true })
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.$transaction(async (tx) => {
      if (payload.confirmPayment) {
        if (
          order.paymentMethodType === PaymentMethodType.MANUAL &&
          order.status !== OrderStatus.PAYMENT_REVIEW
        ) {
          throw new Error(translate(locale, "errors.manualNeedsBuyerMark"))
        }

        if (
          order.status === OrderStatus.CLOSED ||
          order.status === OrderStatus.CANCELLED
        ) {
          throw new Error(translate(locale, "errors.cantConfirmClosed"))
        }

        await confirmOrderPaymentFlow(tx, id, user.id)
      }

      if (payload.rejectManualPayment) {
        if (order.paymentMethodType !== PaymentMethodType.MANUAL) {
          throw new Error(translate(locale, "errors.noManualReview"))
        }

        if (order.status !== OrderStatus.PAYMENT_REVIEW) {
          throw new Error(translate(locale, "errors.notUnderReview"))
        }

        await tx.order.update({
          where: { id },
          data: {
            status: OrderStatus.OPEN,
            manualPaymentRequestedAt: null,
          },
        })
      }

    })

    if (payload.confirmPayment) {
      await notifyOrderPaid(id)
    }

    if (payload.rejectManualPayment) {
      await notifyManualPaymentRejected(id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin()

    const { id } = await params

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        deliveredKey: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      if (order.deliveredKey?.id) {
        await tx.productKey.update({
          where: { id: order.deliveredKey.id },
          data: {
            issuedAt: null,
            issuedToOrderId: null,
          },
        })
      }

      await tx.order.delete({
        where: { id },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return errorResponse(error)
  }
}
