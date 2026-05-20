"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, Search, ShieldCheck, X } from "lucide-react"

import { getAdminUsers, updateAdminUserModeration } from "@/lib/api"
import { Screen, ScreenBody, ScreenEmpty, ScreenHeader } from "@/components/screen"
import { cn } from "@/lib/cn"

export function AdminUsersScreen() {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: getAdminUsers,
    refetchInterval: 10_000,
  })
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all")
  const [banDraft, setBanDraft] = useState<null | { id: string; name: string }>(null)
  const [banReason, setBanReason] = useState("")

  const moderationMutation = useMutation({
    mutationFn: (payload: { id: string; isBanned: boolean; banReason?: string }) =>
      updateAdminUserModeration(payload.id, {
        isBanned: payload.isBanned,
        banReason: payload.banReason,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      await queryClient.invalidateQueries({ queryKey: ["tickets"] })
      setBanDraft(null)
      setBanReason("")
    },
  })

  const users = useMemo(() => {
    const query = search.trim().toLowerCase()
    return (data?.users ?? []).filter((user) => {
      if (user.role === "ADMIN") return false
      if (filter === "active" && user.isBanned) return false
      if (filter === "banned" && !user.isBanned) return false
      if (!query) return true
      return `${user.firstName} ${user.lastName || ""} ${user.username || ""} ${user.telegramId}`
        .toLowerCase()
        .includes(query)
    })
  }, [data?.users, filter, search])

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
              { key: "active" as const, label: "Активные" },
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
                      if (user.isBanned) {
                        moderationMutation.mutate({ id: user.id, isBanned: false })
                      } else {
                        setBanDraft({
                          id: user.id,
                          name: [user.firstName, user.lastName || ""].join(" ").trim(),
                        })
                        setBanReason(user.banReason || "")
                      }
                    }}
                    disabled={moderationMutation.isPending}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-medium",
                      user.isBanned
                        ? "bg-[var(--color-bg)] text-[var(--color-text)]"
                        : "bg-[var(--color-destructive)]/14 text-[var(--color-destructive)]",
                    )}
                  >
                    {user.isBanned ? "Снять бан" : "Забанить"}
                  </button>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <Metric label="Активных заказов" value={String(user.activeOrderCount)} />
                  <Metric label="Telegram ID" value={user.telegramId} />
                  <Metric label="Статус" value={user.isBanned ? "Заблокирован" : "В порядке"} />
                </div>

                {user.banReason ? (
                  <div className="mt-3 rounded-[18px] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-muted)]">
                    {user.banReason}
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
                  setBanReason("")
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
                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                    Причина будет показана пользователю на экране блокировки.
                  </p>
                </div>
              </div>
            </div>

            <textarea
              value={banReason}
              onChange={(event) => setBanReason(event.target.value)}
              placeholder="Причина блокировки"
              className="ui-input mt-4 min-h-28"
            />

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => {
                  setBanDraft(null)
                  setBanReason("")
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
                    banReason: banReason.trim() || undefined,
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
