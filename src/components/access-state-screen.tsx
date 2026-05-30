import { CircleAlert } from "lucide-react"

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Card, CardContent } from "@/components/ui/card"

export function AccessStateScreen({
  title,
  description,
  icon = <CircleAlert />,
}: {
  title: string
  description: string
  icon?: React.ReactNode
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-6">
      <Card className="w-full">
        <CardContent>
          <Empty>
            <EmptyMedia variant="icon">{icon}</EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </main>
  )
}
