import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Edit,
  Trash2,
  Plus,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import "./DataTable.css";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  onAdd?: () => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onView?: (row: TData) => void;
  addButtonText?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  onAdd,
  onEdit,
  onDelete,
  onView,
  addButtonText = "Add New",
  searchPlaceholder = "Search...",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="data-table-container">
      {/* Table Header with Search and Add Button */}
      <div className="table-header">
        <div className="table-search">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="search-input"
            />
          </div>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="add-button">
            <Plus size={16} />
            {addButtonText}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="table-header-cell">
                    {header.isPlaceholder ? null : (
                      <div
                        className={`header-content ${
                          header.column.getCanSort() ? "sortable" : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="sort-icon">
                            {{
                              asc: <ChevronUp size={16} />,
                              desc: <ChevronDown size={16} />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ChevronsUpDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
                {(onEdit || onDelete || onView) && (
                  <th className="table-header-cell actions-header">Actions</th>
                )}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="table-row">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="table-cell">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="table-cell actions-cell">
                      <div className="action-buttons">
                        {onView && (
                          <button
                            onClick={() => onView(row.original)}
                            className="action-btn view-btn"
                            title="View"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(row.original)}
                            className="action-btn edit-btn"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(row.original)}
                            className="action-btn delete-btn"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="no-data">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="table-pagination">
        <div className="pagination-info">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <span>
            Showing{" "}
            {table.getState().pagination.pageSize *
              table.getState().pagination.pageIndex +
              1}{" "}
            to{" "}
            {Math.min(
              table.getState().pagination.pageSize *
                (table.getState().pagination.pageIndex + 1),
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} results
          </span>
        </div>
        <div className="pagination-controls">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="pagination-btn"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: table.getPageCount() }, (_, i) => i).map(
              (pageIndex) => (
                <button
                  key={pageIndex}
                  onClick={() => table.setPageIndex(pageIndex)}
                  className={`page-btn ${
                    table.getState().pagination.pageIndex === pageIndex
                      ? "active"
                      : ""
                  }`}
                >
                  {pageIndex + 1}
                </button>
              )
            )}
          </div>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
