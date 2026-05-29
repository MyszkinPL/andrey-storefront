"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, History, Search, ShieldCheck } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Input } from "@/components/ui/input"
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

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title="Доступ закрыт" subtitle="Модерация доступна только админу." />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="Модерация" subtitle="Баны и доступ покупателей" />

      <ScreenBody>
        <Card size="sm">
          <CardContent>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                className="pl-9"
                placeholder="Имя, username или Telegram ID"
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </CardContent>
        </Card>

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
          <div className="grid gap-3 lg:grid-cols-2">
            {users.map((user) => (
              <Card key={user.id} size="sm">
                <CardHeader>
                  <Avatar size="lg">
                    {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.firstName} /> : null}
                    <AvatarFallback>{user.firstName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="truncate">{[user.firstName, user.lastName || ""].join(" ").trim()}</CardTitle>
                  <CardDescription>{user.username ? `@${user.username}` : `tg:${user.telegramId}`}</CardDescription>
                  <CardAction>
                    {user.isBanned ? (
                      <Badge variant="destructive">Бан</Badge>
                    ) : user.role === "ADMIN" ? (
                      <Badge variant="secondary">Админ</Badge>
                    ) : null}
                  </CardAction>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{user.activeOrderCount} активных заказов</span>
                  <span>ID {user.telegramId}</span>
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedUserId(user.id)}>
                    Открыть
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
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

      <Dialog
        open={Boolean(banDraft)}
        onOpenChange={(open) => {
          if (!open && !moderationMutation.isPending) setBanDraft(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Блокировка пользователя</DialogTitle>
            <DialogDescription>Все активные неоплаченные заказы пользователя будут отменены.</DialogDescription>
          </DialogHeader>
          <Card size="sm">
            <CardHeader>
              <Ban className="size-5 text-muted-foreground" />
              <CardTitle>Забанить пользователя?</CardTitle>
              <CardDescription>{banDraft?.name}</CardDescription>
            </CardHeader>
          </Card>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setBanDraft(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={moderationMutation.isPending}
              onClick={() => {
                if (!banDraft) return
                moderationMutation.mutate({ id: banDraft.id, isBanned: true })
              }}
            >
              Забанить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                  user.orders.map((order) => (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <Card size="sm">
                        <CardHeader>
                          <History className="size-4 text-muted-foreground" />
                          <CardTitle>{order.productTitle || `Заказ #${order.number}`}</CardTitle>
                          <CardDescription>
                            #{order.number}
                            {order.productCategory ? ` · ${order.productCategory}` : ""}
                            {order.priceRub ? ` · ${order.priceRub.toLocaleString("ru-RU")} ₽` : ""}
                            {" · "}
                            {renderOrderStatus(order.status, order.isPaid)}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">Заказов пока нет</div>
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
