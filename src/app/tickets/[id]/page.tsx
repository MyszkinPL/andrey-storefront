import { TicketDetailScreen } from "@/components/screens/ticket-detail-screen"

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TicketDetailScreen ticketId={id} />
}
