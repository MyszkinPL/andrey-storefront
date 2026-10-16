import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react';

export type TruncatedProps = {
  children: ReactNode;
  /** Число строк до обрезки: 1 → nowrap+ellipsis, >1 → line-clamp (orbit lines). */
  lines?: number;
  /** Своё содержимое тултипа; по умолчанию показывается сам текст. */
  tooltip?: ReactNode;
};

/**
 * Обрезка текста с тултипом — порт orbit/Truncated на Base UI Tooltip:
 * тултип рендерится только когда содержимое реально переполняет контейнер
 * (замер scrollWidth/scrollHeight + ResizeObserver, как у orbit), delay 200ms,
 * sideOffset 4. Перенос не инжектирует <style>: clamp-правила статичны
 * в tokens.css, число строк задаётся CSS-переменной --seal-truncate-lines.
 */
export function Truncated({ children, lines = 1, tooltip }: TruncatedProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const overflows = (node: Element) =>
      lines === 1 ? node.scrollWidth > node.clientWidth : node.scrollHeight > node.clientHeight;

    const measure = () => {
      let truncated = overflows(el);
      if (!truncated) {
        for (const child of Array.from(el.children)) {
          if (overflows(child)) {
            truncated = true;
            break;
          }
        }
      }
      setOverflowing(truncated);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [lines, children]);

  return (
    <BaseTooltip.Provider delay={200}>
      <BaseTooltip.Root>
        <BaseTooltip.Trigger
          render={
            <span
              ref={ref}
              className="seal-truncated"
              data-multiline={lines > 1 ? '' : undefined}
              style={{ '--seal-truncate-lines': lines } as CSSProperties}
              tabIndex={overflowing ? 0 : undefined}
            />
          }
        >
          {children}
        </BaseTooltip.Trigger>
        {overflowing && (
          <BaseTooltip.Portal>
            <BaseTooltip.Positioner sideOffset={4} className="seal-popup-positioner seal-popup-positioner--above">
              <BaseTooltip.Popup className="seal-truncated-popup">{tooltip ?? children}</BaseTooltip.Popup>
            </BaseTooltip.Positioner>
          </BaseTooltip.Portal>
        )}
      </BaseTooltip.Root>
    </BaseTooltip.Provider>
  );
}
