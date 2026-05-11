import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchPrompts,
  fetchSystemPrompts,
  setUserData,
  clearSystemPrompts,
  fetchAccessiblePromptsByTypes,
  setSelectedPromptType,
  // Selectors
  selectPromptKeys,
  selectSelectedPrompt,
  selectSystemPrompt,
  selectSystemPrompts,
  selectPromptLoading,
  selectPromptError,
  selectUserId,
  selectCohortId,
  selectPrompts,
  selectLatestPromptVersion,
  selectSelectedPromptType,
  selectSystemPromptsLoading,
  type SystemPrompt,
} from '@/store/slices/prompt-configuration-slice';
import {
  PromptConfigurationProvider,
  usePromptConfiguration,
} from '@/providers/prompt-configuration-provider';
import CreatePromptDialog from './components/create-prompt-dialog';
import DeletePromptDialog from './components/delete-prompt-dialog';
import ForkPromptDialog from './components/fork-prompt-dialog';
import { PromptPrimaryButtons } from './components/prompt-primary-buttons';
import SystemPromptsGrid from './components/system-prompts-grid';
// import { BreadcrumbNavigation } from './components/breadcrumb-navigation';
// import { NavigationInfoPanel } from './components/navigation-info-panel';
import { Info } from 'lucide-react';

