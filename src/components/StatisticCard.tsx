import type { ReactNode } from 'react';

export type StatisticCardSize = 'sm' | 'lg';

export type StatisticCardProps = {
  /** Подпись метрики, приглушённым тоном поверх значения. */
  title: string;
  /** Значение; у Polar рендерится mono-шрифтом. */
  children: ReactNode;
  /** sm: padding 16/12, radius 8; lg: padding 20/16, radius 16, значение 20px. */
  size?: StatisticCardSize;
};

/**
 * Polar StatisticCard (`apps/web/src/components/Shared/StatisticCard.tsx`):
 * поверхность gray-50 / dark polar-800, колонка flex-1 с gap 8,
 * sm — `rounded-lg px-4 py-3 text-sm`, lg — `rounded-2xl px-5 py-4` и значение 20px.
 * Рамки нет: в классе донора есть только `dark:border-polar-700` без класса ширины,
 * то есть border-width остаётся 0 и граница не рисуется.
 */
export function StatisticCard({ title, children, size = 'sm' }: StatisticCardProps) {
  return (
    <div className="seal-statistic" data-size={size}>
      <span className="seal-statistic-title">{title}</span>
      <span className="seal-statistic-value">{children}</span>
    </div>
  );
}
