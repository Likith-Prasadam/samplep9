import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  createCamProcessConfig,
  fetchProcessCatalog,
  fetchProcessWithModels,
} from '@/store/slices/workflow-slice';
import type {
  CamProcessConfigInput,
  PromptCategory,
  PromptHashes,
} from '@/types/workflow-types';
import { Header } from '@/components/layouts/header';
import { Main } from '@/components/layouts/main';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Button } from '@/components/ui/button';
import ChatInterface from '@/features/live-stream/components/live-chat';
import {
  AguiCanvasPrototype,
  type AguiNode,
  type AguiNodeId,
} from './components/agui-canvas-prototype';
import { AguiInspectorPrototype } from './components/agui-inspector-prototype';

const shortId = (value: string) => (value ? `${value.slice(0, 10)}...` : '');

const promptHashField = (category: PromptCategory) => {
  switch (category) {
    case 'system':
      return 'system_prompt_hash' as const;
    case 'user':
      return 'user_prompt_hash' as const;
    case 'events_list':
      return 'events_list_prompt_hash' as const;
  }
};

const getPromptHash = (
  promptHashes: PromptHashes,
  category: PromptCategory
) => {
  return promptHashes[promptHashField(category)];
};

const ensureNumberString = (value: string) => {
  // Keep as string for the input component; validate in compile step.
  return value.replace(/[^\d.]/g, '');
};

