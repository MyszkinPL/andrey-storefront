import type { ReactNode } from 'react';
import { CheckboxGroup as BaseCheckboxGroup } from '@base-ui/react';
import { Checkbox } from './Checkbox';

export type CheckboxGroupLeaf = { value: string; label: ReactNode; disabled?: boolean };

export type CheckboxGroupParent = {
  /** Родительская опция: рендерит вложенную группу с parent-чекбоксом (nested parent по докам). */
  label: ReactNode;
  children: CheckboxGroupLeaf[];
  disabled?: boolean;
};

export type CheckboxGroupItem = CheckboxGroupLeaf | CheckboxGroupParent;

function isParent(item: CheckboxGroupItem): item is CheckboxGroupParent {
  return 'children' in item;
}

/** Все листовые значения группы, включая вложенные (для allValues по докам Base UI). */
function leafValues(options: CheckboxGroupItem[]): string[] {
  return options.flatMap((option) => (isParent(option) ? option.children.map((child) => child.value) : [option.value]));
}

export type CheckboxGroupProps = {
  options: CheckboxGroupItem[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  /** Общее имя поля для всех чекбоксов группы (Base UI name на каждом Checkbox). */
  name?: string;
  /** Подпись родительского чекбокса «выбрать все» для плоского списка. */
  allLabel?: ReactNode;
  /** Доступное имя группы (Base UI/Field: подпись группы). */
  'aria-label'?: string;
};

/**
 * Группа чекбоксов (Base UI CheckboxGroup) в Polar-стиле: строки 8px, лейбл рядом,
 * родительский чекбокс получает indeterminate от группы (minus-иконка).
 * Вложенные группы контролируются тем же плоским массивом value.
 * Каждая строка — тот же `Checkbox` с `label`, что и в одиночном использовании.
 */
export function CheckboxGroup({
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  name,
  allLabel,
  'aria-label': ariaLabel,
}: CheckboxGroupProps) {
  return (
    <BaseCheckboxGroup
      className="seal-checkbox-group"
      aria-label={ariaLabel}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (nextValue) => onValueChange(nextValue) : undefined}
      disabled={disabled}
      allValues={allLabel ? leafValues(options) : undefined}
    >
      {allLabel ? <Checkbox parent name={name} disabled={disabled} label={allLabel} /> : null}
      {options.map((option, index) => {
        if (!isParent(option)) {
          return (
            <Checkbox
              key={option.value}
              value={option.value}
              name={name}
              disabled={option.disabled || disabled}
              label={option.label}
            />
          );
        }

        const childValues = option.children.map((child) => child.value);
        return (
          /* Nested parent checkbox: вложенная группа со своим parent-чекбоксом (доки Base UI) */
          <BaseCheckboxGroup
            key={`parent-${index}`}
            className="seal-checkbox-group seal-checkbox-subgroup"
            allValues={childValues}
            value={value ? value.filter((item) => childValues.includes(item)) : undefined}
            onValueChange={
              value && onValueChange
                ? (nextValue) =>
                    onValueChange([...value.filter((item) => !childValues.includes(item)), ...nextValue])
                : undefined
            }
            disabled={option.disabled || disabled}
          >
            <Checkbox parent name={name} disabled={option.disabled || disabled} label={option.label} />
            <div className="seal-checkbox-children">
              {option.children.map((child) => (
                <Checkbox
                  key={child.value}
                  value={child.value}
                  name={name}
                  disabled={child.disabled || option.disabled || disabled}
                  label={child.label}
                />
              ))}
            </div>
          </BaseCheckboxGroup>
        );
      })}
    </BaseCheckboxGroup>
  );
}
