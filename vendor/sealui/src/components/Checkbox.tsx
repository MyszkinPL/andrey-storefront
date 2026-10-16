import type { ReactNode, Ref } from 'react';
import { Check, Minus } from 'lucide-react';
import { Checkbox as BaseCheckbox } from '@base-ui/react';

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  /**
   * Акцентный вариант Polar `orbit/Checkbox`: рамка и заливка primary
   * (= `--color-blue-600`), минус в indeterminate — тоже primary. Дефолт
   * (без пропа) — инверсия black↔white, точный порт orbit/Checkbox.tsx
   * (перепроверено по исходнику 2026-10-08).
   */
  emphasized?: boolean;
  value?: string;
  /** Имя поля при отправке формы (Base UI name). */
  name?: string;
  /** Форма-владелец скрытого input, если чекбокс отрендерен вне <form> (Base UI form). */
  form?: string;
  /** Что уйдёт в форму, когда чекбокс снят (Base UI uncheckedValue). */
  uncheckedValue?: string;
  /** Без галочки форма не отправится (Base UI required). */
  required?: boolean;
  /** Нельзя менять состояние, но доступен и отправляется (Base UI readOnly). */
  readOnly?: boolean;
  disabled?: boolean;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
  /**
   * Родительский чекбокс группы (Base UI parent): управляет дочерними чекбоксами,
   * а состояние indeterminate считает сама группа.
   */
  parent?: boolean;
  /**
   * Подпись рядом с чекбоксом (Polar `orbit/Checkbox` → `label`). Рядом с контролом
   * рендерится enclosing-<label>: подпись кликабельна и попадает в accessible name.
   */
  label?: ReactNode;
  /** Доступное имя контрола, когда подписи нет. */
  'aria-label'?: string;
};

/**
 * Чекбокс (Base UI Checkbox) в Polar-стиле orbit/Checkbox: 16×16, radius 2px,
 * border gray-300 / dark polar-600; checked — инверсия (чёрный ↔ белый).
 * `emphasized` — синий вариант (primary). Иконка выбирается по состоянию
 * Indicator, поэтому parent-чекбокс группы сам показывает минус в indeterminate.
 */
export function Checkbox({
  checked,
  defaultChecked,
  onCheckedChange,
  indeterminate,
  emphasized,
  value,
  name,
  form,
  uncheckedValue,
  required,
  readOnly,
  disabled,
  id,
  inputRef,
  parent,
  label,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  const control = (
    <BaseCheckbox.Root
      className="seal-checkbox"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange ? (nextChecked) => onCheckedChange(nextChecked) : undefined}
      indeterminate={indeterminate}
      data-emphasized={emphasized || undefined}
      value={value}
      name={name}
      form={form}
      uncheckedValue={uncheckedValue}
      required={required}
      readOnly={readOnly}
      disabled={disabled}
      id={id}
      inputRef={inputRef}
      parent={parent}
      aria-label={label ? undefined : ariaLabel}
    >
      <BaseCheckbox.Indicator
        keepMounted
        className="seal-checkbox-indicator"
        render={(indicatorProps, state) => (
          <span {...indicatorProps}>
            {state.indeterminate ? (
              <Minus size={12} strokeWidth={3} aria-hidden />
            ) : (
              <Check size={16} strokeWidth={2} aria-hidden />
            )}
          </span>
        )}
      />
    </BaseCheckbox.Root>
  );

  if (!label) {
    return control;
  }

  return (
    <label className="seal-control-row" data-disabled={disabled || undefined}>
      {control}
      <span className="seal-control-row-label">{label}</span>
    </label>
  );
}
