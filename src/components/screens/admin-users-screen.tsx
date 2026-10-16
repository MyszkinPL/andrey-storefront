"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ShieldCheck } from "lucide-react"
import { Avatar, Button, EmptyState, Pill, Tabs } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { ListGroup, ListRow, ListSkeleton } from "@/components/list-row"
import { Screen, ScreenBody, ScreenError, ScreenHeader } from "@/components/screen"
import { SearchInput } from "@/components/search-input"
import { getAdminUsers, getMe } from "@/lib/api"

type FilterKey = "all" | "buyers" | "admins" | "banned"

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
  const [filter, setFilter] = useState<FilterKey>("all")
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
        <div className="shop-toolbar">
          <SearchInput
            onValueChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder={t("adminUsers.searchPlaceholder")}
            value={search}
          />

          <div className="shop-scroll-x">
            <Tabs
              aria-label={t("adminUsers.title")}
              items={[
                { value: "all", label: t("adminUsers.filterAll") },
                { value: "buyers", label: t("adminUsers.filterBuyers") },
                { value: "admins", label: t("adminUsers.filterAdmins") },
                { value: "banned", label: t("adminUsers.filterBanned") },
              ]}
              onValueChange={(value) => {
                setFilter(value as FilterKey)
                setPage(1)
              }}
              value={filter}
            />
          </div>
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : isError && !data ? (
          <ScreenError
            onRetry={() => refetch()}
            subtitle={t("adminUsers.errorDescription")}
            title={t("adminUsers.errorTitle")}
          />
        ) : users.length === 0 ? (
          <EmptyState
            description={t("adminUsers.emptyDescription")}
            icon={<ShieldCheck />}
            title={t("adminUsers.emptyTitle")}
          />
        ) : (
          <ListGroup>
            {users.map((user) => {
              const displayName = [user.firstName, user.lastName || ""].join(" ").trim()

              return (
                <ListRow
                  description={`${
                    user.username ? `@${user.username}` : `tg:${user.telegramId}`
                  } · ID ${user.telegramId} · ${tp(
                    "adminUsers.countActive",
                    user.activeOrderCount,
                  )}`}
                  href={`/admin/users/${user.id}`}
                  key={user.id}
                  media={<Avatar name={displayName || user.firstName} src={user.photoUrl} />}
                  title={displayName}
                  trailing={
                    user.isBanned ? (
                      <Pill color="red">{t("adminUsers.banned")}</Pill>
                    ) : user.role === "ADMIN" ? (
                      <Pill color="blue">{t("adminUsers.admin")}</Pill>
                    ) : null
                  }
                />
              )
            })}
          </ListGroup>
        )}

        {data?.pageInfo?.hasMore ? (
          <Button fullWidth onClick={() => setPage((current) => current + 1)} variant="secondary">
            {t("adminUsers.showMore")}
          </Button>
        ) : null}
      </ScreenBody>
    </Screen>
  )
}
