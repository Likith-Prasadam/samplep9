import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  UploadCloud,
  FileVideo2,
  XCircle,
  Settings2,
  Loader2,
  Cpu,
  CheckCircle2,
  ChevronLeft,
  Layers,
  MapPin,
  Crosshair,
  ChevronRight,
  Check,
} from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import {
  useLazyQuery,
  useMutation,
  useQuery,
  useApolloClient,
  ApolloError,
} from '@apollo/client';
import {
  CREATE_BATCH,
  GET_BATCHES_VIDEOS,
  GET_PRESIGNED_URL,
  GET_PROCESS_CATALOG,
  GET_PROCESS_WITH_MODELS,
} from '@/graphql/batch_mutations';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  ProcessConfigItem,
  ReviewPipelineItem,
} from '@/components/pipeline-configuration/process-config-item';
import { toDisplayName as formatProcessName } from '@/components/pipeline-configuration/utils';

const SCHEMA_CONSTRAINT_KEYS_PAGE =
  /^required_.*_types$|^required_model_type$|^parent_.*_hash$/;

// This regex filters out:
// - Schema constraint keys (required_*_types, required_model_type) - UI metadata fields
// - Parent hash fields (parent_*_hash) - UI tracking fields not expected during batch creation

import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import StepProgressBar from '@/features/cameras/camera-add/components/step-progress-bar';
import { FORM_STEPS } from './components/form-steps';
import {
  selectVideosList,
  prependVideo,
  hashStringToNumber,
  fetchBatchVideos,
} from '@/store/slices/playground-slice';
import type { BatchVideo } from './types/batch-analysis';
import type { AppDispatch } from '@/store';
import { normalizeVideoName } from '@/utils/videoNameNormalization';

// Constants
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const AZURE_PROPAGATION_DELAY = 200; // milliseconds
const VIDEO_LOAD_TIMEOUT = 30_000; // 30 seconds

export interface ProcessCatalogItem {
  orgProcessHash: string;
  orgProcessName: string;
}

// Validation helper functions
const validateAlphabetsOnly = (value: string) => /^[a-zA-Z]*$/.test(value);
const validateAlphanumeric = (value: string) => /^[a-zA-Z0-9]*$/.test(value);
const validateAlphanumericWithHyphen = (value: string) =>
  /^[a-zA-Z0-9-]*$/.test(value);
const validateNumbersOnly = (value: string) => /^[0-9]*$/.test(value);
const validateNumbersWithDecimalAndMinus = (value: string) =>
  /^[0-9.-]*$/.test(value);

const parseBatchTags = (raw?: string | null): string[] | null => {
  if (!raw) return null;
  const tags = raw
    .split(',')
    .map((tag) => tag.trim().slice(0, 15))
    .filter(Boolean)
    .slice(0, 10);
  return tags.length ? tags : null;
};

