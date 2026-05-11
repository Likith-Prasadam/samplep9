import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, List, LayoutGrid } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchOrgCohorts,
  setPage,
  setItemsPerPage,
  setDialogOpen,
  setCurrentCohort,
  setFilters,
} from '@/store/slices/org-cohorts-slice';
import type { OrgCohortFilters } from '@/types/org-cohort-types';
import { OrgCohortsTable } from './components/org-cohorts-table';
import type { ViewMode } from './components/org-cohorts-table';
import { CohortFormDialog } from './components/cohort-form-dialog';
import { DeleteCohortDialog } from './components/delete-cohort-dialog';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import {
  selectOrgCohorts,
  selectOrgCohortsLoading,
  selectOrgCohortsPagination,
  selectOrgCohortsFilters,
  selectOrgCohortsDialog,
} from '@/store/slices/org-cohorts-slice.selectors';
import { usePermissions } from '@/hooks/use-permissions';

const OrgCohortsContent = () => {
  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const cohorts = useAppSelector(selectOrgCohorts);
  const loading = useAppSelector(selectOrgCohortsLoading);
  const pagination = useAppSelector(selectOrgCohortsPagination);
  const filters = useAppSelector(selectOrgCohortsFilters);
  const dialog = useAppSelector(selectOrgCohortsDialog);

  const { currentRoleCohortHash, availableRoles } = useAppSelector(
    (state) => state.auth
  );
  const currentRole = useMemo(
    () =>
      availableRoles.find((r) => r.hash === currentRoleCohortHash) ||
      availableRoles[0],
    [availableRoles, currentRoleCohortHash]
  );
  const perms = usePermissions();

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

  useEffect(() => {
    dispatch(
      fetchOrgCohorts({
        page: pagination.page,
        itemsPerPage: pagination.itemsPerPage,
        filters,
      })
    );
  }, [dispatch, pagination.page, pagination.itemsPerPage, filters]);

  const handleRefresh = () => {
    dispatch(
      fetchOrgCohorts({
        page: pagination.page,
        itemsPerPage: pagination.itemsPerPage,
        filters,
      })
    );
  };

  const handleCreateClick = () => {
    if (!perms.isRootAdmin) {
      toast.error("You don't have access to perform this operation.");
      return;
    }
    dispatch(setCurrentCohort(null));
    dispatch(setDialogOpen('create'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        fixed
        className="z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-auto pl-25 pr-25">
        <div>
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shrink-0">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Organization Cohorts
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Manage organization cohorts (teams & departments) and their
                    settings.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-1">
                {/* View toggle */}
                <div className="flex items-center gap-0.5 p-0.5 border border-border/70 rounded-lg bg-muted/40">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center justify-center h-7 w-7 rounded-md transition-all duration-150 ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    }`}
                    title="List view"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center justify-center h-7 w-7 rounded-md transition-all duration-150 ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/80'
                    }`}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                </div>

                {canCreateOrganization && (
                  <Button
                    onClick={handleCreateClick}
                    className="h-8 text-xs font-medium gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Organization
                  </Button>
                )}
              </div>
            </div>

            {/* Stats strip */}
            {!loading && (
              <div className="flex items-center gap-3 mt-4 ml-13">
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {cohorts.length}
                  </span>{' '}
                  organization{cohorts.length !== 1 ? 's' : ''}
                </span>
                {cohorts.filter((c) => c.isRoot).length > 0 && (
                  <Badge className="text-[10px] px-2 py-0 font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-500/20 shadow-none">
                    {cohorts.filter((c) => c.isRoot).length} root
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Loading */}
          {loading ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                  : 'flex flex-col gap-2'
              }
            >
              {[...Array(8)].map((_, i) => (
                <Skeleton
                  key={i}
                  className={
                    viewMode === 'grid'
                      ? 'h-44 w-full rounded-xl'
                      : 'h-16 w-full rounded-xl'
                  }
                />
              ))}
            </div>
          ) : cohorts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 rounded-xl border-2 border-dashed border-border/40 bg-muted/10 text-muted-foreground">
              <div className="h-14 w-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4 border border-border/40">
                <Building2 className="h-7 w-7 opacity-40" />
              </div>
              <p className="text-sm font-semibold">
                No organization cohorts found
              </p>
              <p className="text-xs mt-1.5 opacity-70">
                Click <strong>New Organization</strong> to create one.
              </p>
            </div>
          ) : (
            <OrgCohortsTable
              data={cohorts}
              loading={loading}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onRefresh={handleRefresh}
              filters={filters}
              onFiltersChange={(newFilters: OrgCohortFilters) => {
                dispatch(setFilters(newFilters));
                dispatch(setPage(1));
              }}
              pagination={{
                page: pagination.page,
                itemsPerPage: pagination.itemsPerPage,
                totalItems: pagination.totalItems,
                totalPages: pagination.totalPages,
              }}
              onPageChange={(p) => dispatch(setPage(p))}
              onItemsPerPageChange={(n) => {
                dispatch(setItemsPerPage(n));
                dispatch(setPage(1));
              }}
            />
          )}
        </div>
      </Main>

      {/* Dialogs */}
      <CohortFormDialog
        open={dialog.open === 'create' || dialog.open === 'edit'}
        mode={dialog.open === 'create' ? 'create' : 'edit'}
        cohort={dialog.currentCohort}
        onOpenChange={(isOpen: boolean) =>
          dispatch(setDialogOpen(isOpen ? dialog.open : null))
        }
        onSuccess={handleRefresh}
      />

      <DeleteCohortDialog
        open={dialog.open === 'delete'}
        cohort={dialog.currentCohort}
        onOpenChange={(isOpen: boolean) =>
          dispatch(setDialogOpen(isOpen ? 'delete' : null))
        }
        onSuccess={handleRefresh}
      />
    </div>
  );
};

const OrgCohorts = () => {
  return <OrgCohortsContent />;
};

export default OrgCohorts;
