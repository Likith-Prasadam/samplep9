import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UploadCloud,
  FileVideo2,
  XCircle,
  Settings2,
  Loader2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Layers,
  MapPin,
  Camera,
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
  GET_PRESIGNED_URL,
  GET_PROCESS_CATALOG,
  GET_PROCESS_WITH_MODELS,
} from '@/graphql/batch_mutations';
import type { BatchVideo } from '../types/batch-analysis';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ProcessConfigItem,
  ReviewPipelineItem,
} from '@/components/pipeline-configuration/process-config-item';
import { toDisplayName as formatProcessName } from '@/components/pipeline-configuration/utils';

// Filter out UI-only schema-constraint fields before sending to backend.
// We intentionally KEEP `parent_*_hash` entries in the persisted config —
// they are needed later (e.g. in the Video Details read-only view) to look
// up sibling prompt versions and render correct "v1 / v2 (Latest)" labels.
// This matches the behaviour of live-configuration.tsx, which also keeps
// them on updates.
const SCHEMA_CONSTRAINT_KEYS = /^required_.*_types$|^required_model_type$/;

// Constants
const MAX_FILE_SIZE = 100_000_000; // 100MB
const UPLOAD_TIMEOUT = 300_000; // 5 minutes
const AZURE_PROPAGATION_DELAY = 200; // milliseconds
const VIDEO_LOAD_TIMEOUT = 30_000; // 30 seconds

export interface Model {
  modelHash: string;
  modelName: string;
  modelDefaultParams?: Record<string, unknown>;
}

export interface Prompt {
  promptHash: string;
  promptName: string;
  promptType: string;
}

export interface PromptVersion {
  promptHash: string;
  promptName: string;
}

export interface ProcessCatalogItem {
  orgProcessHash: string;
  orgProcessName: string;
}

export interface SchemaProperty {
  title?: string;
  default?: unknown;
  type?: string;
  minimum?: number;
  maximum?: number;
  description?: string;
  $ref?: string;
}

export interface JsonSchema {
  properties?: Record<string, SchemaProperty>;
  $defs?: Record<string, JsonSchema>;
}

interface UploadVideoFormProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  videoslist: BatchVideo[];
  setVideoslist: React.Dispatch<React.SetStateAction<BatchVideo[]>>;
  onUploadSuccess?: () => void;
  setUploadSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}

// Validation helper functions
const validateAlphabetsOnly = (value: string) => /^[a-zA-Z]*$/.test(value);
const validateAlphanumeric = (value: string) => /^[a-zA-Z0-9]*$/.test(value);
const validateAlphanumericWithHyphen = (value: string) =>
  /^[a-z0-9-]*$/.test(value);
const validateNumbersOnly = (value: string) => /^[0-9]*$/.test(value);
const validateNumbersWithDecimalAndMinus = (value: string) =>
  /^[0-9.-]*$/.test(value);

