import { useMemo, useState } from 'react';
import {
  Button,
  DataTable,
  DataTableColumnHeader,
  Pill,
  Stack,
  Text,
} from '../../index';
import type {
  DataTableColumnDef,
  DataTablePaginationState,
  DataTableSelection,
  DataTableSortingState,
} from '../../index';
import type { CatalogEntry } from '../types';

type Invoice = {
  id: number;
  customer: string;
  email: string;
  status: 'paid' | 'pending' | 'failed';
  amount: number;
  date: string;
};

const STATUS_COLOR = { paid: 'green', pending: 'yellow', failed: 'red' } as const;
const STATUS_LABEL = { paid: 'Paid', pending: 'Pending', failed: 'Failed' } as const;

const ALL_INVOICES: Invoice[] = Array.from({ length: 23 }, (_, i) => {
  const n = i + 1;
  const status: Invoice['status'] = n % 7 === 0 ? 'failed' : n % 3 === 0 ? 'pending' : 'paid';
  return {
    id: 1000 + n,
    customer: [
      'Анна Петрова', 'Boris Johnson', 'Вера Гроссман', 'Chris Wu', 'Дана Ким',
      'Eva Lindgren', 'Фёдор Юрченко', 'Grace Hopper', 'Игорь Соколов', 'Hana Sato',
      'Кирилл Мезин', 'Lena Fischer',
    ][i % 12],
    email: `client${n}@example.com`,
    status,
    amount: Math.round((120.5 + n * 73.25) * 100) / 100,
    date: `2026-09-${String((n % 28) + 1).padStart(2, '0')}`,
  };
});

function DataTableFull() {
  const [pagination, setPagination] = useState<DataTablePaginationState>({ pageIndex: 0, pageSize: 20 });
  const [sorting, setSorting] = useState<DataTableSortingState>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set([1002]));
  const [lastToggled, setLastToggled] = useState<number | null>(null);

  // manualSorting/manualSorting: «сервер» — это наш useMemo.
  const sorted = useMemo(() => {
    const first = sorting[0];
    if (!first) return ALL_INVOICES;
    const key = first.id as keyof Invoice;
    const dir = first.desc ? -1 : 1;
    return [...ALL_INVOICES].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0));
  }, [sorting]);

  const pageRows = useMemo(
    () => sorted.slice(pagination.pageIndex * pagination.pageSize, (pagination.pageIndex + 1) * pagination.pageSize),
    [sorted, pagination],
  );

  const selection: DataTableSelection<Invoice> = useMemo(
    () => ({
      count: selected.size,
      pageSelectedCount: pageRows.filter((row) => selected.has(row.id)).length,
      pageSize: pagination.pageSize,
      isSelected: (item) => selected.has(item.id),
      toggle: (item, options) => {
        setSelected((prev) => {
          const next = new Set(prev);
          if (options?.shiftKey && lastToggled !== null) {
            const from = pageRows.findIndex((row) => row.id === lastToggled);
            const to = pageRows.findIndex((row) => row.id === item.id);
            if (from !== -1 && to !== -1) {
              const [lo, hi] = from < to ? [from, to] : [to, from];
              for (const row of pageRows.slice(lo, hi + 1)) next.add(row.id);
              return next;
            }
          }
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
        setLastToggled(item.id);
      },
      setPageSelected: (value) => {
        setSelected((prev) => {
          const next = new Set(prev);
          for (const row of pageRows) {
            if (value) next.add(row.id);
            else next.delete(row.id);
          }
          return next;
        });
      },
    }),
    [selected, pageRows, pagination.pageSize, lastToggled],
  );

  const columns = useMemo<DataTableColumnDef<Invoice>[]>(
    () => [
      { accessorKey: 'id', size: 100, header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" /> },
      {
        accessorKey: 'customer',
        size: 220,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => (
          <Stack gap="1">
            <Text>{row.original.customer}</Text>
            <Text size="xs" tone="secondary">{row.original.email}</Text>
          </Stack>
        ),
      },
      {
        accessorKey: 'status',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <Pill color={STATUS_COLOR[row.original.status]}>{STATUS_LABEL[row.original.status]}</Pill>,
      },
      { accessorKey: 'date', size: 130, header: ({ column }) => <DataTableColumnHeader column={column} title="Date" /> },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
        cell: ({ row }) => <Text monospace tabularNums>${row.original.amount.toFixed(2)}</Text>,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={pageRows}
      rowCount={sorted.length}
      pageCount={Math.ceil(sorted.length / pagination.pageSize)}
      pagination={pagination}
      onPaginationChange={(updater) => setPagination(typeof updater === 'function' ? updater(pagination) : updater)}
      sorting={sorting}
      onSortingChange={(updater) => setSorting(typeof updater === 'function' ? updater(sorting) : updater)}
      selection={selection}
      isLoading={false}
      getRowId={(row) => String(row.id)}
      onRowClick={(row) => selection.toggle(row.original)}
      isRowActive={(row) => selected.has(row.original.id)}
    />
  );
}

function DataTableStates() {
  const columns = useMemo<DataTableColumnDef<Invoice>[]>(
    () => [
      { accessorKey: 'id', header: 'Invoice' },
      { accessorKey: 'customer', header: 'Customer' },
      { accessorKey: 'amount', header: 'Amount' },
    ],
    [],
  );
  return (
    <Stack gap="6">
      <Text>isLoading — статусная ячейка 96px</Text>
      <DataTable columns={columns} data={[]} isLoading />
      <Text>Пустой результат</Text>
      <DataTable columns={columns} data={[]} isLoading={false} />
      <Text>isLoading как снимок react-query (pending + idle = выключен)</Text>
      <DataTable
        columns={columns}
        data={ALL_INVOICES.slice(0, 3)}
        isLoading={{ isFetching: false, isFetched: true, isLoading: false, status: 'success', fetchStatus: 'idle' }}
      />
    </Stack>
  );
}

export const entries: CatalogEntry[] = [
  {
    name: 'DataTable',
    category: 'Data display',
    description:
      'Порт orbit datatable на @tanstack/react-table v9: серверная пагинация/сортировка (состояние у потребителя), колонка выделения с shift-диапазонами, sortable-заголовки, панель пагинации Rows per page / Viewing X-Y of Z.',
    variants: [
      { name: 'Сортировка, пагинация, выделение (клик по строке — тоже выделение)', preview: <DataTableFull /> },
      { name: 'Загрузка, пустой результат, react-query-снимок', preview: <DataTableStates /> },
    ],
  },
];
