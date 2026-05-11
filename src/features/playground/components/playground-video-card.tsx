import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  CircleCheck,
  CircleGauge,
  CircleX,
  PlayCircle,
  MessageSquare,
  Trash2,
  MoreVertical,
  RefreshCw,
  Maximize2,
  Download,
  Info,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useApolloClient, gql } from '@apollo/client';
import {
  DELETE_BATCH,
  GET_BATCH_PROCESS_CONFIGS,
  GET_BATCH_PROCESS_CONFIG,
} from '@/graphql/batch_mutations';
import {
  GET_ORG_MODEL_BY_HASH,
  GET_PROMPT_BY_HASH,
  GET_PROMPT_VERSIONS,
} from '@/graphql/workflow_queries';

// Variant of GET_PROMPT_BY_HASH that also returns `parentPromptHash`, so we
// can look up sibling versions even when the saved batch config doesn't
// persist `parent_*_hash`. Kept local to this file so other consumers of
// GET_PROMPT_BY_HASH aren't affected if the backend happens not to support
// the field.
const GET_PROMPT_WITH_PARENT = gql`
  query GetPromptWithParent($promptHash: String!) {
    getPromptByHash(promptHash: $promptHash) {
      promptHash
      promptName
      promptType
      promptContent
      promptDescription
      parentPromptHash
    }
  }
`;

// Variant of GET_PROCESS_WITH_MODELS that also returns `parentPromptHash` on
// each accessible prompt. Used as a fallback source for a prompt's parent
// when neither the batch config nor getPromptByHash exposes it.
const GET_PROCESS_ACCESSIBLE_PROMPTS = gql`
  query GetProcessAccessiblePrompts($orgProcessHash: String!) {
    getProcessWithModels(orgProcessHash: $orgProcessHash) {
      orgProcessHash
      accessiblePrompts {
        promptHash
        promptName
        promptType
        parentPromptHash
      }
    }
  }
`;

// Broader-scope prompt listing that reliably returns `parentPromptHash`.
// Useful when a prompt isn't attached to the current process (e.g. a prompt
// that was selected from a cohort-wide list).
const GET_ACCESSIBLE_PROMPTS_WITH_PARENT = gql`
  query GetAccessiblePromptsWithParent(
    $promptTypes: [String!]!
    $itemsPerPage: Int
    $page: Int
  ) {
    getAccessiblePromptsByTypes(
      promptTypes: $promptTypes
      itemsPerPage: $itemsPerPage
      page: $page
    ) {
      promptHash
      promptName
      promptType
      parentPromptHash
    }
  }
`;
import { toast } from 'sonner';
import type { BatchVideo } from './../types/batch-analysis';
import { useAppSelector, useAppDispatch } from '@/store/index';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import {
  selectNotificationsForVideo,
  fetchBatchEventsNew,
  fetchNotifications,
  selectIsInitialized,
  selectIsLoading,
} from '@/store/slices/notifications-slice';
import { fetchPresignedUrlForBatch } from '@/store/slices/playground-slice';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatCreatedAt = (dateString: string): string => {
  try {
    const date = new Date(dateString.replace(' ', 'T'));
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear() % 100;
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year.toString().padStart(2, '0')} at ${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return dateString || '—';
  }
};

function formatProcessName(rawName?: string): string {
  const name = String(rawName || '');
  const lowered = name.toLowerCase();
  if (
    lowered.includes('video_preprocessing') ||
    lowered.includes('video-processing') ||
    lowered.includes('video_processing') ||
    lowered.includes('video processing')
  )
    return 'Video Processing';
  if (lowered.includes('vlm_inference') || lowered.includes('vlm inference'))
    return 'Transcript Generation';
  if (
    lowered.includes('event_detection') ||
    lowered.includes('event-detection') ||
    lowered.includes('event detection')
  )
    return 'Event detection';
  return name.replace(/[_-]+/g, ' ').trim();
}

const HASH_LABELS: Record<string, string> = {
  model_hash: 'Model',
  system_prompt_hash: 'System prompt',
  user_prompt_hash: 'User prompt',
  events_list_prompt_hash: 'Events list prompt',
  version: 'Version',
  video_frames: 'Video frames',
  chunk_duration: 'Chunk duration',
  fps_processing_rate: 'FPS processing rate',
};

const PARAM_LABELS: Record<string, string> = {
  max_tokens: 'Max tokens',
  temperature: 'Temperature',
  top_p: 'Top P',
  repetition_penalty: 'Repetition penalty',
};

