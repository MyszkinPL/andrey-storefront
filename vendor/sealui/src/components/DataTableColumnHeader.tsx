import type { HTMLAttributes } from 'react';
import { MoveDown, MoveUp } from 'lucide-react';
import type { RowData } from '@tanstack/react-table';
import { Button } from './Button';
import type { DataTableColumn } from './dataTableFeatures';

export type DataTableColumnHeaderProps<
  TData extends RowData,
  TValue,
> = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> & {
  column: DataTableColumn<TData, TValue>;
  title: string;
};

/**
 * Заголовок сортируемой колонки — порт orbit DataTableColumnHeader: ghost-кнопка
 * без внутренних отступов и hover-подложки (переопределены в CSS
 * .seal-datatable-sort), иконка MoveUp/MoveDown 16px справа (отступ даёт
 * gap кнопки = 8px, у донора ml-2), клик циклит сортировку asc → desc.
 * Для колонки без сортировки — простой div с текстом.
 */
export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div {...props}>{title}</div>;
  }

  const sorted = column.getIsSorted();
  return (
    <div className="seal-datatable-sort" {...props}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => column.toggleSorting(sorted === 'asc')}
      >
        <span>{title}</span>
        {sorted === 'desc' ? (
          <span className="seal-datatable-sort-icon" aria-hidden="true">
            <MoveDown size={16} />
          </span>
        ) : sorted === 'asc' ? (
          <span className="seal-datatable-sort-icon" aria-hidden="true">
            <MoveUp size={16} />
          </span>
        ) : null}
      </Button>
    </div>
  );
}
