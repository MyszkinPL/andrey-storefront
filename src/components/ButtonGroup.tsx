import type { MouseEventHandler, ReactNode } from 'react';
import { Button, type ButtonVariant } from './Button';

export type ButtonGroupAction = {
  text: string;
  /** Ведущая иконка (Polar: lucide 16px слева от текста). */
  icon?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  'aria-label'?: string;
};

/**
 * Кортеж: максимум два действия — primary + опциональный ghost, как у Polar.
 * variant/size каждым действием не задаются — ими владеет группа.
 */
export type ButtonGroupActions = readonly [ButtonGroupAction] | readonly [ButtonGroupAction, ButtonGroupAction];

export type ButtonGroupSize = 'sm' | 'md' | 'lg';

export type ButtonGroupAlign = 'start' | 'end';

export type ButtonGroupProps = {
  actions: ButtonGroupActions;
  /** Размер, общий для всех действий группы. */
  size?: ButtonGroupSize;
  /** Прижать группу к правому краю родителя (Polar-паттерн CTA в футере). */
  align?: ButtonGroupAlign;
  /**
   * Разрешить перенос действий на новую строку на узких экранах (по умолчанию да).
   * Расширение sealui: у Polar ButtonGroup переноса нет.
   */
  wrap?: boolean;
};

// Первый — primary, второй — тихий ghost: два equally-weighted не сидят рядом.
const variantForIndex = (index: number): ButtonVariant => (index === 0 ? 'primary' : 'ghost');

export function ButtonGroup({ actions, size = 'md', align = 'start', wrap = true }: ButtonGroupProps) {
  return (
    <div className="seal-button-group" data-align={align} data-wrap={wrap ? '' : undefined}>
      {actions.map((action, index) => (
        <Button
          key={`${index}-${action.text}`}
          variant={variantForIndex(index)}
          size={size}
          icon={action.icon}
          disabled={action.disabled}
          loading={action.loading}
          onClick={action.onClick}
          aria-label={action['aria-label']}
        >
          {action.text}
        </Button>
      ))}
    </div>
  );
}
