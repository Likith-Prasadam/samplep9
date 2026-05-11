import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchPromptsByTypes,
  setSelectedPromptTemplate,
} from '@/store/slices/workflow-slice';
import { Header } from '@/components/layouts/header';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { PromptListTable } from './components/prompt-list-table';
import { CreatePromptDialog } from './components/create-prompt-dialog';
import { ForkPromptDialog } from './components/fork-prompt-dialog';
import { DeletePromptDialog } from './components/delete-prompt-dialog';
import { PromptFilters } from './components/prompt-filters';
import type {
  PromptTemplate,
  PromptCategory,
  AccessLevel,
} from '@/types/workflow-types';

import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PromptLibrary() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { promptTemplates, loading, error } = useAppSelector(
    (state) => state.workflow
  );
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(
    null
  );

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [forkDialogOpen, setForkDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<
    PromptCategory[]
  >([]);
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<
    AccessLevel | undefined
  >();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch prompts on mount
  useEffect(() => {
    const types: PromptCategory[] = ['system', 'user', 'events_list'];
    dispatch(fetchPromptsByTypes({ types }));
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = () => {
    const types: PromptCategory[] = ['system', 'user', 'events_list'];
    dispatch(fetchPromptsByTypes({ types, access_level: selectedAccessLevel }));
  };

  // Handle view versions
  const handleViewVersions = (prompt: PromptTemplate) => {
    dispatch(setSelectedPromptTemplate(prompt));
    navigate(`/workflows/prompts/${prompt.ref_prompt_key}/versions`);
  };

  // Handle fork
  const handleFork = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setForkDialogOpen(true);
  };

  // Handle delete
  const handleDelete = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setDeleteDialogOpen(true);
  };

  // Filter prompts
  const filteredPrompts = promptTemplates.filter((prompt) => {
    // Category filter
    if (
      selectedCategories.length > 0 &&
      !selectedCategories.includes(prompt.prompt_category)
    ) {
      return false;
    }

    // Access level filter
    if (selectedAccessLevel && prompt.access_level !== selectedAccessLevel) {
      return false;
    }

    // Search filter
    if (
      searchTerm &&
      !prompt.prompt_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search prompts..."
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
              Prompt Library
            </h2>
            <p className="text-muted-foreground">
              Create, version, and manage reusable prompt templates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading.prompts}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading.prompts ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Prompt
            </Button>
          </div>
        </div>

        {/* Filters */}
        <PromptFilters
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          selectedAccessLevel={selectedAccessLevel}
          onAccessLevelChange={setSelectedAccessLevel}
        />

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Prompt Table */}
        <PromptListTable
          prompts={filteredPrompts}
          loading={loading.prompts}
          onViewVersions={handleViewVersions}
          onFork={handleFork}
          onDelete={handleDelete}
        />
      </Main>

      {/* Dialogs */}
      <CreatePromptDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleRefresh}
      />

      {selectedPrompt && (
        <>
          <ForkPromptDialog
            open={forkDialogOpen}
            onOpenChange={setForkDialogOpen}
            sourcePrompt={selectedPrompt}
            onSuccess={handleRefresh}
          />

          <DeletePromptDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            prompt={selectedPrompt}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
}
