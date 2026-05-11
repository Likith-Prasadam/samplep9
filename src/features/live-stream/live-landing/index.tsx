import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type Updater,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowLeft,
  Camera as CameraIcon,
  MessageSquare,
  Plus,
  Grid2x2,
  List,
  Building2,
} from 'lucide-react';

import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ThemeSwitch } from '@/components/theme-switch';
import { SearchField } from '@/components/search';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DataTableColumnHeader,
  DataTablePagination,
  DataTableToolbar,
  DataTableViewOptions,
} from '@/components/data-table';
import { CameraTable } from '@/features/cameras/camera-list/components/camera-table';
import { GET_ORG_COHORTS } from '@/graphql/mutations';
import { usePermissions } from '@/hooks/use-permissions';
import { matchesSmartSearch } from '@/utils/smart-search';
import {
  fetchCams,
  selectCams,
  selectCurrentPage,
  selectLoading,
  selectTotalCount,
} from '@/store/slices/camera-slice';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import type { AppDispatch, RootState } from '@/store';

interface OrgCohort {
  orgCohortHash: string;
  orgCohortName: string;
  isRoot: boolean;
  updatedAt?: string;
}

interface CohortTableRow {
  orgCohortHash: string;
  orgCohortName: string;
  isRoot: boolean;
  cohortType: 'Root' | 'Child organization';
  updatedAt: string;
}

interface GetOrgCohortsResponse {
  getOrgCohorts: {
    orgCohorts: OrgCohort[];
    page: number;
    itemsPerPage: number;
    hasNext: boolean;
  };
}

const EXCLUDED_CAMERA = 'Test-Demo Camera';

const formatUpdatedAt = (value?: string): string => {
  if (!value) {
    return '--';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsedDate);
};

const LiveLandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();

  const cohortFromQuery = searchParams.get('cohort')?.trim() ?? '';
  /** URL is the single source of truth — avoids sync races with useState (e.g. back button needing two clicks). */
  const selectedCohortHash = cohortFromQuery;
  const currentRoleCohortHash = useSelector(
    (state: RootState) => state.auth.currentRoleCohortHash
  );
  const perms = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [cohortViewMode, setCohortViewMode] = useState<'grid' | 'list'>('list');
  const [cohortSorting, setCohortSorting] = useState<SortingState>([
    { id: '__rootFirst', desc: true },
  ]);
  const [cohortColumnFilters, setCohortColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [cohortRowSelection, setCohortRowSelection] =
    useState<RowSelectionState>({});
  const [cohortColumnVisibility, setCohortColumnVisibility] =
    useState<VisibilityState>({ __rootFirst: false });

  const cameras = useSelector((state: RootState) => selectCams(state));
  const loading = useSelector((state: RootState) => selectLoading(state));
  const currentPage = useSelector((state: RootState) =>
    selectCurrentPage(state)
  );
  const totalCount = useSelector((state: RootState) => selectTotalCount(state));

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data,
    loading: cohortsLoading,
    error: cohortsError,
  } = useQuery<GetOrgCohortsResponse>(GET_ORG_COHORTS, {
    variables: {
      page: 1,
      itemsPerPage: 200,
    },
    fetchPolicy: 'cache-and-network',
  });

  const cohorts = useMemo(() => {
    const list = data?.getOrgCohorts?.orgCohorts ?? [];
    return [...list].sort((a, b) => {
      if (a.isRoot !== b.isRoot) {
        return a.isRoot ? -1 : 1;
      }
      return a.orgCohortName.localeCompare(b.orgCohortName, undefined, {
        sensitivity: 'base',
      });
    });
  }, [data]);

  // For cohort admins (non-root), skip the org list and auto-select their cohort.
  useEffect(() => {
    if (perms.isRootAdmin) return;
    if (cohortFromQuery) return; // URL explicitly set cohort
    if (!currentRoleCohortHash) return;
    if (cohorts.length === 0) return;

    const exists =
      cohorts.some((c) => c.orgCohortHash === currentRoleCohortHash) ||
      cohorts.length === 1;
    if (!exists) return;

    const nextHash =
      cohorts.find((c) => c.orgCohortHash === currentRoleCohortHash)
        ?.orgCohortHash ??
      cohorts[0]?.orgCohortHash ??
      '';

    if (!nextHash) return;
    if (cohortFromQuery === nextHash) return;

    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.set('cohort', nextHash);
      return nextParams;
    });
    // Reset camera pagination when switching cohort automatically.
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
  }, [
    perms.isRootAdmin,
    cohortFromQuery,
    currentRoleCohortHash,
    cohorts,
    setSearchParams,
  ]);

  const selectedCohort = useMemo(
    () =>
      cohorts.find((cohort) => cohort.orgCohortHash === selectedCohortHash) ??
      null,
    [cohorts, selectedCohortHash]
  );

  const canManageSelectedCohort =
    (selectedCohortHash ? perms.canEditOrg(selectedCohortHash) : false) ||
    perms.isAdmin ||
    perms.isRootAdmin;

  const cohortRows = useMemo<CohortTableRow[]>(
    () =>
      cohorts.map((cohort) => ({
        orgCohortHash: cohort.orgCohortHash,
        orgCohortName: cohort.orgCohortName,
        isRoot: cohort.isRoot,
        cohortType: cohort.isRoot ? 'Root' : 'Child organization',
        updatedAt: formatUpdatedAt(cohort.updatedAt),
      })),
    [cohorts]
  );

  const cohortColumns = useMemo<ColumnDef<CohortTableRow>[]>(
    () => [
      // Always pin Root organizations at the top (even when sorting by other columns).
      {
        id: '__rootFirst',
        accessorFn: (row) => (row.isRoot ? 1 : 0),
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'orgCohortName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Organization Name" />
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'cohortType',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Type" />
        ),
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue?.length) return true;
          return filterValue.includes(row.original.cohortType);
        },
        enableSorting: true,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Updated" />
        ),
        enableSorting: true,
      },
    ],
    []
  );

  const cohortTable = useReactTable({
    data: cohortRows,
    columns: cohortColumns,
    initialState: {
      pagination: {
        pageIndex: 0,
        // Multiples of 12 fill grid rows at 1/2/3/4 column breakpoints without trailing gaps.
        pageSize: 12,
      },
      sorting: [{ id: '__rootFirst', desc: true }],
      columnVisibility: { __rootFirst: false },
    },
    state: {
      globalFilter: searchTerm,
      sorting: cohortSorting,
      columnFilters: cohortColumnFilters,
      rowSelection: cohortRowSelection,
      columnVisibility: cohortColumnVisibility,
    },
    onGlobalFilterChange: setSearchTerm,
    onSortingChange: (updater) => {
      setCohortSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        const withoutRoot = next.filter((s) => s.id !== '__rootFirst');
        return [{ id: '__rootFirst', desc: true }, ...withoutRoot];
      });
    },
    onColumnFiltersChange: setCohortColumnFilters,
    onRowSelectionChange: setCohortRowSelection,
    onColumnVisibilityChange: setCohortColumnVisibility,
    enableRowSelection: true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const name = row.original.orgCohortName.toLowerCase();
      const type = row.original.cohortType.toLowerCase();
      const updated = row.original.updatedAt.toLowerCase();
      return matchesSmartSearch(`${name} ${type} ${updated}`, filterValue);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const cohortTypeFilterOptions = useMemo(
    () => [
      { label: 'Root', value: 'Root' },
      { label: 'Child organization', value: 'Child organization' },
    ],
    []
  );

  const paginatedCohortRows = cohortTable.getPaginationRowModel().rows;

  const mappedCameras = useMemo<Camera[]>(() => {
    if (!Array.isArray(cameras)) {
      return [];
    }

    return cameras
      .map((camera) => ({
        id: camera.camHash,
        cam_id: camera.camHash,
        cam_hash: camera.camHash,
        cam_name: camera.camName,
        cam_status: (camera.camStatus?.toLowerCase() === 'active'
          ? 'active'
          : 'inactive') as Camera['cam_status'],
        cam_resolution: camera.camResolution,
        cam_type: camera.camType,
        cam_placement_zone: camera.camPlacementZone,
        cam_cloud_stream_id: camera.camCloudStreamId,
        cam_zipcode: camera.camZipcode,
        cam_placement_zone_slot: camera.camPlacementZoneSlot,
        cam_longitude: parseFloat(camera.camLongitude || '0'),
        cam_latitude: parseFloat(camera.camLatitude || '0'),
        cam_ip: camera.camIp,
        cam_city: camera.camCity,
        cam_address1: camera.camAddress1,
        cam_placement_subzone: camera.camPlacementSubzone,
        hls_expiry: camera.hlsExpiry,
        hls_url: camera.hlsUrl,
        camThumbnailPath: camera.camThumbnailPath,
        cam_thumbnail_path: camera.camThumbnailPath,
        userRoleCohortHash: camera.userRoleCohortHash || selectedCohortHash,
        user_role_cohort_hash: camera.userRoleCohortHash || selectedCohortHash,
        cam_tags: camera.camTags,
        camTags: camera.camTags,
      }))
      .filter((camera) => camera.cam_name !== EXCLUDED_CAMERA);
  }, [cameras, selectedCohortHash]);

  useEffect(() => {
    if (currentPage > 0) {
      setPagination((previous) => ({
        ...previous,
        pageIndex: currentPage - 1,
      }));
    }
  }, [currentPage]);

  useEffect(() => {
    if (!selectedCohortHash) {
      return;
    }

    dispatch(
      fetchCams({
        cohortHash: selectedCohortHash,
        page: pagination.pageIndex + 1,
        itemsPerPage: pagination.pageSize,
      })
    );
  }, [dispatch, pagination.pageIndex, pagination.pageSize, selectedCohortHash]);

  const handleOpenCohort = (cohortHash: string) => {
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.set('cohort', cohortHash);
      return nextParams;
    });
  };

  const handleBackToCohorts = () => {
    setPagination((previous) => ({
      ...previous,
      pageIndex: 0,
    }));
    setSearchParams((previousParams) => {
      const nextParams = new URLSearchParams(previousParams);
      nextParams.delete('cohort');
      return nextParams;
    });
  };

  const handlePaginationChange = (updater: Updater<PaginationState>) => {
    const nextPagination =
      typeof updater === 'function' ? updater(pagination) : updater;
    setPagination(nextPagination);
  };

  const handleDeleteCamera = () => {
    // Camera deletion is handled inside CameraTable actions.
  };

  const handleAddCamera = () => {
    const addPath = selectedCohortHash
      ? `/cameras/add?cohort=${encodeURIComponent(selectedCohortHash)}`
      : '/cameras/add';

    // Persist selected org context so add/edit pages can apply cohort-admin scope checks consistently.
    if (selectedCohort) {
      try {
        sessionStorage.setItem(
          'selectedOrg',
          JSON.stringify({
            orgCohortHash: selectedCohort.orgCohortHash,
            orgCohortName: selectedCohort.orgCohortName,
          })
        );
      } catch {
        // ignore
      }
    }

    navigate(addPath, {
      state: {
        source: 'live-landing',
        cohortHash: selectedCohortHash,
      },
    });
  };

  // Make content scroll "behind" the sticky header without breaking layout alignment.
  // Header remains in normal layout; we pull Main up underneath it.
  const mainClassName = selectedCohort
    ? 'flex-1 pl-25 pr-25'
    : 'flex-1 pl-25 pr-25 -mt-16 pt-20';

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header
        fixed
        className="bg-background border-b border-l border-border/40"
      >
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed={Boolean(selectedCohort)} className={mainClassName}>
        {!selectedCohort ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Live Organization Management
                </h2>
                <p className="text-muted-foreground">
                  Select an organization to manage its live cameras and stream
                  access.
                </p>
              </div>
              <Badge variant="secondary" className="h-8 rounded-full px-3">
                {cohorts.length} Organizations
              </Badge>
            </div>

            {cohortsError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Failed to load organizations.
              </div>
            ) : null}

            {/* Toolbar with Search and View Toggle */}
            <div className="pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="w-full sm:w-auto sm:min-w-[420px]">
                <DataTableToolbar
                  table={cohortTable}
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

              <div className="flex flex-wrap items-center gap-2">
                {cohortViewMode === 'list' ? (
                  <DataTableViewOptions table={cohortTable} showOnMobile />
                ) : null}

                {/* Grid/List View Toggle */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 h-10">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setCohortViewMode('grid')}
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                            cohortViewMode === 'grid'
                              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                          aria-label="Grid view"
                        >
                          <Grid2x2 className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8}>
                        Grid View
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setCohortViewMode('list')}
                          className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 ${
                            cohortViewMode === 'list'
                              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                          aria-label="List view"
                        >
                          <List className="h-4 w-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8}>
                        List View
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Cohort View - Grid or List */}
            {cohortViewMode === 'list' ? (
              <>
                <div className="rounded-md border bg-background overflow-x-auto">
                  <Table className="w-full min-w-[1100px] table-fixed">
                    <TableHeader className="sticky top-0 z-10 bg-neutral-100 dark:bg-neutral-900">
                      <TableRow>
                        {/* <TableHead className="h-10 w-[52px] px-3 py-2 text-xs font-semibold text-muted-foreground">
                            <Checkbox
                              checked={
                                cohortTable.getIsAllPageRowsSelected() ||
                                (cohortTable.getIsSomePageRowsSelected() &&
                                  'indeterminate')
                              }
                              onCheckedChange={(value) =>
                                cohortTable.toggleAllPageRowsSelected(!!value)
                              }
                              aria-label="Select all rows"
                              onClick={(event) => event.stopPropagation()}
                            />
                          </TableHead> */}
                        {cohortTable
                          .getHeaderGroups()[0]
                          ?.headers.map((header) => (
                            <TableHead
                              key={header.id}
                              className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        <TableHead className="h-10 w-[16%] px-4 py-2 text-xs font-semibold text-muted-foreground">
                          ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cohortsLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                          <TableRow key={`cohort-skeleton-${index}`}>
                            <TableCell className="px-3 py-2">
                              <Skeleton className="h-4 w-4 rounded-sm" />
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <Skeleton className="h-4 w-40" />
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <Skeleton className="h-6 w-16 rounded-full" />
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <Skeleton className="h-4 w-28" />
                            </TableCell>
                            <TableCell className="px-4 py-2">
                              <Skeleton className="h-8 w-24 rounded-full" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : cohortTable.getRowModel().rows.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={
                              1 + cohortTable.getVisibleLeafColumns().length + 1
                            }
                            className="h-24 text-center"
                          >
                            No organizations found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        cohortTable.getRowModel().rows.map((row) => {
                          const cohort = row.original;
                          return (
                            <TableRow
                              key={cohort.orgCohortHash}
                              className="h-12 cursor-pointer border-b border-border hover:bg-muted/50"
                              onClick={() =>
                                handleOpenCohort(cohort.orgCohortHash)
                              }
                            >
                              {/* <TableCell className="px-3 py-2 text-sm font-medium align-middle">
                                  <Checkbox
                                    checked={row.getIsSelected()}
                                    onCheckedChange={(value) =>
                                      row.toggleSelected(!!value)
                                    }
                                    aria-label={`Select ${cohort.orgCohortName}`}
                                    onClick={(event) => event.stopPropagation()}
                                  />
                                </TableCell> */}
                              {row.getVisibleCells().map((cell) => (
                                <TableCell
                                  key={cell.id}
                                  className="px-4 py-2 text-sm align-middle"
                                >
                                  {cell.column.id === 'cohortType' ? (
                                    <Badge
                                      variant="outline"
                                      className="rounded-full px-2 py-0 text-[11px]"
                                    >
                                      {cohort.cohortType}
                                    </Badge>
                                  ) : cell.column.id === 'updatedAt' ? (
                                    <span className="text-muted-foreground">
                                      {cohort.updatedAt}
                                    </span>
                                  ) : cell.column.columnDef.cell ? (
                                    flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext()
                                    )
                                  ) : (
                                    String(cell.getValue() ?? '--')
                                  )}
                                </TableCell>
                              ))}
                              <TableCell className="px-4 py-2 align-middle">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 rounded-md border-primary text-primary hover:bg-primary/10 hover:text-primary px-4 text-xs"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenCohort(cohort.orgCohortHash);
                                  }}
                                >
                                  View Cameras
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4">
                  <DataTablePagination
                    table={cohortTable}
                    pageSizeOptions={[12, 24, 36, 48, 60]}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-w-[900px]">
                  {cohortsLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={`cohort-grid-skeleton-${index}`}
                        className="h-48 w-full rounded-xl"
                      />
                    ))
                  ) : cohortTable.getRowModel().rows.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No organizations found.
                    </div>
                  ) : (
                    paginatedCohortRows.map((row) => {
                      const cohort = row.original;
                      return (
                        <div
                          key={cohort.orgCohortHash}
                          onClick={() => handleOpenCohort(cohort.orgCohortHash)}
                          className="group cursor-pointer rounded-lg border border-border bg-background hover:border-blue-400 dark:hover:border-blue-900 hover:shadow-md transition-all duration-200 overflow-hidden"
                        >
                          {/* Top Accent Bar */}
                          <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-300 to-transparent dark:bg-gradient-to-r dark:from-blue-900 dark:via-blue-800 dark:to-transparent" />

                          <div className="p-5">
                            {/* Header with Icon and Name/Badge */}
                            <div className="flex items-start gap-3 mb-4">
                              <div className="shrink-0 h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                <Building2 className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* Cohort Name */}
                                <h3 className="text-lg font-bold text-foreground  transition-colors line-clamp-2 mb-1">
                                  {cohort.orgCohortName}
                                </h3>
                                {/* Organization Type Badge */}
                                <Badge
                                  variant="secondary"
                                  className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-muted dark:bg-blue-900/30 border-border"
                                >
                                  {cohort.cohortType}
                                </Badge>
                              </div>
                            </div>

                            {/* Last Updated */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span>Last updated at: {cohort.updatedAt}</span>
                            </div>

                            {/* Open Live Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full rounded-md h-9 border-primary text-primary hover:bg-primary/10 hover:text-primary text-xs font-medium"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenCohort(cohort.orgCohortHash);
                              }}
                            >
                              View Cameras
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-2">
                  <DataTablePagination
                    table={cohortTable}
                    pageSizeOptions={[12, 24, 36, 48, 60]}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                {perms.isRootAdmin && selectedCohort ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-fit -ms-2 px-2 text-muted-foreground hover:text-foreground"
                    onClick={handleBackToCohorts}
                  >
                    <ArrowLeft className="me-1 h-4 w-4" />
                    Back to organizations
                  </Button>
                ) : null}
                <h2 className="text-2xl font-bold tracking-tight">
                  Live Cameras
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-md px-3"
                  onClick={() => {
                    const target = selectedCohortHash
                      ? `/connected-intelligence?cohort=${encodeURIComponent(selectedCohortHash)}`
                      : '/connected-intelligence';
                    navigate(target);
                  }}
                >
                  <MessageSquare className="mr-1 h-4 w-4" />
                  Live Chat
                </Button>
                <Button
                  size="sm"
                  className="rounded-md px-3"
                  onClick={handleAddCamera}
                  disabled={!canManageSelectedCohort}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Camera
                </Button>
              </div>
            </div>

            {loading && mappedCameras.length === 0 ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-64" />
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton
                    key={`camera-skeleton-${index}`}
                    className="h-14 w-full rounded-xl"
                  />
                ))}
              </div>
            ) : loading || mappedCameras.length > 0 ? (
              <div className="h-full flex flex-col overflow-hidden rounded-md  bg-background p-2">
                <CameraTable
                  cameras={mappedCameras}
                  searchTerm=""
                  pagination={pagination}
                  onPaginationChange={handlePaginationChange}
                  loading={loading}
                  error={undefined}
                  onDeleteCamera={handleDeleteCamera}
                  totalCount={totalCount}
                  canManage={canManageSelectedCohort}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-muted-foreground rounded-md border border-dashed">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
                  <CameraIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-base font-semibold">
                  No cameras in this organization
                </p>
                <p className="mt-1 text-sm">
                  Add your first camera to start live monitoring for this
                  organization.
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-md px-3"
                    onClick={handleAddCamera}
                    disabled={!canManageSelectedCohort}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add First Camera
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>
    </div>
  );
};

export default LiveLandingPage;
