"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Layers, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function DataTable({ 
  columns, 
  data, 
  renderBulkActions, 
  pageCount, 
  pagination, 
  onPaginationChange 
}) {
  const [rowSelection, setRowSelection] = useState({})
  const [customSize, setCustomSize] = useState("")

  const table = useReactTable({
    data,
    columns,
    pageCount: pageCount ?? -1, // Server-side page count
    state: {
      pagination,
      rowSelection,
    },
    onPaginationChange: onPaginationChange,
    onRowSelectionChange: setRowSelection,
    manualPagination: true, // Critical for server-side
    getCoreRowModel: getCoreRowModel(),
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original);

  const handlePageSizeChange = (val) => {
    if (val === 'custom') {
      // Focus input logic if needed, effectively handled by UI state
    } else {
      table.setPageSize(Number(val));
      setCustomSize("");
    }
  };

  const handleCustomSizeSubmit = (e) => {
    e.preventDefault();
    const val = parseInt(customSize);
    if (val > 0) table.setPageSize(val);
  };

  return (
    <div className="relative pb-24">
      
      {/* TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-slate-700 h-12">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 data-[state=selected]:bg-blue-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Layers size={48} className="mb-4 opacity-20" />
                    <p>No records found matching your filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* PAGINATION CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
        
        {/* Row Count Selector */}
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-500">Rows per page</p>
          <Select 
            value={customSize ? "custom" : pagination.pageSize.toString()} 
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50, 100].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Custom Input (Shows only if Custom selected or typing) */}
          {(customSize || pagination.pageSize > 100 || ![10,25,50,100].includes(pagination.pageSize)) && (
             <form onSubmit={handleCustomSizeSubmit} className="flex items-center gap-1">
               <Input 
                 className="h-8 w-16 text-center" 
                 placeholder="#"
                 value={customSize}
                 onChange={(e) => setCustomSize(e.target.value)}
               />
               <Button type="submit" variant="ghost" size="sm" className="h-8 px-2">Set</Button>
             </form>
          )}
        </div>

        {/* Page Navigation */}
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-slate-600 mr-2">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* BULK ACTIONS BAR */}
      {selectedRows.length > 0 && renderBulkActions && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-2 py-2 pr-6 rounded-full shadow-2xl border border-slate-700/50 flex items-center gap-6">
            <div className="bg-slate-800 rounded-full px-4 py-1.5 text-sm font-medium border border-slate-700">
              {selectedRows.length} Selected
            </div>
            
            <div className="flex items-center gap-2 border-l border-slate-700 pl-6 h-6">
              {renderBulkActions({ selectedRows, resetSelection: () => setRowSelection({}) })}
            </div>

            <button 
              onClick={() => setRowSelection({})}
              className="ml-2 hover:bg-slate-800 p-1.5 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}