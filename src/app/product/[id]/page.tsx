import { ProductScreen } from "@/components/screens/product-screen"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <ProductScreen productId={id} />
}
