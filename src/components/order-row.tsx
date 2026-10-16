"use client"

import Link from "next/link"
import { PackageSearch } from "lucide-react"
import { Text } from "sealui"

import { useI18n } from "@/components/i18n-provider"
import { OrderTimeLeft } from "@/components/order-time-left"
import { useRelativeTime } from "@/hooks/use-relative-time"
import type { OrderSummary } from "@/lib/contracts"
import { formatPrice } from "@/lib/format"
import { orderPillColor, orderStatusKey } from "@/lib/order-status"

/**
 * One order in a list, the way a shop app shows a purchase: the product's
 * cover, its name and number, the price, and the state as a coloured dot
 * with a word under it. A row of truncated "#12 · category · method · 46…"
 * told nothing a glance could use.
 */
export function OrderRow({ order }: { order: OrderSummary }) {
  const { t, locale, currency } = useI18n()
  const formatRelative = useRelativeTime()

  return (
    <Link className="shop-item" href={`/orders/${order.id}`}>
      <span className="shop-item-media">
        {order.productImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" src={order.productImageUrl} />
        ) : (
          <PackageSearch aria-hidden />
        )}
      </span>

      <span className="shop-item-copy">
        <Text as="span" size="sm" truncate>
          {order.productTitle || order.subject}
        </Text>
        <Text as="span" size="xs" tone="muted" truncate>
          {`#${order.number} · `}
          {/* The clock matters more than "5 min ago" while the order is
              still waiting to be paid. */}
          <OrderTimeLeft fallback={formatRelative(order.updatedAt)} order={order} />
        </Text>
      </span>

      <span className="shop-item-side">
        {order.priceRub ? (
          <Text as="span" size="sm" tabularNums>
            {formatPrice(order.priceRub, locale, currency)}
          </Text>
        ) : null}
        <span className="shop-item-state" data-color={orderPillColor(order)}>
          {t(orderStatusKey(order))}
        </span>
      </span>
    </Link>
  )
}

/** The rows stacked with hairlines between them, straight on the page. */
export function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <div className="shop-list">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} />
      ))}
    </div>
  )
}