export default function AguiWebchatPrototypePage() {
  const dispatch = useAppDispatch();
  const processes = useAppSelector((state) => state.workflow.processes);
  const selectedProcess = useAppSelector(
    (state) => state.workflow.selectedProcess
  );

  const [camHash, setCamHash] = useState('');
  const [processHash, setProcessHash] = useState('');
  const [modelHash, setModelHash] = useState('');
  const [promptHashes, setPromptHashes] = useState<PromptHashes>({});
  const [durationMinutes, setDurationMinutes] = useState('60');

  const [selectedNodeId, setSelectedNodeId] = useState<AguiNodeId | null>(
    'process'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [chatCamHash, setChatCamHash] = useState('');
  const [chatModelHash, setChatModelHash] = useState('');
  const [chatDurationMinutes, setChatDurationMinutes] = useState('60');

  const [nodePositions, setNodePositions] = useState<
    Record<AguiNodeId, { x: number; y: number }>
  >(() => ({
    camera: { x: 24, y: 60 },
    process: { x: 24, y: 170 },
    model: { x: 24, y: 280 },
    prompts: { x: 24, y: 390 },
    duration: { x: 24, y: 500 },
  }));

  useEffect(() => {
    if (processes.length > 0) return;
    dispatch(fetchProcessCatalog()).catch(() => {
      toast.error('Failed to load process catalog');
    });
  }, [dispatch, processes.length]);

  useEffect(() => {
    if (!processHash.trim()) return;
    void dispatch(fetchProcessWithModels(processHash.trim()));
  }, [dispatch, processHash]);

  // Auto-select defaults when the process changes
  useEffect(() => {
    if (!selectedProcess) return;

    const compatibleModels = selectedProcess.accessible_models.filter((m) =>
      selectedProcess.required_model_types.includes(m.model_type)
    );

    setModelHash((prev) => {
      if (prev && compatibleModels.some((m) => m.model_hash === prev))
        return prev;
      return compatibleModels[0]?.model_hash || '';
    });

    const nextPromptHashes: PromptHashes = { ...promptHashes };
    for (const category of selectedProcess.required_prompt_types) {
      const current = getPromptHash(nextPromptHashes, category);
      const options = selectedProcess.accessible_prompts
        .filter((p) => p.is_active && p.prompt_category === category)
        .map((p) => p.latest_version?.prompt_hash)
        .filter((v): v is string => Boolean(v));

      if (!current || !options.includes(current)) {
        nextPromptHashes[promptHashField(category)] = options[0];
      }
    }

    setPromptHashes(nextPromptHashes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProcess]);

  const promptsReady = useMemo(() => {
    if (!selectedProcess) return false;
    return selectedProcess.required_prompt_types.every((category) => {
      const hash = getPromptHash(promptHashes, category);
      return Boolean(hash);
    });
  }, [promptHashes, selectedProcess]);

  const graphReady = useMemo(() => {
    if (!camHash.trim()) return false;
    if (!processHash.trim()) return false;
    if (!modelHash.trim()) return false;
    if (!promptsReady) return false;

    const minutes = parseFloat(durationMinutes);
    return Number.isFinite(minutes) && minutes > 0;
  }, [camHash, processHash, modelHash, promptsReady, durationMinutes]);

  const compileGraphToCamProcessConfigInput =
    (): CamProcessConfigInput | null => {
      if (!camHash.trim() || !processHash.trim() || !modelHash.trim())
        return null;
      if (!selectedProcess) return null;

      const minutes = parseFloat(durationMinutes);
      if (!Number.isFinite(minutes) || minutes <= 0) return null;

      const prompt_hashes: PromptHashes = {};
      for (const category of selectedProcess.required_prompt_types) {
        const hash = getPromptHash(promptHashes, category);
        if (!hash) return null;
        prompt_hashes[promptHashField(category)] = hash;
      }

      return {
        cam_hash: camHash.trim(),
        process_hash: processHash.trim(),
        model_hash: modelHash.trim(),
        prompt_hashes,
        is_enabled: true,
      };
    };

  const computedNodes = useMemo(() => {
    const minutes = parseFloat(durationMinutes);
    const durationReady = Number.isFinite(minutes) && minutes > 0;
    const isCameraReady = Boolean(camHash.trim());
    const isProcessReady = Boolean(processHash.trim());
    const isModelReady = Boolean(modelHash.trim());

    const subtitleForPrompts = selectedProcess
      ? selectedProcess.required_prompt_types
          .map((c) => {
            const ok = Boolean(getPromptHash(promptHashes, c));
            return `${c}:${ok ? 'ok' : 'missing'}`;
          })
          .join(', ')
      : 'Select a process to see required prompts';

    const nodes: AguiNode[] = [
      {
        id: 'camera' as const,
        title: 'Target Camera',
        subtitle: isCameraReady ? shortId(camHash) : 'cam_hash missing',
        x: nodePositions.camera.x,
        y: nodePositions.camera.y,
        status: isCameraReady ? 'ready' : 'missing',
      },
      {
        id: 'process' as const,
        title: 'Process',
        subtitle: isProcessReady
          ? shortId(processHash)
          : 'process_hash missing',
        x: nodePositions.process.x,
        y: nodePositions.process.y,
        status: isProcessReady ? 'ready' : 'missing',
      },
      {
        id: 'model' as const,
        title: 'Model',
        subtitle: isModelReady ? shortId(modelHash) : 'model_hash missing',
        x: nodePositions.model.x,
        y: nodePositions.model.y,
        status: isModelReady ? 'ready' : 'missing',
      },
      {
        id: 'prompts' as const,
        title: 'Prompts',
        subtitle: promptsReady
          ? 'All required prompts selected'
          : subtitleForPrompts,
        x: nodePositions.prompts.x,
        y: nodePositions.prompts.y,
        status: promptsReady ? 'ready' : 'missing',
      },
      {
        id: 'duration' as const,
        title: 'Duration (min)',
        subtitle: durationReady
          ? `${durationMinutes} min`
          : 'duration missing/invalid',
        x: nodePositions.duration.x,
        y: nodePositions.duration.y,
        status: durationReady ? 'ready' : 'missing',
      },
    ];

    return nodes;
  }, [
    camHash,
    durationMinutes,
    modelHash,
    nodePositions,
    promptHashes,
    processHash,
    promptsReady,
    selectedProcess,
  ]);

  const handleSave = async () => {
    const input = compileGraphToCamProcessConfigInput();
    if (!input) {
      toast.error('Complete all required AGUI nodes before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await dispatch(createCamProcessConfig(input)).unwrap();
      toast.success('Workflow config saved. Webchat connected.');
      setChatCamHash(input.cam_hash);
      setChatModelHash(input.model_hash);
      setChatDurationMinutes(durationMinutes);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Failed to save workflow config';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-hidden px-0 pt-0 pb-0">
        <div className="h-full flex gap-4 px-4 py-6">
          {/* Left: AGUI */}
          <div className="w-[42%] min-w-[380px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">AGUI</div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCamHash('');
                    setProcessHash('');
                    setModelHash('');
                    setPromptHashes({});
                    setDurationMinutes('60');
                    setChatCamHash('');
                    setChatModelHash('');
                    setChatDurationMinutes('60');
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto pr-2">
              <AguiCanvasPrototype
                nodes={computedNodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                onChangeNodePosition={(id, x, y) =>
                  setNodePositions((prev) => ({ ...prev, [id]: { x, y } }))
                }
              />

              <AguiInspectorPrototype
                processes={processes}
                selectedProcess={selectedProcess}
                processHash={processHash}
                onProcessHashChange={(hash) => {
                  setProcessHash(hash);
                  // Reset dependent selections; they'll be auto-filled by selectedProcess effect.
                  setModelHash('');
                  setPromptHashes({});
                }}
                camHash={camHash}
                onCamHashChange={setCamHash}
                modelHash={modelHash}
                onModelHashChange={(hash) => setModelHash(hash)}
                promptHashes={promptHashes}
                onPromptHashChange={(category, hash) =>
                  setPromptHashes((prev) => ({
                    ...prev,
                    [promptHashField(category)]: hash,
                  }))
                }
                durationMinutes={durationMinutes}
                onDurationMinutesChange={(v) =>
                  setDurationMinutes(ensureNumberString(v))
                }
                saving={isSaving}
                canSave={graphReady}
                onSave={handleSave}
              />
            </div>
          </div>

          {/* Right: Webchat */}
          <div className="flex-1 min-w-[420px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-semibold">Webchat</div>
              <div className="text-xs text-muted-foreground">
                {chatCamHash ? (
                  <span>Connected to {shortId(chatCamHash)} </span>
                ) : (
                  <span>Save a workflow config to connect</span>
                )}
              </div>
            </div>

            <div className="h-full min-h-0">
              <ChatInterface
                camHash={chatCamHash || undefined}
                defaultModelHash={chatModelHash || undefined}
                defaultDurationMinutes={chatDurationMinutes || undefined}
              />
            </div>
          </div>
        </div>
      </Main>
    </div>
  );
}
