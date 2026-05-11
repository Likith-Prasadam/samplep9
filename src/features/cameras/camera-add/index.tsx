import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';

import { fetchCams } from '@/store/slices/camera-slice';
import type { AppDispatch, RootState } from '@/store';
import { useAppSelector } from '@/store/hooks';
import { CREATE_CAMERA_MUTATION } from '@/graphql/cameras_mutation';
import { GET_PROCESS_CATALOG } from '@/graphql/workflow_queries';
import { GET_CAMS_QUERY } from '@/graphql/cameras_queries';
import { getActiveCohortHash } from '@/utils/cohort-utils';
import { usePermissions } from '@/hooks/use-permissions';

import { cameraFormSchema, type CameraFormValues } from './schema';
import { INITIAL_FORM_DATA } from './types/types';
import { PipelineProvider } from './context/pipeline-provider';
import { usePipelineContext } from './context/pipeline-context';

import { Step0General } from './components/steps/step-0-general';
import { Step1Location } from './components/steps/step-1-location';
import { Step2Pipelines } from './components/steps/step-2-pipelines';
import { Step3Preview } from './components/steps/step-3-preview';
import { CameraStepper } from './components/camera-stepper';
import StepProgressBar from './components/step-progress-bar';
import { FORM_STEPS } from './components/form-steps';

const parseTags = (raw?: string | null): string[] =>
  (raw || '')
    .split(',')
    .map((tag) => tag.trim().slice(0, 15))
    .filter(Boolean)
    .slice(0, 10);

