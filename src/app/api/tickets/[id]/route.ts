import { PaymentMethodType, Role, TicketStatus } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { createCryptoInvoice, getCryptoInvoice } from "@/lib/crypto-pay"
import { requireUser } from "@/lib/auth"
import {
  notifyManualPaymentRejected,
  notifyManualPaymentRequested,
  notifyOrderCancelled,
  notifyOrderPaid,
} from "@/lib/order-notifications"
import { prisma } from "@/lib/prisma"
import { confirmTicketPaymentFlow } from "@/lib/ticket-payment"

const schema = z.object({
  status: z.nativeEnum(TicketStatus).optional(),
  confirmPayment: z.boolean().optional(),
  refreshCryptoInvoice: z.boolean().optional(),
  markManualPaid: z.boolean().optional(),
  rejectManualPayment: z.boolean().optional(),
  cancelByUser: z.boolean().optional(),
  paymentMethodId: z.string().optional(),
  paymentMethodType: z.nativeEnum(PaymentMethodType).optional(),
})

async function syncCryptoInvoice(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
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

  if (!ticket) return

  if (
    !ticket.isPaid &&
    ticket.paymentMethodType === PaymentMethodType.CRYPTO_PAY &&
    !ticket.cryptoInvoiceId &&
    ticket.product
  ) {
    const createdInvoice = await createCryptoInvoice({
      amountRub: ticket.product.priceRub,
      description: `${ticket.product.title} · order #${ticket.number}`,
      acceptedAssets: ticket.paymentMethod?.cryptoAcceptedAssets,
    }).catch(() => null)

    if (createdInvoice) {
      await prisma.ticket.update({
        where: { id: ticketId },
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

  const refreshedTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      isPaid: true,
      cryptoInvoiceId: true,
    },
  })

  if (!refreshedTicket?.cryptoInvoiceId) return

  const invoice = await getCryptoInvoice(refreshedTicket.cryptoInvoiceId)
  if (!invoice) return

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      cryptoInvoiceUrl: invoice.url,
      cryptoInvoiceStatus: invoice.status,
      cryptoInvoiceAsset: invoice.asset,
      cryptoInvoiceAmount: invoice.amount,
      cryptoInvoiceExpiresAt: invoice.expiresAt,
    },
  })

  if (invoice.status === "paid" && !refreshedTicket.isPaid) {
    const admin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })

      if (admin) {
        await prisma.$transaction((tx) =>
          confirmTicketPaymentFlow(tx, ticketId, admin.id),
        )
        await notifyOrderPaid(ticketId)
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

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      product: true,
      createdBy: true,
      assignedTo: true,
      deliveredKey: true,
    },
  })

  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "ADMIN" && ticket.createdById !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    ticket: {
      id: ticket.id,
      number: ticket.number,
      subject: ticket.subject,
      status: ticket.status,
      createdAt: ticket.createdAt,
      isPaid: ticket.isPaid,
      productTitle: ticket.product?.title || null,
      productCategory: ticket.product?.category || null,
      deliveredKey: ticket.deliveredKey?.value || null,
      manualPaymentRequestedAt: ticket.manualPaymentRequestedAt?.toISOString() || null,
      isAdmin: user.role === "ADMIN",
      isOwner: ticket.createdById === user.id,
      createdBy:
        user.role === "ADMIN"
          ? {
              id: ticket.createdBy.id,
              firstName: ticket.createdBy.firstName,
              lastName: ticket.createdBy.lastName,
              username: ticket.createdBy.username,
              photoUrl: ticket.createdBy.photoUrl,
              isBanned: ticket.createdBy.isBanned,
              banReason: ticket.createdBy.banReason,
            }
          : null,
      assignedTo:
        user.role === "ADMIN" && ticket.assignedTo
          ? {
              id: ticket.assignedTo.id,
              firstName: ticket.assignedTo.firstName,
              lastName: ticket.assignedTo.lastName,
              username: ticket.assignedTo.username,
            }
          : null,
      paymentMethodTitle: ticket.paymentMethodTitle || null,
      paymentMethodId: ticket.paymentMethodId || null,
      paymentMethodType: ticket.paymentMethodType || null,
      paymentMethodDetails: ticket.paymentMethodDetails || null,
      paymentMethodIconDataUrl: ticket.paymentMethodIconDataUrl || null,
      cryptoInvoiceFiat: settings?.cryptoPayFiat || "RUB",
      cryptoInvoiceUrl: ticket.cryptoInvoiceUrl || null,
      cryptoInvoiceStatus: ticket.cryptoInvoiceStatus || null,
      cryptoInvoiceAsset: ticket.cryptoInvoiceAsset || null,
      cryptoInvoiceAmount: ticket.cryptoInvoiceAmount || null,
      cryptoInvoiceExpiresAt: ticket.cryptoInvoiceExpiresAt?.toISOString() || null,
    },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const payload = schema.parse(await request.json())

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        createdById: true,
        status: true,
        isPaid: true,
        paymentMethodType: true,
      },
    })

    if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (payload.refreshCryptoInvoice) {
      if (user.role !== "ADMIN" && ticket.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      await syncCryptoInvoice(id)
      return NextResponse.json({ ok: true })
    }

    if (payload.markManualPaid) {
      if (ticket.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const manualTicket = await prisma.ticket.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          isPaid: true,
          paymentMethodType: true,
          manualPaymentRequestedAt: true,
        },
      })

      if (!manualTicket) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (manualTicket.status === "CLOSED") {
        return NextResponse.json({ error: "Заказ закрыт" }, { status: 400 })
      }

      if (manualTicket.status === TicketStatus.CANCELLED) {
        return NextResponse.json({ error: "Заказ отменён" }, { status: 400 })
      }

      if (manualTicket.paymentMethodType !== PaymentMethodType.MANUAL) {
        return NextResponse.json({ error: "Этот заказ не требует ручной проверки" }, { status: 400 })
      }

      if (manualTicket.isPaid || manualTicket.manualPaymentRequestedAt) {
        return NextResponse.json({ ok: true })
      }

      await prisma.$transaction(async (tx) => {
        await tx.ticket.update({
          where: { id },
          data: {
            status: TicketStatus.PAYMENT_REVIEW,
            manualPaymentRequestedAt: new Date(),
          },
        })
      })

      await notifyManualPaymentRequested(id)

      return NextResponse.json({ ok: true })
    }

    if (payload.paymentMethodId || payload.paymentMethodType) {
      if (ticket.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const ownTicket = await prisma.ticket.findUnique({
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

      if (!ownTicket) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (ownTicket.isPaid) {
        return NextResponse.json({ error: "После оплаты способ менять нельзя" }, { status: 400 })
      }

      if (ownTicket.status === TicketStatus.CLOSED || ownTicket.status === TicketStatus.CANCELLED) {
        return NextResponse.json({ error: "Заказ уже закрыт" }, { status: 400 })
      }

      if (ownTicket.manualPaymentRequestedAt) {
        return NextResponse.json(
          { error: "Способ оплаты нельзя менять после отметки об оплате" },
          { status: 400 },
        )
      }

      if (!ownTicket.product) {
        return NextResponse.json({ error: "У заказа нет товара" }, { status: 400 })
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
          return NextResponse.json({ error: "Способ оплаты не найден" }, { status: 404 })
        }

        await prisma.ticket.update({
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
          return NextResponse.json({ error: "Crypto Bot сейчас недоступен" }, { status: 400 })
        }

        await prisma.ticket.update({
          where: { id },
          data: {
            paymentMethodId: null,
            paymentMethodType: PaymentMethodType.CRYPTO_PAY,
            paymentMethodTitle: "Crypto Bot",
            paymentMethodDetails: "Автоматическая оплата через invoice",
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

      return NextResponse.json({ error: "Неверный способ оплаты" }, { status: 400 })
    }

    if (payload.cancelByUser) {
      if (ticket.createdById !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const ownTicket = await prisma.ticket.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          isPaid: true,
        },
      })

      if (!ownTicket) {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
      }

      if (ownTicket.isPaid) {
        return NextResponse.json({ error: "Оплаченный заказ нельзя отменить самостоятельно" }, { status: 400 })
      }

      if (ownTicket.status === TicketStatus.CLOSED || ownTicket.status === TicketStatus.CANCELLED) {
        return NextResponse.json({ ok: true })
      }

      await prisma.$transaction(async (tx) => {
        await tx.ticket.update({
          where: { id },
          data: {
            status: TicketStatus.CANCELLED,
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
          ticket.paymentMethodType === PaymentMethodType.MANUAL &&
          ticket.status !== TicketStatus.PAYMENT_REVIEW
        ) {
          throw new Error("Ручную оплату можно подтвердить только после отметки покупателя")
        }

        if (
          ticket.status === TicketStatus.CLOSED ||
          ticket.status === TicketStatus.CANCELLED
        ) {
          throw new Error("Закрытый заказ нельзя подтверждать")
        }

        await confirmTicketPaymentFlow(tx, id, user.id)
      }

      if (payload.rejectManualPayment) {
        if (ticket.paymentMethodType !== PaymentMethodType.MANUAL) {
          throw new Error("Этот заказ не требует ручной проверки")
        }

        if (ticket.status !== TicketStatus.PAYMENT_REVIEW) {
          throw new Error("Заказ сейчас не находится на проверке оплаты")
        }

        await tx.ticket.update({
          where: { id },
          data: {
            status: TicketStatus.OPEN,
            manualPaymentRequestedAt: null,
          },
        })
      }

      if (payload.status) {
        if (
          (ticket.status === TicketStatus.CLOSED ||
            ticket.status === TicketStatus.CANCELLED) &&
          payload.status !== ticket.status
        ) {
          throw new Error("Закрытый заказ нельзя перевести в другой статус")
        }

        await tx.ticket.update({
          where: { id },
          data: {
            status: payload.status,
            closedAt:
              payload.status === "CLOSED" || payload.status === "CANCELLED"
                ? new Date()
                : null,
            assignedToId: payload.status === "IN_PROGRESS" ? user.id : undefined,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ticket update failed" },
      { status: 400 },
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser().then((user) => {
      if (user.role !== "ADMIN") throw new Error("Forbidden")
      return user
    })

    const { id } = await params

    const ticket = await prisma.ticket.findUnique({
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

    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      if (ticket.deliveredKey?.id) {
        await tx.productKey.update({
          where: { id: ticket.deliveredKey.id },
          data: {
            issuedAt: null,
            issuedToTicketId: null,
          },
        })
      }

      await tx.ticket.delete({
        where: { id },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ticket delete failed" },
      { status: 400 },
    )
  }
}
