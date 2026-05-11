import { useEffect, useState, useMemo } from 'react';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Pencil, Trash2, UserPlus, Mail, Phone } from 'lucide-react';
import { DataTablePagination } from '@/components/data-table';
import { useTableUrlState, type NavigateFn } from '@/hooks/use-table-url-state';
import { matchesSmartSearch } from '@/utils/smart-search';
import { Cross2Icon } from '@radix-ui/react-icons';
import UserDeleteDialog from './user-delete-dialog';
import { AssignRoleDialog } from './assign-role-dialog';
import { RoleFilterWithManage } from './role-filter-with-manage';
import { UsersPrimaryButtons } from './users-primary-buttons';
import { type RowData } from '@tanstack/react-table';
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string;
  }
}

export interface User {
  user_id?: string;
  user_hash: string;
  display_name?: string;
  email_id: string;
  first_name: string;
  last_name: string;
  account_type: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  roles: string[];
  role_names: string[];
  cohort_hashes: string[];
  cohort_names: string[];
  role_assignments?: Array<{
    user_role_cohort_hash: string;
    role_hash: string;
    role_name: string;
    cohort_hash: string;
    cohort_name: string;
  }>;
}

type DataTableProps = {
  data: User[];
  search: Record<string, unknown>;
  navigate: NavigateFn;
  loading: boolean;
  onEdit: (user: User) => void;
  onRefresh: () => void;
  onAddUser?: () => void;
  canManage?: boolean;
  isRootAdmin?: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  setItemsPerPage: (perPage: number) => void;
  onPageChange: (page: number) => void;
  orgCohortHash: string;
};

