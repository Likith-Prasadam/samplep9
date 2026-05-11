import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { fetchLatestPromptVersion } from '@/store/slices/workflow-slice';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type {
  PromptTemplate,
  PromptVersion,
  PromptCategory,
} from '@/types/workflow-types';

interface PromptSelectorProps {
  promptType: PromptCategory;
  prompts: PromptTemplate[];
  selectedPrompt?: PromptVersion;
  onSelectPrompt: (prompt: PromptVersion) => void;
  loading: boolean;
}

export function PromptSelector({
  promptType,
  prompts,
  selectedPrompt,
  onSelectPrompt,
  loading,
}: PromptSelectorProps) {
  const dispatch = useAppDispatch();
  const [loadingVersion, setLoadingVersion] = useState(false);

  const handleSelectPrompt = async (template: PromptTemplate) => {
    if (!template.latest_version) return;

    setLoadingVersion(true);
    try {
      const version = await dispatch(
        fetchLatestPromptVersion(template.ref_prompt_key)
      ).unwrap();
      onSelectPrompt(version);
    } catch (error) {
      console.error('Failed to load prompt version:', error);
    } finally {
      setLoadingVersion(false);
    }
  };

  const activePrompts = prompts.filter((p) => p.is_active);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select {promptType.replace('_', ' ')} Prompt</CardTitle>
        <CardDescription>
          Choose a prompt template for this workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading prompts...
          </div>
        ) : activePrompts.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No prompts available for this category
          </div>
        ) : (
          <RadioGroup
            value={selectedPrompt?.prompt_hash}
            onValueChange={(hash) => {
              const template = activePrompts.find(
                (p) => p.latest_version?.prompt_hash === hash
              );
              if (template) handleSelectPrompt(template);
            }}
          >
            {activePrompts.map((template) => (
              <div
                key={template.ref_prompt_key}
                className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent"
              >
                <RadioGroupItem
                  value={template.latest_version?.prompt_hash || ''}
                  id={template.ref_prompt_key}
                  disabled={!template.latest_version || loadingVersion}
                />
                <Label
                  htmlFor={template.ref_prompt_key}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{template.prompt_name}</div>
                  <div className="text-sm text-muted-foreground">
                    Version {template.latest_version?.version_number || 'N/A'}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  );
}
