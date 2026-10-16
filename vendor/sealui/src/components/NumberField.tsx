import { useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Minus, MoveHorizontal, Plus } from 'lucide-react';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import { INPUT_CLASS } from './Input';

/** Закрытый API: className/style снаружи недоступны. */
type Closed<T> = Omit<T, 'className' | 'style'>;

/**
 * Base UI NumberField (все части: Root / ScrubArea / ScrubAreaCursor / Group /
 * Decrement / Input / Increment) в визуальном языке sealui: рамка и высота как
 * у `.seal-input` (40px, radius-xl, focus-ring), степперы — квадраты 40×40 в
 * тон степперов Polar Input/PercentageInput.
 */
export type NumberFieldRootProps = Closed<ComponentProps<typeof BaseNumberField.Root>>;
export type NumberFieldScrubAreaProps = Closed<ComponentProps<typeof BaseNumberField.ScrubArea>>;
export type NumberFieldScrubAreaCursorProps = Closed<ComponentProps<typeof BaseNumberField.ScrubAreaCursor>>;
export type NumberFieldGroupProps = Closed<ComponentProps<typeof BaseNumberField.Group>>;
export type NumberFieldDecrementProps = Closed<ComponentProps<typeof BaseNumberField.Decrement>>;
export type NumberFieldIncrementProps = Closed<ComponentProps<typeof BaseNumberField.Increment>>;
export type NumberFieldInputProps = Closed<ComponentProps<typeof BaseNumberField.Input>>;

export function NumberFieldRoot({ children, ...props }: NumberFieldRootProps) {
  return (
    <BaseNumberField.Root {...props} className="seal-number-field">
      {children}
    </BaseNumberField.Root>
  );
}

export function NumberFieldScrubArea({ children, ...props }: NumberFieldScrubAreaProps) {
  return (
    <BaseNumberField.ScrubArea {...props} className="seal-number-field-scrub">
      {children}
    </BaseNumberField.ScrubArea>
  );
}

export function NumberFieldScrubAreaCursor({ children, ...props }: NumberFieldScrubAreaCursorProps) {
  return (
    <BaseNumberField.ScrubAreaCursor {...props} className="seal-number-field-scrub-cursor">
      {children ?? <MoveHorizontal size={14} aria-hidden />}
    </BaseNumberField.ScrubAreaCursor>
  );
}

/**
 * Группа «− input +». Несёт общий класс `.seal-input` (Polar Orbit Input:
 * h-10, rounded-xl, border, bg, shadow, focus-ring) — рамка берётся из одного
 * источника, а `.seal-number-field-group` добавляет только дельты фрейма.
 */
export function NumberFieldGroup({ children, ...props }: NumberFieldGroupProps) {
  return (
    <BaseNumberField.Group {...props} className={`${INPUT_CLASS} seal-number-field-group`}>
      {children}
    </BaseNumberField.Group>
  );
}

/** `label` — доступное имя кнопки (иконка без текста). */
export function NumberFieldDecrement({
  children,
  label = 'Decrease',
  ...props
}: NumberFieldDecrementProps & { label?: string }) {
  return (
    <BaseNumberField.Decrement {...props} className="seal-number-field-stepper" aria-label={label}>
      {children ?? <Minus size={16} aria-hidden />}
    </BaseNumberField.Decrement>
  );
}

/** `label` — доступное имя кнопки (иконка без текста). */
export function NumberFieldIncrement({
  children,
  label = 'Increase',
  ...props
}: NumberFieldIncrementProps & { label?: string }) {
  return (
    <BaseNumberField.Increment {...props} className="seal-number-field-stepper" aria-label={label}>
      {children ?? <Plus size={16} aria-hidden />}
    </BaseNumberField.Increment>
  );
}

export function NumberFieldInput(props: NumberFieldInputProps) {
  return <BaseNumberField.Input {...props} className="seal-number-field-input" />;
}

/** Все части Base UI NumberField с Polar-классами. */
export const NumberFieldParts = {
  Root: NumberFieldRoot,
  ScrubArea: NumberFieldScrubArea,
  ScrubAreaCursor: NumberFieldScrubAreaCursor,
  Group: NumberFieldGroup,
  Decrement: NumberFieldDecrement,
  Increment: NumberFieldIncrement,
  Input: NumberFieldInput,
};

export type NumberFieldProps = NumberFieldRootProps & {
  /** Подпись над полем; живёт в ScrubArea — по ней можно тянуть значение. */
  label?: ReactNode;
  /** Показывать кнопки − / + (по умолчанию true). */
  steppers?: boolean;
};

/**
 * Готовое поле: подпись-скраб-область + группа «− input +».
 * Любой другой режим собирается из `NumberFieldParts`.
 */
export function NumberField({ label, steppers = true, 'aria-label': ariaLabel, ...props }: NumberFieldProps) {
  const generatedId = useId();
  const inputId = props.id ?? generatedId;

  // Композиция собирается из собственных частей этого же файла, чтобы классы
  // и иконки частей не дублировались второй копией разметки.
  return (
    <NumberFieldRoot {...props} id={inputId}>
      {label ? (
        <NumberFieldScrubArea>
          <label className="seal-number-field-label" htmlFor={inputId}>
            {label}
          </label>
          <NumberFieldScrubAreaCursor />
        </NumberFieldScrubArea>
      ) : null}
      <NumberFieldGroup>
        {steppers ? <NumberFieldDecrement /> : null}
        <NumberFieldInput aria-label={label ? undefined : ariaLabel} />
        {steppers ? <NumberFieldIncrement /> : null}
      </NumberFieldGroup>
    </NumberFieldRoot>
  );
}