const formSchema = z.object({
  video: z
    .instanceof(File, { message: 'Please select a video file to upload' })
    .refine(
      (file) => file.size <= MAX_FILE_SIZE,
      'File size must be less than 100MB'
    )
    .refine((file) => {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      return !fileName.includes('_');
    }, 'File names containing underscores (_) are not allowed. Please rename the file without underscores and try again.'),
  batch_video_name: z
    .string()
    .min(1, 'Video name is required')
    .max(50, 'Video name cannot exceed 50 characters'),
  source_type: z.enum(['upload', 'camera']).optional(),
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
  ip_address: z.string().optional(),
  fps_rate: z.string().optional(),
  location_city: z
    .string()
    .max(20, 'City must be maximum 20 characters')
    .refine(
      (value) => !value || validateAlphabetsOnly(value),
      'City must contain alphabets only'
    )
    .optional(),
  location_address: z
    .string()
    .max(30, 'Address must be maximum 30 characters')
    .refine(
      (value) => !value || validateAlphanumeric(value),
      'Address must contain alphabets and numbers only'
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
  recorded_time: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Pipeline sort order
const PIPELINE_ORDER = {
  event_detection: 1,
  vlm_inference: 2,
  video_processing: 3,
};

const sortPipelines = <T extends { orgProcessName: string }>(
  pipelines: T[]
): T[] => {
  return [...pipelines].sort((a, b) => {
    const orderA =
      PIPELINE_ORDER[a.orgProcessName as keyof typeof PIPELINE_ORDER] ?? 999;
    const orderB =
      PIPELINE_ORDER[b.orgProcessName as keyof typeof PIPELINE_ORDER] ?? 999;
    return orderA - orderB;
  });
};

// Helper utilities and process configuration components have been extracted to shared utils

const UploadVideoForm: React.FC<UploadVideoFormProps> = ({
  open,
  setOpen,
  videoslist,
  onUploadSuccess,
  setUploadSuccess,
  setIsLoading,
  setPage,
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'completed' | 'error'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isDone, setIsDone] = useState(false);
  const [hasInitializedDefaults, setHasInitializedDefaults] = useState(false);
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

  const [getPresignedUrl] = useLazyQuery(GET_PRESIGNED_URL);
  const [createBatch] = useMutation(CREATE_BATCH);
  const { data: catalogData, loading: catalogLoading } = useQuery<{
    getProcessCatalog: ProcessCatalogItem[];
  }>(GET_PROCESS_CATALOG);
  const apolloClient = useApolloClient();

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      video: undefined,
      batch_video_name: '',
      source_type: 'upload',
    },
  });

  const isDuplicateName = useCallback(
    (name: string): boolean => {
      return videoslist.some(
        (video) => (video.batchName || '').toLowerCase() === name.toLowerCase()
      );
    },
    [videoslist]
  );

  const resetForm = useCallback(() => {
    form.reset({
      video: undefined,
      batch_video_name: '',
      source_type: 'upload',
    });
    setError(null);
    setStep(1);
    setUploadStatus('idle');
    setProgress(0);
    setVideoDuration(0);
    setStatusMessage('');
    setIsDone(false);
    setSelectedProcesses(new Set());
    setProcessConfigs({});
    setProcessConfigMeta({});
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    form.clearErrors();
    setHasInitializedDefaults(false);
    setIsMetadataOpen(false);
  }, [form]);

  const handleDialogClose = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // If closing, abort upload if in progress
        if (uploadStatus === 'uploading') {
          if (xhrRef.current) {
            xhrRef.current.abort();
          }
        }
        resetForm();
      }
      setOpen(newOpen);
    },
    [uploadStatus, resetForm, setOpen]
  );

  const handleCancel = useCallback(() => {
    resetForm();
    setOpen(false);
  }, [resetForm, setOpen]);

  // Auto-select video_preprocessing
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

  // Handle file selection and duration extraction
  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file) return;

      // Check if file name contains underscores
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      if (fileName.includes('_')) {
        // Display error message below the upload video area
        form.setError('video', {
          type: 'manual',
          message:
            'File names containing underscores (_) are not allowed. Please rename the file without underscores and try again.',
        });
        return;
      }

      // Set default name from file
      if (!form.getValues('batch_video_name')) {
        form.setValue('batch_video_name', fileName, {
          shouldValidate: true,
        });
      }
      const duration = await extractVideoDuration(file);
      setVideoDuration(duration);
    },
    [form, extractVideoDuration]
  );

  const performUpload = useCallback(
    async (file: File) => {
      if (!file) {
        setError('No file selected');
        form.setError('video', { type: 'manual', message: 'No file selected' });
        return;
      }

      // Validate file before proceeding
      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = 'File size must be less than 100MB';
        setError(errorMessage);
        form.setError('video', { type: 'manual', message: errorMessage });
        return;
      }

      // Note: We allow any file type that the input accepts, but browser mime type detection can be flaky.
      // The input accept="video/*" handles most of it.

      setError(null);
      setUploadStatus('uploading');
      setProgress(0);
      setStatusMessage('Uploading Video...');

      try {
        // Fetch presigned URL first
        let presignedData: {
          getBatchUploadPresignedUrl?: {
            presignedUrl?: string;
            batchHash?: string;
            batchVideoSourcePath?: string;
          };
        } | null = null;
        let presignedError: ApolloError | Error | null = null;

        try {
          const result = await getPresignedUrl({ fetchPolicy: 'network-only' });
          // Handle both promise resolve and error cases
          if (result && typeof result === 'object') {
            if ('data' in result) {
              presignedData = result.data;
              presignedError =
                (result as { error?: ApolloError }).error || null;
            } else if ('error' in result) {
              presignedError = (result as { error: ApolloError }).error;
            } else {
              // Result might be the data directly
              presignedData = result;
            }
          } else {
            presignedData = result;
          }
        } catch (err) {
          presignedError = err instanceof Error ? err : new Error(String(err));
          console.error('Error fetching presigned URL:', err);
        }

        // Check for errors after metadata extraction
        if (presignedError) {
          const errorMessage =
            presignedError instanceof ApolloError &&
            presignedError.graphQLErrors?.length > 0
              ? presignedError.graphQLErrors
                  .map((err) => err.message)
                  .join(', ')
              : presignedError instanceof ApolloError &&
                  presignedError.networkError
                ? 'Network error: Unable to connect to the server. Please check your internet connection.'
                : presignedError.message ||
                  'Failed to fetch upload URL. Please try again.';
          form.setError('video', { type: 'manual', message: errorMessage });
          setError(errorMessage);
          setUploadStatus('error');
          setProgress(0);
          toast.error('Failed to get upload URL', {
            position: 'bottom-center',
            className: 'bg-destructive text-destructive-foreground',
            duration: 3000,
          });
          return;
        }

        if (!presignedData) {
          const errorMessage =
            'Presigned URL fetch returned no data. Please try again.';
          form.setError('video', { type: 'manual', message: errorMessage });
          setError(errorMessage);
          setUploadStatus('error');
          setProgress(0);
          toast.error('Failed to get upload URL', {
            position: 'bottom-center',
            className: 'bg-destructive text-destructive-foreground',
            duration: 3000,
          });
          return;
        }

        const presignedUrl =
          presignedData?.getBatchUploadPresignedUrl?.presignedUrl;
        const batch_hash_name =
          presignedData?.getBatchUploadPresignedUrl?.batchHash;
        const batchVideoSourcePath =
          presignedData?.getBatchUploadPresignedUrl?.batchVideoSourcePath;

        if (!presignedUrl || !batchVideoSourcePath || !batch_hash_name) {
          const errorMessage =
            'Presigned URL fetch failed. Missing required data. Please try again.';
          form.setError('video', { type: 'manual', message: errorMessage });
          setError(errorMessage);
          setUploadStatus('error');
          setProgress(0);
          toast.error('Failed to get upload URL', {
            position: 'bottom-center',
            className: 'bg-destructive text-destructive-foreground',
            duration: 3000,
          });
          return;
        }

        // Upload file using XMLHttpRequest for better CORS handling
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded * 100) / e.total);
              setProgress(percent);
            }
          });

          // Handle completion
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else if (xhr.status === 403) {
              reject(
                new Error(
                  'Upload forbidden (403). This usually indicates a signature mismatch. Please check if the backend presigned URL matches the upload headers.'
                )
              );
            } else {
              reject(
                new Error(
                  `Upload failed with status ${xhr.status}: ${xhr.statusText}`
                )
              );
            }
          });

          // Handle errors
          xhr.addEventListener('error', () => {
            // Status 0 usually indicates CORS or network error
            if (xhr.status === 0) {
              reject(
                new Error(
                  'Upload failed due to CORS policy. Please ensure the S3 bucket allows PUT requests from this origin.'
                )
              );
            } else {
              reject(
                new Error(`Network error during upload (status: ${xhr.status})`)
              );
            }
          });

          // Handle timeout
          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timeout'));
          });

          // Handle abort
          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });

          // Configure request
          xhr.open('PUT', presignedUrl, true);
          xhr.timeout = UPLOAD_TIMEOUT;

          // Send the file as a Blob with empty type to prevent browser from adding Content-Type header
          // This is required because the backend presigned URL signature does not include Content-Type
          const blob = file.slice(0, file.size, '');
          xhr.send(blob);
        });

        // Small delay for Azure propagation
        await new Promise((resolve) =>
          setTimeout(resolve, AZURE_PROPAGATION_DELAY)
        );

        return {
          hash: batch_hash_name,
          path: batchVideoSourcePath,
        };
      } catch (err: unknown) {
        let errorMessage = 'Failed to upload video';

        if (err instanceof Error) {
          if (err.message === 'Upload cancelled') return; // Ignore cancellation
          const errMsg = err.message.toLowerCase();

          // Check for CORS-related errors
          if (
            errMsg.includes('cors') ||
            errMsg.includes('access-control') ||
            errMsg.includes('network error') ||
            errMsg.includes('failed to fetch') ||
            errMsg.includes('blocked by cors policy')
          ) {
            errorMessage =
              'CORS policy blocked the upload. The production origin needs to be added to Azure Blob Storage CORS settings. Please contact the administrator.';
          } else if (errMsg.includes('timeout')) {
            errorMessage =
              'Upload timeout. Please try again with a smaller file or check your connection.';
          } else {
            errorMessage = err.message;
          }
        } else if (axios.isAxiosError(err)) {
          // Fallback for any remaining axios errors
          const axiosErr = err as AxiosError;
          if (axiosErr.code === 'CORS' || axiosErr.message.includes('CORS')) {
            errorMessage =
              'Upload failed due to CORS policy. Please ensure the S3 bucket allows PUT requests from this origin.';
          } else if (axiosErr.code === 'ECONNABORTED') {
            errorMessage =
              'Upload timeout. Please try again with a smaller file or check your connection.';
          } else {
            const status = axiosErr.response?.status;
            const code = axiosErr.code;
            errorMessage = `Upload failed: ${status || code || 'Unknown error'} - ${axiosErr.message}`;
          }
        }

        setError(errorMessage);
        form.setError('video', { type: 'manual', message: errorMessage });
        setStatusMessage(errorMessage);
        setUploadStatus('error');
      }
    },
    [getPresignedUrl, form]
  );

  const handleCreateBatch = async () => {
    const file = form.getValues('video');
    if (!file) {
      toast.error('No video file selected.');
      return;
    }

    const values = form.getValues();

    // Construct process configs - filter out UI-only fields
    const configs = Array.from(selectedProcesses).map((hash) => {
      const raw = processConfigs[hash] || {};
      const filtered = Object.fromEntries(
        Object.entries(raw).filter(([k]) => !SCHEMA_CONSTRAINT_KEYS.test(k))
      );
      return {
        orgProcessHash: hash,
        processConfig: filtered,
        isEnabled: true,
      };
    });

    if (configs.length === 0) {
      toast.error('Please select at least one processing pipeline.');
      return;
    }

    try {
      setStatusMessage('Starting upload...');
      // 1. Perform Upload
      const uploadResult = await performUpload(file);

      if (!uploadResult) {
        throw new Error('Upload failed or was cancelled.');
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
            // Optional metadata
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
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors.map((err) => err.message).join(', '));
      }

      if (!batchData) {
        throw new Error('Batch creation returned no data');
      }

      setPage(1);
      setUploadSuccess(true);
      setIsLoading(true);
      onUploadSuccess?.();

      setStatusMessage('All steps completed successfully!');
      setUploadStatus('completed');
      setIsDone(true);
      // Do not reset form or close dialog automatically
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create batch';
      setError(msg);
      setStatusMessage(msg);
      setUploadStatus('error');
    }
  };

  const updateProcessConfig = useCallback(
    (
      hash: string,
      config: Record<string, unknown>,
      meta: Record<string, unknown>
    ) => {
      setProcessConfigs((prev) => ({
        ...prev,
        [hash]: { ...(prev[hash] || {}), ...config },
      }));
      setProcessConfigMeta((prev) => ({
        ...prev,
        [hash]: { ...(prev[hash] || {}), ...meta },
      }));
    },
    []
  );

  // Refetch process with models to update prompt list after creation
  const refetchProcessPrompts = useCallback(
    async (processHash: string) => {
      try {
        console.log(
          '[Playground] Refetching prompts for process:',
          processHash
        );
        await apolloClient.query({
          query: GET_PROCESS_WITH_MODELS,
          variables: { orgProcessHash: processHash },
          fetchPolicy: 'network-only', // Force fresh data
        });
        console.log('[Playground] Refetch completed');
      } catch (error) {
        console.error('[Playground] Error refetching prompts:', error);
        throw error;
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
              {!field.value ? (
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
                          MP4, WebM or Ogg (max. 100MB)
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
                            // Check if file name contains underscores before adding
                            const fileName = file.name.replace(/\.[^/.]+$/, '');
                            if (fileName.includes('_')) {
                              // Display error message below the upload video area
                              form.setError('video', {
                                type: 'manual',
                                message:
                                  'This file name contains underscores (_). Please rename the file without underscores and try again.',
                              });
                              return;
                            }
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
                      <p className="font-medium truncate">{field.value.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(field.value.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        field.onChange(undefined);
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
        <FormField
          control={form.control}
          name="batch_video_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter a name for this batch" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsMetadataOpen(!isMetadataOpen)}
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent hover:text-primary"
        >
          <span className="font-medium text-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Additional Parameters
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 ${isMetadataOpen ? 'rotate-90' : ''}`}
          />
        </Button>
      </div>

      {isMetadataOpen && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Camera & Network Details */}
          <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
            <h4 className="text-sm font-medium flex items-center gap-2 text-primary">
              <Camera className="w-4 h-4" /> Camera & Network
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="camera_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">
                      Camera Name (Zone)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-8"
                        placeholder="e.g. Entrance Cam"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ip_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">IP Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-8"
                        placeholder="192.168.1.100"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fps_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">FPS Source Rate</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8" placeholder="e.g. 30" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

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
  );

  const renderStep2 = () => (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4 py-2">
        <p className="text-sm text-muted-foreground">
          All processing pipelines are included by default and cannot be
          deselected.
        </p>
        {catalogLoading && !catalogData ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          sortPipelines(catalogData?.getProcessCatalog || []).map(
            (process: ProcessCatalogItem) => (
              <div
                key={process.orgProcessHash}
                className="flex items-center justify-between p-4 border rounded-lg border-primary bg-primary/5 shadow-sm cursor-default"
              >
                <div className="space-y-0.5">
                  <div className="font-medium flex items-center gap-2">
                    {formatProcessName(process.orgProcessName)}
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border flex items-center justify-center bg-primary border-primary text-primary-foreground">
                  <Check className="w-3 h-3" />
                </div>
              </div>
            )
          )
        )}
      </div>
    </ScrollArea>
  );

  const renderStep3 = () => {
    const selectedHashes = Array.from(selectedProcesses);
    if (selectedHashes.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          No pipelines selected. Please go back and select at least one.
        </div>
      );
    }

    // Sort selected hashes based on pipeline order
    const sortedHashes = selectedHashes.sort((hashA, hashB) => {
      const processA = catalogData?.getProcessCatalog?.find(
        (p: ProcessCatalogItem) => p.orgProcessHash === hashA
      );
      const processB = catalogData?.getProcessCatalog?.find(
        (p: ProcessCatalogItem) => p.orgProcessHash === hashB
      );

      const orderA =
        PIPELINE_ORDER[
          processA?.orgProcessName as keyof typeof PIPELINE_ORDER
        ] ?? 999;
      const orderB =
        PIPELINE_ORDER[
          processB?.orgProcessName as keyof typeof PIPELINE_ORDER
        ] ?? 999;
      return orderA - orderB;
    });

    return (
      <div className="space-y-4 py-2">
        {sortedHashes.map((hash) => {
          const process = catalogData?.getProcessCatalog?.find(
            (p: ProcessCatalogItem) => p.orgProcessHash === hash
          );
          const processName = process
            ? formatProcessName(process.orgProcessName)
            : 'Unknown Process';

          return (
            <div
              key={hash}
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

  const renderStep5 = () => {
    const values = form.getValues();

    let overallProgress = 0;
    if (isDone) {
      overallProgress = 100;
    } else if (statusMessage === 'Creating Batch...') {
      overallProgress = 80;
    } else if (
      statusMessage.includes('Uploading') ||
      statusMessage === 'Starting upload...'
    ) {
      overallProgress = Math.round(progress * 0.8);
    }

    return (
      <div className="space-y-6 py-2">
        <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <FileVideo2 className="w-4 h-4 text-primary" /> Video Details
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="font-medium">{values.batch_video_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <p className="font-medium">
                {videoDuration ? `${Math.floor(videoDuration)}s` : 'Unknown'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Source:</span>
              <p className="font-medium capitalize">
                {values.camera_name ? 'Camera' : 'Upload'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Pipelines:</span>
              <p className="font-medium">{selectedProcesses.size}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> Selected Pipelines
          </h4>
          <div className="space-y-2">
            {Array.from(selectedProcesses).map((hash) => {
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
            <div className="flex justify-between text-xs font-medium">
              <span
                className={uploadStatus === 'error' ? 'text-destructive' : ''}
              >
                {statusMessage}
              </span>
              {uploadStatus !== 'error' && <span>{overallProgress}%</span>}
            </div>
            <Progress value={overallProgress} className="h-2" />
            <p
              className={`text-xs text-center ${uploadStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {uploadStatus === 'completed'
                ? 'You can now close this window.'
                : uploadStatus === 'error'
                  ? 'Please try again.'
                  : 'Please do not close this window.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              {step === 1
                ? 'Upload Video'
                : step === 2
                  ? 'Select Pipelines'
                  : step === 3
                    ? 'Configure Pipelines'
                    : 'Review & Create'}
            </DialogTitle>
            <DialogDescription
              id="upload-dialog-description"
              className="text-muted-foreground"
            >
              {step === 1
                ? 'Upload a video file and provide a name.'
                : step === 2
                  ? 'Select all the processes you want to enable for this video.'
                  : step === 3
                    ? 'Configure parameters, models, and prompts for selected pipelines.'
                    : 'Review your selections before creating the batch.'}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-2 py-4 bg-muted/20 border-b">
            <div
              className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}
            />
            <div
              className={`h-2 w-16 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}
            />
            <div
              className={`h-2 w-16 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`}
            />
            <div
              className={`h-2 w-16 rounded-full transition-colors ${step >= 4 ? 'bg-primary' : 'bg-muted'}`}
            />
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep5()}
            </Form>
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? handleCancel : () => setStep((s) => s - 1)}
              className="border-border hover:bg-muted"
            >
              {step === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </>
              )}
            </Button>

            {step < 4 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1) {
                    if (
                      !form.watch('video') ||
                      !form.watch('batch_video_name')
                    ) {
                      form.trigger(['video', 'batch_video_name']);
                      return;
                    }
                    if (isDuplicateName(form.watch('batch_video_name'))) {
                      form.setError('batch_video_name', {
                        message: 'Name already exists',
                      });
                      return;
                    }
                  }
                  if (step === 2 && selectedProcesses.size === 0) {
                    toast.error('Please select at least one pipeline.');
                    return;
                  }
                  setStep((s) => s + 1);
                }}
                disabled={
                  step === 1 &&
                  (!form.watch('video') || !form.watch('batch_video_name'))
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={
                  isDone ? () => handleDialogClose(false) : handleCreateBatch
                }
                disabled={
                  uploadStatus === 'uploading' ||
                  (selectedProcesses.size === 0 && !isDone)
                }
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isDone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Done
                  </>
                ) : uploadStatus === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{' '}
                    {statusMessage || 'Processing...'}
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" /> Upload & Create
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <Alert className="fixed bottom-5 left-1/2 transform -translate-x-1/2 w-auto bg-destructive text-destructive-foreground shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}
    </>
  );
};

export default UploadVideoForm;
