import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { type Table } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type DataTableViewOptionsProps<TData> = {
  table: Table<TData>;
  /** When true, the trigger is visible on narrow viewports too (default only shows lg+). */
  showOnMobile?: boolean;
  /** Extra classes for the trigger button (e.g. `ms-auto` when sitting alone in a toolbar row). */
  triggerClassName?: string;
};

export function DataTableViewOptions<TData>({
  table,
  showOnMobile = false,
  triggerClassName,
}: DataTableViewOptionsProps<TData>) {
  const getColumnLabel = (columnId: string) => {
    const knownLabels: Record<string, string> = {
      orgCohortName: 'Organization name',
      cohortType: 'Type',
      updatedAt: 'Updated',
    };
    return knownLabels[columnId] ?? columnId.replace(/_/g, ' ');
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 shrink-0',
            showOnMobile ? 'inline-flex' : 'hidden lg:inline-flex',
            triggerClassName
          )}
        >
          <MixerHorizontalIcon className="size-4" />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== 'undefined' && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {getColumnLabel(column.id)}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
