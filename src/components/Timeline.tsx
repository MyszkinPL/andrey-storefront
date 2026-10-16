import { ChevronRight } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';
import { Collapsible as BaseCollapsible } from '@base-ui/react';
import { CollapsibleParts } from './Collapsible';
import { EmptyState } from './EmptyState';
import { Text } from './Text';
import { Tooltip } from './Tooltip';

export type TimelineSentiment = 'neutral' | 'negative';

export type TimelineEntryData = {
  /** Уникальный идентификатор события. */
  id: string;
  /** Метка времени ISO-строкой; показывается как относительное время. */
  timestamp: string;
  title: string;
  summary?: string;
  /** Иконка 16px внутри 32px-круга. */
  icon?: ReactNode;
  /** negative красит круг в background-danger и иконку в red-500. */
  sentiment?: TimelineSentiment;
  /**
   * Важность: `low` сворачивается в раскрывающуюся группу. Донор
   * (`apps/web/src/components/Timeline/Timeline.tsx`, `buildSegments`) кладёт в
   * fold именно `entry.importance === 'low'`, остальное рисует событием.
   */
  importance?: 'low' | 'high';
};

// Донор: `apps/web/src/components/Timeline/Timeline.tsx` — FOLD_THRESHOLD = 1,
// а flush() собирает fold при `buffer.length >= FOLD_THRESHOLD`, то есть
// сворачивается даже ОДНО событие с importance 'low'.
const FOLD_THRESHOLD = 1;

// buildSegments портирован из донора 1:1: критерий фолда — importance 'low'.
function buildSegments(items: TimelineEntryData[]): Array<{ type: 'event'; item: TimelineEntryData } | { type: 'fold'; items: TimelineEntryData[] }> {
  const segments: Array<{ type: 'event'; item: TimelineEntryData } | { type: 'fold'; items: TimelineEntryData[] }> = [];
  let buffer: TimelineEntryData[] = [];

  const flush = () => {
    if (buffer.length >= FOLD_THRESHOLD) {
      segments.push({ type: 'fold', items: buffer });
    } else {
      segments.push(...buffer.map((item) => ({ type: 'event' as const, item })));
    }
    buffer = [];
  };

  for (const item of items) {
    if (item.importance === 'low') {
      buffer.push(item);
    } else {
      flush();
      segments.push({ type: 'event', item });
    }
  }
  flush();

  return segments;
}

export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export type TimelineProps = {
  items: TimelineEntryData[];
  /** Текст пустого состояния. */
  emptyMessage?: string;
};

/**
 * Timeline sealui: строки иконка-круг 32px + заголовок + относительное время
 * (полная дата в Tooltip) + summary; мелкие события подряд сворачиваются
 * в «N collapsed events», раскрытие — на Base UI Collapsible.
 *
 * Донор: `polar-reference/clients/apps/web/src/components/Timeline/Timeline.tsx`
 * (buildSegments, FOLD_THRESHOLD = 1, пустое состояние, divider после раскрытия) и
 * `.../Timeline/TimelineItem.tsx` (TimelineItem, TimelineFold, formatRelativeTime).
 * Прежняя запись «донора нет» была ошибкой поиска и исправлена.
 */
export function Timeline({ items, emptyMessage = 'Events will appear here.' }: TimelineProps) {
  const segments = useMemo(() => buildSegments(items), [items]);

  // Пустое состояние — переиспользуем наш `EmptyState`, а не свою копию
  // (донор Timeline.tsx в этой ветке тоже рисует общую колонку по центру).
  // Заголовок `EmptyState` — `Text size="sm"` (14px), что совпадает с донорским
  // `Text variant="body"` (14px); прежде здесь стоял `size="md"` (16px).
  if (segments.length === 0) {
    return <EmptyState title="No events yet" description={emptyMessage} />;
  }

  return (
    <div className="seal-timeline">
      {segments.map((segment) =>
        segment.type === 'event' ? (
          <TimelineItem key={segment.item.id} item={segment.item} />
        ) : (
          <TimelineFold key={segment.items[0].id} items={segment.items} />
        ),
      )}
    </div>
  );
}

function TimelineItem({ item }: { item: TimelineEntryData }) {
  const negative = item.sentiment === 'negative';
  return (
    <div className="seal-timeline-item" data-sentiment={negative ? 'negative' : undefined}>
      <span className="seal-timeline-icon" aria-hidden>
        {item.icon}
      </span>
      <span className="seal-timeline-body">
        <span className="seal-timeline-title-row">
          {/* Text донора — `variant="title"` (14px/500, line-height 1.5), а у нашего
              Text нет пропа веса — вид держит класс .seal-timeline-title. */}
          <span className="seal-timeline-title">{item.title}</span>
          {/* Донор: TooltipContent side="top" align="end" и полная дата
              dateStyle/timeStyle = 'medium' (TimelineItem.tsx). */}
          <Tooltip
            side="top"
            align="end"
            content={new Date(item.timestamp).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'medium',
            })}
          >
            <time className="seal-timeline-time" dateTime={item.timestamp}>
              {formatRelativeTime(item.timestamp)}
            </time>
          </Tooltip>
        </span>
        {item.summary ? (
          <span className="seal-timeline-summary">
            <Text as="span" size="xs" tone="muted" truncate>
              {item.summary}
            </Text>
          </span>
        ) : null}
      </span>
    </div>
  );
}

/**
 * Раскрытие фолда — Base UI Collapsible (наши части): open-состояние, aria-expanded
 * и связи триггер-панель ведёт Base UI; подпись одна и берёт текст из `state.open`.
 * Донор строки — `TimelineFold` из Timeline.tsx/TimelineItem.tsx: chevron в боксе
 * `h-5 w-8` (20×32), rotate-90 при раскрытии, подписи «N collapsed events» /
 * «Hide collapsed events».
 */
function TimelineFold({ items }: { items: TimelineEntryData[] }) {
  const count = items.length;
  // Донор: `${count} collapsed ${count === 1 ? 'event' : 'events'}`.
  const collapsedLabel = count === 1 ? '1 collapsed event' : `${count} collapsed events`;
  return (
    <div className="seal-timeline-fold-row">
      <CollapsibleParts.Root>
        {/* Одна подпись вместо двух: текст берём из состояния Base UI (`state.open`)
            через render-функцию, а не переключением двух узлов через CSS.
            Донор `TimelineItem.tsx` (TimelineFold) рендерит ровно ОДИН `Text` и
            меняет его текст по `expanded`. Наш `CollapsibleParts.Trigger`
            запечатывает `render` по правилу проекта, поэтому здесь стоит та же
            часть Base UI напрямую — с теми же классами и вариантом кнопки. */}
        <BaseCollapsible.Trigger
          render={(triggerProps, state) => (
            <button
              {...triggerProps}
              className="seal-button seal-collapsible-trigger"
              data-variant="ghost"
              data-size="sm"
            >
              <span className="seal-timeline-fold-chevron" aria-hidden>
                <ChevronRight size={14} />
              </span>
              <span className="seal-timeline-fold-label">
                {state.open ? 'Hide collapsed events' : collapsedLabel}
              </span>
            </button>
          )}
        />
        <CollapsibleParts.Panel>
          {items.map((item) => (
            <TimelineItem key={item.id} item={item} />
          ))}
          <div className="seal-timeline-fold-end" />
        </CollapsibleParts.Panel>
      </CollapsibleParts.Root>
    </div>
  );
}
