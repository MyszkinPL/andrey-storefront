import type { AriaAttributes, ComponentProps, ReactNode } from 'react';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { Button } from './Button';
import type { ButtonSize, ButtonVariant } from './Button';

export type ToolbarOrientation = 'horizontal' | 'vertical';

export type ToolbarProps = {
  children: ReactNode;
  orientation?: ToolbarOrientation;
  /** Общий disabled для всех элементов тулбара. */
  disabled?: boolean;
  /** Переносить ли клавиатурный фокус через конец тулбара (Base UI API). */
  loopFocus?: boolean;
  /**
   * Доступное имя панели (role=toolbar). Проброс нативного элемента — как в
   * примерах Base UI, где `<Toolbar.Root>` получает обычные атрибуты div.
   */
  'aria-label'?: string;
};

/**
 * Контейнер групп контролов (Base UI Toolbar) в визуале Polar:
 * панель на поверхности raised, элементы внутри.
 */
export function Toolbar({
  children,
  orientation = 'horizontal',
  disabled = false,
  loopFocus = true,
  'aria-label': ariaLabel,
}: ToolbarProps) {
  return (
    <BaseToolbar.Root
      className="seal-toolbar"
      orientation={orientation}
      disabled={disabled}
      loopFocus={loopFocus}
      aria-label={ariaLabel}
    >
      {children}
    </BaseToolbar.Root>
  );
}

/**
 * Варианты кнопок тулбара — тот же набор, что у `Button`: скин один
 * (`.seal-button[data-variant=…]`), поэтому список не дублируется.
 */
export type ToolbarButtonVariant = ButtonVariant;

export type ToolbarButtonProps = {
  children: ReactNode;
  variant?: ToolbarButtonVariant;
  /**
   * Размер из `Button`. Без значения метрики даёт класс тулбара
   * (`seal-toolbar-button`), то есть принятый ранее вид не меняется;
   * `size="icon"` доступен, когда нужна квадратная кнопка-иконка.
   */
  size?: ButtonSize;
  disabled?: boolean;
  /** Base UI: в disabled остаётся фокусируемым; в тулбаре по умолчанию true. */
  focusableWhenDisabled?: boolean;
  /** Ведущая иконка слева от текста, как у кнопок. */
  icon?: ReactNode;
  onClick?: ComponentProps<'button'>['onClick'];
  'aria-label'?: string;
  'aria-pressed'?: boolean;
};

/**
 * Кнопка тулбара — это НАШ `Button`, отрендеренный частью Base UI Toolbar
 * (`render`): Base UI подмешивает к нему `aria-pressed`/`data-*`/`ref`/`tabIndex`
 * для roving focus, а `Button` умеет такой проброс через `mergeProps`.
 * Класс `seal-toolbar-button` остаётся намеренно: `mergeProps` склеивает
 * `className`, поэтому метрики тулбара (32px) сохраняются как прежде.
 * Своей разметки иконки/содержимого здесь больше нет — ею владеет `Button`.
 */
export function ToolbarButton({
  children,
  variant = 'ghost',
  size,
  disabled = false,
  focusableWhenDisabled = true,
  icon,
  onClick,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
}: ToolbarButtonProps) {
  return (
    <BaseToolbar.Button
      className="seal-toolbar-button"
      disabled={disabled}
      focusableWhenDisabled={focusableWhenDisabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      render={
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          focusableWhenDisabled={focusableWhenDisabled}
          icon={icon}
        >
          {children}
        </Button>
      }
    >
      {null}
    </BaseToolbar.Button>
  );
}

export type ToolbarLinkProps = {
  href: string;
  children: ReactNode;
  /** Нативный атрибут ссылки (Base UI прокидывает его на `<a>`). */
  target?: string;
  /** Нативный обработчик клика по ссылке (`Toolbar.Link` — обычный `<a>`). */
  onClick?: ComponentProps<'a'>['onClick'];
  'aria-label'?: string;
  'aria-current'?: AriaAttributes['aria-current'];
};

export function ToolbarLink({
  href,
  children,
  target,
  onClick,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: ToolbarLinkProps) {
  return (
    <BaseToolbar.Link
      className="seal-toolbar-link"
      href={href}
      target={target}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
    >
      {children}
    </BaseToolbar.Link>
  );
}

export type ToolbarInputProps = {
  placeholder?: string;
  'aria-label'?: string;
  disabled?: boolean;
  /** Base UI `Toolbar.Input.defaultValue` — неконтролируемое значение. */
  defaultValue?: string | number;
  /** Base UI `Toolbar.Input.focusableWhenDisabled` (по умолчанию true). */
  focusableWhenDisabled?: boolean;
  /** Нативный тип поля (`Toolbar.Input` рендерит обычный `<input>`). */
  type?: ComponentProps<'input'>['type'];
};

export function ToolbarInput({
  placeholder,
  'aria-label': ariaLabel,
  disabled,
  defaultValue,
  focusableWhenDisabled,
  type,
}: ToolbarInputProps) {
  return (
    <BaseToolbar.Input
      className="seal-input seal-toolbar-input"
      placeholder={placeholder}
      aria-label={ariaLabel}
      disabled={disabled}
      defaultValue={defaultValue}
      focusableWhenDisabled={focusableWhenDisabled}
      type={type}
    />
  );
}

/**
 * Разделитель тулбара: вид берётся из общего `Separator` (`seal-separator`),
 * класс тулбара добавляет только его длину/отступы внутри панели.
 */
export function ToolbarSeparator({ orientation }: { orientation?: ToolbarOrientation } = {}) {
  return <BaseToolbar.Separator className="seal-separator seal-toolbar-separator" orientation={orientation} />;
}

export type ToolbarGroupProps = {
  children: ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
};

export function ToolbarGroup({ children, disabled, 'aria-label': ariaLabel }: ToolbarGroupProps) {
  return (
    <BaseToolbar.Group className="seal-toolbar-group" disabled={disabled} aria-label={ariaLabel}>
      {children}
    </BaseToolbar.Group>
  );
}