const PromptConfigurationContent = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    refetchTrigger,
    forkDialogOpen,
    setForkDialogOpen,
    selectedPromptForFork,
    setOpen,
    setSelectedPromptForDelete,
  } = usePromptConfiguration();
  // Use selectors for state access
  const promptKeys = useAppSelector(selectPromptKeys);
  const selectedPrompt = useAppSelector(selectSelectedPrompt);
  const systemPrompt = useAppSelector(selectSystemPrompt);
  const systemPrompts = useAppSelector(selectSystemPrompts);
  const loading = useAppSelector(selectPromptLoading);
  const error = useAppSelector(selectPromptError);
  const userId = useAppSelector(selectUserId);
  const cohortId = useAppSelector(selectCohortId);
  const prompts = useAppSelector(selectPrompts);
  const latestVersion = useAppSelector(selectLatestPromptVersion);
  const selectedPromptType = useAppSelector(selectSelectedPromptType);
  const systemPromptsLoading = useAppSelector(selectSystemPromptsLoading);

  // Extract unique prompt types from systemPrompts
  // Returns array of full prompt types (e.g., ["event_detection/_/system", "event_detection/_/user"])
  const extractPromptTypes = (prompts: SystemPrompt[]): string[] => {
    const types = new Set<string>();
    prompts.forEach((prompt) => {
      if (prompt.promptType) {
        types.add(prompt.promptType);
      }
    });
    const typeArray = Array.from(types).sort();
    return typeArray;
  };

  // Filter prompts based on selected prompt type and show only templates (parent prompts)
  const getFilteredPrompts = (): SystemPrompt[] => {
    if (!selectedPromptType) return [];

    return systemPrompts.filter((prompt) => {
      // Show only templates (parent prompts where parentPromptHash is null)
      const isTemplate = prompt.parentPromptHash === null;
      // Filter by selected prompt type
      const matchesType = prompt.promptType === selectedPromptType;

      return isTemplate && matchesType;
    });
  };

  const promptTypes = extractPromptTypes(systemPrompts);
  const filteredPrompts = getFilteredPrompts();

  // Handle prompt selection - navigate to versions page
  const handleSelectPrompt = useCallback(
    (promptHash: string) => {
      navigate(`/configuration/prompt-configuration/versions/${promptHash}`);
    },
    [navigate]
  );

  const handleDeletePrompt = (prompt: SystemPrompt) => {
    setSelectedPromptForDelete(prompt);
    setOpen('delete');
  };

  // Redux state updates
  useEffect(() => {
    // State dependency watch
  }, [
    promptKeys,
    selectedPrompt,
    systemPrompt,
    systemPrompts,
    loading,
    error,
    prompts,
  ]);

  // Detect token changes (role switch) and clear system prompts
  useEffect(() => {
    const handleTokenChange = () => {
      dispatch(clearSystemPrompts());
    };

    // Check for access token or selection token changes
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('selection_token');
    const prevToken = sessionStorage.getItem('prevAuthToken');

    if (token !== prevToken) {
      sessionStorage.setItem('prevAuthToken', token || '');
      handleTokenChange();
    }
  }, [dispatch]);

  // Initialize user data from localStorage
  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userData = JSON.parse(userString);
        dispatch(
          setUserData({
            userId: String(userData.user_id || ''),
            cohortId: String(userData.cohort_id || ''),
          })
        );
      } catch {
        // Failed to parse user data
      }
    }
  }, [dispatch]);

  // Fetch prompts when user data is available or refetch is triggered
  useEffect(() => {
    if (userId && cohortId) {
      dispatch(
        fetchPrompts({ userId: Number(userId), cohortId: Number(cohortId) })
      );
    }
    // Also fetch system prompts
    dispatch(fetchSystemPrompts());
  }, [dispatch, userId, cohortId, refetchTrigger]);
  // Fetch accessible prompts by types when component mounts
  useEffect(() => {
    dispatch(
      fetchAccessiblePromptsByTypes({
        promptTypes: selectedPromptType,
        page: 1,
        itemsPerPage: 50,
      })
    );
  }, [dispatch, selectedPromptType]);
  // Handle errors - only show meaningful errors
  useEffect(() => {
    if (error && !error.includes('No authentication token')) {
      toast.error(error, {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
      });
    }
  }, [error]);

  // Set default prompt type to 'event_detection/_/system' or fall back to available types
  useEffect(() => {
    if (!selectedPromptType && promptTypes.length > 0) {
      // Check if 'event_detection/_/system' is available
      const defaultType = promptTypes.find(
        (type) => type === 'event_detection/_/system'
      );

      if (defaultType) {
        dispatch(setSelectedPromptType(defaultType));
      } else if (
        latestVersion?.promptType &&
        promptTypes.includes(latestVersion.promptType)
      ) {
        dispatch(setSelectedPromptType(latestVersion.promptType));
      } else if (promptTypes.length > 0) {
        dispatch(setSelectedPromptType(promptTypes[0]));
      }
    } else if (
      selectedPromptType &&
      promptTypes.length > 0 &&
      !promptTypes.includes(selectedPromptType)
    ) {
      // If selected prompt type no longer exists (was deleted), reset to default
      const defaultType = promptTypes.find(
        (type) => type === 'event_detection/_/system'
      );
      if (defaultType) {
        dispatch(setSelectedPromptType(defaultType));
      } else {
        dispatch(setSelectedPromptType(promptTypes[0]));
      }
    }
  }, [latestVersion?.promptType, promptTypes, dispatch, selectedPromptType]);

  useEffect(() => {
    if (filteredPrompts.length > 0 && !selectedPrompt) {
      handleSelectPrompt(filteredPrompts[0].promptHash);
    }
  }, [filteredPrompts, selectedPrompt, handleSelectPrompt]);

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

      <Main fixed className="flex-1 overflow-auto pl-25 pr-25">
        <div className="p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb Navigation
            <div className="mb-4">
              <BreadcrumbNavigation />
            </div> */}

            {/* Debug Info */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
            {/* {systemPrompts.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                <strong>Debug:</strong> Loaded {systemPrompts.length} system prompts
              </div>
            )} */}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-1">
                    Prompt Configuration
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm p-2 rounded shadow-lg">
                          Defines how input prompts are structured and
                          interpreted by the AI.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h2>
                  <p className="text-muted-foreground">
                    Manage and customize your AI prompts with precision
                  </p>
                </div>
                <PromptPrimaryButtons />
              </div>
            </div>

            {systemPromptsLoading ? (
              <div className="space-y-3">
                {/* <NavigationInfoPanel
                  type="info"
                  message="Loading prompts..."
                  icon={true}
                /> */}
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-64 w-full rounded-md" />
              </div>
            ) : systemPrompts.length === 0 && promptKeys.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-muted-foreground">
                No prompts found. Create a new prompt to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Prompt Filter by Category and Role */}
                <div className="space-y-4">
                  <div>
                    {/* <h3 className="text-xl font-semibold tracking-tight mb-4">
                      Browse Available Prompts
                    </h3> */}

                    {/* Dropdown Controls */}
                    <div className="mb-6">
                      {/* Combined Prompt Type Dropdown */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">
                          Select Prompt Type
                        </label>
                        <Select
                          value={selectedPromptType}
                          onValueChange={(value) =>
                            dispatch(setSelectedPromptType(value))
                          }
                        >
                          <SelectTrigger className="w-75">
                            <SelectValue placeholder="Select org_process / _ / prompt_category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {promptTypes.length > 0 ? (
                              promptTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  <span className="font-mono text-sm">
                                    {type}
                                  </span>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No prompt types available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Info Text */}
                    {/* {selectedPromptType && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <span className="font-mono">
                          Selected: <span className="font-semibold text-foreground">{selectedPromptType}</span>
                        </span>
                        <span className="ml-2">({filteredPrompts.length} result{filteredPrompts.length !== 1 ? 's' : ''})</span>
                      </p>
                    )} */}
                  </div>

                  {/* Display Filtered Prompts */}
                  {selectedPromptType && (
                    <>
                      {filteredPrompts.length > 0 ? (
                        <>
                          {/* <NavigationInfoPanel
                            type="info"
                            title="Available Prompts"
                            message={`Found ${filteredPrompts.length} prompt${filteredPrompts.length !== 1 ? 's' : ''} of type "${selectedPromptType}". Click on a prompt to view versions and manage them.`}
                            icon={true}
                          /> */}
                          <SystemPromptsGrid
                            prompts={filteredPrompts}
                            selectedPromptHash=""
                            onSelectPrompt={handleSelectPrompt}
                            onDeletePrompt={handleDeletePrompt}
                            loading={systemPromptsLoading}
                          />
                        </>
                      ) : (
                        !systemPromptsLoading && (
                          <div className="text-center py-8 text-muted-foreground">
                            No prompts found for the selected type.
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* System Prompts */}
                {/* <div className="space-y-4">
                  <h3 className="text-xl font-semibold tracking-tight">All System Prompts</h3>
                  <SystemPromptsGrid
                    prompts={systemPrompts}
                    selectedPromptHash=""
                    onSelectPrompt={handleSelectPrompt}
                    loading={loading}
                  />
                </div> */}
              </div>
            )}
          </div>
        </div>
      </Main>

      <CreatePromptDialog />
      <DeletePromptDialog />
      <ForkPromptDialog
        selectedPrompt={selectedPromptForFork}
        isOpen={forkDialogOpen}
        onClose={() => {
          setForkDialogOpen(false);
          // Optionally clear selected prompt
          setTimeout(() => {
            // Give time for any state updates
          }, 100);
        }}
        onSuccess={() => {
          // Optional: Additional success handling if needed
        }}
      />
    </div>
  );
};

const PromptConfiguration = () => {
  return (
    <PromptConfigurationProvider>
      <PromptConfigurationContent />
    </PromptConfigurationProvider>
  );
};

export default PromptConfiguration;
