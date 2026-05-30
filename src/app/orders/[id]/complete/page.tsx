import { OrderCompleteScreen } from "@/components/screens/order-complete-screen"

export default async function OrderCompletePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <OrderCompleteScreen orderId={id} />
}
