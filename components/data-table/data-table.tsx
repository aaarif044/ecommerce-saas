"use client";

/*
 * The table helper is intentionally generic over the row shape: each consumer
 * supplies its own columns, and the row data is only read through the column
 * definitions. `any` is used in exactly two places for that reason.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import { columnFilteringFeature, createColumnHelper, createFilteredRowModel, createPaginatedRowModel, createSortedRowModel, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, tableFeatures, useTable, type ColumnDef, type PaginationState, type RowSelectionState, type SortingState } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Download, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { Table, TableBody, TableHeader } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { SearchInput } from "@/components/ui/search-input";

export interface TableMeta {
  className?: string;
  headerClassName?: string;
  align?: "left" | "right" | "center";
  hideBelow?: "sm" | "md" | "lg";
}

export const tableFeaturesConfig = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: {} as TableMeta,
});

export const columnHelper = createColumnHelper<typeof tableFeaturesConfig, any>();

export interface BulkAction {
  label: string;
  value: string;
  icon?: React.ReactNode;
  destructive?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<typeof tableFeaturesConfig, any>[];
  getRowId: (row: T) => string;
  searchAccessor?: (row: T) => string;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  enableSelection?: boolean;
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, ids: string[]) => void | Promise<void>;
  onExport?: (rows: T[]) => void;
  exportLabel?: string;
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  emptyAction?: React.ReactNode;
  initialPageSize?: number;
  itemLabel?: string;
  className?: string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  toolbarRight?: React.ReactNode;
}

const HIDE_CLASSES: Record<NonNullable<TableMeta["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function DataTable<T>({
  data,
  columns,
  getRowId,
  searchAccessor,
  searchPlaceholder = "Search…",
  toolbar,
  enableSelection,
  bulkActions = [],
  onBulkAction,
  onExport,
  exportLabel = "Export CSV",
  emptyTitle = "No results found",
  emptyDescription,
  emptyAction,
  initialPageSize = 10,
  itemLabel = "records",
  className,
  onRowClick,
  loading,
  toolbarRight,
}: DataTableProps<T>) {
  const [search, setSearch] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [bulkBusy, setBulkBusy] = React.useState<string | null>(null);

  const filteredData = React.useMemo(() => {
    if (!searchAccessor || !search.trim()) return data;
    const term = search.trim().toLowerCase();
    return data.filter((row) => searchAccessor(row).toLowerCase().includes(term));
  }, [data, search, searchAccessor]);

  const filterKey = `${filteredData.length}-${search}`;
  const [lastFilterKey, setLastFilterKey] = React.useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }

  const table = useTable({
    features: tableFeaturesConfig,
    columns,
    data: filteredData,
    getRowId,
    state: { sorting, rowSelection, pagination },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    enableRowSelection: enableSelection ?? false,
  });

  const rows = table.getRowModel().rows;
  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedRows = filteredData.filter((row) => selectedIds.includes(getRowId(row)));

  const runBulkAction = async (action: string) => {
    if (!onBulkAction) return;
    setBulkBusy(action);
    try {
      await onBulkAction(action, selectedIds);
    } finally {
      setBulkBusy(null);
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {(toolbar || searchAccessor || onExport || toolbarRight) && (
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {searchAccessor ? (
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder}
                className="sm:w-72"
              />
            ) : null}
            {toolbar}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbarRight}
            {onExport ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onExport(selectedRows.length ? selectedRows : filteredData)}
              >
                <Download className="size-3.5" aria-hidden />
                {exportLabel}
                {selectedRows.length ? ` (${selectedRows.length})` : ""}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {enableSelection && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-brand-200 bg-brand-50 px-4 py-2.5 dark:border-brand-800/70 dark:bg-brand-950/50">
          <span className="text-sm font-medium text-brand-800 dark:text-brand-200">
            {selectedIds.length} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.value}
                size="sm"
                variant={action.destructive ? "dangerGhost" : "secondary"}
                onClick={() => void runBulkAction(action.value)}
                loading={bulkBusy === action.value}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
              disabled={Boolean(bulkBusy)}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as TableMeta | undefined;
                  const sortable = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : sortable
                              ? "none"
                              : undefined
                      }
                      className={cn(
                        "whitespace-nowrap border-b border-line px-4 py-2.5 text-2xs font-semibold uppercase tracking-wide text-ink-muted",
                        meta?.align === "right" ? "text-right" : meta?.align === "center" ? "text-center" : "text-left",
                        meta?.headerClassName,
                        meta?.hideBelow ? HIDE_CLASSES[meta.hideBelow] : "",
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            meta?.align === "right" ? "flex-row-reverse" : "",
                          )}
                        >
                          {sortable ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 rounded transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            >
                              {table.FlexRender
                                ? (
                                    <table.FlexRender header={header} />
                                  )
                                : null}
                              {sorted === "asc" ? (
                                <ArrowUp className="size-3" aria-hidden />
                              ) : sorted === "desc" ? (
                                <ArrowDown className="size-3" aria-hidden />
                              ) : (
                                <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                              )}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original as T) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick ? "cursor-pointer hover:bg-surface-2" : "hover:bg-surface-2/60",
                  row.getIsSelected() && "bg-brand-50/60 dark:bg-brand-950/30",
                )}
              >
                {row.getAllCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as TableMeta | undefined;
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        "px-4 py-2.5 align-middle text-ink",
                        meta?.align === "right" ? "text-right" : meta?.align === "center" ? "text-center" : "text-left",
                        meta?.className,
                        meta?.hideBelow ? HIDE_CLASSES[meta.hideBelow] : "",
                      )}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </TableBody>
        </Table>

        {!loading && rows.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" aria-hidden />}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        ) : null}
      </div>

      {rows.length > 0 ? (
        <Pagination
          pageIndex={pagination.pageIndex}
          pageSize={pagination.pageSize}
          pageCount={table.getPageCount()}
          total={filteredData.length}
          onPageChange={(index) => setPagination((current) => ({ ...current, pageIndex: index }))}
          onPageSizeChange={(size) =>
            setPagination({ pageIndex: 0, pageSize: size })
          }
          itemLabel={itemLabel}
        />
      ) : null}
    </div>
  );
}

/** Convenience helper for a selection checkbox column. */
export function selectionColumn<T>(options: {
  id?: string;
  getRowId: (row: T) => string;
}) {
  return columnHelper.display({
    id: options.id ?? "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows on this page"
        checked={table.getIsAllPageRowsSelected()}
        onChange={() => table.toggleAllPageRowsSelected()}
        onClick={(event) => event.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select row ${row.id}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(event) => event.stopPropagation()}
      />
    ),
  });
}
