import { Cross2Icon } from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from './faceted-filter';

type DataTableToolbarProps<TData> = {
  table: Table<TData>;
  searchPlaceholder?: string;
  searchKey?: string;
  filters?: {
    columnId: string;
    title: string;
    icon?: React.ComponentType<{ className?: string }>;
    options: {
      label: string;
      value: string;
      icon?: React.ComponentType<{ className?: string }>;
      count?: number;
    }[];
    /** When set, this component is rendered instead of the faceted filter for this column. */
    customRender?: (column: ReturnType<Table<TData>['getColumn']>) => ReactNode;
  }[];
};

export function DataTableToolbar<TData>({
  table,
  searchPlaceholder = 'Filter...',
  searchKey,
  filters = [],
}: DataTableToolbarProps<TData>) {
  const searchValue = searchKey
    ? ((table.getColumn(searchKey)?.getFilterValue() as string) ?? '')
    : (table.getState().globalFilter ?? '');

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2">
        {searchKey ? (
          <div className="relative">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="h-8 w-[150px] lg:w-[250px] pr-8"
            />
            {String(searchValue ?? '') !== '' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => table.getColumn(searchKey)?.setFilterValue('')}
                aria-label="Clear search"
              >
                <Cross2Icon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="relative">
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="h-8 w-[150px] lg:w-[250px] pr-8"
            />
            {String(searchValue ?? '') !== '' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => table.setGlobalFilter('')}
                aria-label="Clear search"
              >
                <Cross2Icon className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        )}
        <div className="flex gap-x-2">
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId);
            if (!column) return null;
            if (filter.customRender) {
              return (
                <div key={filter.columnId}>{filter.customRender(column)}</div>
              );
            }
            if (!filter.options?.length) return null;
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                icon={filter.icon}
                options={filter.options}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
