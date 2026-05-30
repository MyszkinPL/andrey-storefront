import { AdminProductEditorScreen } from "@/components/screens/admin-product-editor-screen"

export default async function AdminProductNewPage({
  searchParams,
}: {
  searchParams: Promise<{ copy?: string }>
}) {
  const { copy } = await searchParams
  return <AdminProductEditorScreen copyProductId={copy} />
}
