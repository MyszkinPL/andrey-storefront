"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, History, Search, ShieldCheck, X } from "lucide-react"

import { getAdminUser, getAdminUsers, getMe, updateAdminUserModeration } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

export function AdminUsersScreen() {
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "buyers" | "admins" | "banned">("all")
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", search, filter, page],
    queryFn: () =>
      getAdminUsers({
        q: search,
        filter,
        page,
        limit: 30,
      }),
    refetchInterval: 10_000,
  })
  const [banDraft, setBanDraft] = useState<null | { id: string; name: string }>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const moderationMutation = useMutation({
    mutationFn: (payload: { id: string; isBanned: boolean }) =>
      updateAdminUserModeration(payload.id, {
        isBanned: payload.isBanned,
      }),
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
        <section className="ui-card p-3">
          <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
            <Search size={16} className="text-[var(--color-muted)]" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Поиск по имени, username или telegram id"
              className="w-full bg-transparent text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </label>

          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: "all" as const, label: "Все" },
              { key: "buyers" as const, label: "Покупатели" },
              { key: "admins" as const, label: "Админы" },
              { key: "banned" as const, label: "Забаненные" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setFilter(item.key)
                  setPage(1)
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-xs sm:text-sm transition-colors",
                  filter === item.key
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                    : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {data?.summary ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <InlineMeta label="Всего" value={String(data.summary.total)} />
              <InlineMeta label="Покупатели" value={String(data.summary.buyers)} />
              <InlineMeta label="Админы" value={String(data.summary.admins)} />
              <InlineMeta label="Бан" value={String(data.summary.banned)} />
            </div>
          ) : null}
        </section>

        {isLoading ? (
          <ScreenEmpty
            icon={<ShieldCheck size={28} className="text-[var(--color-muted)]" />}
            title="Загружаю пользователей"
            subtitle="Подтягиваю модерацию."
          />
        ) : isError ? (
          <ScreenEmpty
            icon={<ShieldCheck size={28} className="text-[var(--color-muted)]" />}
            title="Список не загрузился"
            subtitle="Обнови экран или попробуй позже."
          />
        ) : users.length === 0 ? (
          <ScreenEmpty
            icon={<ShieldCheck size={28} className="text-[var(--color-muted)]" />}
            title="Никого не найдено"
            subtitle="Смени фильтр или запрос."
          />
        ) : (
          <div className="grid gap-3">
            {users.map((user) => (
              <section
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className="ui-card cursor-pointer p-4 text-left transition-transform duration-150 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-[var(--color-text)]">
                        {[user.firstName, user.lastName || ""].join(" ").trim()}
                      </p>
                      <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
                        {user.role === "ADMIN" ? "Админ" : "Покупатель"}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px]",
                          user.isBanned
                            ? "bg-[var(--color-destructive)]/14 text-[var(--color-destructive)]"
                            : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                        )}
                      >
                        {user.isBanned ? "Забанен" : "Активен"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {user.username ? `@${user.username}` : `tg:${user.telegramId}`}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <InlineMeta label="Заказы" value={String(user.activeOrderCount)} />
                      <InlineMeta
                        label="Доступ"
                        value={
                          user.role === "ADMIN"
                            ? "Админ"
                            : user.isBanned
                              ? "Блок"
                              : "Активен"
                        }
                      />
                      <InlineMeta label="ID" value={user.telegramId} truncate />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setSelectedUserId(user.id)
                    }}
                    className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)]"
                  >
                    Открыть
                  </button>
                </div>
              </section>
            ))}
            {data?.pageInfo?.hasMore ? (
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                className="ui-card py-3 text-sm font-medium text-[var(--color-text)]"
              >
                Показать ещё
              </button>
            ) : null}
          </div>
        )}
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

      {banDraft ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-3 md:items-center">
          <div className="ui-card w-full max-w-xl p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-[var(--color-text)]">
                  Блокировка пользователя
                </p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{banDraft.name}</p>
              </div>
              <button
                onClick={() => {
                  setBanDraft(null)
                }}
                className="flex size-10 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 rounded-[20px] bg-[var(--color-bg)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-destructive)]/14 text-[var(--color-destructive)]">
                  <Ban size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    Все активные заказы будут автоматически отменены.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => {
                  setBanDraft(null)
                }}
                className="rounded-full bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-text)]"
              >
                Отмена
              </button>
              <button
                onClick={() =>
                  moderationMutation.mutate({
                    id: banDraft.id,
                    isBanned: true,
                  })
                }
                className="rounded-full bg-[var(--color-destructive)] px-4 py-2 text-sm font-medium text-white"
              >
                Забанить
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  const [ordersOpen, setOrdersOpen] = useState(true)
  const userQuery = useQuery<Awaited<ReturnType<typeof getAdminUser>>>({
    queryKey: ["admin-user", userId],
    queryFn: () => getAdminUser(userId),
    refetchInterval: 10_000,
  })
  const detailedUser = userQuery.data?.user
  const user = detailedUser ?? fallbackUser

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] p-0 sm:p-3 md:items-center md:p-6"
      onClick={onClose}
    >
      <div
        className="ui-card flex h-[min(100dvh,920px)] w-full max-w-2xl flex-col overflow-hidden rounded-b-none rounded-t-[28px] sm:h-[min(92vh,920px)] sm:rounded-[32px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-semibold text-[var(--color-text)]">
                  {[user.firstName, user.lastName || ""].join(" ").trim()}
                </p>
                <span className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-[10px] text-[var(--color-muted)]">
                  {user.role === "ADMIN" ? "Админ" : "Покупатель"}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px]",
                    user.isBanned
                      ? "bg-[var(--color-destructive)]/14 text-[var(--color-destructive)]"
                      : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                  )}
                >
                  {user.isBanned ? "Забанен" : "Активен"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {user.username ? `@${user.username}` : `tg:${user.telegramId}`}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg)] text-[var(--color-muted)]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
          {userQuery.isLoading && !detailedUser ? (
            <div className="rounded-[20px] bg-[var(--color-bg)] px-4 py-10 text-center text-sm text-[var(--color-muted)]">
              Загружаю пользователя…
            </div>
          ) : (
            <div className="grid gap-3">
              <section className="ui-card-soft p-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  <DetailMetric label="Активные заказы" value={String(user.activeOrderCount)} />
                  <DetailMetric
                    label="Доступ"
                    value={
                      user.role === "ADMIN" ? "Админ" : user.isBanned ? "Заблокирован" : "Активен"
                    }
                  />
                  <DetailMetric label="Telegram ID" value={user.telegramId} />
                </div>
              </section>

              <section className="ui-card-soft p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <History size={15} className="text-[var(--color-muted)]" />
                    <p className="text-sm font-semibold text-[var(--color-text)]">История заказов</p>
                    <span className="text-xs text-[var(--color-muted)]">{user.orders.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrdersOpen((current) => !current)}
                    className="rounded-full bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text)]"
                  >
                    {ordersOpen ? "Скрыть" : "Показать"}
                  </button>
                </div>

                {ordersOpen ? (
                  user.orders.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {user.orders.map((order) => (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="rounded-[18px] bg-[var(--color-bg)] px-4 py-3 transition-colors hover:bg-[var(--color-surface)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                                {order.productTitle || `Заказ #${order.number}`}
                              </p>
                              <p className="mt-1 text-xs text-[var(--color-muted)]">
                                #{order.number}
                                {order.productCategory ? ` · ${order.productCategory}` : ""}
                                {order.priceRub ? ` · ${order.priceRub.toLocaleString("ru-RU")} ₽` : ""}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-[var(--color-text)]">
                                {renderOrderStatus(order.status, order.isPaid)}
                              </p>
                              <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                                {new Date(order.updatedAt).toLocaleDateString("ru-RU")}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-[18px] bg-[var(--color-bg)] px-4 py-4 text-sm text-[var(--color-muted)]">
                      Заказов пока нет.
                    </div>
                  )
                ) : null}
              </section>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[18px] bg-[var(--color-bg)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)]"
            >
              Закрыть
            </button>
            <button
              type="button"
              onClick={onToggleBan}
              disabled={moderationPending || user.role === "ADMIN"}
              className={cn(
                "rounded-[18px] px-4 py-2.5 text-sm font-medium",
                user.role === "ADMIN"
                  ? "bg-[var(--color-bg)] text-[var(--color-muted)]"
                  : user.isBanned
                    ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                    : "bg-[var(--color-destructive)] text-white",
              )}
            >
              {user.role === "ADMIN"
                ? "Админ не модерируется"
                : user.isBanned
                  ? "Снять бан"
                  : "Забанить пользователя"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailMetric({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-[16px] bg-[var(--color-bg)] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">{value}</p>
    </div>
  )
}

function InlineMeta({
  label,
  value,
  truncate = false,
}: {
  label: string
  value: string
  truncate?: boolean
}) {
  return (
    <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[var(--color-bg)] px-3 py-1.5">
      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </span>
      <span
        className={cn(
          "text-xs font-medium text-[var(--color-text)]",
          truncate && "max-w-[112px] truncate",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function renderOrderStatus(status: string, isPaid: boolean) {
  if (status === "CANCELLED") return "Отменён"
  if (status === "CLOSED") return isPaid ? "Завершён" : "Закрыт"
  if (status === "PAYMENT_REVIEW") return "Проверка оплаты"
  if (!isPaid) return "Ждёт оплату"
  return "Оплачен"
}
