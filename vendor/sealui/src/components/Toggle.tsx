import { Toggle as BaseToggle } from '@base-ui/react/toggle';
import type { ReactNode } from 'react';

/** Полное событие Base UI `Toggle` — пробрасывается наружу без потерь. */
export type ToggleChangeEventDetails = BaseToggle.ChangeEventDetails;

export type ToggleProps = {
  children: ReactNode;
  /** Base UI `Toggle.value` — идентификатор тоггла внутри ToggleGroup. */
  value?: string;
  /** Управляемое состояние нажатия (парный к `defaultPressed`). */
  pressed?: boolean;
  /** Base UI `Toggle.onPressedChange` — вместе с eventDetails (reason/details). */
  onPressedChange?: (pressed: boolean, eventDetails: ToggleChangeEventDetails) => void;
  /** Неконтролируемое стартовое состояние нажатия. */
  defaultPressed?: boolean;
  /** Base UI `Toggle.disabled`. */
  disabled?: boolean;
  'aria-label'?: string;
};

/**
 * Одиночная toggle-кнопка (Base UI Toggle) в Polar-стиле toolbar-кнопок.
 *
 * Переиспользование скина: визуал берётся из одного места — класс
 * `seal-button` с `data-variant="ghost"`, а компактные метрики (32px)
 * объявлены в tokens.css общей парой `.seal-toggle, .seal-toolbar-button`,
 * то есть Toggle и ToolbarButton не дублируют друг друга.
 *
 * Элемент остаётся частью Base UI: обернуть его в компонент `Button`
 * нельзя — `Button` принимает фиксированный набор пропсов и не пробрасывает
 * `aria-pressed`/`data-pressed`, которые Base UI накладывает на элемент;
 * нажатое состояние потерялось бы и в CSS, и для скринридера.
 */
export function Toggle({
  children,
  value,
  pressed,
  onPressedChange,
  defaultPressed,
  disabled = false,
  'aria-label': ariaLabel,
}: ToggleProps) {
  return (
    <BaseToggle
      className="seal-button seal-toggle"
      data-variant="ghost"
      value={value}
      pressed={pressed}
      defaultPressed={defaultPressed}
      onPressedChange={
        onPressedChange ? (nextPressed, eventDetails) => onPressedChange(nextPressed, eventDetails) : undefined
      }
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </BaseToggle>
  );
}
