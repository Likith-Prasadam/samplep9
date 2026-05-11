'use client';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { cn, getPageNumbers } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ReactNode } from 'react';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  centerContent?: ReactNode;
  singleLine?: boolean;
  /** If the current page size is not in the list, it is still shown in the dropdown. */
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData>({
  table,
  centerContent,
  singleLine = false,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: DataTablePaginationProps<TData>) {
  const rawPageCount = table.getPageCount();
  const totalPages = Math.max(rawPageCount, 1);
  const currentPage = Math.min(
    table.getState().pagination.pageIndex + 1,
    totalPages
  );
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const currentPageSize = table.getState().pagination.pageSize;
  const mergedPageSizes = [
    ...new Set([currentPageSize, ...pageSizeOptions]),
  ].sort((a, b) => a - b);

  const rowsPerBlock = (
    <div className="flex shrink-0 items-center gap-2">
      <Select
        value={`${table.getState().pagination.pageSize}`}
        onValueChange={(value) => {
          table.setPageSize(Number(value));
        }}
      >
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue placeholder={table.getState().pagination.pageSize} />
        </SelectTrigger>
        <SelectContent side="top">
          {mergedPageSizes.map((pageSize) => (
            <SelectItem key={pageSize} value={`${pageSize}`}>
              {pageSize}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="whitespace-nowrap text-sm font-medium leading-none">
        Rows per page
      </span>
    </div>
  );

  const pageControlsBlock = (
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
      <span
        className="hidden shrink-0 text-sm font-medium leading-none tabular-nums text-foreground @max-3xl/content:hidden sm:inline"
        aria-live="polite"
      >
        Page {currentPage} of {totalPages}
      </span>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          className="size-8 shrink-0 p-0 @max-md/content:hidden"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to first page</span>
          <DoubleArrowLeftIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="size-8 shrink-0 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        {pageNumbers.map((pageNumber, index) => (
          <div key={`${pageNumber}-${index}`} className="flex items-center">
            {pageNumber === '...' ? (
              <span className="px-1 text-sm leading-none text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                variant={currentPage === pageNumber ? 'default' : 'outline'}
                className="h-8 min-w-8 shrink-0 px-2"
                onClick={() => table.setPageIndex((pageNumber as number) - 1)}
              >
                <span className="sr-only">Go to page {pageNumber}</span>
                {pageNumber}
              </Button>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          className="size-8 shrink-0 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRightIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="size-8 shrink-0 p-0 @max-md/content:hidden"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Go to last page</span>
          <DoubleArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (singleLine) {
    return (
      <div
        className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 px-2 py-2"
        style={{ overflowClipMargin: 1 }}
      >
        {rowsPerBlock}
        {pageControlsBlock}
      </div>
    );
  }

  /* Summary + controls: two stacked rows so “Showing …” gets full width (notifications, live alerts). */
  if (centerContent) {
    return (
      <div
        className="flex w-full min-w-0 flex-col gap-2 px-2 pt-1.5 pb-0"
        style={{ overflowClipMargin: 1 }}
      >
        <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {rowsPerBlock}
          {pageControlsBlock}
        </div>
        <div className="w-full min-w-0 border-t border-border/60 pt-4 pb-0">
          <div
            className={cn(
              'text-center text-sm leading-tight text-muted-foreground [text-wrap:balance]',
              '[&_p]:m-0 [&_p]:text-sm [&_p]:leading-tight [&_p]:text-muted-foreground',
              'sm:text-balance sm:[text-wrap:unset] sm:whitespace-nowrap'
            )}
          >
            {centerContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 py-2 md:gap-x-6"
      style={{ overflowClipMargin: 1 }}
    >
      {rowsPerBlock}
      {pageControlsBlock}
    </div>
  );
}
