import type { AriaAttributes, MouseEventHandler, ReactNode, Ref } from 'react';
import { Button as BaseButton, mergeProps } from '@base-ui/react';
import { LoaderCircle } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'outline'
  | 'link'
  | 'underline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  /**
   * Base UI: в disabled-состоянии кнопка остаётся фокусируемой
   * (aria-disabled + data-disabled вместо нативного disabled). В Polar режима нет.
   */
  focusableWhenDisabled?: boolean;
  /** Polar: спиннер по центру, содержимое скрыто, ширина сохранена. */
  loading?: boolean;
  /** Растянуть на всю ширину контейнера. */
  fullWidth?: boolean;
  /** Ведущая иконка слева от текста (Polar: lucide 16px + gap 8px). */
  icon?: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children: ReactNode;
  /** Единственный разрешённый aria-пасстrough; className/style закрыты. */
  'aria-label'?: string;
  'aria-current'?: AriaAttributes['aria-current'];
};

/**
 * Пропсы, которые Base UI подмешивает в кнопку, когда она отрендерена как
 * часть другого компонента (`render={<Button/>}` у Menu/Popover/Dialog/Toolbar):
 * id, aria-*, data-*, onClick, ref. Публичный тип от этого не открывается —
 * снаружи по-прежнему доступен только ButtonProps.
 */
type ButtonInjectedProps = {
  ref?: Ref<HTMLButtonElement>;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  'aria-label'?: string;
  'aria-current'?: AriaAttributes['aria-current'];
  [key: `data-${string}`]: unknown;
};

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  focusableWhenDisabled = false,
  loading = false,
  fullWidth = false,
  icon,
  onClick,
  children,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
  ...injectedProps
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Base UI клонирует отрендеренный элемент и передаёт ему свои пропсы.
  // Раньше они молча терялись, поэтому кнопка-триггер не открывала панель и
  // не получала доступность. mergeProps — документированный способ Base UI
  // слить такие пропсы: обработчики и className складываются, `ref` не
  // мержится, поэтому его ведём отдельно.
  const { ref: elementRef, ...injected } = injectedProps as ButtonInjectedProps;

  const ownProps: Record<string, unknown> = {
    className: 'seal-button',
    'data-variant': variant,
    'data-size': size,
    'data-loading': loading ? '' : undefined,
    'data-full-width': fullWidth ? '' : undefined,
    type,
    disabled: isDisabled,
    focusableWhenDisabled,
  };
  // Незаполненные значения не пишем вообще: иначе `undefined` перекрыл бы
  // одноимённый проп, вложенный Base UI (например, его onClick у триггера).
  if (onClick) ownProps.onClick = onClick;
  if (ariaLabel) ownProps['aria-label'] = ariaLabel;
  if (ariaCurrent) ownProps['aria-current'] = ariaCurrent;

  const merged = mergeProps<'button'>(
    injected as never,
    ownProps as never,
  ) as Record<string, unknown>;

  return (
    <BaseButton ref={elementRef} {...merged}>
      {loading ? (
        <>
          <span className="seal-button-spinner" role="status">
            <LoaderCircle aria-hidden />
          </span>
          <span className="seal-button-ghost-content">{children}</span>
        </>
      ) : (
        <>
          {icon ? <span className="seal-button-lead-icon">{icon}</span> : null}
          {children}
        </>
      )}
    </BaseButton>
  );
}
