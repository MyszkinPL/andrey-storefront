import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/** Закрытая система: className/style извне недоступны, семантические атрибуты HTML — да. */
type Sealed<T> = Omit<T, 'className' | 'style'>;

export type TableProps = Sealed<HTMLAttributes<HTMLTableElement>>;

/**
 * Таблица — порт orbit ui/table.tsx: обёртка relative w-full overflow-auto,
 * таблица w-full caption-bottom text-sm.
 */
export function Table(props: TableProps) {
  return (
    <div className="seal-table-wrap">
      <table className="seal-table" {...props} />
    </div>
  );
}

export type TableHeaderProps = Sealed<HTMLAttributes<HTMLTableSectionElement>>;

/** thead — порт orbit TableHeader: у каждого tr нижняя рамка. */
export function TableHeader(props: TableHeaderProps) {
  return <thead className="seal-table-header" {...props} />;
}

export type TableBodyProps = Sealed<HTMLAttributes<HTMLTableSectionElement>>;

/** tbody — порт orbit TableBody: у последнего tr рамки нет. */
export function TableBody(props: TableBodyProps) {
  return <tbody className="seal-table-body" {...props} />;
}

export type TableRowProps = Sealed<HTMLAttributes<HTMLTableRowElement>> & {
  /** Выделенная строка (data-selected): фон --seal-muted-bg, как orbit data-[state=selected]. */
  selected?: boolean;
};

/** tr — порт orbit TableRow: нижняя рамка, hover bg-muted/50, selected bg-muted, transition-colors. */
export function TableRow({ selected, ...props }: TableRowProps) {
  return <tr className="seal-table-row" data-selected={selected ? '' : undefined} {...props} />;
}

export type TableHeadProps = Sealed<ThHTMLAttributes<HTMLTableCellElement>>;

/** th — порт orbit TableHead: h-12 px-4, text-left, muted-foreground, font-medium; ячейка с чекбоксом без padding. */
export function TableHead(props: TableHeadProps) {
  return <th className="seal-table-head" {...props} />;
}

export type TableCellProps = Sealed<TdHTMLAttributes<HTMLTableCellElement>>;

/** td — порт orbit TableCell: p-4 align-middle; ячейка с чекбоксом без padding. */
export function TableCell(props: TableCellProps) {
  return <td className="seal-table-cell" {...props} />;
}
