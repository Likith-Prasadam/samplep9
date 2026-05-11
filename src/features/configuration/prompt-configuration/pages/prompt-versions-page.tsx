import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  PromptConfigurationProvider,
  usePromptConfiguration,
} from '@/providers/prompt-configuration-provider';
import {
  fetchLatestPromptVersion,
  selectSystemPrompts,
} from '@/store/slices/prompt-configuration-slice';
import PromptVersions from '../components/prompt-versions';
import ForkPromptDialog from '../components/fork-prompt-dialog';
// import { BreadcrumbNavigation } from '../components/breadcrumb-navigation';
// import { NavigationInfoPanel } from '../components/navigation-info-panel';

const PromptVersionsPageContent = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { promptHash } = useParams<{ promptHash: string }>();
  const systemPrompts = useAppSelector(selectSystemPrompts);
  const { forkDialogOpen, setForkDialogOpen, selectedPromptForFork } =
    usePromptConfiguration();

  // Find the prompt name from system prompts
  const selectedPrompt = systemPrompts.find((p) => p.promptHash === promptHash);
  const promptName = selectedPrompt?.promptName || 'Prompt';

  useEffect(() => {
    // Redirect back if no promptHash is provided
    if (!promptHash) {
      navigate('/configuration/prompt-configuration');
    }
  }, [promptHash, navigate]);

  // Fetch latest version when component mounts or promptHash changes
  useEffect(() => {
    if (promptHash) {
      dispatch(
        fetchLatestPromptVersion({
          parentPromptHash: promptHash,
        })
      );
    }
  }, [dispatch, promptHash]);

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
              <BreadcrumbNavigation
                items={[
                  {
                    label: `${promptName}`,
                    path: `/configuration/prompt-configuration/versions/${promptHash}`,
                  },
                ]}
              />
            </div> */}

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">
                Versions for {promptName}
              </h2>
              <p className="text-muted-foreground mb-4">
                Manage and view all versions of this prompt template
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/configuration/prompt-configuration')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Prompts
              </Button>
              {/* {latestVersion.prompt && !latestVersion.loading && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✅ Latest version: <span className="font-semibold">{latestVersion.prompt.promptHash}</span>
                </p>
              )}  */}
            </div>

            {/* Info Panel
            <NavigationInfoPanel
              type="info"
              title="Version History"
              message="Below are all versions of this prompt. Click on any version to view or fork it. The latest version is marked as active."
              icon={true}
            /> */}

            {/* Versions Grid */}
            {promptHash && (
              <div className="bg-white dark:bg-slate-950 rounded-lg border p-6 mt-4">
                <PromptVersions parentPromptHash={promptHash} />
              </div>
            )}
          </div>
        </div>
      </Main>

      {/* Fork Dialog */}
      <ForkPromptDialog
        selectedPrompt={selectedPromptForFork}
        isOpen={forkDialogOpen}
        onClose={() => setForkDialogOpen(false)}
      />
    </div>
  );
};

const PromptVersionsPage = () => {
  return (
    <PromptConfigurationProvider>
      <PromptVersionsPageContent />
    </PromptConfigurationProvider>
  );
};

export default PromptVersionsPage;