const formSchema = z.object({
  video: z
    .instanceof(File, { message: 'Please select a video file to upload' })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      'File size must be less than 100MB'
    )
    .optional(),
  batch_video_name: z
    .string()
    .min(1, 'Video name is required')
    .max(50, 'Video name cannot exceed 50 characters'),
  source_type: z.enum(['upload', 'camera']),
  camera_name: z.string().optional(),
  placement_subzone: z
    .string()
    .max(20, 'Subzone must be maximum 20 characters')
    .refine(
      (value) => !value || validateAlphabetsOnly(value),
      'Subzone must contain alphabets only'
    )
    .optional(),
  placement_slot: z
    .string()
    .max(20, 'Zone Slot must be maximum 20 characters')
    .refine(
      (value) => !value || validateAlphanumericWithHyphen(value),
      'Zone Slot must contain alphabets, numbers, and hyphens only'
    )
    .optional(),
  batch_tags: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || !value.trim()) return true;
      const tags = value
        .split(',')
        .map((t) => t.trim().slice(0, 15))
        .filter(Boolean);
      return tags.length <= 10 && tags.every((t) => t.length <= 15);
    }, 'Enter up to 10 tags, each 15 characters or fewer'),
  location_address: z
    .string()
    .max(30, 'Address must be maximum 30 characters')
    .refine(
      (value) => !value || validateAlphanumeric(value),
      'Address must contain alphabets and numbers only'
    )
    .optional(),
  location_city: z
    .string()
    .max(20, 'City must be maximum 20 characters')
    .refine(
      (value) => !value || validateAlphabetsOnly(value),
      'City must contain alphabets only'
    )
    .optional(),
  location_zip: z
    .string()
    .max(8, 'Zip Code must be maximum 8 characters')
    .refine(
      (value) => !value || validateNumbersOnly(value),
      'Zip Code must contain numbers only'
    )
    .optional(),
  location_lat: z
    .string()
    .max(10, 'Latitude must be maximum 10 characters')
    .refine(
      (value) => !value || validateNumbersWithDecimalAndMinus(value),
      'Latitude must contain numbers, decimals, and minus sign only'
    )
    .optional(),
  location_long: z
    .string()
    .max(10, 'Longitude must be maximum 10 characters')
    .refine(
      (value) => !value || validateNumbersWithDecimalAndMinus(value),
      'Longitude must contain numbers, decimals, and minus sign only'
    )
    .optional(),
  fps_rate: z.string().optional(),
  ip_address: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PlaygroundUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const apolloClient = useApolloClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'completed' | 'error'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isDone, setIsDone] = useState(false);
  const [hasInitializedDefaults, setHasInitializedDefaults] = useState(false);
  const [configResetToken, setConfigResetToken] = useState(0);
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  // Validation error states for metadata fields
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Process Selection State
  const [selectedProcesses, setSelectedProcesses] = useState<Set<string>>(
    new Set()
  );
  const [processConfigs, setProcessConfigs] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [processConfigMeta, setProcessConfigMeta] = useState<
    Record<string, unknown>
  >({});
  const [getPresignedUrl] = useLazyQuery(GET_PRESIGNED_URL, {
    fetchPolicy: 'no-cache',
  });
  const [createBatch] = useMutation(CREATE_BATCH);
  const { data: catalogData, loading: catalogLoading } = useQuery<{
    getProcessCatalog: ProcessCatalogItem[];
  }>(GET_PROCESS_CATALOG);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  // Guard against concurrent createBatch submissions (fast double-click, Enter+click, etc.).
  // A single click that somehow fires twice within the state-update window was the main
  // frontend trigger for the "Batch with name X already exists" error surfaced after deploy.
  // The ref blocks the second async call synchronously, the state flips the button's
  // disabled attribute on the very next paint so the user can't re-click either.
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicateName, setIsCheckingDuplicateName] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      video: undefined,
      batch_video_name: '',
      source_type: 'upload',
      batch_tags: '',
    },
  });

  const videoslist = useSelector(selectVideosList);
  const duplicateNamesPrefetchDoneRef = useRef(false);

  // Load batch names once for duplicate-name validation. Do not refetch while the list stays
  // empty — each fulfilled fetch replaces videoslist with a new [] reference, which would
  // retrigger this effect and cause an infinite GetBatchVideos loop.
  useEffect(() => {
    if (duplicateNamesPrefetchDoneRef.current) return;

    if (videoslist.length > 0) {
      duplicateNamesPrefetchDoneRef.current = true;
      return;
    }

    duplicateNamesPrefetchDoneRef.current = true;
    // Fetch a wide window of recent batches so the client-side duplicate-name check
    // catches real conflicts before we attempt createBatch on the server. With only the
    // most recent 8 names loaded, matches against older batches slipped through and were
    // only caught by the backend's unique constraint (the error users see after deploy).
    dispatch(
      fetchBatchVideos({
        page: 1,
        itemsPerPage: 200,
      })
    );
  }, [videoslist, dispatch]);

  const isDuplicateName = useCallback(
    (name: string): boolean => {
      const normalized = normalizeVideoName(name);
      if (!normalized) return false;

      return videoslist.some(
        (video) => normalizeVideoName(video.batchName || '') === normalized
      );
    },
    [videoslist]
  );

  const checkDuplicateNameOnServer = useCallback(
    async (
      name: string
    ): Promise<{ isDuplicate: boolean; checkFailed: boolean }> => {
      const normalizedInput = normalizeVideoName(name);
      if (!normalizedInput) return { isDuplicate: false, checkFailed: false };

      try {
        const { data } = await apolloClient.query({
          query: GET_BATCHES_VIDEOS,
          variables: {
            page: 1,
            itemsPerPage: 50,
            sortBy: 'created_at',
            sortOrder: 'desc',
            filters: { searchTerm: name },
          },
          fetchPolicy: 'network-only',
        });

        const batches = data?.getBatchVideos?.batches || [];
        return {
          isDuplicate: batches.some(
            (batch: { batchName?: string }) =>
              normalizeVideoName(batch.batchName || '') === normalizedInput
          ),
          checkFailed: false,
        };
      } catch (primaryErr) {
        console.warn(
          'Primary duplicate-name check failed; trying fallback query:',
          primaryErr
        );

        try {
          const { data } = await apolloClient.query({
            query: GET_BATCHES_VIDEOS,
            variables: {
              page: 1,
              itemsPerPage: 200,
              sortBy: 'created_at',
              sortOrder: 'desc',
            },
            fetchPolicy: 'network-only',
          });

          const batches = data?.getBatchVideos?.batches || [];
          return {
            isDuplicate: batches.some(
              (batch: { batchName?: string }) =>
                normalizeVideoName(batch.batchName || '') === normalizedInput
            ),
            checkFailed: false,
          };
        } catch (fallbackErr) {
          console.error(
            'Duplicate-name server check failed (primary + fallback):',
            fallbackErr
          );
          return { isDuplicate: false, checkFailed: true };
        }
      }
    },
    [apolloClient]
  );

  const watchedVideoName = form.watch('batch_video_name');

  // Live duplicate-name validation while the user types the video name
  useEffect(() => {
    const name = (watchedVideoName || '').trim();

    if (!name) {
      const fieldState = form.getFieldState('batch_video_name');
      if (fieldState.error?.type === 'duplicate') {
        form.clearErrors('batch_video_name');
      }
      return;
    }

    if (isDuplicateName(name)) {
      form.setError('batch_video_name', {
        type: 'duplicate',
        message:
          'A video with this name already exists. Please choose a different name. (Special characters, case, and spacing are ignored for matching)',
      });
    } else {
      const fieldState = form.getFieldState('batch_video_name');
      if (fieldState.error?.type === 'duplicate') {
        form.clearErrors('batch_video_name');
      }
    }
  }, [watchedVideoName, form, isDuplicateName]);

  // Pipeline defaults and prompt versions load only in Setup Configuration (step 3) via
  // ProcessConfigItem — avoids duplicating getProcessWithModels / getPromptVersions /
  // getPromptByHash while the user is still on earlier steps.

  const resetForm = useCallback(() => {
    form.reset({
      video: undefined,
      batch_video_name: '',
      source_type: 'upload',
      batch_tags: '',
    });
    setError(null);
    setCurrentStep(0);
    setUploadStatus('idle');
    setProgress(0);
    setVideoDuration(0);
    setStatusMessage('');
    setIsDone(false);
    setSelectedProcesses(new Set());
    setProcessConfigs({});
    setProcessConfigMeta({});
    setConfigResetToken((token) => token + 1);
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    form.clearErrors();
    setHasInitializedDefaults(false);
    setIsMetadataOpen(false);
  }, [form]);

  // Ensure a clean slate every time this page is mounted
  useEffect(() => {
    resetForm();
    // We only want this to run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
    navigate('/playground');
  }, [resetForm, navigate]);

  // Auto-select all processes by default
  useEffect(() => {
    if (catalogData?.getProcessCatalog && !hasInitializedDefaults) {
      if (catalogData.getProcessCatalog.length > 0) {
        setSelectedProcesses((prev) => {
          const next = new Set(prev);
          catalogData.getProcessCatalog.forEach((p) =>
            next.add(p.orgProcessHash)
          );
          return next;
        });
      }
      setHasInitializedDefaults(true);
    }
  }, [catalogData, hasInitializedDefaults]);

  const extractVideoDuration = useCallback(
    (videoFile: File): Promise<number> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const blobUrl = URL.createObjectURL(videoFile);
        let timeoutId: NodeJS.Timeout | null = null;
        let resolved = false;

        const cleanup = () => {
          if (timeoutId) clearTimeout(timeoutId);
          URL.revokeObjectURL(blobUrl);
          video.remove();
        };

        const handleError = () => {
          if (resolved) return;
          resolved = true;
          cleanup();
          reject(new Error('Error loading video metadata for duration'));
        };

        timeoutId = setTimeout(() => {
          handleError();
        }, VIDEO_LOAD_TIMEOUT);

        video.src = blobUrl;

        video.addEventListener('loadedmetadata', () => {
          if (resolved) return;
          const duration = Math.floor(video.duration);
          if (isNaN(duration) || duration <= 0) {
            handleError();
            return;
          }
          resolved = true;
          cleanup();
          resolve(duration);
        });

        video.addEventListener('error', handleError);
      });
    },
    []
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      const fileName = file.name.replace(/\.[^/.]+$/, '');

      if (!form.getValues('batch_video_name')) {
        form.setValue('batch_video_name', fileName, {
          shouldValidate: true,
        });
      }

      try {
        const duration = await extractVideoDuration(file);
        setVideoDuration(duration);
      } catch {
        // If we can't read duration, don't block the flow â€“ just continue with unknown duration
        setVideoDuration(0);
      }
    },
    [form, extractVideoDuration]
  );

  const performUpload = useCallback(
    async (file: File) => {
      if (!file) {
        setError('No file selected');
        form.setError('video', { type: 'manual', message: 'No file selected' });
        return null;
      }

      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = 'File size must be less than 500MB';
        setError(errorMessage);
        form.setError('video', { type: 'manual', message: errorMessage });
        return null;
      }

      try {
        setUploadStatus('uploading');
        setStatusMessage('Getting upload URL...');
        setProgress(0);

        const { data: urlData, errors: urlErrors } = await getPresignedUrl();

        if (urlErrors && urlErrors.length > 0) {
          throw new Error(urlErrors.map((e) => e.message).join(', '));
        }

        const presignResult = urlData?.getBatchUploadPresignedUrl as
          | {
              batchHash: string;
              batchVideoSourcePath: string;
              presignedUrl: string;
            }
          | undefined;

        if (!presignResult?.presignedUrl) {
          throw new Error('Failed to get upload URL');
        }

        const uploadUrl = presignResult.presignedUrl;
        const hash = presignResult.batchHash;
        const path = presignResult.batchVideoSourcePath;

        setStatusMessage('Uploading video...');

        return new Promise<{ hash: string; path: string }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhrRef.current = xhr;

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                setProgress(percentComplete);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                setTimeout(() => {
                  resolve({ hash, path });
                }, AZURE_PROPAGATION_DELAY);
              } else {
                reject(
                  new Error(
                    `Upload failed with status ${xhr.status}: ${xhr.statusText}`
                  )
                );
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload was cancelled'));
            });

            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
            xhr.send(file);
          }
        );
      } catch (err: unknown) {
        let errorMessage = 'Upload failed';
        if (err instanceof ApolloError) {
          errorMessage = err.message;
        } else if (err instanceof Error) {
          if (err.message.includes('CORS')) {
            errorMessage =
              'Upload failed due to CORS policy. Please ensure the S3 bucket allows PUT requests from this origin.';
          } else if (axios.isAxiosError(err)) {
            const axiosErr = err as AxiosError;
            if (axiosErr.code === 'ECONNABORTED') {
              errorMessage =
                'Upload timeout. Please try again with a smaller file or check your connection.';
            } else {
              const status = axiosErr.response?.status;
              const code = axiosErr.code;
              errorMessage = `Upload failed: ${status || code || 'Unknown error'} - ${axiosErr.message}`;
            }
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        form.setError('video', { type: 'manual', message: errorMessage });
        setStatusMessage(errorMessage);
        setUploadStatus('error');
        return null;
      }
    },
    [getPresignedUrl, form]
  );

  const handleCreateBatch = async () => {
    // Block concurrent submissions. Without this, a fast double-click (or click + Enter)
    // fires handleCreateBatch twice before setUploadStatus('uploading') disables the
    // button. The first call succeeds; the second hits the backend's unique constraint
    // on batchName and surfaces as "Batch with name 'X' already exists".
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const file = form.getValues('video');
      if (!file) {
        toast.error('No video file selected.');
        return;
      }

      const values = form.getValues();
      const batchTags = parseBatchTags(values.batch_tags);
      const configs = Array.from(selectedProcesses).map((hash) => {
        const raw = processConfigs[hash] || {};
        const processConfig = Object.fromEntries(
          Object.entries(raw).filter(
            ([k]) => !SCHEMA_CONSTRAINT_KEYS_PAGE.test(k)
          )
        );
        return { orgProcessHash: hash, processConfig, isEnabled: true };
      });

      if (configs.length === 0) {
        toast.error('Please select at least one processing pipeline.');
        return;
      }

      // Frontend validation for required prompt config on specific pipelines
      for (const { orgProcessHash, processConfig } of configs) {
        const process = catalogData?.getProcessCatalog?.find(
          (p: ProcessCatalogItem) => p.orgProcessHash === orgProcessHash
        );
        const processName = process?.orgProcessName || orgProcessHash;
        const processNameLower = String(processName || '').toLowerCase();

        const hasSystemPrompt = Boolean(
          (processConfig as Record<string, unknown>).system_prompt_hash
        );

        // Event detection requires a system prompt hash
        if (processNameLower === 'event_detection' && !hasSystemPrompt) {
          toast.error(
            'Event detection, vlm inference requires a System Prompt. Please configure it in "Setup Configuration" or deselect Event detection'
          );
          setCurrentStep(2);
          return;
        }

        // VLM inference also requires a system prompt hash
        if (processNameLower === 'vlm_inference' && !hasSystemPrompt) {
          toast.error(
            'Transcript Generation requires a System Prompt. Please configure it in "Setup Configuration".'
          );
          setCurrentStep(2);
          return;
        }
      }

      try {
        setStatusMessage('Starting upload...');
        const uploadResult = await performUpload(file);

        if (!uploadResult) {
          // performUpload already handled and surfaced the specific error
          return;
        }

        setStatusMessage('Creating Batch...');
        const { data: batchData, errors } = await createBatch({
          variables: {
            input: {
              batchName: values.batch_video_name,
              batchHash: uploadResult.hash,
              batchCloudStreamPath: uploadResult.path,
              duration: videoDuration,
              processConfigs: configs,
              batchType: values.camera_name ? 'camera_recording' : 'upload',
              batchPlacementZone: values.camera_name,
              batchPlacementSubzone: values.placement_subzone,
              batchPlacementZoneSlot: values.placement_slot,
              batchCity: values.location_city,
              batchAddress1: values.location_address,
              batchZipcode: values.location_zip,
              batchLatitude: values.location_lat,
              batchLongitude: values.location_long,
              batchFpsSourceRate: values.fps_rate,
              batchIp: values.ip_address,
              ...(batchTags ? { batchTags } : {}),
            },
          },
        });

        if (errors && errors.length > 0) {
          throw new Error(errors.map((err) => err.message).join(', '));
        }

        if (!batchData) {
          throw new Error('Batch creation returned no data');
        }

        const created = batchData.createBatch;
        const batchHash = created.batchHash ?? uploadResult.hash;
        const newVideo: BatchVideo = {
          id: hashStringToNumber(batchHash),
          batchHash,
          batchName: created.batchName ?? values.batch_video_name,
          batchStatus: (created.batchStatus ?? 'pending').toLowerCase(),
          batchCloudStreamPath:
            created.batchCloudStreamPath ?? uploadResult.path ?? '',
          thumbnailPresignedUrl: '',
          duration: created.duration ?? videoDuration ?? 0,
          batchType: created.batchType,
          batchPlacementZone: created.batchPlacementZone,
          batchTags: created.batchTags ?? batchTags ?? null,
          created_at: new Date().toISOString(),
          recentlyUploaded: true,
        };
        dispatch(prependVideo(newVideo));

        setStatusMessage('All steps completed successfully!');
        setUploadStatus('completed');
        setIsDone(true);
        toast.success('Video uploaded and batch created successfully!');

        resetForm();
        navigate('/playground', { state: { fromUpload: true } });
      } catch (err: unknown) {
        const rawMsg =
          err instanceof Error ? err.message : 'Failed to create batch';
        let msg = rawMsg;

        // Handle duplicate batch hash error from backend more gracefully
        if (
          rawMsg.includes(
            'duplicate key value violates unique constraint "BATCH_TBL_batch_hash_key"'
          )
        ) {
          msg =
            'This video upload already exists on the server (duplicate batch). Please go back to the playground list and use Re-analyse on the existing video, or upload a different video.';
        } else if (/batch with name .* already exists/i.test(rawMsg)) {
          // Backend unique-constraint on batchName. Common cause in practice:
          //  - a cold-start retry duplicated the create request on the server
          //  - the name matched an older batch not in the prefetched duplicate list
          // Make the UX recoverable: refresh the duplicate list, jump the user back
          // to the name step, and mark the field invalid so they can rename and retry
          // without losing their pipeline / config selections.
          msg =
            'A batch with this name already exists. Please change the name slightly and try again.';
          form.setError('batch_video_name', {
            type: 'duplicate',
            message: msg,
          });
          setCurrentStep(0);
          // Refresh prefetched names so the live validator flags it too.
          duplicateNamesPrefetchDoneRef.current = false;
          dispatch(fetchBatchVideos({ page: 1, itemsPerPage: 200 }));
        }

        setError(msg);
        setStatusMessage(msg);
        setUploadStatus('error');
        toast.error(msg);
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const updateProcessConfig = useCallback(
    (
      hash: string,
      config: Record<string, unknown>,
      meta: Record<string, unknown>
    ) => {
      const cleanConfig = Object.fromEntries(
        Object.entries(config).filter(
          ([k]) => !SCHEMA_CONSTRAINT_KEYS_PAGE.test(k)
        )
      );
      setProcessConfigs((prev) => ({
        ...prev,
        [hash]: { ...(prev[hash] || {}), ...cleanConfig },
      }));
      setProcessConfigMeta((prev) => ({
        ...prev,
        [hash]: { ...(prev[hash] || {}), ...meta },
      }));
    },
    []
  );

  const refetchProcessPrompts = useCallback(
    async (processHash: string) => {
      try {
        // Force a fresh fetch of process models/prompts so newly created prompts appear immediately
        await apolloClient.query({
          query: GET_PROCESS_WITH_MODELS,
          variables: { orgProcessHash: processHash },
          fetchPolicy: 'network-only',
        });
      } catch (err) {
        console.error('[PlaygroundUploadPage] Error refetching prompts:', err);
        throw err;
      }
    },
    [apolloClient]
  );

  // Render Steps
  const renderStep1 = () => (
    <div className="space-y-6 py-2">
      <FormField
        control={form.control}
        name="video"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              {!form.watch('video') ? (
                <div className="border-2 border-dashed border-border rounded-xl p-10 hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 cursor-pointer text-center group">
                  <label className="cursor-pointer w-full h-full block">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="p-4 rounded-full bg-muted group-hover:bg-background transition-colors">
                        <UploadCloud className="w-10 h-10 text-primary" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          MP4, WebM or Ogg (max. 500MB)
                        </p>
                      </div>
                      <Input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        ref={field.ref}
                        name={field.name}
                        onClick={(e) => {
                          (e.target as HTMLInputElement).value = '';
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            field.onChange(file);
                            handleFileSelect(file);
                          }
                        }}
                      />
                    </div>
                  </label>
                </div>
              ) : (
                <div className="border rounded-xl p-4 bg-muted/20 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileVideo2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {(form.watch('video') as File | undefined)?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(
                          ((form.watch('video') as File | undefined)?.size ||
                            0) /
                          (1024 * 1024)
                        ).toFixed(2)}{' '}
                        MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        field.onChange(undefined);
                        form.setError('video', {
                          type: 'manual',
                          message: 'Please select a video file to upload',
                        });
                        setVideoDuration(0);
                        form.setValue('batch_video_name', '');
                      }}
                    >
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {form.watch('video') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="batch_video_name"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Video Title</FormLabel>
                  <div className="text-xs text-muted-foreground">
                    {field.value?.length || 0}/50 characters
                  </div>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter a name for this batch"
                    maxLength={50}
                  />
                </FormControl>

                <FormMessage />
                {field.value && isDuplicateName(String(field.value)) && (
                  <p className="mt-1 text-xs text-destructive">
                    A video with this name already exists. Please choose a
                    different name.
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="batch_tags"
            render={({ field }) => {
              const normalizeTagsInput = (
                value: string,
                previous: string
              ): string => {
                const endsWithComma = /,\s*$/.test(value);
                const isDeleting = previous.length > value.length;
                const tags = value
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => t.slice(0, 15))
                  .slice(0, 10);
                const base = tags.join(', ');
                const canStartNext =
                  endsWithComma && tags.length < 10 && !isDeleting;
                return canStartNext ? `${base}${base ? ', ' : ''}` : base;
              };

              return (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FormLabel className="flex items-center gap-1">
                        Tags
                      </FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[11px] text-muted-foreground hover:text-foreground">
                              i
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs">
                              Use tags to identify camera places
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      onChange={(event) => {
                        const normalized = normalizeTagsInput(
                          event.target.value,
                          field.value || ''
                        );
                        field.onChange(normalized);
                        void form.trigger('batch_tags');
                      }}
                      onBlur={() => {
                        void form.trigger('batch_tags');
                      }}
                      placeholder="Comma separated (e.g. indoor,daytime)"
                      maxLength={200}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
      )}

      <div className="pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsMetadataOpen(!isMetadataOpen)}
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent hover:text-primary"
        >
          <span className="text-sm font-medium">Additional Information</span>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${isMetadataOpen ? 'rotate-90' : ''}`}
          />
        </Button>

        {isMetadataOpen && (
          <div className="mt-4 space-y-4 pt-4 border-t">
            {/* Placement Details */}
            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                <Crosshair className="w-4 h-4" /> Placement
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="placement_subzone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Subzone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. North Wing"
                          maxLength={20}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^a-zA-Z]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                placement_subzone:
                                  'Subzone must contain alphabets only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.placement_subzone;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.placement_subzone && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.placement_subzone}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="placement_slot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Zone Slot</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. A-01"
                          maxLength={20}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^a-zA-Z0-9-]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                placement_slot:
                                  'Zone Slot must contain alphabets, numbers, and hyphens only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.placement_slot;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.placement_slot && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.placement_slot}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
                <MapPin className="w-4 h-4" /> Location
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location_address"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs">Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. 123 Main St"
                          maxLength={30}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^a-zA-Z0-9]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                location_address:
                                  'Address must contain alphabets and numbers only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.location_address;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.location_address && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.location_address}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. New York"
                          maxLength={20}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^a-zA-Z]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                location_city:
                                  'City must contain alphabets only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.location_city;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.location_city && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.location_city}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Zip Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. 10001"
                          maxLength={8}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^0-9]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                location_zip:
                                  'Zip Code must contain numbers only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.location_zip;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.location_zip && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.location_zip}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_lat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Latitude</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. 40.7128"
                          maxLength={10}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^0-9.-]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                location_lat:
                                  'Latitude must contain numbers, decimals, and minus sign only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.location_lat;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.location_lat && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.location_lat}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location_long"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Longitude</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-8"
                          placeholder="e.g. -74.0060"
                          maxLength={10}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const filteredValue = inputValue.replace(
                              /[^0-9.-]/g,
                              ''
                            );
                            if (
                              inputValue !== filteredValue &&
                              inputValue.length > 0
                            ) {
                              setValidationErrors((prev) => ({
                                ...prev,
                                location_long:
                                  'Longitude must contain numbers, decimals, and minus sign only. Invalid characters have been removed.',
                              }));
                            } else {
                              setValidationErrors((prev) => {
                                const updated = { ...prev };
                                delete updated.location_long;
                                return updated;
                              });
                            }
                            field.onChange(filteredValue);
                          }}
                        />
                      </FormControl>
                      {validationErrors.location_long && (
                        <p className="text-xs font-medium text-red-500 mt-1">
                          {validationErrors.location_long}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const getPipelineOrder = (rawName: string): number => {
    const name = String(rawName || '').toLowerCase();
    if (
      name.includes('event_detection') ||
      name.includes('event-detection') ||
      name.includes('event detection')
    )
      return 0;
    if (
      name.includes('object_detection') ||
      name.includes('object-detection') ||
      name.includes('object detection') ||
      name.includes('yolo')
    )
      return 1;
    if (
      name.includes('video_preprocessing') ||
      name.includes('video-preprocessing') ||
      name.includes('video_processing') ||
      name.includes('video-processing') ||
      name.includes('video processing')
    )
      return 2;
    if (
      name.includes('vlm_inference') ||
      name.includes('vlm inference') ||
      name.includes('transcript')
    )
      return 3;
    return 999;
  };

  const renderStep2 = () => {
    // Sort the catalog data
    const sortedCatalog = catalogData?.getProcessCatalog
      ? [...catalogData.getProcessCatalog].sort((a, b) => {
          return (
            getPipelineOrder(a.orgProcessName) -
            getPipelineOrder(b.orgProcessName)
          );
        })
      : [];

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4">
            All processing pipelines are included by default and cannot be
            deselected.
          </p>
          {catalogLoading && !catalogData ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedCatalog.map((process: ProcessCatalogItem) => {
                const rawName = String(
                  process.orgProcessName || ''
                ).toLowerCase();

                let IconComponent = Cpu;
                if (rawName === 'event_detection') {
                  IconComponent = Crosshair;
                } else if (rawName === 'video_preprocessing') {
                  IconComponent = Settings2;
                } else if (rawName === 'vlm_inference') {
                  IconComponent = Cpu;
                }

                return (
                  <div
                    key={process.orgProcessHash}
                    className="relative flex flex-col items-center justify-center rounded-xl border border-primary bg-primary/5 shadow-sm px-4 py-6 text-center cursor-default"
                  >
                    <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded border bg-primary border-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>

                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border bg-primary/10 border-primary text-primary">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium">
                      {formatProcessName(process.orgProcessName)}
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-primary">
                      Enabled
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    );
  };

  const renderStep3 = () => {
    const selectedHashes = Array.from(selectedProcesses).sort((a, b) => {
      const nameA =
        catalogData?.getProcessCatalog?.find(
          (p: ProcessCatalogItem) => p.orgProcessHash === a
        )?.orgProcessName || '';
      const nameB =
        catalogData?.getProcessCatalog?.find(
          (p: ProcessCatalogItem) => p.orgProcessHash === b
        )?.orgProcessName || '';
      return getPipelineOrder(nameA) - getPipelineOrder(nameB);
    });
    if (selectedHashes.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          No pipelines selected. Please go back and select at least one.
        </div>
      );
    }

    return (
      <div className="space-y-4 py-2">
        {selectedHashes.map((hash) => {
          const process = catalogData?.getProcessCatalog?.find(
            (p: ProcessCatalogItem) => p.orgProcessHash === hash
          );
          const processName = process
            ? formatProcessName(process.orgProcessName)
            : 'Unknown Process';

          return (
            <div
              key={`${hash}-${configResetToken}`}
              className="border rounded-xl bg-card shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden mb-4"
            >
              <div className="p-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm text-foreground capitalize">
                    {processName}
                  </span>
                </div>
              </div>
              <div className="p-4 border-t bg-background/50">
                <ProcessConfigItem
                  processHash={hash}
                  currentConfig={processConfigs[hash]}
                  onConfigChange={updateProcessConfig}
                  onRefetchPrompts={() => refetchProcessPrompts(hash)}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderStep4 = () => {
    const values = form.getValues();
    const tagList = parseBatchTags(values.batch_tags);

    const isCreatingBatch = statusMessage === 'Creating Batch...';
    let overallProgress = 0;
    if (isDone) {
      overallProgress = 100;
    } else if (
      statusMessage.includes('Uploading') ||
      statusMessage === 'Starting upload...'
    ) {
      overallProgress = Math.round(progress);
    }

    const prettyDuration =
      videoDuration && videoDuration > 0
        ? videoDuration >= 60
          ? `${Math.floor(videoDuration / 60)}m ${Math.floor(videoDuration % 60)}s`
          : `${Math.floor(videoDuration)}s`
        : 'Unknown';

    const selectedPipelineNames = Array.from(selectedProcesses)
      .sort((a, b) => {
        const nameA =
          catalogData?.getProcessCatalog?.find(
            (p: ProcessCatalogItem) => p.orgProcessHash === a
          )?.orgProcessName || '';
        const nameB =
          catalogData?.getProcessCatalog?.find(
            (p: ProcessCatalogItem) => p.orgProcessHash === b
          )?.orgProcessName || '';
        return getPipelineOrder(nameA) - getPipelineOrder(nameB);
      })
      .map((hash) =>
        catalogData?.getProcessCatalog?.find(
          (p: ProcessCatalogItem) => p.orgProcessHash === hash
        )
      )
      .filter(Boolean)
      .map((p) => formatProcessName((p as ProcessCatalogItem).orgProcessName));

    return (
      <div className="space-y-6 py-2">
        <div className="bg-card border rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileVideo2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-base">Video details</h4>
                <p className="text-xs text-muted-foreground">
                  Double-check the basics before you start the analysis.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ready to run
              </span>
              <span className="text-muted-foreground">
                Step {currentStep + 1} of {FORM_STEPS.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name
              </span>
              <p className="text-sm font-semibold text-foreground">
                {values.batch_video_name}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Duration
              </span>
              <p className="text-sm font-semibold text-foreground">
                {prettyDuration}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Source
              </span>
              <p className="text-sm font-semibold text-foreground capitalize">
                {values.camera_name ? 'Camera' : 'Upload'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Pipelines
              </span>
              <p className="text-sm font-semibold text-foreground">
                {selectedProcesses.size}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Tags
              </span>
              <p className="text-sm font-semibold text-foreground break-words">
                {tagList?.length ? tagList.join(', ') : 'None'}
              </p>
            </div>
          </div>

          {selectedPipelineNames.length > 0 && (
            <div className="pt-3 border-t border-border/70 flex flex-wrap gap-2">
              {selectedPipelineNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-base">
                Selected configurations
              </h4>
              <p className="text-xs text-muted-foreground">
                Expand each section to see models, prompts and parameters.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {Array.from(selectedProcesses)
              .sort((a, b) => {
                const nameA =
                  catalogData?.getProcessCatalog?.find(
                    (p: ProcessCatalogItem) => p.orgProcessHash === a
                  )?.orgProcessName || '';
                const nameB =
                  catalogData?.getProcessCatalog?.find(
                    (p: ProcessCatalogItem) => p.orgProcessHash === b
                  )?.orgProcessName || '';
                return getPipelineOrder(nameA) - getPipelineOrder(nameB);
              })
              .map((hash) => {
                const process = catalogData?.getProcessCatalog?.find(
                  (p: ProcessCatalogItem) => p.orgProcessHash === hash
                );
                const meta = processConfigMeta[hash] as
                  | Record<string, unknown>
                  | undefined;
                const config: Record<string, unknown> =
                  processConfigs[hash] || {};
                return (
                  <ReviewPipelineItem
                    key={hash}
                    processName={process?.orgProcessName || 'Unknown Process'}
                    config={config}
                    meta={meta || {}}
                  />
                );
              })}
          </div>
        </div>

        {(uploadStatus === 'uploading' ||
          uploadStatus === 'completed' ||
          uploadStatus === 'error') && (
          <div className="space-y-2 pt-4 border-t">
            {isCreatingBatch ? (
              <div className="flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground py-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating batch, please wait...</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between text-xs font-medium">
                  <span
                    className={
                      uploadStatus === 'error' ? 'text-destructive' : ''
                    }
                  >
                    {statusMessage}
                  </span>
                  {uploadStatus !== 'error' && <span>{overallProgress}%</span>}
                </div>
                <Progress value={overallProgress} className="h-2" />
                <p
                  className={`text-xs text-center ${
                    uploadStatus === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {uploadStatus === 'completed'
                    ? 'You can now close this window.'
                    : uploadStatus === 'error'
                      ? 'Please try again.'
                      : 'Please do not close this window.'}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      if (!form.watch('video') || !form.watch('batch_video_name')) {
        form.trigger(['video', 'batch_video_name']);
        return;
      }
      const videoTitle = form.watch('batch_video_name') as string;
      if (videoTitle.length > 50) {
        form.setError('batch_video_name', {
          type: 'validate',
          message: 'Video title cannot exceed 50 characters.',
        });
        return;
      }
      if (isDuplicateName(videoTitle)) {
        form.setError('batch_video_name', {
          type: 'validate',
          message:
            'A video with this name already exists. Please choose a different name.',
        });
        return;
      }

      setIsCheckingDuplicateName(true);
      const { isDuplicate: duplicateOnServer, checkFailed } =
        await checkDuplicateNameOnServer(videoTitle);
      setIsCheckingDuplicateName(false);

      if (checkFailed) {
        form.setError('batch_video_name', {
          type: 'manual',
          message:
            'We could not validate this name right now. Please click Next again in a moment.',
        });
        toast.error(
          'Name validation is temporarily unavailable. Please try again.'
        );
        return;
      }

      if (duplicateOnServer) {
        form.setError('batch_video_name', {
          type: 'duplicate',
          message:
            'A video with this name already exists. Please choose a different name. (Special characters, case, and spacing are ignored for matching)',
        });
        return;
      }
    }

    if (currentStep === 1 && selectedProcesses.size === 0) {
      toast.error('Please select at least one pipeline.');
      return;
    }

    // Before leaving Setup Configuration, ensure required prompts are configured
    if (currentStep === 2) {
      const configs = Array.from(selectedProcesses).map((hash) => ({
        orgProcessHash: hash,
        processConfig: processConfigs[hash] || {},
        isEnabled: true,
      }));

      for (const { orgProcessHash, processConfig } of configs) {
        const process = catalogData?.getProcessCatalog?.find(
          (p: ProcessCatalogItem) => p.orgProcessHash === orgProcessHash
        );
        const processName = process?.orgProcessName || orgProcessHash;
        const processNameLower = String(processName || '').toLowerCase();

        const hasSystemPrompt = Boolean(
          (processConfig as Record<string, unknown>).system_prompt_hash
        );

        if (processNameLower === 'event_detection' && !hasSystemPrompt) {
          toast.error(
            'Event detection, vlm inference requires a System Prompt. Please configure it in "Setup Configuration" or deselect Event detection, vlm inference.'
          );
          return;
        }

        if (processNameLower === 'vlm_inference' && !hasSystemPrompt) {
          toast.error(
            'Transcript Generation requires a System Prompt. Please configure it in "Setup Configuration".'
          );
          return;
        }
      }
    }

    setCurrentStep((s) => s + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const currentFormStep = FORM_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === FORM_STEPS.length - 1;

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
        <div className="max-w-6xl mx-auto h-full min-h-0 flex flex-col text-left pt-4 md:pt-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="self-start mb-6 flex items-center gap-2 px-0 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Playground
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start md:items-stretch flex-1 min-h-0">
            {/* Left rail - stepper */}
            <aside className="pt-2 md:pt-0 md:col-span-1 md:sticky md:top-6 md:self-start">
              <StepProgressBar
                steps={FORM_STEPS}
                currentStep={currentStep}
                onStepClick={(step) => {
                  if (step <= currentStep) {
                    setCurrentStep(step);
                  }
                }}
              />
            </aside>

            {/* Right column - heading + form */}
            <section className="md:col-span-2 min-h-0 relative">
              <div className="spectra-scrollbar space-y-4 w-full max-w-3xl h-full min-h-0 md:overflow-y-auto md:pr-2 md:pb-4">
                <div className="border border-border shadow-sm rounded-2xl bg-card">
                  <div className="px-4 py-3 border-b">
                    <h2 className="text-xl font-semibold text-foreground">
                      {currentFormStep.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentFormStep.description}
                    </p>
                  </div>

                  <div className="px-4 py-4">
                    <Form {...form}>
                      {currentStep === 0 && renderStep1()}
                      {currentStep === 1 && renderStep2()}
                      {currentStep === 2 && renderStep3()}
                      {currentStep === 3 && renderStep4()}
                    </Form>
                  </div>

                  {/* Step Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t px-6 pb-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={isFirstStep ? handleCancel : handlePrevious}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {isFirstStep ? 'Cancel' : 'Previous'}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      Step {currentStep + 1} of {FORM_STEPS.length}
                    </div>

                    {isLastStep ? (
                      <Button
                        type="button"
                        onClick={
                          isDone
                            ? () => navigate('/playground')
                            : handleCreateBatch
                        }
                        disabled={
                          isSubmitting ||
                          uploadStatus === 'uploading' ||
                          (selectedProcesses.size === 0 && !isDone)
                        }
                        className="gap-2 bg-primary hover:opacity-90"
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </>
                        ) : isSubmitting || uploadStatus === 'uploading' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />{' '}
                            {statusMessage || 'Processing...'}
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4" /> Upload & Create
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={
                          isCheckingDuplicateName ||
                          (currentStep === 0 &&
                            (!form.watch('video') ||
                              !form.watch('batch_video_name') ||
                              (form.watch('batch_video_name') as string)
                                ?.length > 50 ||
                              isDuplicateName(
                                (form.watch('batch_video_name') as string) || ''
                              )))
                        }
                        className="gap-2 bg-primary hover:opacity-90"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </Main>

      {error && (
        <Alert className="fixed bottom-5 left-1/2 transform -translate-x-1/2 w-auto bg-destructive text-destructive-foreground shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
};

export default PlaygroundUploadPage;
