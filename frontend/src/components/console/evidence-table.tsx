"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type FilterFn,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Columns3,
  Rows2,
  Rows3,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { MonoValue, SkeletonRows, StatusBadge } from "@/components/ui/primitives";
import type { EvidenceRecord } from "@/lib/types";
import { STATUS_CODE, STATUS_LABEL, STATUS_TONE } from "@/lib/types";
import { cn, formatRelativeTime, formatBytes } from "@/lib/utils";

const columnHelper = createColumnHelper<EvidenceRecord>();

const STATUS_FILTERS = ["all", "Registered", "InTransit", "InLab", "InCourt", "Disposed"] as const;

/** Matches a row against a query across every identifier field. */
const globalFilterFn: FilterFn<EvidenceRecord> = (row, _columnId, filterValue) => {
  const needle = String(filterValue).toLowerCase().trim();
  if (!needle) return true;

  const record = row.original;
  return [
    record.id,
    record.caseId,
    record.title,
    record.type,
    record.custodian,
    record.department,
    record.fileHash,
    record.ipfsCid,
    record.txHash,
    record.classification,
    record.notes,
  ]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(needle));
};

export function EvidenceTable({
  data,
  loading,
  onInspect,
  selectedId,
}: {
  data: EvidenceRecord[];
  loading?: boolean;
  onInspect: (id: string) => void;
  selectedId?: string | null;
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "uploadedAt", desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    ipfsCid: false,
    department: false,
    fileSize: false,
  });
  const [compact, setCompact] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Evidence ID",
        cell: (info) => (
          <span className="font-mono text-xs font-medium text-cyan-300">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("caseId", {
        header: "Case",
        cell: (info) => <MonoValue value={info.getValue()} />,
      }),
      columnHelper.accessor("title", {
        header: "Description",
        cell: (info) => (
          <div className="min-w-0 max-w-[22ch]">
            <p className="truncate text-xs text-zinc-200">{info.getValue() || "—"}</p>
            <p className="truncate text-[10px] text-zinc-600">{info.row.original.type}</p>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "State",
        cell: (info) => {
          const status = info.getValue();
          return (
            <StatusBadge
              tone={STATUS_TONE[status] ?? "muted"}
              code={STATUS_CODE[status] ?? "UNK"}
              label={STATUS_LABEL[status] ?? status}
              pulse={status === "InTransit"}
            />
          );
        },
        filterFn: (row, columnId, value) => value === "all" || row.getValue(columnId) === value,
      }),
      columnHelper.accessor("classification", {
        header: "Class",
        cell: (info) => {
          const value = info.getValue();
          return (
            <span
              className={cn(
                "font-mono text-[10px] font-semibold tracking-wider",
                value === "Restricted"
                  ? "text-rose-300"
                  : value === "Confidential"
                    ? "text-amber-300"
                    : "text-zinc-400",
              )}
            >
              {String(value).slice(0, 4).toUpperCase()}
            </span>
          );
        },
      }),
      columnHelper.accessor("custodian", {
        header: "Custodian",
        cell: (info) => (
          <span className="truncate text-xs text-zinc-300">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("department", {
        header: "Department",
        cell: (info) => (
          <span className="truncate text-xs text-zinc-400">{info.getValue() || "—"}</span>
        ),
      }),
      columnHelper.accessor("fileHash", {
        header: "SHA-256",
        enableSorting: false,
        cell: (info) => <MonoValue value={info.getValue()} truncate={[10, 6]} tone="muted" />,
      }),
      columnHelper.accessor("ipfsCid", {
        header: "IPFS CID",
        enableSorting: false,
        cell: (info) => <MonoValue value={info.getValue()} truncate={[8, 6]} tone="muted" />,
      }),
      columnHelper.accessor("blockNumber", {
        header: "Block",
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className="font-mono text-xs text-zinc-400">{value ? `#${value}` : "—"}</span>
          );
        },
      }),
      columnHelper.accessor("fileSize", {
        header: "Size",
        cell: (info) => (
          <span className="font-mono text-[11px] text-zinc-500">
            {formatBytes(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("uploadedAt", {
        header: "Registered",
        cell: (info) => (
          <span
            title={info.getValue()}
            className="whitespace-nowrap font-mono text-[11px] text-zinc-500"
          >
            {formatRelativeTime(info.getValue())}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableMultiSort: true,
  });

  const rows = table.getRowModel().rows;
  const cellPadding = compact ? "px-3 py-1" : "px-3 py-2";

  function applyStatusFilter(next: string) {
    setStatusFilter(next);
    table.getColumn("status")?.setFilterValue(next === "all" ? undefined : next);
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            placeholder="Filter by ID, case, custodian, hash, CID…"
            aria-label="Filter evidence"
            className="h-7 w-full rounded border border-zinc-800 bg-zinc-900 pl-7 pr-7 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-cyan-600/60 focus:outline-none"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              aria-label="Clear filter"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-600 hover:text-zinc-300"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-0.5 rounded border border-zinc-800 bg-zinc-900 p-0.5">
          {STATUS_FILTERS.map((status) => {
            const active = statusFilter === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => applyStatusFilter(status)}
                className={cn(
                  "relative rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider transition",
                  active ? "text-zinc-100" : "text-zinc-600 hover:text-zinc-300",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="status-pill"
                    className="absolute inset-0 rounded bg-zinc-700"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <span className="relative">
                  {status === "all" ? "ALL" : (STATUS_CODE[status] ?? status)}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setCompact((current) => !current)}
          title={compact ? "Comfortable rows" : "Compact rows"}
          className="rounded border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition hover:text-zinc-100"
        >
          {compact ? <Rows3 className="h-3.5 w-3.5" /> : <Rows2 className="h-3.5 w-3.5" />}
        </button>

        {/* Column visibility */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              title="Toggle columns"
              className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] font-medium text-zinc-400 transition hover:text-zinc-100"
            >
              <Columns3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">COLUMNS</span>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={4}
              className="z-50 min-w-[180px] rounded border border-zinc-800 bg-zinc-950 p-1 shadow-xl shadow-black/60"
            >
              <DropdownMenu.Label className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-600">
                Visible columns
              </DropdownMenu.Label>

              {table.getAllLeafColumns().map((column) => (
                <DropdownMenu.CheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                  onSelect={(event) => event.preventDefault()}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 outline-none data-[highlighted]:bg-zinc-800"
                >
                  <span
                    className={cn(
                      "flex h-3 w-3 items-center justify-center rounded-[3px] border",
                      column.getIsVisible()
                        ? "border-cyan-500 bg-cyan-500/25"
                        : "border-zinc-700",
                    )}
                  >
                    {column.getIsVisible() && <span className="h-1 w-1 rounded-full bg-cyan-300" />}
                  </span>
                  {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
                </DropdownMenu.CheckboxItem>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <span className="hidden font-mono text-[10px] text-zinc-600 lg:inline">
          {rows.length}/{data.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-zinc-800">
                {headerGroup.headers.map((header) => {
                  const sortDirection = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();

                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-1.5 text-left"
                      aria-sort={
                        sortDirection === "asc"
                          ? "ascending"
                          : sortDirection === "desc"
                            ? "descending"
                            : "none"
                      }
                    >
                      <button
                        type="button"
                        disabled={!canSort}
                        // Shift-click adds a secondary sort key.
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] transition",
                          canSort ? "text-zinc-500 hover:text-zinc-200" : "text-zinc-600",
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-cyan-400" />
                          ) : sortDirection === "desc" ? (
                            <ArrowDown className="h-3 w-3 text-cyan-400" />
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          ))}
                      </button>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-zinc-800/70">
            {loading ? (
              <tr>
                <td colSpan={table.getVisibleLeafColumns().length} className="p-0">
                  <SkeletonRows rows={8} cols={6} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getVisibleLeafColumns().length}
                  className="px-3 py-16 text-center"
                >
                  <SlidersHorizontal className="mx-auto h-5 w-5 text-zinc-700" />
                  <p className="mt-2 text-xs text-zinc-600">
                    No records match the active filters.
                  </p>
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {rows.map((row) => {
                  const isSelected = selectedId === row.original.id;

                  return (
                    <motion.tr
                      key={row.id}
                      layout="position"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      onClick={() => onInspect(row.original.id)}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onInspect(row.original.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer transition-colors focus:outline-none",
                        isSelected
                          ? "bg-cyan-500/10 shadow-[inset_2px_0_0_var(--color-state-info)]"
                          : "hover:bg-zinc-800/50 focus-visible:bg-zinc-800/50",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className={cellPadding}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
