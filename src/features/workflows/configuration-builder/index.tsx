import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchProcessWithModels,
  createCamProcessConfig,
  createBatchProcessConfig,
} from '@/store/slices/workflow-slice';
import { Header } from '@/components/layouts/header';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ProcessOverview } from '@/features/workflows/configuration-builder/components/process-overview';
import { ModelSelector } from '@/features/workflows/configuration-builder/components/model-selector';
import { PromptSelector } from '@/features/workflows/configuration-builder/components/prompt-selector';
import { TargetSelector } from '@/features/workflows/configuration-builder/components/target-selector';
import { ConfigurationSummary } from '@/features/workflows/configuration-builder/components/configuration-summary';
import type {
  Model,
  PromptVersion,
  PromptCategory,
} from '@/types/workflow-types';

export default function ConfigurationBuilder() {
  const { processHash } = useParams<{ processHash: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { selectedProcess, loading } = useAppSelector(
    (state) => state.workflow
  );

  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<{
    system?: PromptVersion;
    user?: PromptVersion;
    events_list?: PromptVersion;
  }>({});
  const [targetType, setTargetType] = useState<'camera' | 'batch'>('camera');
  const [targetHash, setTargetHash] = useState<string>('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch process details
  useEffect(() => {
    if (processHash) {
      dispatch(fetchProcessWithModels(processHash));
    }
  }, [processHash, dispatch]);

  const handleSave = async () => {
    // Validation
    if (!selectedModel) {
      toast.error('Please select a model');
      return;
    }

    if (!targetHash) {
      toast.error('Please select a target camera or batch video');
      return;
    }

    // Check required prompts
    const requiredPrompts = selectedProcess?.required_prompt_types || [];
    for (const promptType of requiredPrompts) {
      if (!selectedPrompts[promptType as PromptCategory]) {
        toast.error(`Please select a ${promptType} prompt`);
        return;
      }
    }

    setSaving(true);

    try {
      const promptHashes = {
        system_prompt_hash: selectedPrompts.system?.prompt_hash,
        user_prompt_hash: selectedPrompts.user?.prompt_hash,
        events_list_prompt_hash: selectedPrompts.events_list?.prompt_hash,
      };

      const configInput = {
        process_hash: processHash!,
        model_hash: selectedModel.model_hash,
        prompt_hashes: promptHashes,
        is_enabled: isEnabled,
      };

      if (targetType === 'camera') {
        await dispatch(
          createCamProcessConfig({
            ...configInput,
            cam_hash: targetHash,
          })
        ).unwrap();
      } else {
        await dispatch(
          createBatchProcessConfig({
            ...configInput,
            batch_hash: targetHash,
          })
        ).unwrap();
      }

      toast.success('Configuration saved successfully');
      navigate(targetType === 'camera' ? '/cameras' : '/playground');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading.processes || !selectedProcess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading workflow...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl h-full min-h-screen flex flex-col bg-background">
      <Header
        fixed
        className="z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/workflows/catalog')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Catalog
        </Button>
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-auto pl-25 pr-25">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Configure Workflow
          </h2>
          <p className="text-muted-foreground">
            Set up {selectedProcess.process_name} for your cameras or batch
            videos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <ProcessOverview process={selectedProcess} />

            <ModelSelector
              models={selectedProcess.accessible_models}
              selectedModel={selectedModel}
              onSelectModel={setSelectedModel}
              requiredTypes={selectedProcess.required_model_types}
              loading={false}
            />

            {selectedProcess.required_prompt_types.map((promptType) => (
              <PromptSelector
                key={promptType}
                promptType={promptType as PromptCategory}
                prompts={selectedProcess.accessible_prompts.filter(
                  (p) => p.prompt_category === promptType
                )}
                selectedPrompt={selectedPrompts[promptType as PromptCategory]}
                onSelectPrompt={(prompt) =>
                  setSelectedPrompts({
                    ...selectedPrompts,
                    [promptType]: prompt,
                  })
                }
                loading={false}
              />
            ))}

            <TargetSelector
              targetType={targetType}
              targetHash={targetHash}
              onTargetTypeChange={setTargetType}
              onTargetHashChange={setTargetHash}
            />
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <ConfigurationSummary
              process={selectedProcess}
              model={selectedModel}
              prompts={selectedPrompts}
              targetType={targetType}
              targetHash={targetHash}
              isEnabled={isEnabled}
              onIsEnabledChange={setIsEnabled}
              onSave={handleSave}
              saving={saving}
            />
          </div>
        </div>
      </Main>
    </div>
  );
}
