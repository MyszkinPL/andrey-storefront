import type { MouseEvent, ReactNode } from 'react';
import { Checkbox } from './Checkbox';

export type ListSize = 'small' | 'default';

export type ListProps = {
  /** Пустой список не рендерится (orbit List возвращает null без children). */
  children?: ReactNode;
  /** default — радиус 32px (rounded-4xl), small — 16px (rounded-2xl). */
  size?: ListSize;
};

/**
 * Список-панель — порт orbit/List: колонка строк, разделители gray-200 /
 * polar-700 (divide-y), рамка 1px, overflow hidden, радиус по размеру.
 */
export function List({ children, size = 'default' }: ListProps) {
  if (!children) return null;
  return (
    <div className="seal-list" data-size={size}>
      {children}
    </div>
  );
}

export type ListItemProps = {
  children: ReactNode;
  /** Строка выбрана: фон gray-50 / polar-800 держится постоянно. */
  selected?: boolean;
  /** Клик по строке; включает cursor-pointer. */
  onSelect?: (event: MouseEvent<HTMLDivElement>) => void;
  size?: ListSize;
  /** Состояние чекбокса строки (управляется родителем). */
  checked?: boolean;
  /** Задан → строка получает чекбокс слева (орбит: hasCheckbox = !!onCheckedChange). */
  onCheckedChange?: (checked: boolean, event: MouseEvent<HTMLDivElement>) => void;
  /** Чекбокс виден всегда, а не только на hover/фокусе/отметке. */
  checkboxVisible?: boolean;
  /** Доступное имя чекбокса (orbit: 'Select item'). */
  checkboxLabel?: string;
};

/**
 * Строка списка — порт orbit/ListItem: flex row, space-between, hover/selected
 * фон gray-50 / polar-800; опциональный чекбокс слева, который проявляется
 * на hover строки, фокусе, в отмеченном/indeterminate-состоянии и на
 * coarse-указателях (orbit group-hover/row логика, перенесена в CSS).
 */
export function ListItem({
  children,
  selected,
  onSelect,
  size = 'default',
  checked,
  onCheckedChange,
  checkboxVisible,
  checkboxLabel = 'Select item',
}: ListItemProps) {
  const hasCheckbox = !!onCheckedChange;
  return (
    <div
      className="seal-list-item"
      data-size={size}
      data-selected={selected ? '' : undefined}
      data-selectable={onSelect ? '' : undefined}
      data-checkable={hasCheckbox ? '' : undefined}
      data-checkbox-visible={checkboxVisible ? '' : undefined}
      onClick={onSelect}
    >
      {hasCheckbox && (
        <div
          className="seal-list-item-check"
          data-size={size}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCheckedChange(!checked, event);
          }}
        >
          <Checkbox checked={!!checked} aria-label={checkboxLabel} />
        </div>
      )}
      {children}
    </div>
  );
}
