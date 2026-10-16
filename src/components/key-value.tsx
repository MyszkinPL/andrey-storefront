import type { ReactNode } from "react"

/**
 * Label on the left, value on the right, a hairline between rows: the
 * receipt layout. sealui's DetailRow stacks the label over the value,
 * which turned six numbers into a column twice as tall as the screen.
 */
export function KeyValueList({
  items,
}: {
  items: Array<{ label: ReactNode; value: ReactNode; mono?: boolean } | null | false>
}) {
  return (
    <dl className="shop-kv">
      {items.filter(Boolean).map((item, index) =>
        item ? (
          <div className="shop-kv-row" key={index}>
            <dt>{item.label}</dt>
            <dd data-mono={item.mono ? "" : undefined}>{item.value ?? "—"}</dd>
          </div>
        ) : null,
      )}
    </dl>
  )
}
