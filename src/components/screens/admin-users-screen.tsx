"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ShieldCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { SearchInput } from "@/components/search-input"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { useI18n } from "@/components/i18n-provider"
import { getAdminUsers, getMe } from "@/lib/api"

export function AdminUsersScreen() {
  const { t, tp } = useI18n()

  const usersSummary = (
    summary: NonNullable<Awaited<ReturnType<typeof getAdminUsers>>["summary"]>,
  ) => {
    const parts = [
      tp("adminUsers.countUsers", summary.total),
      tp("adminUsers.countBuyers", summary.buyers),
      tp("adminUsers.countAdmins", summary.admins),
    ]
    if (summary.banned > 0) {
      parts.push(tp("adminUsers.countBanned", summary.banned))
    }
    return parts.join(" · ")
  }

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "buyers" | "admins" | "banned">("all")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: () => getAdminUsers({ q: search, filter, page, limit: 30 }),
    refetchInterval: 10_000,
  })

  const users = useMemo(() => data?.users ?? [], [data?.users])
  const summary = data?.summary

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title={t("admin.deniedTitle")} subtitle={t("adminUsers.deniedDescription")} />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("adminUsers.title")}
        subtitle={summary ? usersSummary(summary) : t("adminUsers.subtitleFallback")}
      />

      <ScreenBody>
        <SearchInput
          onValueChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          placeholder={t("adminUsers.searchPlaceholder")}
          value={search}
        />

        <Tabs value={filter} onValueChange={(value) => {
          setFilter(value as typeof filter)
          setPage(1)
        }}>
          <TabsList className="w-full">
            {[
              { key: "all" as const, label: t("adminUsers.filterAll") },
              { key: "buyers" as const, label: t("adminUsers.filterBuyers") },
              { key: "admins" as const, label: t("adminUsers.filterAdmins") },
              { key: "banned" as const, label: t("adminUsers.filterBanned") },
            ].map((item) => (
              <TabsTrigger key={item.key} value={item.key}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <ListSkeleton className="lg:grid lg:grid-cols-2" trailing={false} />
        ) : isError && !data ? (
          <ScreenError
            onRetry={() => refetch()}
            subtitle={t("adminUsers.errorDescription")}
            title={t("adminUsers.errorTitle")}
          />
        ) : users.length === 0 ? (
          <UsersEmpty
            title={t("adminUsers.emptyTitle")}
            description={t("adminUsers.emptyDescription")}
          />
        ) : (
          <ListGroup className="lg:grid lg:grid-cols-2">
            {users.map((user) => (
              <ListRow
                description={`${
                  user.username ? `@${user.username}` : `tg:${user.telegramId}`
                } · ID ${user.telegramId} · ${tp(
                  "adminUsers.countActive",
                  user.activeOrderCount,
                )}`}
                href={`/admin/users/${user.id}`}
                key={user.id}
                media={
                  <Avatar className="size-10">
                    {user.photoUrl ? (
                      <AvatarImage src={user.photoUrl} alt={user.firstName} />
                    ) : null}
                    <AvatarFallback>{user.firstName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                }
                title={[user.firstName, user.lastName || ""].join(" ").trim()}
                trailing={
                  user.isBanned ? (
                    <Badge variant="destructive">{t("adminUsers.banned")}</Badge>
                  ) : user.role === "ADMIN" ? (
                    <Badge variant="secondary">{t("adminUsers.admin")}</Badge>
                  ) : null
                }
              />
            ))}
          </ListGroup>
        )}

        {data?.pageInfo?.hasMore ? (
          <Button variant="secondary" onClick={() => setPage((current) => current + 1)}>
            {t("adminUsers.showMore")}
          </Button>
        ) : null}
      </ScreenBody>
    </Screen>
  )
}

function UsersEmpty({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardContent>
        <Empty>
          <EmptyMedia variant="icon">
            <ShieldCheck />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>{title}</EmptyTitle>
            <EmptyDescription>{description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}
