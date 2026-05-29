import { OrderDetailScreen } from "@/components/screens/order-detail-screen"

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OrderDetailScreen orderId={id} />
}
