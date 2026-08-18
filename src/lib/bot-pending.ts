export type PendingAction =
  | { kind: "deliverKey"; orderId: string }
  | { kind: "setPrice"; productId: string }
  | { kind: "addKeys"; productId: string }
  | { kind: "newProductTitle" }
  | { kind: "newProductPrice"; title: string }

export const PENDING_TTL_MS = 10 * 60 * 1000

/**
 * Multi-step admin actions (typing a key, a price, a title) need to remember
 * what the admin's next message means. Kept in memory with a short TTL: the
 * state is cheap to rebuild by tapping the button again, so it is not worth a
 * table. Note this is per-process — with several replicas a half-finished
 * action can land on another container and simply expire.
 */
const pending = new Map<number, { action: PendingAction; at: number }>()

export function setPending(telegramId: number, action: PendingAction) {
  pending.set(telegramId, { action, at: Date.now() })
}

/** Returns the action and forgets it. Expired entries count as absent. */
export function takePending(telegramId: number): PendingAction | null {
  const entry = pending.get(telegramId)
  if (!entry) return null

  pending.delete(telegramId)
  if (Date.now() - entry.at > PENDING_TTL_MS) return null
  return entry.action
}

export function clearPending(telegramId: number) {
  pending.delete(telegramId)
}
