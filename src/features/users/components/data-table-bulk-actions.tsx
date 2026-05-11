import { type Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>;
  onRefresh?: () => void;
};

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200/60 bg-blue-50/60 px-3 py-2 dark:border-blue-800/40 dark:bg-blue-950/20">
      <Badge className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white shadow-none">
        {selectedCount}
      </Badge>
      <span className="flex-1 text-sm text-blue-700 dark:text-blue-300">
        {selectedCount === 1
          ? '1 user selected'
          : `${selectedCount} users selected`}
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/40 dark:hover:text-blue-300"
        onClick={() => table.resetRowSelection()}
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
