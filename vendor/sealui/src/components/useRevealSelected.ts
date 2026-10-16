import { useCallback, useEffect, useRef } from 'react';
import type { Ref, RefCallback } from 'react';

/**
 * Горизонтальный ряд (Tabs, SegmentedControl), который шире контейнера,
 * прокручивается. Хук держит выбранный элемент в видимой области: при
 * монтировании — сразу, при смене выбора — плавно, по центру ряда.
 * Прокручивается только сам ряд (scrollTo), а не страница, как было бы
 * со scrollIntoView.
 *
 * `selector` — как ряд помечает выбранный элемент: Base UI Tabs ставит
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

    const reveal = (smooth: boolean) => {
      if (row.scrollWidth <= row.clientWidth) return;
      const item = row.querySelector<HTMLElement>(selector);
      if (!item) return;
      const rowBox = row.getBoundingClientRect();
      const itemBox = item.getBoundingClientRect();
      const itemLeft = itemBox.left - rowBox.left + row.scrollLeft;
      const left = itemLeft - (row.clientWidth - itemBox.width) / 2;
      row.scrollTo({ left: Math.max(0, left), behavior: smooth ? 'smooth' : 'auto' });
    };

    reveal(false);
    const observer = new MutationObserver(() => reveal(true));
    observer.observe(row, { attributes: true, attributeFilter: [attribute], subtree: true });
    return () => observer.disconnect();
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
