"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Badge,
  Button,
  Cell,
  Input,
  Modal,
  Placeholder,
  Section,
  SegmentedControl,
} from "@telegram-apps/telegram-ui"
import { Ban, History, Search, ShieldCheck } from "lucide-react"

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

      <ScreenBody className="gap-3">
        <Section>
          <Input
            value={search}
            before={<Search size={18} />}
            placeholder="Имя, username или Telegram ID"
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
          />
        </Section>

        <SegmentedControl>
          {[
            { key: "all" as const, label: "Все" },
            { key: "buyers" as const, label: "Покупатели" },
            { key: "admins" as const, label: "Админы" },
            { key: "banned" as const, label: "Бан" },
          ].map((item) => (
            <SegmentedControl.Item
              key={item.key}
              selected={filter === item.key}
              onClick={() => {
                setFilter(item.key)
                setPage(1)
              }}
            >
              {item.label}
            </SegmentedControl.Item>
          ))}
        </SegmentedControl>

        {isLoading ? (
          <Placeholder header="Загружаю пользователей" description="Подтягиваю модерацию.">
            <ShieldCheck size={32} />
          </Placeholder>
        ) : isError ? (
          <Placeholder header="Список не загрузился" description="Обнови экран или попробуй позже.">
            <ShieldCheck size={32} />
          </Placeholder>
        ) : users.length === 0 ? (
          <Placeholder header="Никого не найдено" description="Смени фильтр или запрос.">
            <ShieldCheck size={32} />
          </Placeholder>
        ) : (
          <Section
            footer={
              data?.summary
                ? `Всего: ${data.summary.total} · покупатели: ${data.summary.buyers} · админы: ${data.summary.admins} · бан: ${data.summary.banned}`
                : undefined
            }
          >
            {users.map((user) => (
              <Cell
                key={user.id}
                multiline
                titleBadge={
                  user.isBanned ? (
                    <Badge type="number" mode="critical">Бан</Badge>
                  ) : user.role === "ADMIN" ? (
                    <Badge type="number" mode="secondary">Админ</Badge>
                  ) : undefined
                }
                subtitle={user.username ? `@${user.username}` : `tg:${user.telegramId}`}
                description={`${user.activeOrderCount} активных заказов`}
                after={<Button size="s" mode="bezeled">Открыть</Button>}
                onClick={() => setSelectedUserId(user.id)}
              >
                {[user.firstName, user.lastName || ""].join(" ").trim()}
              </Cell>
            ))}
          </Section>
        )}

        {data?.pageInfo?.hasMore ? (
          <Button stretched mode="bezeled" onClick={() => setPage((current) => current + 1)}>
            Показать ещё
          </Button>
        ) : null}
      </ScreenBody>

      {selectedUser ? (
        <UserDetailsSheet
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

      <Modal
        open={Boolean(banDraft)}
        onOpenChange={(open) => {
          if (!open && !moderationMutation.isPending) setBanDraft(null)
        }}
        header={<Modal.Header>Блокировка пользователя</Modal.Header>}
      >
        <Section footer="Все активные неоплаченные заказы пользователя будут отменены.">
          <Cell before={<Ban size={24} />} subtitle={banDraft?.name}>
            Забанить пользователя?
          </Cell>
        </Section>
        <div className="grid gap-2 p-4 sm:grid-cols-2">
          <Button stretched mode="gray" onClick={() => setBanDraft(null)}>
            Отмена
          </Button>
          <Button
            stretched
            mode="outline"
            loading={moderationMutation.isPending}
            onClick={() => {
              if (!banDraft) return
              moderationMutation.mutate({ id: banDraft.id, isBanned: true })
            }}
          >
            Забанить
          </Button>
        </div>
      </Modal>
    </Screen>
  )
}

function UserDetailsSheet({
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
    <Modal open onOpenChange={(open) => !open && onClose()} header={<Modal.Header>{[user.firstName, user.lastName || ""].join(" ").trim()}</Modal.Header>}>
      {userQuery.isLoading && !detailedUser ? (
        <Placeholder header="Загружаю пользователя" />
      ) : (
        <>
          <Section header="Профиль">
            <Cell subtitle={user.username ? `@${user.username}` : `tg:${user.telegramId}`}>
              Telegram
            </Cell>
            <Cell
              titleBadge={user.isBanned ? <Badge type="number" mode="critical">Бан</Badge> : undefined}
              subtitle={user.role === "ADMIN" ? "Администратор" : "Покупатель"}
            >
              Доступ
            </Cell>
            <Cell subtitle={String(user.activeOrderCount)}>Активные заказы</Cell>
          </Section>

          <Section header="История заказов">
            {user.orders.length > 0 ? (
              user.orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`}>
                  <Cell
                    multiline
                    before={<History size={22} />}
                    subtitle={[
                      `#${order.number}`,
                      order.productCategory,
                      order.priceRub ? `${order.priceRub.toLocaleString("ru-RU")} ₽` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    after={renderOrderStatus(order.status, order.isPaid)}
                  >
                    {order.productTitle || `Заказ #${order.number}`}
                  </Cell>
                </Link>
              ))
            ) : (
              <Cell>Заказов пока нет</Cell>
            )}
          </Section>

          <div className="grid gap-2 p-4 sm:grid-cols-2">
            <Button stretched mode="gray" onClick={onClose}>
              Закрыть
            </Button>
            <Button
              stretched
              mode={user.isBanned ? "bezeled" : "outline"}
              loading={moderationPending}
              disabled={user.role === "ADMIN"}
              onClick={onToggleBan}
            >
              {user.role === "ADMIN" ? "Админ" : user.isBanned ? "Снять бан" : "Забанить"}
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}

function renderOrderStatus(status: string, isPaid: boolean) {
  if (status === "CANCELLED") return "Отменён"
  if (status === "CLOSED") return isPaid ? "Завершён" : "Закрыт"
  if (status === "PAYMENT_REVIEW") return "Проверка"
  if (!isPaid) return "Оплата"
  return "Оплачен"
}
