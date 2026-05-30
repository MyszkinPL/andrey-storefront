import { AdminPaymentMethodEditorScreen } from "@/components/screens/admin-payment-method-editor-screen"

export default async function AdminPaymentMethodEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminPaymentMethodEditorScreen methodId={id} />
}
