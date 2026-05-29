import { DeliveryType, Prisma, OrderStatus } from "@prisma/client"

type Tx = Prisma.TransactionClient

export async function confirmOrderPaymentFlow(
  tx: Tx,
  orderId: string,
  adminUserId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { product: true, deliveredKey: true },
  })

  if (!order || order.isPaid) return order

  const nextStatus =
    order.product?.deliveryType === DeliveryType.AUTO_KEY
      ? OrderStatus.CLOSED
      : order.status === OrderStatus.PAYMENT_REVIEW
        ? OrderStatus.OPEN
        : order.status

  await tx.order.update({
    where: { id: orderId },
    data: {
      isPaid: true,
      paymentConfirmedAt: new Date(),
      status: nextStatus,
      assignedToId: adminUserId,
      closedAt: nextStatus === OrderStatus.CLOSED ? new Date() : null,
    },
  })

  if (order.product?.deliveryType !== DeliveryType.AUTO_KEY || order.deliveredKey) {
    return order
  }

  const freeKey = await tx.productKey.findFirst({
    where: {
      productId: order.productId || undefined,
      issuedAt: null,
    },
    orderBy: { createdAt: "asc" },
  })

  if (freeKey) {
    await tx.productKey.update({
      where: { id: freeKey.id },
      data: {
        issuedAt: new Date(),
        issuedToOrderId: orderId,
      },
    })
  }

  return order
}
