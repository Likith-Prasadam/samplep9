import { useEffect, useMemo, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { UsersTable } from '@/features/users/components/user-table';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import UserEditDialog from '@/features/users/components/user-edit-dialog';
import type { NavigateFn } from '@/hooks/use-table-url-state';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  fetchUsers,
  fetchRoles,
  setPage,
  setItemsPerPage,
  setCurrentOrgCohortHash,
  setDialogOpen,
  setCurrentRow,
} from '@/store/slices/users-slice';
import {
  fetchOrgCohorts,
  setPage as setCohortPage,
  setDialogOpen as setCohortDialogOpen,
  setCurrentCohort,
  setFilters as setCohortFilters,
} from '@/store/slices/org-cohorts-slice';
import type { OrgCohort } from '@/types/org-cohort-types';
import { OrgCohortsTable } from '../org-cohorts/components/org-cohorts-table';
import type { ViewMode } from '../org-cohorts/components/org-cohorts-table';
import { CohortFormDialog } from '@/features/org-cohorts/components/cohort-form-dialog';
import { DeleteCohortDialog } from '@/features/org-cohorts/components/delete-cohort-dialog';
import type { RootState } from '@/store';
import type { User } from './types';
import type { AppDispatch } from '@/store';
import { usePermissions } from '@/hooks/use-permissions';

