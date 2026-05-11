import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  fetchCohortParams,
  updateCohortParams,
  setParam,
  setModel,
} from '@/store/slices/model-configuration-slice';
import {
  ModelConfigurationProvider,
  useModelConfiguration,
} from '@/providers/model-configuration-provider';
import type { RootState, AppDispatch } from '@/store';
import type { ParamKey } from './types/types';
import ModelSelector from './components/model-selector';
import ParameterGrid from './components/parameter-grid';
import DeploymentDialog from './components/deployment-dialog';
import { Info } from 'lucide-react';

const SLIDER_STYLES = `.slider{z-index:2}.slider::-webkit-slider-thumb{appearance:none;width:16px;height:16px;margin-top:-6px;border-radius:50%;background:hsl(var(--primary));border:2px solid hsl(var(--border));cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.12)}.slider::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:hsl(var(--primary));border:2px solid hsl(var(--border));cursor:pointer}.slider::-ms-thumb{width:16px;height:16px;border-radius:50%;background:hsl(var(--primary));border:2px solid hsl(var(--border));cursor:pointer}.slider::-webkit-slider-runnable-track{height:4px;background:transparent}.slider::-ms-fill-lower{background:transparent}.slider::-ms-fill-upper{background:transparent}.slider:focus{outline:none}`;

const ModelConfigurationContent = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { deployModalOpen, setDeployModalOpen } = useModelConfiguration();
  const { params, model, cohortId, loading, error } = useSelector(
    (state: RootState) => state.modelConfiguration
  );

  // Fetch cohort parameters on mount
  useEffect(() => {
    dispatch(fetchCohortParams());
  }, [dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
      });
    }
  }, [error]);

  const updateParam = (key: ParamKey, value: number) => {
    dispatch(setParam({ key, value }));
  };

  const handleModelChange = (newModel: string) => {
    dispatch(setModel(newModel));
  };

  const handleDeploy = async () => {
    try {
      await dispatch(updateCohortParams({ cohortId, params })).unwrap();

      toast.success('Model parameters updated successfully!', {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
      });

      setDeployModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update parameters',
        {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
        }
      );
    }
  };

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <style>{SLIDER_STYLES}</style>

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
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight flex items-center gap-1">
                    Model Configuration
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                          <Info className="h-4 w-4 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm p-2 rounded shadow-lg">
                          These settings control how your AI model generates
                          responses,
                          <br />
                          including randomness, repetition, and output length.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </h2>
                  <p className="text-muted-foreground">
                    Fine-tune your AI model parameters for optimal performance
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <ModelSelector model={model} setModel={handleModelChange} />

              <div className="mb-6">
                <ParameterGrid
                  params={params}
                  updateParam={updateParam}
                  loading={loading}
                />
              </div>

              <div className="flex pt-8">
                <Button
                  onClick={() => setDeployModalOpen(true)}
                  disabled={loading}
                  size="lg"
                  className="font-semibold"
                >
                  {loading ? 'Loading...' : 'Deploy Model'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Main>

      <DeploymentDialog
        isOpen={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        onDeploy={handleDeploy}
        params={params}
        loading={loading}
      />
    </div>
  );
};

const ModelConfiguration = () => {
  return (
    <ModelConfigurationProvider>
      <ModelConfigurationContent />
    </ModelConfigurationProvider>
  );
};

export default ModelConfiguration;
