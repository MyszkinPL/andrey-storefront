"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ShieldCheck } from "lucide-react"

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
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { getAdminUsers, getMe } from "@/lib/api"

export function AdminUsersScreen() {
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "buyers" | "admins" | "banned">("all")
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: () => getAdminUsers({ q: search, filter, page, limit: 30 }),
    refetchInterval: 10_000,
  })

  const users = useMemo(() => data?.users ?? [], [data?.users])
  const summary = data?.summary

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title="Доступ закрыт" subtitle="Модерация доступна только админу." />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader
        title="Юзеры"
        subtitle={summary ? renderUsersSummary(summary) : "Баны и доступ покупателей"}
      />

      <ScreenBody>
        <InputGroup>
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            placeholder="Имя, username или Telegram ID"
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </InputGroup>

        <Tabs value={filter} onValueChange={(value) => {
          setFilter(value as typeof filter)
          setPage(1)
        }}>
          <TabsList className="w-full">
            {[
              { key: "all" as const, label: "Все" },
              { key: "buyers" as const, label: "Покупатели" },
              { key: "admins" as const, label: "Админы" },
              { key: "banned" as const, label: "Бан" },
            ].map((item) => (
              <TabsTrigger key={item.key} value={item.key}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <UsersEmpty title="Загружаю пользователей" description="Подтягиваю модерацию." />
        ) : isError ? (
          <UsersEmpty title="Список не загрузился" description="Обнови экран или попробуй позже." />
        ) : users.length === 0 ? (
          <UsersEmpty title="Никого не найдено" description="Смени фильтр или запрос." />
        ) : (
          <ItemGroup className="gap-2 lg:grid lg:grid-cols-2">
            {users.map((user) => (
              <Item
                key={user.id}
                render={<Link href={`/admin/users/${user.id}`} />}
                variant="muted"
                size="sm"
              >
                <ItemMedia>
                  <Avatar size="sm">
                    {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.firstName} /> : null}
                    <AvatarFallback>{user.firstName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>{[user.firstName, user.lastName || ""].join(" ").trim()}</ItemTitle>
                  <ItemDescription>
                    {user.username ? `@${user.username}` : `tg:${user.telegramId}`} · ID {user.telegramId} ·{" "}
                    {formatActiveOrders(user.activeOrderCount)}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {user.isBanned ? (
                    <Badge variant="destructive">Бан</Badge>
                  ) : user.role === "ADMIN" ? (
                    <Badge variant="secondary">Админ</Badge>
                  ) : null}
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}

        {data?.pageInfo?.hasMore ? (
          <Button variant="secondary" onClick={() => setPage((current) => current + 1)}>
            Показать ещё
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

function formatActiveOrders(count: number) {
  if (count === 1) return "1 активный"
  return `${count} активных`
}

function renderUsersSummary(summary: Awaited<ReturnType<typeof getAdminUsers>>["summary"]) {
  const parts = [
    formatCount(summary.total, "юзер", "юзера", "юзеров"),
    formatCount(summary.buyers, "покупатель", "покупателя", "покупателей"),
    formatCount(summary.admins, "админ", "админа", "админов"),
  ]

  if (summary.banned > 0) {
    parts.push(formatCount(summary.banned, "бан", "бана", "банов"))
  }

  return parts.join(" · ")
}

function formatCount(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  const word = mod10 === 1 && mod100 !== 11 ? one : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? few : many

  return `${count} ${word}`
}