export function UsersTable({
  data,
  search,
  navigate,
  loading,
  onEdit,
  onRefresh,
  canManage: canManageProp,
  isRootAdmin = false,
  currentPage,
  totalPages,
  itemsPerPage,
  setItemsPerPage,
  onPageChange,
  orgCohortHash,
}: DataTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const { columnFilters, onColumnFiltersChange, ensurePageInRange } =
    useTableUrlState({
      search,
      navigate,
      pagination: { defaultPage: 1, defaultPageSize: 10 },
      globalFilterDebounceMs: 300,
      globalFilter: { enabled: false, key: 'search' },
      columnFilters: [{ columnId: 'role', searchKey: 'role', type: 'array' }],
    });

  const urlAppliedSearch =
    typeof search.search === 'string' ? search.search : '';

  const [appliedSearch, setAppliedSearch] = useState(urlAppliedSearch);
  const [pendingSearch, setPendingSearch] = useState(urlAppliedSearch);

  useEffect(() => {
    setAppliedSearch(urlAppliedSearch);
    setPendingSearch(urlAppliedSearch);
  }, [urlAppliedSearch]);

  const applySearch = () => {
    // Preserve trailing spaces so users can opt into whole-word search (e.g. "test ").
    const next = pendingSearch.replace(/^\s+/, '');
    setAppliedSearch(next);

    // Only update URL on submit to avoid refetching/filtering on each keystroke.
    navigate({
      replace: true,
      search: (prev) => ({
        ...(prev as Record<string, unknown>),
        page: undefined,
        search: next ? next : undefined,
      }),
    });

    onPageChange(1);
  };

  const [pagination, setPagination] = useState({
    pageIndex: currentPage - 1,
    pageSize: itemsPerPage,
  });

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [assignRoleUser, setAssignRoleUser] = useState<User | null>(null);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);

  const canManage = canManageProp ?? false;

  const loggedInUserHash =
    JSON.parse(localStorage.getItem('user') ?? '{}')?.user_hash ?? null;

  const filteredUsers = useMemo(() => {
    return loggedInUserHash
      ? data.filter((u) => u.user_hash !== loggedInUserHash)
      : data;
  }, [data, loggedInUserHash]);

  const assignedRoleNames = useMemo(() => {
    const roles = new Set<string>();
    filteredUsers.forEach((user) => {
      (user.role_names ?? []).forEach((role) => roles.add(role));
    });
    return Array.from(roles);
  }, [filteredUsers]);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'first_name',
      header: 'First Name',
    },
    {
      accessorKey: 'last_name',
      header: 'Last Name',
    },
    {
      accessorKey: 'display_name',
      header: 'User Name',
    },
    {
      accessorKey: 'email_id',
      header: 'Email',
      cell: ({ row }) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-sm min-w-0 max-w-full">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{row.original.email_id}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs break-words">
            {row.original.email_id}
          </TooltipContent>
        </Tooltip>
      ),
      meta: {
        className: 'w-[35%] min-w-[160px] max-w-[350px]',
      },
    },
    {
      accessorKey: 'phone_number',
      header: 'Phone Number',
      cell: ({ row }) =>
        row.original.phone_number ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 text-sm min-w-0 max-w-full">
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{row.original.phone_number}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs break-words">
              {row.original.phone_number}
            </TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      meta: {
        className: 'w-[18%] min-w-[110px] max-w-[150px]',
      },
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => {
        const gender = row.original.gender;
        if (!gender) return '-';
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      },
    },
    {
      accessorKey: 'account_type',
      header: 'Account Type',
      cell: ({ row }) => {
        const type = row.original.account_type;
        if (!type) return <span className="text-muted-foreground">—</span>;
        const label =
          type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        return (
          <Badge
            variant="secondary"
            className="text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {label}
          </Badge>
        );
      },
    },
    {
      id: 'role',
      header: 'Roles',
      accessorFn: (row) => row.role_names ?? [],
      filterFn: (
        row,
        _columnId,
        filterValue: Array<string | null | undefined>
      ) => {
        if (!filterValue || filterValue.length === 0) return true;

        const userRoles = row.original.role_names ?? [];

        return filterValue.some((filter) => {
          if (typeof filter !== 'string' || filter.trim() === '') return false;
          if (filter.includes(' + ')) {
            const requiredRoles = filter.split(' + ').map((r) => r.trim());
            return requiredRoles.every((role) => userRoles.includes(role));
          } else {
            return userRoles.includes(filter);
          }
        });
      },
      cell: ({ row }) => {
        const roles = row.original.role_names ?? [];
        if (!roles.length)
          return <span className="text-muted-foreground/40 text-sm">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 2).map((name) => (
              <Badge
                key={name}
                className="text-[10px] px-2 py-0.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40 shadow-none"
              >
                {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
              </Badge>
            ))}
            {roles.length > 2 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5 font-medium rounded-full shadow-none"
              >
                +{roles.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'cohort',
      header: 'Cohorts',
      accessorFn: (row) => row.cohort_names ?? [],
      cell: ({ row }) =>
        row.original.cohort_names?.length
          ? row.original.cohort_names.join(', ')
          : '-',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.is_active;
        const locked = row.original.is_locked;
        if (locked) {
          return (
            <Badge className="text-[10px] px-2 py-0.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40 shadow-none gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
              Locked
            </Badge>
          );
        }
        return active ? (
          <Badge className="text-[10px] px-2 py-0.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40 shadow-none gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            Active
          </Badge>
        ) : (
          <Badge className="text-[10px] px-2 py-0.5 font-semibold rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/40 shadow-none gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" />
            Inactive
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              {canManage ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs text-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAssignRoleUser(row.original);
                    setIsAssignRoleDialogOpen(true);
                  }}
                >
                  <UserPlus className="h-3.5 w-3.5 text-foreground" />
                </Button>
              ) : (
                <div className="h-8 w-8" />
              )}
            </TooltipTrigger>
            <TooltipContent className="text-xs">Assign Role</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              {canManage && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(row.original);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5 text-blue-600" />
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent className="text-xs">Edit User</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              {canManage && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteUser(row.original);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </Button>
              )}
            </TooltipTrigger>
            <TooltipContent className="text-xs">Delete User</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredUsers,
    columns,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      sorting,
      pagination,
      columnFilters,
      columnVisibility,
      globalFilter: appliedSearch,
    },
    onPaginationChange: (updater) => {
      const newPag =
        typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(newPag);
      const newPageIdx = newPag.pageIndex + 1;
      const newSize = newPag.pageSize;
      if (newPageIdx !== currentPage) onPageChange(newPageIdx);
      if (newSize !== itemsPerPage) setItemsPerPage(newSize);
    },
    onColumnFiltersChange,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const firstName = String(row.original.first_name || '').toLowerCase();
      const lastName = String(row.original.last_name || '').toLowerCase();
      const displayName = String(row.original.display_name || '').toLowerCase();

      return matchesSmartSearch(
        `${firstName} ${lastName} ${displayName}`,
        filterValue
      );
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  useEffect(() => {
    setPagination({ pageIndex: currentPage - 1, pageSize: itemsPerPage });
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    ensurePageInRange(totalPages);
  }, [totalPages, ensurePageInRange]);

  /* ── Helper: status badge ── */
  const renderStatus = (user: User) => {
    if (user.is_locked) {
      return (
        <Badge className="text-[10px] px-2 py-0.5 font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/40 shadow-none gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
          Locked
        </Badge>
      );
    }
    return user.is_active ? (
      <Badge className="text-[10px] px-2 py-0.5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40 shadow-none gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
        Active
      </Badge>
    ) : (
      <Badge className="text-[10px] px-2 py-0.5 font-semibold rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200/60 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700/40 shadow-none gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" />
        Inactive
      </Badge>
    );
  };

  /* ── Helper: roles badges ── */
  const renderRoles = (user: User) => {
    const roles = user.role_names ?? [];
    if (!roles.length)
      return <span className="text-muted-foreground/40 text-sm">—</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {roles.slice(0, 2).map((name) => (
          <Badge
            key={name}
            className="text-[10px] px-2 py-0.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/40 shadow-none"
          >
            {name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}
          </Badge>
        ))}
        {roles.length > 2 && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0.5 font-medium rounded-full shadow-none"
          >
            +{roles.length - 2}
          </Badge>
        )}
      </div>
    );
  };

  /* ── Helper: action buttons ── */
  const renderActions = (user: User) => {
    if (!canManage) return null;

    return (
      <div
        className="flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-foreground hover:bg-muted/60 transition-colors"
              onClick={() => {
                setAssignRoleUser(user);
                setIsAssignRoleDialogOpen(true);
              }}
            >
              <UserPlus className="h-3.5 w-3.5 text-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Assign Role</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-3.5 w-3.5 text-blue-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Edit User</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
              onClick={() => setDeleteUser(user)}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Delete User</TooltipContent>
        </Tooltip>
      </div>
    );
  };

  const rows = table.getRowModel().rows;
  const showCohortsAndStatus = isRootAdmin;
  const gridCols = showCohortsAndStatus
    ? 'grid-cols-[1.1fr_0.9fr_1.5fr_1fr_0.7fr_1fr_1fr_0.6fr_80px]'
    : 'grid-cols-[1.1fr_0.9fr_1.5fr_1fr_0.7fr_1fr_80px]';

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <div className="pb-4 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 flex-nowrap">
            <div className="flex items-center gap-2 min-w-0 flex-nowrap">
              <div className="relative">
                <Input
                  value={pendingSearch}
                  onChange={(e) => {
                    const next = e.target.value;
                    setPendingSearch(next);
                    // Apply client-side filtering immediately for responsiveness.
                    setAppliedSearch(next.replace(/^\s+/, ''));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                  placeholder="Search by name or user name..."
                  className="h-8 w-[150px] lg:w-[250px] pr-8"
                />
                {pendingSearch !== '' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                    onClick={() => {
                      setPendingSearch('');
                      setAppliedSearch('');
                      navigate({
                        replace: true,
                        search: (prev) => ({
                          ...(prev as Record<string, unknown>),
                          page: undefined,
                          search: undefined,
                        }),
                      });
                      onPageChange(1);
                    }}
                    aria-label="Clear search"
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <RoleFilterWithManage
                column={table.getColumn('role') as never}
                title="Role"
                onRolesChange={onRefresh}
                isAdmin={canManage}
                assignedRoleNames={assignedRoleNames}
              />
            </div>
          </div>
          <UsersPrimaryButtons canManage={canManage} />
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="rounded-xl border border-border/60 dark:border-border h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                {Array.from({ length: Math.min(5, itemsPerPage) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-4 border-b border-border/40 last:border-b-0"
                    >
                      <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                      <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  )
                )}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-muted-foreground">
              <p className="text-sm font-semibold">
                No users in this organization
              </p>
              <p className="text-xs mt-1 opacity-60">
                Add a user and assign them to this organization
              </p>
              <div className="mt-4">
                <UsersPrimaryButtons canManage={canManage} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 dark:border-border h-full flex flex-col">
              <ScrollArea className="flex-1 w-full h-full">
                {/* Table Header */}
                <div
                  className={`sticky top-0 z-10 grid ${gridCols} items-center bg-muted border-b border-border/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground rounded-t-xl`}
                >
                  <div>Name</div>
                  <div>Username</div>
                  <div>Email</div>
                  <div>Phone</div>
                  <div className="whitespace-nowrap">Account Type</div>
                  <div className="pl-4">Roles</div>
                  {showCohortsAndStatus && <div>Cohorts</div>}
                  {showCohortsAndStatus && <div>Status</div>}
                  <div className="ml-4">
                    {canManage ? (
                      'Actions'
                    ) : (
                      <span className="sr-only">Actions</span>
                    )}
                  </div>
                </div>

                {/* Table Rows */}
                {rows.map((row) => {
                  const user = row.original;
                  const accountType = user.account_type
                    ? user.account_type.charAt(0).toUpperCase() +
                      user.account_type.slice(1).toLowerCase()
                    : null;
                  return (
                    <div
                      key={row.id}
                      className={`group grid ${gridCols} items-center px-4 py-3 border last:border-b-0 border-border/60 dark:border-border transition-colors duration-150 hover:bg-muted/30 dark:bg-transparent`}
                    >
                      {/* Name */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm font-medium text-foreground truncate cursor-default">
                            {[user.first_name, user.last_name]
                              .filter(Boolean)
                              .join(' ') || '—'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {[user.first_name, user.last_name]
                            .filter(Boolean)
                            .join(' ') || '—'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Username */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-sm text-muted-foreground truncate cursor-default">
                            {user.display_name || '—'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {user.display_name || '—'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Email */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 min-w-0 cursor-default">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="text-sm truncate">
                              {user.email_id}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {user.email_id}
                        </TooltipContent>
                      </Tooltip>

                      {/* Phone */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 min-w-0 text-sm text-muted-foreground cursor-default">
                            {user.phone_number ? (
                              <>
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {user.phone_number}
                                </span>
                              </>
                            ) : (
                              <span>—</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {user.phone_number || 'No phone number'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Account Type */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-default">
                            {accountType ? (
                              <Badge
                                variant="secondary"
                                className="text-xs font-medium px-2 py-0.5 rounded-full shadow-none"
                              >
                                {accountType}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {accountType || '—'}
                        </TooltipContent>
                      </Tooltip>

                      {/* Roles */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="pl-4 cursor-default">
                            {renderRoles(user)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-xs">
                          {user.role_names?.length
                            ? user.role_names.join(', ')
                            : 'No roles assigned'}
                        </TooltipContent>
                      </Tooltip>

                      {showCohortsAndStatus && (
                        <>
                          {/* Cohorts */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-sm text-muted-foreground truncate cursor-default">
                                {user.cohort_names?.length
                                  ? user.cohort_names.join(', ')
                                  : '—'}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs max-w-xs">
                              {user.cohort_names?.length
                                ? user.cohort_names.join(', ')
                                : 'No cohorts assigned'}
                            </TooltipContent>
                          </Tooltip>

                          {/* Status */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-default">
                                {renderStatus(user)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              {user.is_locked
                                ? 'Account is locked'
                                : user.is_active
                                  ? 'Account is active'
                                  : 'Account is inactive'}
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end">
                        {renderActions(user)}
                      </div>
                    </div>
                  );
                })}
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="shrink-0 border-t pt-4">
          <DataTablePagination table={table} />
        </div>
      </div>

      <UserDeleteDialog
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        userHash={deleteUser?.user_hash ?? ''}
        orgCohortHash={orgCohortHash}
        userId={deleteUser?.user_id ?? undefined}
        userName={deleteUser?.display_name ?? ''}
        onDeleteSuccess={onRefresh}
      />

      <AssignRoleDialog
        open={isAssignRoleDialogOpen}
        onOpenChange={setIsAssignRoleDialogOpen}
        cohortHash={orgCohortHash}
        user={
          assignRoleUser
            ? {
                userHash: assignRoleUser.user_hash,
                displayName:
                  assignRoleUser.display_name ||
                  assignRoleUser.first_name + ' ' + assignRoleUser.last_name,
                emailId: assignRoleUser.email_id,
              }
            : null
        }
        userRoles={
          assignRoleUser?.role_assignments?.map((ra) => ({
            userRoleCohortHash: ra.user_role_cohort_hash,
            roleHash: ra.role_hash,
            roleName: ra.role_name,
            cohortHash: ra.cohort_hash,
            cohortName: ra.cohort_name,
          })) || []
        }
        onSuccess={onRefresh}
      />
    </>
  );
}
