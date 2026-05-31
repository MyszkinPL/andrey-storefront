import { DeliveryType, Prisma, OrderStatus } from "@prisma/client"

type Tx = Prisma.TransactionClient

async function issueAutoKey(tx: Tx, orderId: string, productId: string | null) {
  if (!productId) return false

  const freeKey = await tx.productKey.findFirst({
    where: {
      productId,
      issuedAt: null,
      issuedToOrderId: null,
    },
    orderBy: { createdAt: "asc" },
  })

  if (!freeKey) return false

  const issuedAt = new Date()
  const result = await tx.productKey.updateMany({
    where: {
      id: freeKey.id,
      issuedAt: null,
      issuedToOrderId: null,
    },
    data: {
      issuedAt,
      issuedToOrderId: orderId,
    },
  })

  return result.count > 0
}

export async function confirmOrderPaymentFlow(
  tx: Tx,
  orderId: string,
  adminUserId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { product: true, deliveredKey: true },
  })

  if (!order) return order

  const isAutoKey = order.product?.deliveryType === DeliveryType.AUTO_KEY
  let hasDeliveredKey = Boolean(order.deliveredKey)

  if (isAutoKey && !hasDeliveredKey) {
    hasDeliveredKey = await issueAutoKey(tx, orderId, order.productId)
  }

  if (order.isPaid) {
    if (isAutoKey) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: hasDeliveredKey ? OrderStatus.CLOSED : OrderStatus.OPEN,
          closedAt: hasDeliveredKey ? new Date() : null,
        },
      })
    }

    return order
  }

  const nextStatus = isAutoKey && hasDeliveredKey
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

  return order
}
