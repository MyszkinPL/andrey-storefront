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

  await tx.ticket.update({
    where: { id: ticketId },
    data: {
      isPaid: true,
      paymentConfirmedAt: new Date(),
      status: ticket.status === "OPEN" ? TicketStatus.IN_PROGRESS : ticket.status,
      assignedToId: adminUserId,
    },
  })

  await tx.ticketMessage.create({
    data: {
      ticketId,
      senderId: adminUserId,
      body: "Оплата подтверждена. Начинаю выдачу.",
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

    await tx.ticketMessage.create({
      data: {
        ticketId,
        senderId: adminUserId,
        body: `Автовыдача ключа:\n${freeKey.value}`,
      },
    })
  } else {
    await tx.ticketMessage.create({
      data: {
        ticketId,
        senderId: adminUserId,
        body: "Оплата подтверждена, но свободных ключей сейчас нет. Пополню остаток вручную.",
      },
    })
  }

  return ticket
}
