import type { MouseEventHandler, ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';
import { Text } from './Text';

export type EmptyStateAction = {
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  /** Иконка слева, как у Button (в Polar actions — полные ButtonProps). */
  icon?: ReactNode;
  /** Спиннер вместо текста, кнопка при этом заблокирована. */
  loading?: boolean;
  disabled?: boolean;
};

export type EmptyStateProps = {
  /** Знаковая иконка крупным приглушённым цветом. */
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  /** Растянуть на свободное место родителя, чтобы совпасть с соседними списками. */
  fill?: boolean;
};

/**
 * Polar Shared/EmptyState: колонка по центру с gap 12, рамка 1px
 * (borderColor="border-primary" = gray-200 / polar-700), радиус 12,
 * padding 48, иконка в контейнере 48px с цветом gray-500 / polar-500
 * (сам svg — 24px), копия по центру без gap, действия в ряд с шагом 16
 * и отступом сверху 16.
 */
export function EmptyState({ icon, title, description, actions, fill = false }: EmptyStateProps) {
  return (
    <div className="seal-empty" data-fill={fill ? '' : undefined}>
      {icon ? (
        <div className="seal-empty-icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      <div className="seal-empty-copy">
        <Text as="h3" size="sm">
          {title}
        </Text>
        {description ? <Text tone="muted">{description}</Text> : null}
      </div>
      {actions && actions.length > 0 ? (
        <div className="seal-empty-actions">
          {actions.map((item, index) => (
            <Button
              key={`${item.label}-${index}`}
              variant={item.variant ?? 'primary'}
              icon={item.icon}
              loading={item.loading}
              disabled={item.disabled}
              onClick={item.onClick}
            >
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
