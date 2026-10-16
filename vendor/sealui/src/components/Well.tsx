import type { ReactNode } from 'react';
import { Text } from './Text';

export type WellProps = {
  children: ReactNode;
};

/**
 * Polar Shared/Well: `bg-gray-100 dark:bg-polar-800 flex flex-col gap-y-4
 * rounded-3xl p-8` — радиус 24, padding 32, вертикальный gap 16, без рамки.
 * Поверхность = --seal-background-card (ровно эта пара gray-100 / polar-800).
 */
export function Well({ children }: WellProps) {
  return <div className="seal-well">{children}</div>;
}

export type WellHeaderLayout = 'stacked' | 'split';

export type WellHeaderProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Кнопка/инструмент справа; при его наличии split включается по умолчанию. */
  action?: ReactNode;
  layout?: WellHeaderLayout;
  children?: ReactNode;
};

/**
 * Шапка Well. С пропсами title/description/action воспроизводит частый
 * паттерн Polar (копия слева с gap 8, действие справа); без них рендерит
 * детей как есть.
 */
export function WellHeader({ title, description, action, layout, children }: WellHeaderProps) {
  const resolved: WellHeaderLayout = layout ?? (action != null ? 'split' : 'stacked');
  return (
    <div className="seal-well-header" data-layout={resolved}>
      {title != null || description != null ? (
        <div className="seal-well-header-copy">
          {title != null ? <div className="seal-well-header-title">{title}</div> : null}
          {description != null ? (
            <div className="seal-well-header-description">
              <Text as="div" tone="muted">
                {description}
              </Text>
            </div>
          ) : null}
        </div>
      ) : null}
      {action != null ? <div className="seal-well-header-action">{action}</div> : null}
      {children}
    </div>
  );
}

export type WellContentProps = {
  children: ReactNode;
};

/** Основное содержимое Well: вертикальный поток с gap 8. */
export function WellContent({ children }: WellContentProps) {
  return <div className="seal-well-content">{children}</div>;
}

export type WellFooterProps = {
  children: ReactNode;
};

/** Нижний блок Well: вертикальный поток с gap 8. */
export function WellFooter({ children }: WellFooterProps) {
  return <div className="seal-well-footer">{children}</div>;
}
