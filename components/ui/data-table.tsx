"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ChevronDown, ChevronUp, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { CaretSortIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

type SortDirection = "asc" | "desc" | null

export interface ColumnDef<T> {
  id: string
  header: string
  accessorFn: (row: T) => any
  cell?: ({ row }: { row: { original: T, getValue: (id: string) => any } }) => React.ReactNode
  enableSorting?: boolean
  enableFiltering?: boolean
  enableHiding?: boolean
  width?: number | string
  minWidth?: number
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  searchKey?: string
  paginationOptions?: number[]
  initialPageSize?: number
  showFilters?: boolean
  initialSortColumn?: string
  initialSortDirection?: "asc" | "desc"
  columnVisibilityButton?: React.ReactNode
  columnOrder?: string[]
  onColumnOrderChange?: (newOrder: string[]) => void
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns,
  data,
  searchKey,
  paginationOptions = [10, 20, 30, 50, 100],
  initialPageSize = 10,
  showFilters = true,
  initialSortColumn,
  initialSortDirection,
  columnVisibilityButton,
  columnOrder,
  onColumnOrderChange,
  onRowClick,
}: DataTableProps<T>) {
  // Disable pagination, always show all results
  const [sortColumn, setSortColumn] = useState<string | null>(initialSortColumn || null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection || null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => 
    columns.reduce((acc, column) => {
      acc[column.id] = true
      return acc
    }, {} as Record<string, boolean>)
  )
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
    columns.reduce((acc, column) => {
      acc[column.id] = column.width ? Number(column.width) : 100;
      return acc;
    }, {} as Record<string, number>)
  )
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState<number>(0);
  const [initialWidth, setInitialWidth] = useState<number>(0);
  const tableRef = useRef<HTMLTableElement>(null);

  // Initialize column widths on component mount
  useEffect(() => {
    // Set initial column widths based on column definitions
    const initialWidths = columns.reduce((acc, column) => {
      if (column.width) {
        acc[column.id] = typeof column.width === 'number' 
          ? column.width 
          : parseInt(column.width as string, 10) || 100;
      } else {
        // Default width if not specified
        acc[column.id] = 100;
      }
      return acc;
    }, {} as Record<string, number>);
    
    setColumnWidths(initialWidths);
    
    console.log('Initial column widths set:', initialWidths);
  }, [columns]);

  // Get visible columns in the correct order
  const visibleColumns = useMemo(() => {
    const orderedColumns = columnOrder 
      ? columnOrder
          .map(id => columns.find(col => col.id === id))
          .filter((col): col is ColumnDef<T> => col !== undefined)
      : columns;
    
    return orderedColumns.filter(column => columnVisibility[column.id]);
  }, [columns, columnVisibility, columnOrder]);

  // Handle column visibility toggle
  const toggleColumnVisibility = (columnId: string, isVisible: boolean) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: isVisible
    }))
  }

  // Handle filter change
  const handleFilterChange = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value
    }))
  }

  // Handle sorting
  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      // Toggle through: asc -> desc -> none
      const newDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc"
      setSortDirection(newDirection)
      if (newDirection === null) {
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnId)
      setSortDirection("asc")
    }
  }

  // Apply filters and sorting to data
  const filteredAndSortedData = useMemo(() => {
    // First apply filters
    const filtered = data.filter(row => {
      // Apply column-specific filters
      for (const columnId in filters) {
        if (filters[columnId]) {
          const column = columns.find(col => col.id === columnId)
          if (column) {
            const value = String(column.accessorFn(row)).toLowerCase()
            if (!value.includes(filters[columnId].toLowerCase())) {
              return false
            }
          }
        }
      }

      // Apply global search if searchKey is provided
      if (searchKey && globalFilter) {
        const column = columns.find(col => col.id === searchKey)
        if (column) {
          const value = String(column.accessorFn(row)).toLowerCase()
          if (!value.includes(globalFilter.toLowerCase())) {
            return false
          }
        }
      }

      return true
    });

    // Then apply sorting
    if (!sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      const column = columns.find(col => col.id === sortColumn)
      if (!column) return 0
      
      const valueA = column.accessorFn(a)
      const valueB = column.accessorFn(b)
      
      if (valueA === valueB) return 0
      
      // Default string comparison for simplicity
      const comparison = String(valueA).localeCompare(String(valueB))
      return sortDirection === "asc" ? comparison : -comparison
    });
  }, [data, filters, globalFilter, searchKey, sortColumn, sortDirection, columns]);

  // Handle column resize with improved calculations
  const handleMouseDown = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Store initial values when resize starts
    const startX = e.clientX;
    const startWidth = columnWidths[columnId] || 100;
    
    // Calculate initial position for the resize line
    const tableElement = tableRef.current;
    if (!tableElement) return;
    
    const headerCells = tableElement.querySelectorAll('th');
    let targetCell: HTMLElement | null = null;
    let accumulatedWidth = 0;
    
    // Find the target header cell and calculate its position
    headerCells.forEach((cell) => {
      const cellElement = cell as HTMLElement;
      if (cellElement.dataset.columnId === columnId) {
        targetCell = cellElement;
      } else if (!targetCell) {
        // Add width of cells before our target
        accumulatedWidth += cellElement.offsetWidth;
      }
    });
    
    if (!targetCell) return;
    
    const columnLeftOffset = accumulatedWidth;
    
    setResizingColumn(columnId);
    setResizeStartX(startX);
    setInitialWidth(startWidth);
    
    const resizeLine = document.getElementById('resize-line');
    if (resizeLine) {
      const initialPos = columnLeftOffset + startWidth;
      resizeLine.style.left = `${initialPos}px`;
    }
    
    // Add a class to prevent text selection during resize
    document.body.classList.add('resize-table-column');
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      
      const delta = moveEvent.clientX - startX;
      // Allow any width, including very small values - don't enforce minimum
      const newWidth = Math.max(startWidth + delta, 5); // Tiny minimum just to keep column visible
      
      // Update width in state
      setColumnWidths(prev => ({
        ...prev,
        [columnId]: newWidth
      }));
      
      // Update resize line position
      if (resizeLine) {
        const newPos = columnLeftOffset + newWidth;
        resizeLine.style.left = `${newPos}px`;
      }
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      document.body.classList.remove('resize-table-column');
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const table = useReactTable({
    columns: visibleColumns.map(column => ({
      ...column,
      accessorFn: column.accessorFn,
      cell: column.cell,
      header: column.header,
    })),
    data: filteredAndSortedData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showFilters && (
          <div className="flex items-center gap-2">
            {searchKey && (
              <Input
                placeholder="Search..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="max-w-sm"
              />
            )}
          </div>
        )}
        {columnVisibilityButton}
      </div>
      <div className="rounded-md border">
        <Table ref={tableRef}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    data-column-id={header.column.id}
                    style={{ width: columnWidths[header.column.id] || 'auto' }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          header.column.columnDef.enableSorting && "cursor-pointer select-none"
                        )}
                        onClick={() => header.column.columnDef.enableSorting && handleSort(header.column.id)}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.columnDef.enableSorting && (
                          <CaretSortIcon className="h-4 w-4" />
                        )}
                      </div>
                      {header.column.columnDef.enableHiding !== false && (
                        <div
                          className="w-1 h-full cursor-col-resize hover:bg-primary/10"
                          onMouseDown={(e) => handleMouseDown(header.column.id, e)}
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-accent/40 transition-colors')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Debug output only during development */}
      {process.env.NODE_ENV === 'development' && resizingColumn && (
        <div className="text-xs text-gray-500 mt-2">
          Resizing column: {resizingColumn}, 
          Width: {columnWidths[resizingColumn] || 0}px
        </div>
      )}
    </div>
  )
} 