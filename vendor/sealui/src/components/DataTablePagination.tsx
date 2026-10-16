import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { RowData } from '@tanstack/react-table';
import { Button } from './Button';
import {
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from './Select';
import type { DataTableInstance } from './dataTableFeatures';

export type DataTablePaginationProps<TData extends RowData> = {
  table: DataTableInstance<TData>;
};

const SUPPORTED_PAGE_SIZES = [20, 50, 100];

const PAGE_SIZE_OPTIONS = SUPPORTED_PAGE_SIZES.map((size) => ({
  value: String(size),
  label: String(size),
}));

/**
 * Панель пагинации — порт orbit DataTablePagination 1:1: «Rows per page» +
 * Select 32×75px (панель вверх, side="top"), сводка записей
 * (Viewing X-Y of Z / all N / the only record), outline-кнопки 32×32
 * prev/next и first/last (последние — только от lg, 1024px).
 * Пуста, когда записей нет.
 */
export function DataTablePagination<TData extends RowData>({
  table,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.state.pagination;
  const rowCount = table.getRowCount();
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min(startItem + pageSize - 1, rowCount);

  if (endItem === 0 || rowCount === 0) {
    return null;
  }

  const isShowingAllRecords = startItem === 1 && endItem === rowCount;

  return (
    <div className="seal-datatable-pagination">
      <div className="seal-datatable-pagesize">
        <p className="seal-datatable-pagination-text">Rows per page</p>
        <SelectRoot
          items={PAGE_SIZE_OPTIONS}
          value={String(pageSize)}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger aria-label="Rows per page">
            <SelectValue />
            <SelectIcon />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner side="top">
              <SelectPopup>
                <SelectList>
                  {SUPPORTED_PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      <SelectItemIndicator />
                      <SelectItemText>{size}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectList>
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </SelectRoot>
      </div>
      <div className="seal-datatable-pagination-text seal-datatable-count">
        {rowCount === 1
          ? 'Viewing the only record'
          : isShowingAllRecords
            ? `Viewing all ${rowCount} records`
            : `Viewing ${startItem}-${endItem} of ${rowCount}`}
      </div>
      <div className="seal-datatable-nav">
        {/* first/last — только от lg (1024px): у донора hidden lg:flex на кнопке,
            у нас класс закрыт, поэтому прячет обёртка. */}
        <span className="seal-datatable-edge">
          <Button
            variant="outline"
            aria-label="Go to first page"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft size={16} aria-hidden="true" />
          </Button>
        </span>
        <Button
          variant="outline"
          aria-label="Go to previous page"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </Button>
        <Button
          variant="outline"
          aria-label="Go to next page"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
        <span className="seal-datatable-edge">
          <Button
            variant="outline"
            aria-label="Go to last page"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight size={16} aria-hidden="true" />
          </Button>
        </span>
      </div>
    </div>
  );
}
