import { DeliveryType, Prisma, OrderStatus } from "@prisma/client"

type Tx = Prisma.TransactionClient

async function issueAutoKey(tx: Tx, orderId: string, productId: string | null) {
  if (!productId) return null

  const freeKey = await tx.productKey.findFirst({
    where: {
      productId,
      issuedAt: null,
      issuedToOrderId: null,
    },
    orderBy: { createdAt: "asc" },
  })

  if (!freeKey) return null

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

  return result.count > 0 ? freeKey.value : null
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
  let deliveredKeyValue = order.deliveredKey?.value || order.deliveredKeyValue || null

  if (isAutoKey && !deliveredKeyValue) {
    deliveredKeyValue = await issueAutoKey(tx, orderId, order.productId)
  }

  const hasDeliveredKey = Boolean(deliveredKeyValue)

  if (order.isPaid) {
    if (isAutoKey) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: hasDeliveredKey ? OrderStatus.CLOSED : OrderStatus.OPEN,
          closedAt: hasDeliveredKey ? new Date() : null,
          deliveredKeyValue,
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
      deliveredKeyValue,
    },
  })

  return order
}
