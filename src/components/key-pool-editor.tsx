"use client"

import { KeyRound, Plus, Trash2, Undo2 } from "lucide-react"
import { useState } from "react"
import { Button, Input, Pill, Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { Section } from "@/components/screen"

/** Splits pasted or typed text into keys: one per line, blanks dropped. */
export function splitKeys(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * The key pool of an auto-delivery product. One input with an "Add" button
 * puts a key straight into the list, marked as new until the product is
 * saved; pasting several lines adds them all at once. Keys already in
 * stock sit in the same list and can be taken out (and put back) before
 * saving. Nothing is written until the editor's own Save.
 */
export function KeyPoolEditor({
  existing,
  removedIds,
  pending,
  onRemovedIdsChange,
  onPendingChange,
}: {
  existing: Array<{ id: string; value: string }>
  removedIds: string[]
  pending: string[]
  onRemovedIdsChange: (ids: string[]) => void
  onPendingChange: (keys: string[]) => void
}) {
  const { t, tp } = useI18n()
  const [draft, setDraft] = useState("")
  const [duplicate, setDuplicate] = useState(false)

  const inStock = existing.length - removedIds.length

  function add(raw: string) {
    const known = new Set([...existing.map((key) => key.value), ...pending])
    const fresh: string[] = []
    let skipped = false
    for (const key of splitKeys(raw)) {
      if (known.has(key)) {
        skipped = true
        continue
      }
      known.add(key)
      fresh.push(key)
    }
    setDuplicate(skipped && fresh.length === 0)
    if (fresh.length > 0) onPendingChange([...fresh, ...pending])
    setDraft("")
  }

  return (
    <Section
      action={
        <Pill color={inStock + pending.length > 0 ? "green" : "yellow"}>
          {tp("adminProductEditor.keysInStockCount", inStock + pending.length)}
        </Pill>
      }
      hint={t("adminProductEditor.keyPoolHint")}
      title={t("adminProductEditor.keyPool")}
    >
      <form
        className="shop-key-add"
        onSubmit={(event) => {
          event.preventDefault()
          add(draft)
        }}
      >
        <Input
          aria-label={t("adminProductEditor.addNewKeys")}
          autoComplete="off"
          id="product-key-draft"
          onChange={(event) => {
            setDuplicate(false)
            setDraft(event.target.value)
          }}
          onPaste={(event) => {
            // A column of keys copied from a spreadsheet lands as many keys,
            // not as one line with the breaks stripped out.
            const text = event.clipboardData.getData("text")
            if (/\r?\n/.test(text.trim())) {
              event.preventDefault()
              add(text)
            }
          }}
          placeholder={t("adminProductEditor.keyPlaceholder")}
          value={draft}
        />
        <Button disabled={!draft.trim()} icon={<Plus size={16} aria-hidden />} type="submit" variant="secondary">
          {t("adminProductEditor.add")}
        </Button>
      </form>

      {duplicate ? (
        <Text as="p" size="xs" tone="warning">
          {t("adminProductEditor.keyDuplicate")}
        </Text>
      ) : null}

      {pending.length > 0 || existing.length > 0 ? (
        <div className="shop-keys">
          {pending.map((key) => (
            <div className="shop-key" key={`new:${key}`}>
              <KeyRound aria-hidden size={16} />
              <span className="shop-key-value">{key}</span>
              <Pill color="blue">{t("adminProductEditor.keyNew")}</Pill>
              <Button
                aria-label={t("adminProductEditor.removeKey")}
                onClick={() => onPendingChange(pending.filter((item) => item !== key))}
                size="icon"
                variant="ghost"
              >
                <Trash2 size={16} aria-hidden />
              </Button>
            </div>
          ))}
          {existing.map((key) => {
            const removed = removedIds.includes(key.id)
            return (
              <div className="shop-key" data-removed={removed ? "" : undefined} key={key.id}>
                <KeyRound aria-hidden size={16} />
                <span className="shop-key-value">{key.value}</span>
                {removed ? (
                  <Button
                    aria-label={t("adminProductEditor.keyRestore")}
                    onClick={() => onRemovedIdsChange(removedIds.filter((id) => id !== key.id))}
                    size="icon"
                    variant="ghost"
                  >
                    <Undo2 size={16} aria-hidden />
                  </Button>
                ) : (
                  <Button
                    aria-label={t("adminProductEditor.removeKey")}
                    onClick={() => onRemovedIdsChange([...removedIds, key.id])}
                    size="icon"
                    variant="ghost"
                  >
                    <Trash2 size={16} aria-hidden />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <Text as="p" size="sm" tone="muted">
          {t("adminProductEditor.keyPoolEmpty")}
        </Text>
      )}
    </Section>
  )
}
