import type { MouseEvent } from 'react';
import type { RowData } from '@tanstack/react-table';
import { Checkbox } from './Checkbox';
import type { DataTableColumnDef } from './dataTableFeatures';

export const SELECTION_COLUMN_ID = 'select';
export const SELECTION_COLUMN_WIDTH = 36;

/**
 * Контракт выделения — порт orbit DataTableSelection: состояние живёт у
 * потребителя (обычно вместе с серверной пагинацией), колонка лишь отражает
 * его и сообщает о кликах (включая shift-клик для диапазонов).
 */
export interface DataTableSelection<TData extends RowData> {
  /** Всего выделено строк (сквозь страницы). */
  count: number;
  /** Выделено строк на текущей странице. */
  pageSelectedCount: number;
  /** Размер текущей страницы. */
  pageSize: number;
  isSelected: (item: TData) => boolean;
  toggle: (item: TData, options?: { shiftKey?: boolean }) => void;
  setPageSelected: (selected: boolean) => void;
}

/**
 * Колонка чекбоксов — порт orbit DataTableSelectionColumn: ширина 36px,
 * без сортировки, чекбокс проявляется на hover строки / фокусе / отметке /
 * indeterminate / при непустом выделении / на coarse-указателях (reveal-логика
 * в CSS .seal-datatable-check, как у List).
 */
export const createSelectionColumn = <TData extends RowData,>(
  selection: DataTableSelection<TData>,
): DataTableColumnDef<TData, unknown> => ({
  id: SELECTION_COLUMN_ID,
  size: SELECTION_COLUMN_WIDTH,
  enableSorting: false,
  header: () => {
    const pageFullySelected =
      selection.pageSize > 0 &&
      selection.pageSelectedCount === selection.pageSize;
    const pagePartiallySelected =
      selection.pageSelectedCount > 0 && !pageFullySelected;

    return (
      <div
        className="seal-datatable-check seal-datatable-check-head"
        data-visible={selection.count > 0 ? '' : undefined}
        onClick={() => selection.setPageSelected(!pageFullySelected)}
      >
        <Checkbox
          aria-label={
            selection.count > 0
              ? `Select all rows on this page, ${selection.count} selected`
              : 'Select all rows on this page'
          }
          checked={pageFullySelected}
          indeterminate={pagePartiallySelected}
        />
      </div>
    );
  },
  cell: ({ row }) => (
    <div
      className="seal-datatable-check"
      data-visible={selection.count > 0 ? '' : undefined}
      onClick={(event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
        selection.toggle(row.original, { shiftKey: event.shiftKey });
      }}
    >
      <Checkbox
        aria-label={`Select row ${row.index + 1}`}
        checked={selection.isSelected(row.original)}
      />
    </div>
  ),
});
