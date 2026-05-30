import { AdminPaymentMethodEditorScreen } from "@/components/screens/admin-payment-method-editor-screen"

export default async function AdminPaymentMethodNewPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template } = await searchParams
  return <AdminPaymentMethodEditorScreen template={template} />
}
