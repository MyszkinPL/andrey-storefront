import { useMemo, type ReactNode } from 'react';
import { flexRender, useTable } from '@tanstack/react-table';
import type {
  OnChangeFn,
  PaginationState,
  RowData,
  SortingState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './Table';
import { DataTablePagination } from './DataTablePagination';
import {
  createSelectionColumn,
  SELECTION_COLUMN_ID,
  SELECTION_COLUMN_WIDTH,
  type DataTableSelection,
} from './DataTableSelectionColumn';
import {
  dataTableFeatures,
  type DataTableCell,
  type DataTableColumnDef,
  type DataTableRow,
} from './dataTableFeatures';

/** Снимок загрузки react-query-подобного источника (структурный тип, без зависимости). */
export interface ReactQueryLoading {
  isFetching: boolean;
  isFetched: boolean;
  isLoading: boolean;
  status: string;
  fetchStatus: string;
}

export type DataTableProps<TData extends RowData> = {
  columns: DataTableColumnDef<TData>[];
  data: TData[];
  /** Серверная пагинация/сортировка: общее число строк и страниц. */
  rowCount?: number;
  pageCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Древовидные данные: подстроки строки. */
  getSubRows?: (row: TData) => TData[] | undefined;
  /** true или снимок состояния react-query (pending+idle считается выключенным). */
  isLoading: boolean | ReactQueryLoading;
  /** colSpan ячейки; 0 убирает ячейку из ряда (orbit-семантика). */
  getCellColSpan?: (cell: DataTableCell<TData, unknown>) => number;
  getRowId?: (
    originalRow: TData,
    index: number,
    parent?: DataTableRow<TData>,
  ) => string;
  /** Контракт выделения + колонка чекбоксов (см. DataTableSelection). */
  selection?: DataTableSelection<TData>;
  onRowClick?: (row: DataTableRow<TData>) => void;
  isRowActive?: (row: DataTableRow<TData>) => boolean;
};

export type DataTablePaginationState = PaginationState;
export type DataTableSortingState = SortingState;

const queryIsDisabled = (s: ReactQueryLoading): boolean =>
  s.status === 'pending' && s.fetchStatus === 'idle';

/**
 * Таблица данных — порт orbit datatable/DataTable.tsx 1:1 на tanstack v9
 * (features API, manualPagination/manualSorting — состояние у потребителя):
 * колонки/строки из getRowModel, ширина колонок table-fixed (у донора
 * inline-style на th/td, у нас colgroup — Table запечатан), шапка bg gray-50 /
 * polar-800, статусные ячейки Loading/No Results 96px по центру, строка
 * selected при isRowActive/выделении, cursor-pointer при onRowClick,
 * панель пагинации когда передан pagination.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  rowCount,
  pageCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  getSubRows,
  isLoading,
  getCellColSpan,
  getRowId,
  selection,
  onRowClick,
  isRowActive,
}: DataTableProps<TData>) {
  const allColumns = useMemo(
    () =>
      selection ? [createSelectionColumn(selection), ...columns] : columns,
    [selection, columns],
  );

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: allColumns,
    manualPagination: true,
    manualSorting: true,
    rowCount,
    pageCount,
    onPaginationChange,
    onSortingChange,
    getSubRows,
    getRowId,
    state: {
      pagination,
      sorting,
    },
  });

  const calcLoading =
    typeof isLoading === 'boolean'
      ? isLoading
      : (!isLoading.isFetched || isLoading.isLoading) &&
        !queryIsDisabled(isLoading);

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const statusContent: ReactNode | null = calcLoading
    ? 'Loading...'
    : rows?.length
      ? null
      : 'No Results';

  return (
    <div
      className="seal-datatable"
      data-row-click={onRowClick ? '' : undefined}
      data-status={statusContent !== null ? '' : undefined}
    >
      <div className="seal-datatable-wrap">
        <Table>
          <colgroup>
            {(headerGroups[0]?.headers ?? []).map((header) => (
              <col
                key={header.id}
                style={{
                  width:
                    header.column.id === SELECTION_COLUMN_ID
                      ? SELECTION_COLUMN_WIDTH
                      : header.column.getSize(),
                }}
              />
            ))}
          </colgroup>
          <TableHeader>
            {headerGroups.map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {statusContent !== null ? (
              <TableRow>
                <TableCell colSpan={allColumns.length}>{statusContent}</TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  selected={Boolean(
                    isRowActive?.(row) || selection?.isSelected(row.original),
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colSpan = getCellColSpan ? getCellColSpan(cell) : 1;
                    return colSpan ? (
                      <TableCell key={cell.id} colSpan={colSpan}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ) : null;
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pagination ? <DataTablePagination table={table} /> : null}
    </div>
  );
}
