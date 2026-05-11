import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProcessCatalog } from '@/store/slices/workflow-slice';
import { Header } from '@/components/layouts/header';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { ProcessGrid } from './components/process-grid';
import type { Process } from '@/types/workflow-types';

export default function ProcessCatalog() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { processes, loading, error } = useAppSelector(
    (state) => state.workflow
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchProcessCatalog());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchProcessCatalog());
  };

  const handleConfigure = (process: Process) => {
    navigate(`/workflows/configure/${process.process_hash}`);
  };

  const filteredProcesses = processes.filter((process) => {
    if (
      searchTerm &&
      !process.process_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return process.is_active;
  });

  return (
    <div className="rounded-2xl h-full min-h-screen flex flex-col bg-background">
      <Header
        fixed
        className="z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-auto pl-25 pr-25">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Workflow Catalog
            </h2>
            <p className="text-muted-foreground">
              Discover and configure AI workflows for your cameras and batch
              videos
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading.processes}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading.processes ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        <ProcessGrid
          processes={filteredProcesses}
          loading={loading.processes}
          onConfigure={handleConfigure}
        />
      </Main>
    </div>
  );
}
