import { DeliveryType, Prisma, TicketStatus } from "@prisma/client"

type Tx = Prisma.TransactionClient

export async function confirmTicketPaymentFlow(
  tx: Tx,
  ticketId: string,
  adminUserId: string,
) {
  const ticket = await tx.ticket.findUnique({
    where: { id: ticketId },
    include: { product: true, deliveredKey: true },
  })

  if (!ticket || ticket.isPaid) return ticket

  const nextStatus =
    ticket.product?.deliveryType === DeliveryType.AUTO_KEY
      ? TicketStatus.CLOSED
      : ticket.status === TicketStatus.PAYMENT_REVIEW
        ? TicketStatus.OPEN
        : ticket.status

  await tx.ticket.update({
    where: { id: ticketId },
    data: {
      isPaid: true,
      paymentConfirmedAt: new Date(),
      status: nextStatus,
      assignedToId: adminUserId,
      closedAt: nextStatus === TicketStatus.CLOSED ? new Date() : null,
    },
  })

  if (ticket.product?.deliveryType !== DeliveryType.AUTO_KEY || ticket.deliveredKey) {
    return ticket
  }

  const freeKey = await tx.productKey.findFirst({
    where: {
      productId: ticket.productId || undefined,
      issuedAt: null,
    },
    orderBy: { createdAt: "asc" },
  })

  if (freeKey) {
    await tx.productKey.update({
      where: { id: freeKey.id },
      data: {
        issuedAt: new Date(),
        issuedToTicketId: ticketId,
      },
    })
  }

  return ticket
}
