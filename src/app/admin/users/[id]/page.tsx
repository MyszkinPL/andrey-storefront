import { AdminUserDetailScreen } from "@/components/screens/admin-user-detail-screen"

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <AdminUserDetailScreen userId={id} />
}