const UsersContent = () => {
  const dispatch = useDispatch<AppDispatch>();

  // ─── Drill-down state: null = orgs grid, set = users for that org ───
  const [selectedOrg, setSelectedOrgState] = useState<OrgCohort | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const cohortFetchPageSize = 200;

  // ─── Users state ───
  const {
    users,
    loading,
    currentPage,
    totalPages,
    page,
    itemsPerPage,
    dialog: { open, currentRow },
  } = useSelector((state: RootState) => state.users);

  // ─── Org cohorts state ───
  const {
    cohorts,
    loading: cohortsLoading,
    filters: cohortFilters,
    dialog: cohortDialog,
  } = useSelector((state: RootState) => state.orgCohorts);

  // ─── Auth state ───
  const { currentRoleCohortHash, availableRoles } = useSelector(
    (state: RootState) => state.auth
  );

  const currentRole = useMemo(
    () =>
      availableRoles.find((r) => r.hash === currentRoleCohortHash) ||
      availableRoles[0],
    [availableRoles, currentRoleCohortHash]
  );

  const perms = usePermissions();
  const normalize = (value?: string | null) =>
    (value || '').toString().trim().toLowerCase();
  const canManageSelectedOrg =
    !!selectedOrg &&
    (perms.canManageUsers(selectedOrg.orgCohortHash) ||
      // Some environments store the selected role context as a role-cohort hash,
      // so we fallback to cohort-name matching for cohort admins.
      (perms.isAdmin &&
        (perms.currentRoleCohortHash === selectedOrg.orgCohortHash ||
          normalize(currentRole?.cohort) ===
            normalize(selectedOrg.orgCohortName))));

  const canCreateOrganization = useMemo(() => {
    const cohortName = (
      currentRole?.cohort ||
      localStorage.getItem('selected_cohort') ||
      ''
    )
      .toString()
      .toLowerCase();
    return perms.isRootAdmin && cohortName === 'parabola9';
  }, [perms.isRootAdmin, currentRole]);

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const search = useMemo(
    () => Object.fromEntries(Array.from(searchParams.entries())),
    [searchParams]
  );
  const urlHasCohort = Boolean(search.cohort);
  const authReady = Boolean(currentRoleCohortHash) && availableRoles.length > 0;
  const shouldShowOrgPicker =
    authReady && (perms.isRootAdmin || perms.isRootUser) && !urlHasCohort;

  const urlNavigate: NavigateFn = useCallback(
    (opts) => {
      const newParams = new URLSearchParams(searchParams);
      let searchUpdate: Record<string, unknown> = {};
      if (typeof opts.search === 'function') {
        const currentSearch = Object.fromEntries(
          Array.from(searchParams.entries())
        );
        searchUpdate = opts.search(currentSearch);
      } else if (opts.search !== true) {
        searchUpdate = opts.search ?? {};
      }
      Object.entries(searchUpdate).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          newParams.delete(key);
        } else {
          newParams.set(key, value.toString());
        }
      });
      navigate(`${location.pathname}?${newParams.toString()}`, {
        replace: opts.replace,
      });
    },
    [searchParams, location.pathname, navigate]
  );

  const setSelectedOrg = useCallback(
    (org: OrgCohort | null, opts?: { replace?: boolean }) => {
      setSelectedOrgState(org);
      dispatch(setCurrentOrgCohortHash(org ? org.orgCohortHash : null));
      if (org) {
        sessionStorage.setItem('selectedOrg', JSON.stringify(org));
        urlNavigate({
          search: { cohort: org.orgCohortHash },
          replace: opts?.replace,
        });
      } else {
        sessionStorage.removeItem('selectedOrg');
        urlNavigate({
          // Reset users-table URL state when returning to org list
          search: {
            cohort: undefined,
            search: undefined,
            role: undefined,
            page: undefined,
            pageSize: undefined,
          },
          replace: opts?.replace,
        });
      }
    },
    [dispatch, urlNavigate]
  );

  const onEdit = useCallback(
    (user: User) => {
      dispatch(setCurrentRow(user));
      dispatch(setDialogOpen('edit'));
    },
    [dispatch]
  );

  useEffect(() => {
    const cohortHash = search.cohort as string | undefined;

    if (cohortHash && cohorts.length > 0) {
      const foundCohort = cohorts.find((c) => c.orgCohortHash === cohortHash);
      if (foundCohort) {
        setSelectedOrgState(foundCohort);
        dispatch(setCurrentOrgCohortHash(foundCohort.orgCohortHash));
      } else {
        setSelectedOrgState(null);
        dispatch(setCurrentOrgCohortHash(null));
      }
    } else {
      setSelectedOrgState(null);
      dispatch(setCurrentOrgCohortHash(null));
    }
  }, [search.cohort, cohorts, dispatch]);

  // For cohort admins, users list should open directly.
  // Root admins should keep seeing the org/cohort list.
  useEffect(() => {
    // Root users can access all cohorts, so keep the org picker for them.
    if (perms.isRootAdmin || perms.isRootUser) return;
    if (!authReady) return;
    if (selectedOrg) return;
    if (!currentRoleCohortHash) return;
    if (search.cohort) return; // URL explicitly set cohort
    if (!cohorts || cohorts.length === 0) return;

    const foundCohort =
      cohorts.find(
        (c) =>
          c.orgCohortHash === currentRoleCohortHash ||
          normalize(c.orgCohortName) === normalize(currentRole?.cohort)
      ) ?? (cohorts.length === 1 ? cohorts[0] : undefined);

    if (foundCohort) {
      setSelectedOrg(foundCohort, { replace: true });
    }
  }, [
    perms.isRootAdmin,
    perms.isRootUser,
    selectedOrg,
    authReady,
    currentRoleCohortHash,
    currentRole?.cohort,
    search.cohort,
    cohorts,
    setSelectedOrg,
  ]);

  useEffect(() => {
    if (selectedOrg) {
      dispatch(setPage(1));
    }
  }, [selectedOrg, dispatch]);

  // ─── Fetch users with proper backend pagination ───
  useEffect(() => {
    if (!currentRoleCohortHash || !selectedOrg) return;

    const filters: Record<string, unknown> = {};
    if (search.search) filters.searchTerm = search.search;

    dispatch(
      fetchUsers({
        orgCohortHash: selectedOrg.orgCohortHash,
        itemsPerPage,
        page,
        filters,
      })
    );
  }, [
    dispatch,
    itemsPerPage,
    page,
    currentRoleCohortHash,
    selectedOrg,
    search.search,
  ]);

  useEffect(() => {
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(setItemsPerPage(10));
      dispatch(setPage(1));
    };
  }, [dispatch]);

  // Fetch org cohorts for all roles — admin sees the full grid, non-admin uses it to auto-select
  useEffect(() => {
    dispatch(
      fetchOrgCohorts({
        page: 1,
        itemsPerPage: cohortFetchPageSize,
        filters: cohortFilters,
      })
    );
  }, [dispatch, cohortFetchPageSize, cohortFilters]);

  // Use users directly from backend - already properly filtered and paginated
  const displayUsers = useMemo<User[]>(() => {
    return users as unknown as User[];
  }, [users]);

  const handleSave = () => {
    if (!currentRoleCohortHash || !selectedOrg) return;
    dispatch(
      fetchUsers({
        orgCohortHash: selectedOrg.orgCohortHash,
        itemsPerPage,
        page,
      })
    );
  };

  const handleCohortRefresh = () => {
    dispatch(
      fetchOrgCohorts({
        page: 1,
        itemsPerPage: cohortFetchPageSize,
        filters: cohortFilters,
      })
    );
  };

  const handleCreateCohort = () => {
    if (!perms.isRootAdmin) {
      toast.error("You don't have access to perform this operation.");
      return;
    }
    dispatch(setCurrentCohort(null));
    dispatch(setCohortDialogOpen('create'));
  };

  const handleBack = () => {
    // Reset cohort-list filters when returning
    dispatch(
      setCohortFilters({
        ...cohortFilters,
        orgCohortName: undefined,
        isRoot: undefined,
      })
    );
    dispatch(setCohortPage(1));
    setSelectedOrg(null);
  };

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className="flex-1 overflow-y-auto pl-25 pr-25">
        <div className="flex flex-col">
          {!currentRoleCohortHash && (
            <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground mb-4 mt-2">
              <span>
                Select an organization from the role switcher in the top bar to
                view and manage its users.
              </span>
            </div>
          )}

          {!selectedOrg && shouldShowOrgPicker && (
            <div className="flex flex-col">
              <div className="mb-4 space-y-3">
                {/* Row 1: Title (left) + New Org (right) */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">User Management</h1>
                    <p className="text-muted-foreground text-sm">
                      Select an organization to view and manage its users.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 pt-1">
                    {canCreateOrganization && (
                      <Button size="sm" onClick={handleCreateCohort}>
                        <Plus className="h-3.5 w-3.5" />
                        New Organization
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {cohortsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(perms.isAdmin ? 8 : 2)].map((_, i) => (
                    <Skeleton key={i} className="h-44 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div>
                  <OrgCohortsTable
                    data={cohorts}
                    loading={cohortsLoading}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onSelect={setSelectedOrg}
                    showViewToggle
                    preserveOrder
                  />
                </div>
              )}
            </div>
          )}

          {!selectedOrg && !shouldShowOrgPicker && (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex items-start justify-between gap-4 mb-4 space-x-3">
                <div>
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-56" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════
              VIEW B — Users for the selected org
          ════════════════════════════════════════ */}
          {selectedOrg && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Breadcrumb — back to org grid */}
              {(perms.isRootAdmin || perms.isRootUser) && (
                <div className="flex items-center mb-1">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="flex items-center text-xs text-muted-foreground hover:text-foreground hover:bg-ray-400 bg-gray-50 dark:bg-gray-900/10 h-5 px-2"
                  >
                    <ArrowLeft className="w-2 h-2" />
                    <span className="text-xs">Back to Organizations</span>
                  </Button>
                </div>
              )}

              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {selectedOrg.orgCohortName}
                  </h2>
                  {selectedOrg.isRoot && (
                    <Badge
                      variant="outline"
                      className="border-blue-600 text-blue-600 text-xs mt-1"
                    >
                      Root
                    </Badge>
                  )}
                </div>
              </div>

              {/* Users content */}
              <div className="flex-1 overflow-hidden min-h-0">
                {!currentRoleCohortHash ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <p className="text-sm">
                      Select an organization context to view users.
                    </p>
                  </div>
                ) : loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <UsersTable
                    data={displayUsers}
                    search={search}
                    navigate={urlNavigate}
                    loading={loading}
                    onEdit={onEdit}
                    canManage={canManageSelectedOrg}
                    isRootAdmin={perms.isRootAdmin}
                    onRefresh={() =>
                      dispatch(
                        fetchUsers({
                          orgCohortHash: selectedOrg.orgCohortHash,
                          itemsPerPage,
                          page,
                          filters: { searchTerm: search.search },
                        })
                      )
                    }
                    onAddUser={
                      canManageSelectedOrg
                        ? () => navigate('/users/add')
                        : undefined
                    }
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={(n) => {
                      dispatch(setItemsPerPage(n));
                      dispatch(setPage(1));
                    }}
                    onPageChange={(n) => dispatch(setPage(n))}
                    orgCohortHash={selectedOrg.orgCohortHash}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </Main>

      {/* User Edit Dialog */}
      {currentRow && (
        <UserEditDialog
          open={open === 'edit'}
          onOpenChange={(isOpen) =>
            dispatch(setDialogOpen(isOpen ? 'edit' : null))
          }
          user={currentRow}
          onSave={handleSave}
          orgCohortHash={selectedOrg?.orgCohortHash || ''}
        />
      )}

      {/* Cohort Form Dialog */}
      <CohortFormDialog
        open={cohortDialog.open === 'create' || cohortDialog.open === 'edit'}
        mode={cohortDialog.open === 'create' ? 'create' : 'edit'}
        cohort={cohortDialog.currentCohort}
        onOpenChange={(isOpen: boolean) =>
          dispatch(setCohortDialogOpen(isOpen ? cohortDialog.open : null))
        }
        onSuccess={handleCohortRefresh}
      />

      {/* Cohort Delete Dialog */}
      <DeleteCohortDialog
        open={cohortDialog.open === 'delete'}
        cohort={cohortDialog.currentCohort}
        onOpenChange={(isOpen: boolean) =>
          dispatch(setCohortDialogOpen(isOpen ? 'delete' : null))
        }
        onSuccess={handleCohortRefresh}
      />
    </div>
  );
};

const Users = () => {
  return <UsersContent />;
};

export default Users;
