"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { History } from "lucide-react"

import { AccessStateScreen } from "@/components/access-state-screen"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Screen, ScreenBody, ScreenHeader } from "@/components/screen"
import { useBackButton } from "@/hooks/use-telegram"
import { getAdminUser, getMe, updateAdminUserModeration } from "@/lib/api"

export function AdminUserDetailScreen({ userId }: { userId: string }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmBanOpen, setConfirmBanOpen] = useState(false)

  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    refetchInterval: 10_000,
  })

  const moderationMutation = useMutation({
    mutationFn: (payload: { isBanned: boolean }) =>
      updateAdminUserModeration(userId, { isBanned: payload.isBanned }),
    onSuccess: async () => {
      setConfirmBanOpen(false)
      await queryClient.invalidateQueries({ queryKey: ["admin-user", userId] })
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      await queryClient.invalidateQueries({ queryKey: ["orders"] })
    },
  })

  useBackButton(() => router.push("/admin/users"))

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <AccessStateScreen
        title="Доступ закрыт"
        description="Карточка пользователя доступна только админу."
      />
    )
  }

  if (isLoading) {
    return <UserState title="Загружаю пользователя" description="Подтягиваю профиль и заказы." />
  }

  if (isError || !data?.user) {
    return <UserState title="Пользователь не загрузился" description="Обнови экран или вернись к списку." />
  }

  const user = data.user
  const displayName = [user.firstName, user.lastName || ""].join(" ").trim()
  const canModerate = user.role !== "ADMIN"

  return (
    <Screen noTabBar>
      <ScreenHeader
        title={displayName}
        subtitle={user.username ? `@${user.username}` : `tg:${user.telegramId}`}
        trailing={
          user.isBanned ? (
            <Badge variant="destructive">Бан</Badge>
          ) : user.role === "ADMIN" ? (
            <Badge variant="secondary">Админ</Badge>
          ) : null
        }
      />

      <ScreenBody className="mx-auto w-full max-w-2xl">
        <Card>
          <CardHeader>
            <Avatar size="lg">
              {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={displayName} /> : null}
              <AvatarFallback>{user.firstName.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>
              {user.role === "ADMIN" ? "Администратор" : "Покупатель"} · {formatActiveOrders(user.activeOrderCount)}
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant={user.isBanned ? "secondary" : "destructive"}
                disabled={!canModerate || moderationMutation.isPending}
                onClick={() => {
                  if (!canModerate) return
                  if (user.isBanned) {
                    moderationMutation.mutate({ isBanned: false })
                  } else {
                    setConfirmBanOpen(true)
                  }
                }}
              >
                {user.isBanned ? "Снять бан" : "Забанить"}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field orientation="horizontal">
                <FieldLabel>Telegram ID</FieldLabel>
                <FieldDescription className="text-right">{user.telegramId}</FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>Username</FieldLabel>
                <FieldDescription className="text-right">
                  {user.username ? `@${user.username}` : "Нет"}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>Роль</FieldLabel>
                <FieldDescription className="text-right">
                  {user.role === "ADMIN" ? "Админ" : "Покупатель"}
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel>Активные заказы</FieldLabel>
                <FieldDescription className="text-right">{user.activeOrderCount}</FieldDescription>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>История заказов</CardTitle>
            <CardDescription>{user.orders.length} последних заказов</CardDescription>
          </CardHeader>
          <CardContent>
            {user.orders.length > 0 ? (
              <ItemGroup className="gap-2">
                {user.orders.map((order) => (
                  <Item key={order.id} render={<Link href={`/orders/${order.id}`} />} variant="muted" size="sm">
                    <ItemMedia variant="icon">
                      <History />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
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
                  <EmptyDescription>История появится после первой покупки.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </ScreenBody>

      {confirmBanOpen && !user.isBanned ? (
        <AlertDialog
          open
          onOpenChange={(open) => !moderationMutation.isPending && setConfirmBanOpen(open)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Забанить пользователя?</AlertDialogTitle>
              <AlertDialogDescription>
                Активные неоплаченные заказы будут отменены. Доступ к магазину будет закрыт.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={moderationMutation.isPending}
                onClick={() => {
                  setConfirmBanOpen(false)
                  moderationMutation.mutate({ isBanned: true })
                }}
              >
                Забанить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </Screen>
  )
}

function UserState({ title, description }: { title: string; description: string }) {
  return (
    <Screen noTabBar>
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{title}</EmptyTitle>
              <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    </Screen>
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