interface VideoCardProps {
  video: BatchVideo;
  onOpenDrawer: (video: BatchVideo, mode?: 'view' | 'reanalyze') => void;
  onProcessBatch: (video: BatchVideo) => void;
  username: string;
  showDate?: boolean;
  onDeleteSuccess?: (videoId: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onOpenDrawer,
  onProcessBatch,
  onDeleteSuccess,
}) => {
  const navigate = useNavigate();
  const client = useApolloClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteBatch] = useMutation(DELETE_BATCH);
  const [isNotificationPopoverOpen, setIsNotificationPopoverOpen] =
    useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isAlertVideoOpen, setIsAlertVideoOpen] = useState(false);
  const [activeAlertVideo, setActiveAlertVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const [isHighZoom, setIsHighZoom] = useState(false);
  const [isFullscreenViewOpen, setIsFullscreenViewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewDetailsLoading, setViewDetailsLoading] = useState(false);
  const [viewDetailsConfigs, setViewDetailsConfigs] = useState<
    Array<{
      batchProcessConfigHash: string;
      orgProcessHash: string;
      orgProcessName: string;
      isEnabled: boolean;
      processConfig?: Record<string, unknown>;
      displayRows: Array<{
        label: string;
        value: string;
        type?: 'prompt' | 'param';
        subLabel?: string;
        subValue?: string;
        version?: string;
        promptName?: string;
      }>;
    }>
  >([]);

  const dispatch = useAppDispatch();
  const isInitialized = useAppSelector(selectIsInitialized);
  const isNotificationsLoading = useAppSelector(selectIsLoading);

  const { data: configsData, loading: configsListLoading } = useQuery(
    GET_BATCH_PROCESS_CONFIGS,
    {
      variables: { batchHash: video.batchHash },
      skip: !isViewDetailsOpen || !video.batchHash,
      fetchPolicy: 'network-only',
    }
  );

  const getPromptContent = (
    promptData: { promptContent?: unknown } | null | undefined
  ): string => {
    if (!promptData?.promptContent) return '';
    const raw = promptData.promptContent;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw !== null && 'content' in raw)
      return String((raw as { content: string }).content);
    return String(raw);
  };

  const fetchViewDetailsConfigs = useCallback(async () => {
    const list = (configsData?.getBatchProcessConfigs || []) as Array<{
      batchProcessConfigHash: string;
      orgProcessHash: string;
      orgProcessName: string;
      isEnabled: boolean;
    }>;

    if (list.length === 0) {
      setViewDetailsConfigs([]);
      setViewDetailsLoading(false);
      return;
    }

    // Initialize placeholders so the UI can render one card per config immediately.
    setViewDetailsConfigs(
      list.map((c) => ({
        ...c,
        processConfig: undefined,
        displayRows: [],
      }))
    );
    setViewDetailsLoading(false);

    // Fetch each config independently and update that card as soon as it's ready.
    list.forEach((c) => {
      (async () => {
        try {
          const res = await client.query({
            query: GET_BATCH_PROCESS_CONFIG,
            variables: { batchProcessConfigHash: c.batchProcessConfigHash },
            fetchPolicy: 'network-only',
          });
          const full = res.data?.getBatchProcessConfig as
            | { processConfig?: Record<string, unknown> }
            | undefined;
          const processConfig = full?.processConfig as
            | Record<string, unknown>
            | undefined;
          const displayRows: Array<{
            label: string;
            value: string;
            type?: 'prompt' | 'param';
            subLabel?: string;
            subValue?: string;
            version?: string;
            promptName?: string;
          }> = [];

          if (processConfig && typeof processConfig === 'object') {
            const modelHash = processConfig.model_hash as string | undefined;
            const systemPromptHash = processConfig.system_prompt_hash as
              | string
              | undefined;
            const userPromptHash = processConfig.user_prompt_hash as
              | string
              | undefined;
            const eventsListPromptHash =
              processConfig.events_list_prompt_hash as string | undefined;

            // Fetch a prompt including its parentPromptHash. `network-only`
            // avoids picking up a previously-cached partial entity (e.g. from
            // GET_PROMPT_BY_HASH) that's missing the parentPromptHash field.
            type PromptLookup = {
              promptHash?: string;
              promptName?: string;
              promptType?: string;
              promptContent?: unknown;
              parentPromptHash?: string | null;
            };

            const fetchPromptWithParent = async (promptHash?: string) => {
              if (!promptHash) return null;
              try {
                const res = await client.query({
                  query: GET_PROMPT_WITH_PARENT,
                  variables: { promptHash },
                  fetchPolicy: 'network-only',
                });
                return res?.data?.getPromptByHash as
                  | PromptLookup
                  | null
                  | undefined;
              } catch {
                // If the backend rejects the augmented query, fall back to
                // the standard one so we at least render prompt content.
                try {
                  const res = await client.query({
                    query: GET_PROMPT_BY_HASH,
                    variables: { promptHash },
                    fetchPolicy: 'cache-first',
                  });
                  return res?.data?.getPromptByHash as
                    | PromptLookup
                    | null
                    | undefined;
                } catch {
                  return null;
                }
              }
            };

            // Resolve the "vN (Latest)" label for the given prompt. We try
            // every known parent-hash candidate in order, returning as soon
            // as one yields a non-empty version list that contains the
            // selected promptHash. Order of preference:
            //   1. `parent_<type>_hash` persisted on the batch config
            //   2. `parentPromptHash` returned from the prompt itself
            //   3. The prompt hash itself (covers the first-version/template
            //      case where the prompt IS its own parent).
            const resolveVersionLabel = async (
              promptHash: string | undefined,
              prompt: PromptLookup | null | undefined,
              savedParentHash: string | undefined,
              debugKey: string
            ): Promise<string> => {
              if (!promptHash) return '';
              const parentFromPrompt =
                (prompt?.parentPromptHash as string | null | undefined) ||
                undefined;
              const candidates = [
                savedParentHash,
                parentFromPrompt,
                promptHash,
              ].filter(
                (v, i, arr): v is string =>
                  typeof v === 'string' && !!v && arr.indexOf(v) === i
              );

              console.log(`[video-details:${debugKey}] resolve start`, {
                promptHash,
                savedParentHash,
                parentFromPrompt,
                candidates,
              });

              for (const parentHash of candidates) {
                try {
                  const res = await client.query({
                    query: GET_PROMPT_VERSIONS,
                    variables: {
                      parentPromptHash: parentHash,
                      page: 1,
                      itemsPerPage: 1000,
                    },
                    fetchPolicy: 'network-only',
                  });
                  const raw =
                    (res.data?.getPromptVersions as
                      | Array<{
                          promptHash?: string;
                        }>
                      | undefined) || [];
                  console.log(`[video-details:${debugKey}] candidate`, {
                    parentHash,
                    versionsReturned: raw.length,
                    versionHashes: raw.map((v) => v.promptHash),
                  });
                  if (raw.length === 0) continue;
                  const ordered = [...raw].reverse();
                  const idx = ordered.findIndex(
                    (v) => v.promptHash === promptHash
                  );
                  if (idx === -1) {
                    // Query returned siblings but not our hash — this can
                    // happen if the backend omits the parent/template itself
                    // from the version list. Treat the selected prompt as
                    // the newest in that case and label it v{len+1} (Latest).
                    // Only do this when the current candidate is the
                    // prompt's own parent (most reliable signal), not a
                    // speculative fallback.
                    if (parentHash === parentFromPrompt) {
                      return `v${ordered.length + 1} (Latest)`;
                    }
                    continue;
                  }
                  return `v${ordered.length - idx}${idx === 0 ? ' (Latest)' : ''}`;
                } catch (err) {
                  console.log(`[video-details:${debugKey}] query error`, {
                    parentHash,
                    err,
                  });
                }
              }
              return '';
            };

            // Also fetch the process's accessiblePrompts so we can look up
            // parentPromptHash there as an extra fallback. This mirrors the
            // approach PromptSelectionField uses (where parentPromptHash is
            // read off the accessible prompt listing).
            const [
              modelRes,
              systemPrompt,
              userPrompt,
              eventsPrompt,
              processRes,
            ] = await Promise.all([
              modelHash
                ? client
                    .query({
                      query: GET_ORG_MODEL_BY_HASH,
                      variables: { modelHash },
                      fetchPolicy: 'cache-first',
                    })
                    .catch(() => null)
                : null,
              fetchPromptWithParent(systemPromptHash),
              fetchPromptWithParent(userPromptHash),
              fetchPromptWithParent(eventsListPromptHash),
              c.orgProcessHash
                ? client
                    .query({
                      query: GET_PROCESS_ACCESSIBLE_PROMPTS,
                      variables: { orgProcessHash: c.orgProcessHash },
                      fetchPolicy: 'cache-first',
                    })
                    .catch(() => null)
                : null,
            ]);

            const accessiblePrompts =
              (processRes?.data?.getProcessWithModels?.accessiblePrompts as
                | Array<{
                    promptHash?: string;
                    parentPromptHash?: string | null;
                  }>
                | undefined) || [];

            const findParentFromAccessible = (
              promptHash: string | undefined
            ): string | undefined => {
              if (!promptHash) return undefined;
              const match = accessiblePrompts.find(
                (p) => p.promptHash === promptHash
              );
              const parent =
                (match?.parentPromptHash as string | null | undefined) ||
                undefined;
              return parent || undefined;
            };

            // Merge parentPromptHash from accessiblePrompts into the prompt
            // object if it wasn't returned by getPromptByHash.
            const enrichParent = (
              prompt: PromptLookup | null | undefined,
              promptHash: string | undefined
            ): PromptLookup | null | undefined => {
              if (!prompt) return prompt;
              if (prompt.parentPromptHash) return prompt;
              const parent = findParentFromAccessible(promptHash);
              return parent ? { ...prompt, parentPromptHash: parent } : prompt;
            };

            const systemPromptEnriched = enrichParent(
              systemPrompt,
              systemPromptHash
            );
            const userPromptEnriched = enrichParent(userPrompt, userPromptHash);
            const eventsPromptEnriched = enrichParent(
              eventsPrompt,
              eventsListPromptHash
            );

            // Broader fallback: fetch ALL accessible prompts for the types
            // the pipeline cares about. This query reliably returns
            // `parentPromptHash` (unlike getProcessWithModels → accessiblePrompts
            // and sometimes getPromptByHash), giving us another shot at
            // finding the correct parent.
            const fetchAccessiblePromptsByTypes = async (
              promptTypes: string[]
            ): Promise<
              Array<{
                promptHash?: string;
                promptName?: string;
                promptType?: string;
                parentPromptHash?: string | null;
              }>
            > => {
              try {
                const res = await client.query({
                  query: GET_ACCESSIBLE_PROMPTS_WITH_PARENT,
                  variables: {
                    promptTypes,
                    itemsPerPage: 1000,
                    page: 1,
                  },
                  fetchPolicy: 'cache-first',
                });
                return (
                  (res.data?.getAccessiblePromptsByTypes as Array<{
                    promptHash?: string;
                    promptName?: string;
                    promptType?: string;
                    parentPromptHash?: string | null;
                  }>) || []
                );
              } catch {
                return [];
              }
            };

            // Last-resort: search every template's version list to find the
            // one owning our promptHash. Mirrors resolveParentForValue() in
            // PromptSelectionField. Accepts an explicit prompt pool so we
            // can try both the process-scoped list and the broader
            // type-scoped list.
            // Matches a prompt's type against a requested simple type. Mirrors
            // `matchingPrompts` in PromptSelectionField so we accept both
            // simple types ("system") and namespaced ones
            // ("event_detection/__system").
            const typeMatches = (pType?: string, requested?: string) => {
              if (!requested) return true;
              if (!pType) return false;
              return (
                pType === requested ||
                pType.startsWith(requested) ||
                pType.endsWith(requested) ||
                pType.includes(`/${requested}`) ||
                pType.includes(`__${requested}`)
              );
            };

            const searchParentForHash = async (
              promptHash: string | undefined,
              pool: Array<{
                promptHash?: string;
                parentPromptHash?: string | null;
                promptType?: string;
              }>,
              promptType?: string
            ): Promise<string> => {
              if (!promptHash || pool.length === 0) return '';
              // Prefer genuine templates (parentPromptHash === null). If the
              // query didn't return parentPromptHash for any prompt, every
              // entry satisfies `?? null === null` — we just try them all.
              const templates = pool.filter(
                (p) =>
                  ((p.parentPromptHash as string | null | undefined) ??
                    null) === null && typeMatches(p.promptType, promptType)
              );
              for (const t of templates) {
                if (!t.promptHash) continue;
                try {
                  const res = await client.query({
                    query: GET_PROMPT_VERSIONS,
                    variables: {
                      parentPromptHash: t.promptHash,
                      page: 1,
                      itemsPerPage: 1000,
                    },
                    fetchPolicy: 'cache-first',
                  });
                  const raw =
                    (res.data?.getPromptVersions as
                      | Array<{
                          promptHash?: string;
                        }>
                      | undefined) || [];
                  if (raw.length === 0) continue;
                  const ordered = [...raw].reverse();
                  const idx = ordered.findIndex(
                    (v) => v.promptHash === promptHash
                  );
                  if (idx !== -1) {
                    return `v${ordered.length - idx}${idx === 0 ? ' (Latest)' : ''}`;
                  }
                } catch {
                  // skip this template
                }
              }
              return '';
            };

            const resolveWithFallback = async (
              promptHash: string | undefined,
              prompt: PromptLookup | null | undefined,
              savedParentHash: string | undefined,
              defaultPromptType: string,
              debugKey: string
            ): Promise<string> => {
              const primary = await resolveVersionLabel(
                promptHash,
                prompt,
                savedParentHash,
                debugKey
              );
              if (primary) return primary;
              const promptType =
                (prompt as { promptType?: string } | null | undefined)
                  ?.promptType || defaultPromptType;
              // Try process-scoped templates first (smaller, faster).
              const searchedProcess = await searchParentForHash(
                promptHash,
                accessiblePrompts,
                promptType
              );
              if (searchedProcess) {
                console.log(
                  `[video-details:${debugKey}] final (process pool)`,
                  {
                    primary,
                    searchedProcess,
                  }
                );
                return searchedProcess;
              }
              // Fall back to the broader accessible-prompts-by-type list.
              const broaderPool = await fetchAccessiblePromptsByTypes([
                promptType,
              ]);

              // Direct hit: our prompt might be in the broader pool with
              // `parentPromptHash` populated. If so, try resolving with that
              // parent directly — much faster than brute-force search.
              const selfEntry = broaderPool.find(
                (p) => p.promptHash === promptHash
              );
              const broaderParent =
                (selfEntry?.parentPromptHash as string | null | undefined) ||
                undefined;
              if (broaderParent) {
                const viaBroader = await resolveVersionLabel(
                  promptHash,
                  { parentPromptHash: broaderParent, promptType },
                  broaderParent,
                  `${debugKey}:broader-parent`
                );
                if (viaBroader) {
                  console.log(
                    `[video-details:${debugKey}] final (broader-parent)`,
                    { broaderParent, viaBroader }
                  );
                  return viaBroader;
                }
              }

              let searchedBroad = await searchParentForHash(
                promptHash,
                broaderPool,
                promptType
              );

              // Last-ditch: drop the type filter entirely and try every
              // template in BOTH pools. Some older prompts have promptType
              // values ('custom', legacy namespaces) that our fuzzy matcher
              // doesn't recognise.
              if (!searchedBroad) {
                const allPools = [...accessiblePrompts, ...broaderPool];
                console.log(
                  `[video-details:${debugKey}] trying ALL templates (no type filter)`,
                  {
                    totalCandidates: allPools.length,
                  }
                );
                searchedBroad = await searchParentForHash(
                  promptHash,
                  allPools,
                  undefined
                );
              }
              console.log(`[video-details:${debugKey}] final`, {
                primary,
                searchedProcess,
                broaderPoolSize: broaderPool.length,
                searchedBroad,
              });
              return searchedBroad;
            };

            console.log('[video-details] fetched state', {
              orgProcessHash: c.orgProcessHash,
              orgProcessName: c.orgProcessName,
              processConfigKeys: Object.keys(processConfig),
              systemPromptHash,
              userPromptHash,
              eventsListPromptHash,
              accessiblePromptsCount: accessiblePrompts.length,
              accessiblePromptsSample: accessiblePrompts
                .slice(0, 5)
                .map((p) => ({
                  promptHash: p.promptHash,
                  promptType: (p as { promptType?: string }).promptType,
                  parentPromptHash: p.parentPromptHash,
                })),
              systemPromptParent: systemPromptEnriched?.parentPromptHash,
              userPromptParent: userPromptEnriched?.parentPromptHash,
              eventsPromptParent: eventsPromptEnriched?.parentPromptHash,
            });

            const [systemVersion, userVersion, eventsVersion] =
              await Promise.all([
                resolveWithFallback(
                  systemPromptHash,
                  systemPromptEnriched,
                  processConfig.parent_system_hash as string | undefined,
                  'system',
                  'system'
                ),
                resolveWithFallback(
                  userPromptHash,
                  userPromptEnriched,
                  processConfig.parent_user_hash as string | undefined,
                  'user',
                  'user'
                ),
                resolveWithFallback(
                  eventsListPromptHash,
                  eventsPromptEnriched,
                  processConfig.parent_events_list_hash as string | undefined,
                  'events_list',
                  'events'
                ),
              ]);

            console.log('[video-details] resolved versions', {
              systemVersion,
              userVersion,
              eventsVersion,
            });

            const modelName = modelRes?.data?.getOrgModelByHash?.modelName as
              | string
              | undefined;

            const systemContent = getPromptContent(systemPrompt);
            const userContent = getPromptContent(userPrompt);
            const eventsContent = getPromptContent(eventsPrompt);

            const order = [
              'model_hash',
              'system_prompt_hash',
              'user_prompt_hash',
              'events_list_prompt_hash',
              'parameters',
              'version',
              'video_frames',
              'chunk_duration',
              'fps_processing_rate',
            ];
            // Keys that describe prompt selection bookkeeping (hashes / parent
            // hashes) or data already surfaced elsewhere — we skip these to
            // avoid noisy rows in the read-only view.
            const SKIP_KEYS = new Set<string>([
              'system_prompt_hash',
              'user_prompt_hash',
              'events_list_prompt_hash',
              'parent_system_hash',
              'parent_user_hash',
              'parent_events_list_hash',
            ]);
            const seen = new Set<string>();
            for (const key of order) {
              if (!(key in processConfig)) continue;
              const value = processConfig[key];
              if (value == null) continue;
              seen.add(key);
              const label = HASH_LABELS[key] || key.replace(/_/g, ' ');
              if (key === 'model_hash') {
                // Note: we intentionally skip `processConfig.version` here. It
                // is a generic config-schema version that looks like a stale
                // "Version 1" next to the model name; users care about the
                // prompt versions (shown as badges on each prompt row below).
                if (processConfig['version'] != null) seen.add('version');
                displayRows.push({
                  label,
                  value: modelName ?? (value as string),
                });
              } else if (key === 'system_prompt_hash') {
                if (systemContent)
                  displayRows.push({
                    label,
                    value: systemContent,
                    type: 'prompt',
                    version: systemVersion,
                    promptName: systemPromptEnriched?.promptName as
                      | string
                      | undefined,
                  });
              } else if (key === 'user_prompt_hash') {
                if (userContent)
                  displayRows.push({
                    label,
                    value: userContent,
                    type: 'prompt',
                    version: userVersion,
                    promptName: userPromptEnriched?.promptName as
                      | string
                      | undefined,
                  });
              } else if (key === 'events_list_prompt_hash') {
                if (eventsContent)
                  displayRows.push({
                    label,
                    value: eventsContent,
                    type: 'prompt',
                    version: eventsVersion,
                    promptName: eventsPromptEnriched?.promptName as
                      | string
                      | undefined,
                  });
              } else if (
                key === 'parameters' &&
                typeof value === 'object' &&
                value !== null
              ) {
                const params = value as Record<string, unknown>;
                for (const [paramKey, paramVal] of Object.entries(params)) {
                  // `parameters.version` duplicates the model version shown
                  // on the Model row, so omit it here to keep the layout clean.
                  if (paramKey === 'version') continue;
                  const paramLabel =
                    PARAM_LABELS[paramKey] ?? paramKey.replace(/_/g, ' ');
                  displayRows.push({
                    label: paramLabel,
                    value: String(paramVal),
                    type: 'param',
                  });
                }
              } else if (
                key === 'video_frames' &&
                typeof value === 'object' &&
                value !== null
              ) {
                const v = value as Record<string, unknown>;
                const w = v.width ?? '—';
                const h = v.height ?? '—';
                displayRows.push({ label, value: `${w} × ${h}` });
              } else {
                const displayValue =
                  typeof value === 'object'
                    ? JSON.stringify(value, null, 2)
                    : String(value);
                displayRows.push({ label, value: displayValue });
              }
            }
            for (const [key, value] of Object.entries(processConfig)) {
              if (seen.has(key) || value == null) continue;
              if (SKIP_KEYS.has(key)) continue;
              const label = HASH_LABELS[key] || key.replace(/_/g, ' ');
              const displayValue =
                typeof value === 'object'
                  ? JSON.stringify(value, null, 2)
                  : String(value);
              displayRows.push({ label, value: displayValue });
            }
          }

          const updated = {
            ...c,
            processConfig,
            displayRows,
          };

          setViewDetailsConfigs((prev) => {
            const idx = prev.findIndex(
              (p) => p.batchProcessConfigHash === c.batchProcessConfigHash
            );
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = updated;
            return next;
          });
        } catch {
          setViewDetailsConfigs((prev) => {
            const idx = prev.findIndex(
              (p) => p.batchProcessConfigHash === c.batchProcessConfigHash
            );
            if (idx === -1) return prev;
            const next = [...prev];
            next[idx] = { ...c, processConfig: undefined, displayRows: [] };
            return next;
          });
        }
      })();
    });
  }, [client, configsData]);

  useEffect(() => {
    if (!isViewDetailsOpen) return;
    if (configsListLoading || viewDetailsLoading) return;

    const configs = configsData?.getBatchProcessConfigs;

    if (!configs || configs.length === 0) {
      // No configs returned from API – show empty state (no spinner)
      if (viewDetailsConfigs.length !== 0) {
        setViewDetailsConfigs([]);
      }
      return;
    }

    // Only fetch and build display data once per open, or when configs truly change.
    if (viewDetailsConfigs.length === 0) {
      fetchViewDetailsConfigs();
    }
  }, [
    isViewDetailsOpen,
    configsListLoading,
    viewDetailsLoading,
    configsData,
    viewDetailsConfigs.length,
    fetchViewDetailsConfigs,
  ]);

  useEffect(() => {
    if (!isViewDetailsOpen) {
      setViewDetailsConfigs([]);
      setViewDetailsLoading(false);
    }
  }, [isViewDetailsOpen]);

  useEffect(() => {
    if (!isInitialized) {
      dispatch(
        fetchBatchEventsNew({
          itemsPerPage: 100,
          page: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          filters: {},
        })
      );
    }
  }, [dispatch, isInitialized]);

  useEffect(() => {
    const checkZoom = () => {
      const zoom = Math.round((window.outerWidth / window.innerWidth) * 100);
      setIsHighZoom(zoom >= 90);
    };

    checkZoom();
    window.addEventListener('resize', checkZoom);
    return () => window.removeEventListener('resize', checkZoom);
  }, []);

  const videoBatchHash = video?.batchHash;
  useEffect(() => {
    if (!videoBatchHash) return;

    dispatch(
      fetchNotifications({
        itemsPerPage: 100,
        page: 1,
        type: 'batch',
      })
    );
  }, [dispatch, videoBatchHash]);

  const notificationsForVideo = useAppSelector(
    selectNotificationsForVideo(video.batchHash)
  );
  const status = video.local_status || video.batchStatus || 'pending';
  const isProcessingComplete =
    (typeof video.progress === 'number' && video.progress >= 100) ||
    ['completed', 'success', 'done'].includes(status);
  const videoNotifications = isProcessingComplete ? notificationsForVideo : [];

  useEffect(() => {
    if (!isNotificationPopoverOpen) return;
    const closePopover = () => setIsNotificationPopoverOpen(false);
    const scrollEl = document.querySelector('[data-playground-scroll]');
    document.addEventListener('wheel', closePopover, { passive: true });
    document.addEventListener('touchmove', closePopover, { passive: true });
    scrollEl?.addEventListener('scroll', closePopover);
    return () => {
      document.removeEventListener('wheel', closePopover);
      document.removeEventListener('touchmove', closePopover);
      scrollEl?.removeEventListener('scroll', closePopover);
    };
  }, [isNotificationPopoverOpen]);

  const notificationCount = videoNotifications.length;

  const formatUtcTimestamp = (value: string) => {
    return formatTimeInTimezone(value, getUserTimezone(), 'datetime');
  };

  if (!video) {
    console.error('VideoCard: Received undefined video prop');
    return null;
  }

  const progress = video.progress || 0;
  const thumbnail = video.thumbnailPresignedUrl || '';
  const duration = video.duration || 0;
  const tagsValue = video.batchTags;
  const tags = Array.isArray(tagsValue) ? tagsValue : [];
  const tagColors = [
    'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-950/20 dark:text-violet-300',
    'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-950/20 dark:text-pink-300',
    'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-300',
    'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-300',
    'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/20 dark:text-amber-300',
    'border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950/20 dark:text-cyan-300',
  ];

  // Validate thumbnail URL - check for common invalid patterns
  const isValidThumbnail = (() => {
    if (!thumbnail || thumbnail.trim() === '') return false;
    if (thumbnail.includes('placehold.co')) return false;
    if (thumbnail === 'about:blank') return false;

    // Check if it's a valid URL format
    try {
      const url = new URL(thumbnail);
      // Check if it's an S3 presigned URL (common pattern)
      if (
        url.hostname.includes('s3') ||
        url.hostname.includes('amazonaws.com')
      ) {
        // Check if URL has required presigned URL parameters
        const hasSignature =
          url.searchParams.has('Signature') ||
          url.searchParams.has('X-Amz-Signature');
        const hasExpires =
          url.searchParams.has('Expires') || url.searchParams.has('X-Amz-Date');
        // If it looks like a presigned URL but missing params, it's likely invalid
        if (url.search && !hasSignature && !hasExpires) {
          return false;
        }
      }
      return true;
    } catch {
      // Not a valid URL format
      return false;
    }
  })();

  const FALLBACK_THUMBNAIL = './batch-thumbnail.jpg';
  const effectiveThumbnail = isValidThumbnail ? thumbnail : FALLBACK_THUMBNAIL;

  // Parse created_at as UTC (server sends UTC; ensure we don't interpret as local)
  let createdAt: Date;
  try {
    if (video.created_at) {
      const dateStr = video.created_at.replace(' ', 'T').trim();
      createdAt =
        dateStr.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(dateStr)
          ? new Date(dateStr)
          : new Date(dateStr + 'Z');
    } else {
      createdAt = new Date();
    }
  } catch (error) {
    console.error('VideoCard: Invalid date format', error);
    createdAt = new Date();
  }

  const formatUploadTime = (createdAt: Date): string => {
    return formatTimeInTimezone(createdAt, getUserTimezone(), 'time');
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteBatch({ variables: { batchHash: video.batchHash } });
      toast.success('Video deleted successfully', {
        position: 'bottom-center',
        duration: 3000,
      });
      setIsDeleteDialogOpen(false);
      // Call the parent's callback to refresh the video list
      if (onDeleteSuccess) {
        onDeleteSuccess(video.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete video', {
        position: 'bottom-center',
        className: 'bg-red-500 text-white',
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedUploadTime = formatUploadTime(createdAt);

  const handleThumbnailError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = e.target as HTMLImageElement;
    // Silently fallback to default thumbnail - don't log 404 errors
    // The browser will log the 404, but we handle it gracefully
    if (
      img.src !== FALLBACK_THUMBNAIL &&
      !img.src.includes('batch-thumbnail.jpg')
    ) {
      img.src = FALLBACK_THUMBNAIL;
    }
  };

  const handleThumbnailLoad = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const img = e.target as HTMLImageElement;
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      img.src = FALLBACK_THUMBNAIL;
    }
  };

  return (
    <div className="cursor-pointer relative overflow-hidden group p-1 bg-gray-50/80 dark:bg-[#212126] rounded-xl h-full flex flex-col">
      {/* Card Content */}
      <div className="sm:p-6 sm:pr-3 sm:pl-3 pt-2 border bg-gray-100 dark:bg-[#27272D] rounded-xl flex-1 flex flex-col min-h-0">
        {/* Primary color accent line at the very top */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 h-1 bg-primary w-36 rounded-b-xl" />

        {/* Video name and status badge - inline at top */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight truncate cursor-pointer flex-1 min-w-0">
                  {video.batchName || 'Untitled'}
                </h3>
              </TooltipTrigger>
              <TooltipContent>
                <p>{video.batchName || 'Untitled'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Badge
            variant={
              status === 'completed'
                ? 'outline'
                : status === 'failed'
                  ? 'destructive'
                  : status === 'processing'
                    ? 'secondary'
                    : status === 'queued'
                      ? 'secondary'
                      : 'outline'
            }
            className={`flex items-center font-medium text-xs shrink-0 ${
              status === 'completed'
                ? 'border-green-400 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-950/20 dark:text-green-400'
                : status === 'pending'
                  ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/20 dark:text-amber-400'
                  : status === 'queued'
                    ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-400'
                    : ''
            }`}
          >
            {status === 'completed' ? (
              <CircleCheck className="w-3 h-3 mr-1" />
            ) : status === 'failed' ? (
              <CircleX className="w-3 h-3 mr-1" />
            ) : status === 'processing' ? (
              <CircleGauge className="w-3 h-3 mr-1 animate-spin" />
            ) : status === 'queued' ? (
              <CircleGauge className="w-3 h-3 mr-1" />
            ) : (
              <AlertTriangle className="w-3 h-3 mr-1" />
            )}
            {status === 'completed'
              ? 'Processed'
              : status === 'failed'
                ? 'Failed'
                : status === 'processing'
                  ? 'Processing'
                  : status === 'queued'
                    ? 'Queued'
                    : 'Pending'}
          </Badge>
        </div>

        {tagsValue === null ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge
              variant="outline"
              className="flex items-center font-medium text-xs shrink-0 border-slate-400 dark:border-slate-500"
            >
              null
            </Badge>
          </div>
        ) : (
          tags.length > 0 && (
            <TooltipProvider>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                {tags.slice(0, 2).map((tag, index) => {
                  const shouldTruncate = tag.length > 18;
                  const displayTag = shouldTruncate
                    ? `${tag.slice(0, 15)}...`
                    : tag;
                  const badge = (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`flex items-center font-medium text-xs shrink-0 ${tagColors[index % tagColors.length]}`}
                    >
                      {displayTag}
                    </Badge>
                  );

                  return shouldTruncate ? (
                    <Tooltip key={`tag-${index}`}>
                      <TooltipTrigger asChild>{badge}</TooltipTrigger>
                      <TooltipContent side="top">
                        <p className="text-xs">{tag}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    badge
                  );
                })}

                {tags.length > 2 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold px-2"
                      >
                        +{tags.length - 2}More
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="space-y-1">
                        {tags.slice(2).map((tag, idx) => (
                          <p key={`tag-more-${idx}`} className="text-xs">
                            • {tag}
                          </p>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          )
        )}

        {/* Inline video preview (thumbnail replaced by hover‑to‑play video) */}
        <div className="relative overflow-hidden aspect-video rounded-md mb-2 bg-black">
          {video.videoPresignedUrl ? (
            <video
              className="w-full h-full object-cover"
              src={video.videoPresignedUrl}
              muted
              playsInline
              preload="metadata"
              // Autoplay on hover, pause on mouse leave
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                // Restart from beginning for consistent preview
                el.currentTime = 0;
                const playPromise = el.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                  playPromise.catch(() => {
                    // Ignore autoplay errors (browser restrictions)
                  });
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.pause();
              }}
              // Prevent click on the video from hijacking card click; let parent handle navigation
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          ) : (
            <img
              src={effectiveThumbnail}
              alt={video.batchName || 'Untitled'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={handleThumbnailError}
              onLoad={handleThumbnailLoad}
            />
          )}

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge
              variant="secondary"
              className="font-mono text-xs px-1.5 py-0.5 bg-background/90 backdrop-blur-sm border-none"
            >
              {formatDuration(duration)}
            </Badge>
          </div>
        </div>

        {/* Uploaded at - below thumbnail */}
        <div className="mb-3 mt-2 flex items-center justify-between">
          <p className="text-[10px] sm:text-xs text-muted-foreground flex flex-wrap gap-x-1 gap-y-0.5">
            <span>
              Uploaded at:{' '}
              <span className="font-bold text-foreground">
                {formattedUploadTime}
              </span>
            </span>
          </p>
          <div className="flex items-center gap-1">
            {/* Alert Triangle with Notifications */}
            <Popover
              open={isNotificationPopoverOpen}
              onOpenChange={setIsNotificationPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  {notificationCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 min-w-4 flex items-center justify-center p-0 px-1 text-[10px] rounded-full"
                    >
                      {notificationCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 max-h-96 p-0"
                align="start"
                side="top"
                sideOffset={5}
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div className="p-3 border-b border-border">
                  <h4 className="font-semibold text-sm">
                    Alerts for this video
                  </h4>
                </div>
                <div className="max-h-80 overflow-y-auto overscroll-contain">
                  {isNotificationsLoading ? (
                    <div className="p-4 flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2">
                      <CircleGauge className="w-5 h-5 animate-spin text-muted-foreground/70" />
                      <span>Loading alerts...</span>
                    </div>
                  ) : !isNotificationsLoading &&
                    videoNotifications.length === 0 ? (
                    <div className="p-4 flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2">
                      <AlertTriangle className="w-5 h-5 text-muted-foreground/70" />
                      <span>No alerts for this video yet.</span>
                    </div>
                  ) : (
                    videoNotifications.map((n) => {
                      const alertId = n.event_id ?? `${n.timestamp}-${n.alert}`;
                      const isExpanded = expandedAlertId === alertId;
                      return (
                        <div
                          key={alertId}
                          className="p-3 border-b border-border/60 last:border-b-0 bg-card/80 hover:bg-card transition-colors"
                        >
                          <div className="flex gap-3">
                            {/* Video thumbnail / clip preview */}
                            <div className="relative w-24 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {n.details?.presigned_url ? (
                                <video
                                  className="w-full h-full object-cover"
                                  src={n.details.presigned_url}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  onMouseEnter={(e) => {
                                    const el = e.currentTarget;
                                    el.currentTime = 0;
                                    const playPromise = el.play();
                                    if (
                                      playPromise &&
                                      typeof playPromise.catch === 'function'
                                    ) {
                                      playPromise.catch(() => {});
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                  No clip
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                              {/* <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] text-white/80">
                                <PlayCircle className="w-3 h-3" />
                                <span>Alert</span>
                              </div> */}
                              {n.details?.presigned_url && (
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white p-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveAlertVideo({
                                      url: n.details!.presigned_url!,
                                      title: n.alert,
                                    });
                                    setIsAlertVideoOpen(true);
                                  }}
                                  aria-label="Open alert video"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>

                            {/* Text content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger
                                      asChild
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <p className="text-xs font-medium text-foreground line-clamp-2 cursor-pointer">
                                        {n.alert}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{n.alert}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {formatUtcTimestamp(n.timestamp)}
                                </span>
                              </div>

                              {n.details?.description && (
                                <div className="space-y-0.5">
                                  <p
                                    className={
                                      'text-[11px] text-muted-foreground ' +
                                      (isExpanded ? '' : 'line-clamp-3')
                                    }
                                  >
                                    {n.details.description}
                                  </p>
                                  {n.details.description.length > 120 && (
                                    <button
                                      type="button"
                                      className="text-[11px] font-medium text-primary hover:underline"
                                      onClick={() =>
                                        setExpandedAlertId(
                                          isExpanded ? null : alertId
                                        )
                                      }
                                    >
                                      {isExpanded ? 'See less' : 'See more'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Alert Video Modal */}
            <Dialog open={isAlertVideoOpen} onOpenChange={setIsAlertVideoOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{activeAlertVideo?.title}</DialogTitle>
                </DialogHeader>
                {activeAlertVideo?.url && (
                  <video
                    className="w-full bg-black rounded-lg"
                    src={activeAlertVideo.url}
                    controls
                    autoPlay
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* More Vertical Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsDownloading(true);
                    try {
                      let url =
                        video.videoPresignedUrl || video.batchCloudStreamPath;
                      if (!url) {
                        toast.error('Video is not available for download yet.');
                        return;
                      }
                      const expiry = video.videoPresignedUrlExpiry;
                      const isExpired =
                        expiry &&
                        new Date(expiry).getTime() - Date.now() < 60_000;
                      if (isExpired && video.batchHash) {
                        const result = await dispatch(
                          fetchPresignedUrlForBatch(video.batchHash)
                        ).unwrap();
                        if (result?.videoPresignedUrl) {
                          url = result.videoPresignedUrl;
                        }
                      }

                      try {
                        const res = await fetch(url, { mode: 'cors' });
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);
                        const blob = await res.blob();
                        const objectUrl = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = objectUrl;
                        a.download = `${(video.batchName || 'video').replace(/[^a-zA-Z0-9-_]/g, '_')}.mp4`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(objectUrl);
                        toast.success('Download started.');
                      } catch {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(video.batchName || 'video').replace(/[^a-zA-Z0-9-_]/g, '_')}.mp4`;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        toast.success(
                          'Opening video. Use the browser menu to save if it plays instead of downloading.'
                        );
                      }
                    } catch (err) {
                      console.error('[Download] failed:', err);
                      toast.error(
                        'Could not download. The video URL may have expired — please refresh the page and try again.'
                      );
                    } finally {
                      setIsDownloading(false);
                    }
                  }}
                  disabled={
                    isDownloading ||
                    (!video.videoPresignedUrl && !video.batchCloudStreamPath)
                  }
                >
                  {isDownloading ? (
                    <CircleGauge className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullscreenViewOpen(true);
                  }}
                  disabled={
                    !video.videoPresignedUrl && !video.batchCloudStreamPath
                  }
                >
                  <Maximize2 className="mr-2 h-4 w-4" />
                  View full screen
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsViewDetailsOpen(true);
                  }}
                >
                  <Info className="mr-2 h-4 w-4" />
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-destructive focus:text-destructive "
                >
                  <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen video view dialog */}
            <Dialog
              open={isFullscreenViewOpen}
              onOpenChange={setIsFullscreenViewOpen}
            >
              <DialogContent
                className="max-w-[95vw] w-full h-[95vh] p-2 bg-black border-border"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>{video.batchName || 'Video'}</DialogTitle>
                </DialogHeader>
                {video.videoPresignedUrl || video.batchCloudStreamPath ? (
                  <video
                    className="w-full h-full object-contain rounded-lg"
                    src={video.videoPresignedUrl || video.batchCloudStreamPath}
                    controls
                    autoPlay
                    playsInline
                  />
                ) : null}
              </DialogContent>
            </Dialog>

            {/* View details dialog – read-only, latest data */}
            <Dialog
              open={isViewDetailsOpen}
              onOpenChange={setIsViewDetailsOpen}
            >
              <DialogContent
                className="max-w-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Video details
                  </DialogTitle>
                  <DialogDescription>
                    Read-only view. Data is fetched when opened so it reflects
                    the latest state.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-6 py-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Name</span>
                      <p className="font-medium">{video.batchName || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Status</span>
                      <p className="font-medium capitalize">
                        {video.batchStatus || video.local_status || '—'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Duration</span>
                      <p className="font-medium">
                        {formatDuration(video.duration ?? 0)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Created</span>
                      <p className="font-medium">
                        {formatCreatedAt(
                          video.createdAt || video.created_at || ''
                        )}
                      </p>
                    </div>
                  </div>

                  {tagsValue === null ? (
                    <div className="space-y-2">
                      <span className="text-muted-foreground text-sm">
                        Tags
                      </span>
                      <Badge
                        variant="outline"
                        className="flex items-center font-medium text-xs shrink-0"
                      >
                        null
                      </Badge>
                    </div>
                  ) : (
                    tags.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-muted-foreground text-sm">
                          Tags
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="flex items-center font-medium text-xs shrink-0 border-green-400 bg-green-50 text-green-700 dark:border-green-500 dark:bg-green-950/20 dark:text-green-400"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Pipelines
                    </h4>
                    {configsListLoading || viewDetailsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <CircleGauge className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : viewDetailsConfigs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No pipeline configs.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {[...viewDetailsConfigs]
                          .sort((a, b) => {
                            const order = (name: string) => {
                              const n = formatProcessName(name).toLowerCase();
                              if (n.includes('event')) return 0;
                              if (n.includes('transcript')) return 1;
                              if (n.includes('video')) return 2;
                              return 3;
                            };
                            return (
                              order(a.orgProcessName) - order(b.orgProcessName)
                            );
                          })
                          .map((config) => (
                            <div
                              key={config.batchProcessConfigHash}
                              className="rounded-xl border bg-card shadow-sm overflow-hidden"
                            >
                              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b">
                                <span className="font-semibold text-sm">
                                  {formatProcessName(config.orgProcessName)}
                                </span>
                                <Badge
                                  variant={
                                    config.isEnabled !== false
                                      ? 'default'
                                      : 'secondary'
                                  }
                                  className="text-[10px] h-5"
                                >
                                  {config.isEnabled !== false
                                    ? 'Enabled'
                                    : 'Disabled'}
                                </Badge>
                              </div>
                              {config.displayRows.length > 0 && (
                                <div className="p-4 space-y-4">
                                  {config.displayRows.map((row, idx) => {
                                    if (row.type === 'prompt') {
                                      const isEventsListPrompt = row.label
                                        .toLowerCase()
                                        .includes('events list');

                                      const promptHeader = (
                                        <div className="flex items-center justify-between gap-3 w-full">
                                          <span className="text-xs font-semibold text-foreground">
                                            {row.label}
                                          </span>
                                          <div className="flex items-center gap-2 flex-wrap justify-end">
                                            {row.promptName ? (
                                              <Badge
                                                variant="secondary"
                                                className="text-[10px] font-medium px-2 py-0.5 h-5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                                              >
                                                {row.promptName}
                                              </Badge>
                                            ) : null}
                                            {row.version ? (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px] font-semibold px-2 py-0.5 h-5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                              >
                                                {row.version}
                                              </Badge>
                                            ) : null}
                                          </div>
                                        </div>
                                      );

                                      if (isEventsListPrompt) {
                                        const items = String(row.value || '')
                                          .replace(/\r\n/g, '\n')
                                          .split(/,|\n/)
                                          .map((s) => s.trim())
                                          .filter(Boolean);

                                        return (
                                          <div key={idx} className="space-y-2">
                                            {promptHeader}
                                            {items.length ? (
                                              <div className="flex flex-wrap gap-1.5">
                                                {items.map((item, i) => (
                                                  <span
                                                    key={i}
                                                    className="px-2 py-1 rounded-md border border-border bg-muted/40 text-xs text-foreground"
                                                  >
                                                    {item}
                                                  </span>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="text-xs text-muted-foreground">
                                                —
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }
                                      return (
                                        <div key={idx} className="space-y-2">
                                          {promptHeader}
                                          <div className="rounded-md border bg-muted/30 p-3 text-xs text-foreground whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed">
                                            {row.value || '—'}
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-baseline gap-6 text-sm"
                                      >
                                        <div className="flex items-baseline gap-2 flex-1 min-w-0">
                                          <span className="text-muted-foreground shrink-0 min-w-[7rem]">
                                            {row.label}
                                          </span>
                                          <span className="font-medium break-all">
                                            {row.value}
                                          </span>
                                        </div>
                                        {row.subValue && (
                                          <div className="flex items-baseline gap-2 shrink-0">
                                            <span className="text-muted-foreground">
                                              {row.subLabel}
                                            </span>
                                            <span className="font-medium">
                                              {row.subValue}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Notification badge - temporarily hidden per playground design */}
        {/*
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex flex-row items-center gap-1.5 px-2 py-1.5 rounded bg-muted/30 border border-border mb-4 mt-1 cursor-pointer hover:bg-muted/60 transition-colors"
            >
              <AlertTriangle className="size-3 sm:size-3.5 text-yellow-400 flex-shrink-0" />
              <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight">
                {hasAnyNotifications
                  ? unreadVideoNotifications.length > 0
                    ? `${unreadVideoNotifications.length} unread notification(s)`
                    : `${allVideoNotifications.length} notification(s)`
                  : 'No notifications available'}
              </span>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 max-h-64 overflow-y-auto p-2">
            {hasAnyNotifications ? (
              <div className="space-y-1.5">
                {allVideoNotifications.map((n) => (
                  <div
                    key={n.event_id}
                    className="p-2 rounded border space-y-1"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[11px] font-medium leading-tight">
                        {n.alert}
                      </p>
                      {n.event_id &&
                        !viewedNotifications.includes(n.event_id) && (
                          <Badge
                            variant="default"
                            className="text-[9px] px-1 py-0 h-4"
                          >
                            New
                          </Badge>
                        )}
                    </div>
                    {n.details && (
                      <div className="text-[10px] text-muted-foreground space-y-0.5">
                        {n.details.cam_name && <div>{n.details.cam_name}</div>}
                        {n.details.description && (
                          <div>{n.details.description}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">
                No notifications
              </p>
            )}
          </PopoverContent>
        </Popover>
        */}

        {/* Spacer to push actions to bottom */}
        <div className="flex-1 min-h-0" />

        {/* Action Area */}
        <div className="flex items-center gap-2 shrink-4">
          {status === 'processing' ? (
            <div className="flex-1 space-y-2">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="h-full bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.max(5, Math.min(progress, 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Processing...{' '}
                {progress > 0 ? `${Math.round(progress)}%` : 'Initializing...'}
              </p>
            </div>
          ) : status === 'completed' ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDrawer(video, 'reanalyze');
                    }}
                    className="flex-1 h-8 text-xs min-w-0 whitespace-nowrap"
                  >
                    {!isHighZoom && <RefreshCw />} Re-analyse
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">
                    Configure processing pipelines and reprocess this video
                  </p>
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  const search = video.batchHash
                    ? `?batchHash=${encodeURIComponent(video.batchHash)}`
                    : '';
                  navigate(`/playground/chat/${video.id}${search}`);
                }}
                className="flex-1 h-8 text-xs min-w-0"
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Chat
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onProcessBatch(video);
              }}
              className="flex-1 h-8 text-xs min-w-0"
            >
              <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Process
            </Button>
          )}
        </div>
      </div>

      {/* bottom timestamp removed to avoid redundancy; upload time shown inline above */}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {video.batchName || 'this video'}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoCard;
