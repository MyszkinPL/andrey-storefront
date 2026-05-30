"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronRight, History, Search, ShieldCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { getAdminUser, getAdminUsers, getMe, updateAdminUserModeration } from "@/lib/api"

export function AdminUsersScreen() {
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "buyers" | "admins" | "banned">("all")
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [banDraft, setBanDraft] = useState<null | { id: string; name: string }>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: () => getAdminUsers({ q: search, filter, page, limit: 30 }),
    refetchInterval: 10_000,
  })

  const moderationMutation = useMutation({
    mutationFn: (payload: { id: string; isBanned: boolean }) =>
      updateAdminUserModeration(payload.id, { isBanned: payload.isBanned }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
      setBanDraft(null)
    },
  })

  const users = useMemo(() => data?.users ?? [], [data?.users])
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null
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
              <Item key={user.id} role="listitem" variant="muted" size="sm">
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
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    aria-label="Открыть пользователя"
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <ChevronRight />
                  </Button>
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

      {selectedUser ? (
        <UserDetailsDialog
          userId={selectedUser.id}
          fallbackUser={selectedUser}
          moderationPending={moderationMutation.isPending}
          onClose={() => setSelectedUserId(null)}
          onToggleBan={() => {
            if (selectedUser.role === "ADMIN") return
            if (selectedUser.isBanned) {
              moderationMutation.mutate({ id: selectedUser.id, isBanned: false })
            } else {
              setBanDraft({
                id: selectedUser.id,
                name: [selectedUser.firstName, selectedUser.lastName || ""].join(" ").trim(),
              })
            }
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(banDraft)}
        onOpenChange={(open) => {
          if (!open && !moderationMutation.isPending) setBanDraft(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Забанить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              {banDraft?.name ? `${banDraft.name}. ` : ""}Все активные неоплаченные заказы пользователя будут отменены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={moderationMutation.isPending}
              onClick={() => {
                if (!banDraft) return
                moderationMutation.mutate({ id: banDraft.id, isBanned: true })
              }}
            >
              Забанить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Screen>
  )
}

function UserDetailsDialog({
  userId,
  fallbackUser,
  moderationPending,
  onClose,
  onToggleBan,
}: {
  userId: string
  fallbackUser: Awaited<ReturnType<typeof getAdminUsers>>["users"][number]
  moderationPending: boolean
  onClose: () => void
  onToggleBan: () => void
}) {
  const userQuery = useQuery<Awaited<ReturnType<typeof getAdminUser>>>({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    refetchInterval: 10_000,
  })
  const detailedUser = userQuery.data?.user
  const user = detailedUser ?? fallbackUser

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{[user.firstName, user.lastName || ""].join(" ").trim()}</DialogTitle>
          <DialogDescription>{user.username ? `@${user.username}` : `tg:${user.telegramId}`}</DialogDescription>
        </DialogHeader>
        {userQuery.isLoading && !detailedUser ? (
          <UsersEmpty title="Загружаю пользователя" description="Подтягиваю профиль и историю." />
        ) : (
          <>
            <Card size="sm">
              <CardHeader>
                <Avatar size="lg">
                  {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.firstName} /> : null}
                  <AvatarFallback>{user.firstName.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <CardTitle>Профиль</CardTitle>
                <CardDescription>
                  {user.role === "ADMIN" ? "Администратор" : "Покупатель"} · {user.activeOrderCount} активных заказов
                </CardDescription>
                <CardAction>
                  {user.isBanned ? <Badge variant="destructive">Бан</Badge> : null}
                </CardAction>
              </CardHeader>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>История заказов</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {user.orders.length > 0 ? (
                  <ItemGroup className="gap-2">
                    {user.orders.map((order) => (
                      <Item key={order.id} render={<Link href={`/orders/${order.id}`} />} variant="muted" size="sm">
                        <ItemMedia variant="icon">
                          <History />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>{order.productTitle || `Заказ #${order.number}`}</ItemTitle>
                          <ItemDescription>
                            #{order.number}
                            {order.productCategory ? ` · ${order.productCategory}` : ""}
                            {order.priceRub ? ` · ${order.priceRub.toLocaleString("ru-RU")} ₽` : ""}
                            {" · "}
                            {renderOrderStatus(order.status, order.isPaid)}
                          </ItemDescription>
                        </ItemContent>
                      </Item>
                    ))}
                  </ItemGroup>
                ) : (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>Заказов пока нет</EmptyTitle>
                      <EmptyDescription>История покупок появится после первого заказа.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="secondary" onClick={onClose}>
                Закрыть
              </Button>
              <Button
                variant={user.isBanned ? "secondary" : "destructive"}
                disabled={moderationPending || user.role === "ADMIN"}
                onClick={onToggleBan}
              >
                {user.role === "ADMIN" ? "Админ" : user.isBanned ? "Снять бан" : "Забанить"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
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

function renderOrderStatus(status: string, isPaid: boolean) {
  if (status === "CANCELLED") return "Отменён"
  if (status === "CLOSED") return isPaid ? "Завершён" : "Закрыт"
  if (status === "PAYMENT_REVIEW") return "Проверка"
  if (!isPaid) return "Оплата"
  return "Оплачен"
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
