import type { ReactNode, Ref } from 'react';
import { Circle } from 'lucide-react';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { Radio as BaseRadio } from '@base-ui/react/radio';

export type RadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Форма не отправится без выбора (Base UI). */
  required?: boolean;
  /** Нельзя переключить выбор, но значение отправляется (Base UI). */
  readOnly?: boolean;
  name?: string;
  /** Форма-владелец скрытых input (Base UI form). */
  form?: string;
  inputRef?: Ref<HTMLInputElement>;
  /** Доступное имя группы (Base UI/Field: подпись группы, стоящая рядом). */
  'aria-label'?: string;
  children: ReactNode;
};

/**
 * Группа радио (Base UI RadioGroup) в Polar-стиле ui/radio-group: рендерит
 * контейнер с data-состояниями, лейбл — у самого пункта.
 */
export function RadioGroup({
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  readOnly,
  name,
  form,
  inputRef,
  'aria-label': ariaLabel,
  children,
}: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className="seal-radio-group"
      aria-label={ariaLabel}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (nextValue) => onValueChange(nextValue) : undefined}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      name={name}
      form={form}
      inputRef={inputRef}
    >
      {children}
    </BaseRadioGroup>
  );
}

export type RadioItemProps = {
  value: string;
  /** Подпись рядом с кружком (Polar: Label подвязан к контролу) */
  label?: ReactNode;
  disabled?: boolean;
  /** Нельзя выбрать этот пункт (Base UI readOnly на Radio). */
  readOnly?: boolean;
};

/**
 * Пункт радио: кружок 16px с accent-рамкой (Polar primary = blue-600) и точка
 * 10px. Без label отдаётся один круг (Polar `ui/radio-group`: сам RadioGroupItem),
 * с label — enclosing <label>, поэтому подпись кликабельна и попадает в accessible
 * name контрола (enclosing label по докам Base UI).
 */
export function RadioItem({ value, label, disabled, readOnly }: RadioItemProps) {
  const control = (
    <BaseRadio.Root className="seal-radio" value={value} disabled={disabled} readOnly={readOnly}>
      {/* Polar ui/radio-group: lucide Circle h-2.5 w-2.5 fill-current → точка 10px. */}
      <BaseRadio.Indicator keepMounted className="seal-radio-dot">
        <Circle size={10} fill="currentColor" aria-hidden />
      </BaseRadio.Indicator>
    </BaseRadio.Root>
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
