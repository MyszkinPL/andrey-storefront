import type { Ref } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react';

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Имя поля при отправке формы (Base UI name). */
  name?: string;
  /** Значение, отправляемое при включённом свитче (Base UI value, по умолчанию "on"). */
  value?: string;
  /** Значение, отправляемое при выключенном свитче (Base UI uncheckedValue). */
  uncheckedValue?: string;
  /** Форма-владелец скрытого input (Base UI form). */
  form?: string;
  /** Без включения форма не отправится (Base UI required). */
  required?: boolean;
  /** Нельзя менять состояние, но доступен и отправляется (Base UI readOnly). */
  readOnly?: boolean;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
};

/**
 * Свитч (Base UI Switch) в Polar-стиле orbit/Switch: 37×18, круглый трек,
 * thumb 8px, checked — accent (Polar primary = blue-600).
 */
export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  name,
  value,
  uncheckedValue,
  form,
  required,
  readOnly,
  id,
  inputRef,
}: SwitchProps) {
  return (
    <BaseSwitch.Root
      className="seal-switch"
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange ? (nextChecked) => onCheckedChange(nextChecked) : undefined}
      disabled={disabled}
      name={name}
      value={value}
      uncheckedValue={uncheckedValue}
      form={form}
      required={required}
      readOnly={readOnly}
      id={id}
      inputRef={inputRef}
    >
      <BaseSwitch.Thumb className="seal-switch-thumb" />
    </BaseSwitch.Root>
  );
}
