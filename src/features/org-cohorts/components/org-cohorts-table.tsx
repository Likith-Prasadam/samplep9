import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Building2,
  ChevronRight,
  Clock,
  Edit,
  LayoutGrid,
  List,
  Trash2,
  Users,
} from 'lucide-react';

import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { DataTablePagination } from '@/components/data-table';
import { DataTableToolbar } from '@/components/data-table';
import { useAppDispatch } from '@/store';
import { usePermissions } from '@/hooks/use-permissions';
import {
  setCurrentCohort,
  setDialogOpen,
} from '@/store/slices/org-cohorts-slice';
import type { OrgCohort, OrgCohortFilters } from '@/types/org-cohort-types';
import { OrgCohortsListTable } from './org-cohorts-list-table';
import { matchesSmartSearch } from '@/utils/smart-search';

export type ViewMode = 'list' | 'grid';

interface OrgCohortsTableProps {
  data: OrgCohort[];
  loading: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onSelect?: (cohort: OrgCohort) => void;
  onRefresh?: () => void;
  filters?: OrgCohortFilters;
  onFiltersChange?: (filters: OrgCohortFilters) => void;
  showViewToggle?: boolean;
  preserveOrder?: boolean;
  pagination?: {
    page: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

interface CohortRow extends OrgCohort {
  cohortType: 'Root' | 'Child organization';
  updatedAtLabel: string;
  updatedAtTimestamp: number;
}

const cohortGlobalFilter: FilterFn<CohortRow> = (
  row,
  _columnId,
  filterValue
) => {
  const haystack =
    `${row.original.orgCohortName} ${row.original.cohortType} ${row.original.updatedAtLabel}`.toLowerCase();
  return matchesSmartSearch(haystack, filterValue);
};

export function OrgCohortsTable({
  data,
  loading,
  viewMode,
  onViewModeChange,
  onSelect,
  showViewToggle = true,
  preserveOrder = false,
  pagination,
  onPageChange,
  onItemsPerPageChange,
}: OrgCohortsTableProps) {
  const dispatch = useAppDispatch();
  const perms = usePermissions();

  const [sorting, setSorting] = useState<SortingState>([
    { id: '__rootFirst', desc: true },
    { id: 'orgCohortName', desc: false },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    __rootFirst: false,
  });
  const [globalFilter, setGlobalFilter] = useState('');

  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const safePage = Math.min(Math.max(1, pagination?.page ?? 1), totalPages);
  const pageSize = pagination?.itemsPerPage ?? 10;
  const isManualPagination = Boolean(pagination);

  const [tablePagination, setTablePagination] = useState<PaginationState>({
    pageIndex: safePage - 1,
    pageSize,
  });

  useEffect(() => {
    setTablePagination({ pageIndex: safePage - 1, pageSize });
  }, [safePage, pageSize]);

  const sortedData = useMemo(() => {
    if (preserveOrder) return data;
    return [...data].sort((a, b) => {
      const rootDiff = Number(b.isRoot) - Number(a.isRoot);
      if (rootDiff !== 0) return rootDiff;
      return (a.orgCohortName || '').localeCompare(b.orgCohortName || '');
    });
  }, [data, preserveOrder]);

  const tableData = useMemo<CohortRow[]>(
    () =>
      sortedData.map((cohort) => {
        const timestamp = cohort.updatedAt
          ? new Date(cohort.updatedAt).getTime()
          : 0;
        return {
          ...cohort,
          cohortType: cohort.isRoot ? 'Root' : 'Child organization',
          updatedAtLabel: cohort.updatedAt
            ? format(new Date(cohort.updatedAt), 'MMM dd, yyyy · HH:mm')
            : '—',
          updatedAtTimestamp: timestamp,
        };
      }),
    [sortedData]
  );

  const handleEdit = useCallback(
    (cohort: OrgCohort) => {
      if (!perms.isRootAdmin) {
        toast.error("You don't have access to perform this operation.");
        return;
      }
      dispatch(setCurrentCohort(cohort));
      dispatch(setDialogOpen('edit'));
    },
    [dispatch, perms.isRootAdmin]
  );

  const handleDelete = useCallback(
    (cohort: OrgCohort) => {
      if (!perms.isRootAdmin) {
        toast.error("You don't have access to perform this operation.");
        return;
      }
      dispatch(setCurrentCohort(cohort));
      dispatch(setDialogOpen('delete'));
    },
    [dispatch, perms.isRootAdmin]
  );

  const cohortTypeFilterOptions = useMemo(
    () => [
      { label: 'Root', value: 'Root' },
      { label: 'Child organization', value: 'Child organization' },
    ],
    []
  );

  const columns = useMemo<ColumnDef<CohortRow>[]>(() => {
    const baseColumns: ColumnDef<CohortRow>[] = [
      // Always pin Root organizations at the top (even when sorting by other columns).
      {
        id: '__rootFirst',
        accessorFn: (row) => (row.isRoot ? 1 : 0),
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'orgCohortName',
        header: 'Organization Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="truncate text-sm font-medium text-foreground">
              {row.original.orgCohortName}
            </span>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'cohortType',
        header: 'Type',
        cell: ({ row }) =>
          row.original.isRoot ? (
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0 text-[11px] border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400 bg-transparent"
            >
              Root
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="rounded-full px-2 py-0 text-[11px] bg-transparent"
            >
              Child organization
            </Badge>
          ),
        enableSorting: true,
        filterFn: (row, columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.getValue(columnId));
        },
      },
      {
        id: 'updatedAt',
        accessorFn: (row) => row.updatedAtTimestamp,
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.updatedAtLabel}
          </span>
        ),
        sortingFn: 'basic',
      },
    ];

    if (perms.isRootAdmin) {
      baseColumns.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-md"
                  onClick={() => handleEdit(row.original)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Edit organization
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 rounded-md hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                  onClick={() => handleDelete(row.original)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Delete organization
              </TooltipContent>
            </Tooltip>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      });
    }

    return baseColumns;
  }, [handleDelete, handleEdit, perms.isRootAdmin]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination: tablePagination,
    },
    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const withoutRoot = next.filter((s) => s.id !== '__rootFirst');
        return [{ id: '__rootFirst', desc: true }, ...withoutRoot];
      });
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(tablePagination) : updater;
      setTablePagination(next);

      if (!pagination) return;

      if (next.pageSize !== tablePagination.pageSize) {
        onItemsPerPageChange?.(next.pageSize);
        onPageChange?.(1);
        return;
      }

      const nextPage = next.pageIndex + 1;
      if (nextPage !== safePage) {
        onPageChange?.(nextPage);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: cohortGlobalFilter,
    manualPagination: isManualPagination,
    pageCount: pagination ? totalPages : undefined,
  });

  const currentRows = isManualPagination
    ? table.getRowModel().rows
    : table.getPaginationRowModel().rows;
  const isEmptyState = currentRows.length === 0 && !loading;

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full lg:max-w-2xl">
          <DataTableToolbar
            table={table}
            searchPlaceholder="Search organizations by name, type or updated date..."
            filters={[
              {
                columnId: 'cohortType',
                title: 'Type',
                options: cohortTypeFilterOptions,
              },
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {showViewToggle ? (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-black border border-gray-200 dark:border-slate-800 rounded-lg p-0 h-8 shrink-0">
              <button
                onClick={() => onViewModeChange('list')}
                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                aria-label="Grid view"
                title="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedData.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-muted-foreground">
            <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4 border border-border/40">
              <Building2 className="h-7 w-7 opacity-40" />
            </div>
            <p className="text-sm font-semibold">No organizations found</p>
            <p className="text-xs mt-1 opacity-60">
              Create your first organization to get started
            </p>
          </div>
        ) : isEmptyState ? (
          <div className="flex flex-col items-center justify-center h-40 rounded-xl border border-border/50 bg-muted/10 text-muted-foreground">
            <p className="text-sm font-medium">No matching organizations</p>
          </div>
        ) : viewMode === 'list' ? (
          <OrgCohortsListTable
            data={currentRows.map((r) => r.original)}
            isRootAdmin={perms.isRootAdmin}
            safePage={table.getState().pagination.pageIndex + 1}
            pageSize={table.getState().pagination.pageSize}
            onSelect={onSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 pb-4">
            {currentRows.map((row) => {
              const cohort = row.original;
              return (
                <div
                  key={cohort.orgCohortHash}
                  onClick={() => onSelect?.(cohort)}
                  className={[
                    'group relative flex flex-col rounded-xl border border-border dark:border-border bg-card transition-all duration-200 overflow-hidden',
                    'hover:border-blue-300/60 hover:shadow-lg hover:shadow-blue-500/5 dark:hover:border-blue-500/30 dark:hover:shadow-blue-500/5',
                    onSelect ? 'cursor-pointer' : '',
                  ].join(' ')}
                >
                  <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-300 to-transparent dark:bg-gradient-to-r dark:from-blue-900 dark:via-blue-800 dark:to-transparent" />

                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-semibold shadow-sm">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <h3 className="font-semibold text-sm leading-snug text-foreground line-clamp-2">
                                {cohort.orgCohortName}
                              </h3>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs text-xs"
                            >
                              {cohort.orgCohortName}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {cohort.isRoot ? (
                            <Badge className="text-[10px] px-2 py-0 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/20 shadow-none">
                              Root
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-2 py-0 font-medium shadow-none"
                            >
                              Child organization
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {cohort.updatedAt && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="h-3 w-3 opacity-60" />
                        <span>
                          Last updated at:{' '}
                          {format(new Date(cohort.updatedAt), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    )}

                    {onSelect && (
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 mt-auto pt-1">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">View members</span>
                        <ChevronRight className="h-3 w-3 -ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </div>

                  {perms.isRootAdmin && (
                    <div className="px-3 py-2.5 border-t border-gray-300 dark:border-border bg-muted/10 dark:bg-muted/5 flex gap-1.5">
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          className="flex-1 flex justify-center items-center px-3 py-1.5 text-sm font-medium rounded-lg transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cohort);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                        <div className="w-px border border-border dark:border-border self-stretch" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 text-xs font-medium gap-1.5 bg-red-50 border border-red-100 dark:border-red-500 dark:bg-red-900/10 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(cohort);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">Delete</span>
                        </Button>
                      </>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/40 bg-background pt-3 pb-1 mt-3">
        <DataTablePagination table={table} singleLine />
      </div>
    </div>
  );
}
