import { AdminProductEditorScreen } from "@/components/screens/admin-product-editor-screen"

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminProductEditorScreen productId={id} />
}
