import React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import type { UseFormReturn } from 'react-hook-form';
import type { FormValues } from './../types/model-config';
import { Info } from 'lucide-react';

interface ModelConfigSectionProps {
  form: UseFormReturn<FormValues>;
}

const ModelConfigSection: React.FC<ModelConfigSectionProps> = ({ form }) => (
  <div className="space-y-4">
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="model"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className="text-foreground">Select Model</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-full bg-background text-foreground border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-300">
                  <SelectValue
                    placeholder="Select a model"
                    className="text-muted-foreground"
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent
                position="popper"
                sideOffset={5}
                align="start"
                className="w-full bg-background text-foreground border-border max-h-[300px] overflow-y-auto"
              >
                <SelectItem value="pg-9-dllm-model-v1.0">
                  pg-9-dllm-model-v1.0
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage className="text-destructive text-sm mt-1 block min-h-[1.5rem]">
              {form.formState.errors.model?.message}
              {!form.formState.errors.model?.message && <>&nbsp;</>}
            </FormMessage>
          </FormItem>
        )}
      />

      <div>
        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                Temperature
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 inline ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                      Controls randomness in the model's output. <br /> Lower
                      values make output more deterministic, higher values more
                      random. <br /> Default value: 0.7
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div
                className="flex items-center gap-4"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <FormControl className="flex-1">
                  <Slider
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={[field.value || 0]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="text-teal-500"
                  />
                </FormControl>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={() => {
                      const value = form.getValues('temperature');
                      const parsed = parseFloat(String(value));
                      if (!isNaN(parsed)) {
                        form.setValue('temperature', parsed, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border"
                    step={0.01}
                    min={0.0}
                    max={1.0}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-destructive text-sm block">
                {form.formState.errors.temperature?.message}
                {!form.formState.errors.temperature?.message && <>&nbsp;</>}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="repetitionPenalty"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                Repetition Penalty
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 inline ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                      Reduces repeated sequences in the output. <br /> Higher
                      values penalize repetition more strongly. <br /> Default
                      value: 1.1
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div
                className="flex items-center gap-4"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <FormControl className="flex-1">
                  <Slider
                    min={1.0}
                    max={1.5}
                    step={0.01}
                    value={[field.value || 0]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="text-teal-500"
                  />
                </FormControl>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={() => {
                      const value = form.getValues('repetitionPenalty');
                      const parsed = parseFloat(String(value));
                      if (!isNaN(parsed)) {
                        form.setValue('repetitionPenalty', parsed, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border"
                    step={0.01}
                    min={1.0}
                    max={1.5}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-destructive text-sm block ">
                {form.formState.errors.repetitionPenalty?.message}
                {!form.formState.errors.repetitionPenalty?.message && (
                  <>&nbsp;</>
                )}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topP"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                Top P
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 inline ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                      Top-p sampling considers only the most probable tokens{' '}
                      <br /> whose cumulative probability adds up to top_p.{' '}
                      <br /> Default value: 0.9
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div
                className="flex items-center gap-4"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <FormControl className="flex-1">
                  <Slider
                    min={0.8}
                    max={1.0}
                    step={0.001}
                    value={[field.value || 0]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="text-teal-500"
                  />
                </FormControl>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={() => {
                      const value = form.getValues('topP');
                      const parsed = parseFloat(String(value));
                      if (!isNaN(parsed)) {
                        form.setValue('topP', parsed, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border"
                    step={0.001}
                    min={0.8}
                    max={1.0}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-destructive text-sm block ">
                {form.formState.errors.topP?.message}
                {!form.formState.errors.topP?.message && <>&nbsp;</>}
              </FormMessage>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxTokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">
                Max Tokens
                <TooltipProvider>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 inline ml-1 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-popover text-popover-foreground text-sm p-3 rounded shadow-lg border border-border max-w-xs min-w-[200px] leading-relaxed">
                      The maximum number of tokens the model <br /> can generate
                      in one response. <br /> Default value: 4096
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <div
                className="flex items-center gap-4"
                style={{ touchAction: 'none' }}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <FormControl className="flex-1">
                  <Slider
                    min={500}
                    max={25000}
                    step={1}
                    value={[field.value || 0]}
                    onValueChange={(value) => field.onChange(value[0])}
                    className="text-teal-500"
                  />
                </FormControl>
                <FormControl>
                  <Input
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={() => {
                      const value = form.getValues('maxTokens');
                      const parsed = parseInt(String(value), 10);
                      if (!isNaN(parsed)) {
                        form.setValue('maxTokens', parsed, {
                          shouldValidate: true,
                        });
                      }
                    }}
                    className="w-24 min-w-24 px-2 text-center bg-background text-foreground border-border"
                    step={1}
                    min={500}
                    max={25000}
                  />
                </FormControl>
              </div>
              <FormMessage className="text-destructive text-sm block ">
                {form.formState.errors.maxTokens?.message}
                {!form.formState.errors.maxTokens?.message && <>&nbsp;</>}
              </FormMessage>
            </FormItem>
          )}
        />
      </div>
    </div>
  </div>
);

export default ModelConfigSection;
