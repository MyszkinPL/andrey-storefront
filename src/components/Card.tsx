import type { ReactNode } from 'react';
import { Text } from './Text';

export type CardProps = {
  children: ReactNode;
};

/**
 * Polar SettingsGroup: `divide-y divide-gray-200 dark:divide-polar-700
 * rounded-2xl ring-1 ring-gray-200 dark:ring-polar-700 bg-transparent
 * dark:bg-polar-900 overflow-hidden` — радиус 16, кольцо 1px (box-shadow,
 * не border), разделители между строками, цвет текста наследуется.
 */
export function Card({ children }: CardProps) {
  return <div className="seal-card">{children}</div>;
}

export type SettingLayout = 'split' | 'stacked' | 'inline';

export type SettingProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Polar SettingsGroupItem layouts; split по умолчанию. */
  layout?: SettingLayout;
};

/**
 * Строка настройки Polar: заголовок + описание слева (max 50% на md+), контрол справа.
 * Самая частая композиция в Polar — карточка из таких строк.
 */
export function Setting({ title, description, children, layout = 'split' }: SettingProps) {
  return (
    <div className="seal-setting" data-layout={layout}>
      <div className="seal-setting-body">
        <div className="seal-setting-title">
          <Text as="div" size="sm">
            {title}
          </Text>
        </div>
        {description ? (
          <div className="seal-setting-description">
            <Text as="div" size="xs" tone="muted">
              {description}
            </Text>
          </div>
        ) : null}
      </div>
      <div className="seal-setting-control">{children}</div>
    </div>
  );
}