const CameraWizard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);

  const methods = useFormContext<CameraFormValues>();
  const { handleSubmit, trigger, getValues, setError, clearErrors } = methods;

  const {
    processCatalog,
    setProcessCatalog,
    selectedProcesses,
    setSelectedProcesses,
    processConfigs,
    setProcessConfigs,
    setExpandedPipelines,
  } = usePipelineContext();

  const sourceState = location.state as
    | { source?: string; cohortHash?: string }
    | undefined;
  const cohortFromQuery = searchParams.get('cohort')?.trim() || '';
  const authCurrentRoleCohortHash = useAppSelector(
    (state: RootState) => state.auth.currentRoleCohortHash
  );

  const selectedCohortHash =
    cohortFromQuery ||
    sourceState?.cohortHash ||
    authCurrentRoleCohortHash ||
    getActiveCohortHash() ||
    '';
  const normalizedSelectedCohortHash = selectedCohortHash.trim();
  const isFromLiveLanding = sourceState?.source === 'live-landing';
  const camerasPath = normalizedSelectedCohortHash
    ? `/cameras?cohort=${encodeURIComponent(normalizedSelectedCohortHash)}`
    : '/cameras';
  const livePath = normalizedSelectedCohortHash
    ? `/live?cohort=${encodeURIComponent(normalizedSelectedCohortHash)}`
    : '/live';
  const returnPath = isFromLiveLanding ? livePath : camerasPath;

  const perms = usePermissions();

  const {
    data: processCatalogData,
    loading: isProcessCatalogLoading,
    error: processCatalogError,
  } = useQuery(GET_PROCESS_CATALOG, {
    fetchPolicy: 'cache-first',
  });

  const [fetchCamsForNameCheck, { loading: isNameCheckLoading }] = useLazyQuery(
    GET_CAMS_QUERY,
    {
      fetchPolicy: 'network-only',
    }
  );

  useEffect(() => {
    if (processCatalogData?.getProcessCatalog) {
      const catalog = processCatalogData.getProcessCatalog;
      setProcessCatalog(catalog);

      // Select every catalog pipeline so Preview & Create matches the Configure step
      // (e.g. YOLO / yolo_model was listed in UI but was missing from selectedProcesses).
      setSelectedProcesses((prev) => {
        const next = new Set(prev);
        catalog.forEach(
          (process: { orgProcessHash: string; orgProcessName: string }) => {
            next.add(process.orgProcessHash);
          }
        );
        return next;
      });

      setExpandedPipelines(new Set());

      setProcessConfigs((prevConfigs) => {
        const merged = { ...prevConfigs };
        catalog.forEach(
          (process: { orgProcessHash: string; orgProcessName: string }) => {
            if (!merged[process.orgProcessHash]) {
              merged[process.orgProcessHash] = {};
            }
          }
        );
        return merged;
      });
    }
  }, [
    processCatalogData,
    setProcessCatalog,
    setSelectedProcesses,
    setProcessConfigs,
    setExpandedPipelines,
  ]);

  useEffect(() => {
    if (!normalizedSelectedCohortHash) return;
    if (perms.canCreateCamera(normalizedSelectedCohortHash)) return;

    toast.error("You don't have permission to add a camera for this cohort.");
    navigate(returnPath, { replace: true });
  }, [navigate, normalizedSelectedCohortHash, perms, returnPath]);

  const [createCamera] = useMutation(CREATE_CAMERA_MUTATION, {
    refetchQueries: [
      {
        query: GET_CAMS_QUERY,
        variables: {
          cohortHash: normalizedSelectedCohortHash,
          page: 1,
          itemsPerPage: 10,
        },
      },
    ],
    awaitRefetchQueries: true,
    onCompleted: async () => {
      await dispatch(
        fetchCams({
          cohortHash: selectedCohortHash,
          page: 1,
          itemsPerPage: 10,
        })
      );
      toast.success('Camera created successfully');
    },
  });

  const onSubmit = async (formData: CameraFormValues) => {
    if (currentStep !== 3) {
      return;
    }

    setIsLoading(true);
    try {
      const camTags = parseTags(formData.cam_tags);
      // Validate process configurations
      for (const processHash of Array.from(selectedProcesses)) {
        const config = processConfigs[processHash];
        const process = processCatalog.find(
          (p) => p.orgProcessHash === processHash
        );
        const processName = process?.orgProcessName || processHash;

        if (!config) {
          throw new Error(`Configuration required for process: ${processName}`);
        }

        const hasAnyConfig = Object.keys(config).length > 0;
        const processNameLower = String(processName || '').toLowerCase();

        // Special validation for vlm_inference
        if (processNameLower === 'vlm_inference') {
          const hasSystemPrompt = config.system_prompt_hash;
          if (!hasSystemPrompt) {
            throw new Error(
              `Transcript Generation requires a System Prompt to be configured. Please expand and configure the Transcript Generation pipeline.`
            );
          }
        }

        if (processNameLower === 'event_detection' && !hasAnyConfig) continue;
        if (!hasAnyConfig) continue;

        // Validate required prompts
        const hasRequiredPrompts = Object.entries(config).some(
          ([key, value]) => key.endsWith('_prompt_hash') && value
        );
        const promptFields = Object.keys(config).filter((k) =>
          k.endsWith('_prompt_hash')
        );

        if (promptFields.length > 0 && !hasRequiredPrompts) {
          throw new Error(
            `At least one prompt must be selected for process: ${processName}`
          );
        }
      }

      // Build process configs array
      const processConfigsArray = Array.from(selectedProcesses).map(
        (processHash) => {
          const config = processConfigs[processHash];
          if (!config)
            throw new Error(`Missing config for process ${processHash}`);

          const process = processCatalog.find(
            (p) => p.orgProcessHash === processHash
          );
          const processName = String(
            process?.orgProcessName || ''
          ).toLowerCase();

          // Empty config
          if (Object.keys(config).length === 0) {
            return {
              orgProcessHash: processHash,
              processConfig: JSON.stringify({}),
              isEnabled: true,
            };
          }

          const processConfig: Record<string, unknown> = {};

          Object.entries(config).forEach(([key, value]) => {
            // Filter out UI-only fields that should not be sent to backend
            if (key.startsWith('required_')) return;
            if (key === 'parent_system_hash') return;
            if (key === 'parent_user_hash') return;
            if (key === 'parent_events_list_hash') return;

            if (key === 'parameters') {
              if (
                typeof value === 'object' &&
                value !== null &&
                Object.keys(value).length > 0
              ) {
                processConfig.parameters = value;
              }
            } else if (key === 'video_frames' || key === 'image_frames') {
              if (
                typeof value === 'object' &&
                value !== null &&
                Object.keys(value).length > 0
              ) {
                processConfig[key] = value;
              }
            } else if (value !== undefined && value !== null && value !== '') {
              processConfig[key] = value;
            }
          });

          // Add defaults for event_detection
          if (processName === 'event_detection') {
            if (!processConfig.parameters) {
              processConfig.parameters = {};
            }
            const params = processConfig.parameters as Record<string, unknown>;
            if (params.temperature === undefined) params.temperature = 0.1;
            if (params.max_tokens === undefined) params.max_tokens = 1000;
          }

          return {
            orgProcessHash: processHash,
            processConfig: JSON.stringify(processConfig),
            isEnabled: true,
          };
        }
      );

      const input_json = {
        camAddress1: formData.cam_address1?.trim() || '',
        camCity: formData.cam_city?.trim() || '',
        camCloudStreamId: formData.cam_cloud_stream_id.trim(),
        camIp: formData.cam_ip?.trim() || '',
        camLatitude: formData.cam_latitude.trim(),
        camLongitude: formData.cam_longitude.trim(),
        camName: formData.cam_name.trim(),
        camPlacementSubzone: formData.cam_placement_subzone?.trim() || '',
        camPlacementZone: formData.cam_placement_zone?.trim() || '',
        camPlacementZoneSlot: formData.cam_placement_zone_slot?.trim() || '',
        camResolution: formData.cam_resolution || '',
        camStatus: formData.cam_status || 'active',
        camFpsSourceRate: formData.cam_fps_source_rate || '30',
        camType: formData.cam_type || '',
        camZipcode: formData.cam_zipcode?.trim() || '',
        camThumbnailPath: null,
        camTags,
        processConfigs: processConfigsArray,
        // include cohortHash (backend expects camelCase)
        ...(normalizedSelectedCohortHash
          ? { cohortHash: normalizedSelectedCohortHash }
          : {}),
      };

      // Log payload for debugging server input issues
      console.log('create camera payload', { input: input_json });

      if (!normalizedSelectedCohortHash) {
        toast.error('Cohort is required to create a camera');
        setIsLoading(false);
        return;
      }

      const cameraResult = await createCamera({
        variables: { input: input_json },
      });

      if (!cameraResult.data?.createCam) {
        throw new Error('Failed to create camera');
      }
      navigate(returnPath);
    } catch (error: unknown) {
      console.error('Submit Error:', error);
      const rawMessage =
        error instanceof Error ? error.message : 'Failed to create camera';
      const normalizedMessage = rawMessage.toLowerCase();
      const friendlyMessage = normalizedMessage.includes(
        'user role cohort not found'
      )
        ? 'You do not have permission to add a camera to another cohort'
        : rawMessage;
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = async () => {
    let isValid = false;

    if (currentStep === 0) {
      isValid = await trigger([
        'cam_name',
        'cam_type',
        'cam_resolution',
        'cam_cloud_stream_id',
        'cam_ip',
        'cam_tags',
      ]);
      if (isValid) {
        const rawName = getValues('cam_name') ?? '';
        const candidate = String(rawName).trim();
        if (candidate && normalizedSelectedCohortHash) {
          try {
            const result = await fetchCamsForNameCheck({
              variables: {
                cohortHash: normalizedSelectedCohortHash,
                page: 1,
                itemsPerPage: 200,
              },
            });
            const existing =
              result.data?.getCams?.cams?.some(
                (c: { camName?: string | null }) =>
                  String(c?.camName ?? '')
                    .trim()
                    .toLowerCase() === candidate.toLowerCase()
              ) ?? false;

            if (existing) {
              setError('cam_name', {
                type: 'validate',
                message: 'Camera name already exists',
              });
              return;
            }
            clearErrors('cam_name');
          } catch {
            // If name-check fails, don't block navigation; backend will still validate on submit.
          }
        }
      }
    } else if (currentStep === 1) {
      isValid = await trigger([
        'cam_latitude',
        'cam_longitude',
        'cam_placement_zone',
      ]);
    } else if (currentStep === 2) {
      isValid = selectedProcesses.size > 0;
      if (!isValid) {
        toast.error('Select at least one processing pipeline');
      }
    }

    if (isValid && !isNameCheckLoading) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && currentStep !== 3) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0General />;
      case 1:
        return <Step1Location />;
      case 2:
        return (
          <Step2Pipelines
            isProcessCatalogLoading={isProcessCatalogLoading}
            processCatalogError={processCatalogError}
          />
        );
      case 3:
        return <Step3Preview setIsAutoPopulating={setIsAutoPopulating} />;
      default:
        return null;
    }
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
      <Main
        fixed
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto h-full min-h-0 flex flex-col text-left">
          <Button
            variant="ghost"
            onClick={() => navigate(returnPath)}
            className="self-start mb-6 flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {isFromLiveLanding ? 'Back to Live' : 'Back to Cameras'}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start md:items-stretch flex-1 min-h-0">
            {/* Left rail - stepper */}
            <aside className="pt-2 md:pt-0 md:col-span-1 md:sticky md:top-6 md:self-start">
              <StepProgressBar
                steps={FORM_STEPS}
                currentStep={currentStep}
                onStepClick={async (step) => {
                  if (step <= currentStep) {
                    setCurrentStep(step);
                  }
                }}
              />
            </aside>

            {/* Right column - form and step controls */}
            <section className="md:col-span-2 min-h-0 relative flex flex-col pb-6">
              <div className="spectra-scrollbar flex-1 min-h-0 overflow-y-auto md:pr-2">
                <form
                  id="camera-add-form"
                  onSubmit={handleSubmit(onSubmit)}
                  onKeyDown={handleKeyDown}
                  className="space-y-6"
                >
                  <Card className="flex flex-col border border-border shadow-sm rounded-2xl">
                    <CardHeader>
                      <CardTitle className="mt-1 text-xl">
                        {FORM_STEPS[currentStep].title}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {FORM_STEPS[currentStep].description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {renderStep()}

                      <CameraStepper
                        currentStep={currentStep}
                        onNext={handleNextStep}
                        onPrevious={handlePrevStep}
                        isLoading={isLoading}
                        isAutoPopulating={isAutoPopulating}
                      />
                    </CardContent>
                  </Card>
                </form>
              </div>
            </section>
          </div>
        </div>
      </Main>
    </div>
  );
};

const AddCameraPage = () => {
  const methods = useForm<CameraFormValues>({
    resolver: zodResolver(cameraFormSchema),
    defaultValues: INITIAL_FORM_DATA,
    mode: 'onChange',
  });

  return (
    <FormProvider {...methods}>
      <PipelineProvider>
        <CameraWizard />
      </PipelineProvider>
    </FormProvider>
  );
};

export default AddCameraPage;
