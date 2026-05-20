"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, ChevronDown, History, Search, ShieldCheck, X } from "lucide-react"

import { getAdminUsers, getMe, updateAdminUserModeration } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

export function AdminUsersScreen() {
  const queryClient = useQueryClient()
  const { data: meData } = useQuery({ queryKey: ["me"], queryFn: getMe })
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
    refetchInterval: 10_000,
  })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "buyers" | "admins" | "banned">("all")
  const [banDraft, setBanDraft] = useState<null | { id: string; name: string }>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const moderationMutation = useMutation({
    mutationFn: (payload: { id: string; isBanned: boolean }) =>
      updateAdminUserModeration(payload.id, {
        isBanned: payload.isBanned,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      setBanDraft(null)
    },
  })

  const users = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (data?.users ?? []).filter((user) => {
      if (filter === "buyers" && user.role !== "USER") return false
      if (filter === "admins" && user.role !== "ADMIN") return false
      if (filter === "banned" && !user.isBanned) return false
      if (!query) return true
      return `${user.firstName} ${user.lastName || ""} ${user.username || ""} ${user.telegramId}`
        .toLowerCase()
        .includes(query)
    })
  }, [data?.users, filter, search])

  if (meData && meData.user.role !== "ADMIN") {
    return (
      <Screen>
        <ScreenHeader title="Доступ закрыт" subtitle="Модерация доступна только админу." />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader title="Модерация" subtitle="Баны, активность и контроль покупателей" />

      <ScreenBody className="gap-4">
        <section className="ui-card p-3 sm:p-4">
          <label className="ui-card-soft flex items-center gap-3 px-4 py-3">
            <Search size={16} className="text-[var(--color-muted)]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
                onClick={() => setFilter(item.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors",
                  filter === item.key
                    ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                    : "bg-[var(--color-bg)] text-[var(--color-muted)]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {users.length === 0 ? (
          <ScreenEmpty
            icon={<ShieldCheck size={28} className="text-[var(--color-muted)]" />}
            title="Никого не найдено"
            subtitle="Смени фильтр или запрос."
          />
        ) : (
          <div className="grid gap-3">
            {users.map((user) => (
              <section key={user.id} className="ui-card p-4">
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
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (user.role === "ADMIN") return
                      if (user.isBanned) {
                        moderationMutation.mutate({ id: user.id, isBanned: false })
                      } else {
                        setBanDraft({
                          id: user.id,
                          name: [user.firstName, user.lastName || ""].join(" ").trim(),
                        })
                      }
                    }}
                    disabled={moderationMutation.isPending || user.role === "ADMIN"}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-medium",
                      user.role === "ADMIN"
                        ? "bg-[var(--color-bg)] text-[var(--color-muted)]"
                        : user.isBanned
                        ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                        : "bg-[var(--color-destructive)]/14 text-[var(--color-destructive)]",
                    )}
                  >
                    {user.role === "ADMIN" ? "Недоступно" : user.isBanned ? "Снять бан" : "Забанить"}
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Metric label="Активных заказов" value={String(user.activeOrderCount)} />
                  <Metric label="Telegram ID" value={user.telegramId} />
                  <Metric
                    label="Доступ"
                    value={
                      user.role === "ADMIN"
                        ? "Админ"
                        : user.isBanned
                          ? "Заблокирован"
                          : "Активен"
                    }
                  />
                </div>

                {user.orders.length > 0 ? (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedUserId((current) => (current === user.id ? null : user.id))
                      }
                      className="flex w-full items-center justify-between rounded-[18px] bg-[var(--color-bg)] px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <History size={15} className="text-[var(--color-muted)]" />
                        <span className="text-sm font-medium text-[var(--color-text)]">
                          История заказов
                        </span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {user.orders.length}
                        </span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "text-[var(--color-muted)] transition-transform",
                          expandedUserId === user.id && "rotate-180",
                        )}
                      />
                    </button>

                    {expandedUserId === user.id ? (
                      <div className="mt-3 grid gap-2">
                        {user.orders.map((order) => (
                          <Link
                            key={order.id}
                            href={`/tickets/${order.id}`}
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
                    ) : null}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        )}
      </ScreenBody>

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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-[var(--color-bg)] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[var(--color-text)]">{value}</p>
    </div>
  )
}

function renderOrderStatus(status: string, isPaid: boolean) {
  if (status === "CANCELLED") return "Отменён"
  if (status === "CLOSED") return isPaid ? "Завершён" : "Закрыт"
  if (status === "PAYMENT_REVIEW") return "Проверка оплаты"
  if (status === "IN_PROGRESS") return "В работе"
  if (!isPaid) return "Ждёт оплату"
  return "Оплачен"
}
