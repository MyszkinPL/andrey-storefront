import { useCallback, useEffect, useRef } from 'react';
import type { Ref, RefCallback } from 'react';

/** Сколько места оставить у края, когда выбранный пункт подъезжает. */
const EDGE_GAP = 32;

/**
 * Горизонтальный ряд (Tabs, SegmentedControl), который шире контейнера,
 * прокручивается. Хук делает две вещи:
 *
 * 1. Держит выбранный пункт в видимой части ряда. Ряд сдвигается только
 *    если пункт виден не целиком, и ровно настолько, чтобы он показался с
 *    отступом от края. Центрирование сдвигало ряд при каждом тапе и
 *    уводило первую вкладку («Все») за край.
 * 2. Помечает ряд `data-overflow-start` / `data-overflow-end`, пока за
 *    левым / правым краем что-то скрыто. CSS гасит этот край градиентом,
 *    так что видно: ряд можно листать.
 *
 * Прокручивается только сам ряд (scrollTo), а не страница, как было бы со
 * scrollIntoView.
 *
 * `selector` — как ряд помечает выбранный пункт: Base UI Tabs ставит
 * `aria-selected="true"`, Toggle в ToggleGroup — `aria-pressed="true"`.
 */
export function useRevealSelected<T extends HTMLElement>(
  selector: string,
  attribute: string,
  forwardedRef?: Ref<T>,
): RefCallback<T> {
  const nodeRef = useRef<T | null>(null);

  useEffect(() => {
    const row = nodeRef.current;
    if (!row) return;

    const markEdges = () => {
      const max = row.scrollWidth - row.clientWidth;
      row.toggleAttribute('data-overflow-start', max > 1 && row.scrollLeft > 1);
      row.toggleAttribute('data-overflow-end', max > 1 && row.scrollLeft < max - 1);
    };

    const reveal = (smooth: boolean) => {
      if (row.scrollWidth <= row.clientWidth) return;
      const item = row.querySelector<HTMLElement>(selector);
      if (!item) return;
      const rowBox = row.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();
      const start = itemBox.left - rowBox.left;
      const end = itemBox.right - rowBox.left;
      let delta = 0;
      if (start < EDGE_GAP) delta = start - EDGE_GAP;
      else if (end > row.clientWidth - EDGE_GAP) delta = end - (row.clientWidth - EDGE_GAP);
      if (delta === 0) return;
      row.scrollTo({ left: row.scrollLeft + delta, behavior: smooth ? 'smooth' : 'auto' });
    };

    reveal(false);
    markEdges();

    const selection = new MutationObserver(() => reveal(true));
    selection.observe(row, { attributes: true, attributeFilter: [attribute], subtree: true });
    // Пункты могут прийти позже (категории грузятся), а ширина — поменяться.
    const content = new MutationObserver(markEdges);
    content.observe(row, { childList: true, subtree: true, characterData: true });
    const size = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(markEdges);
    size?.observe(row);
    row.addEventListener('scroll', markEdges, { passive: true });

    return () => {
      selection.disconnect();
      content.disconnect();
      size?.disconnect();
      row.removeEventListener('scroll', markEdges);
    };
  }, [selector, attribute]);

  return useCallback(
    (node: T | null) => {
      nodeRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef],
  );
}
