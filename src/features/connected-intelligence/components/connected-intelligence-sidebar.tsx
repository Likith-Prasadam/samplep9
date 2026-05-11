import { useState } from 'react';
import {
  Building2,
  Clock,
  Camera,
  Hash,
  Map,
  MapPinned,
  ScanSearch,
  Tags,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type {
  ConnectedIntelligenceFilterOptions,
  ConnectedIntelligenceFilters,
} from '../types';

interface ConnectedIntelligenceSidebarProps {
  filters: ConnectedIntelligenceFilters;
  filterOptions: ConnectedIntelligenceFilterOptions;
  activeCameraCount: number;
  cameraNamesInScope: string[];
  onToggleMultiFilter: (
    key:
      | 'cameraTypes'
      | 'resolutions'
      | 'cameraTags'
      | 'zones'
      | 'cities'
      | 'zipcodes',
    value: string
  ) => void;
  onSetSingleFilter: (
    key:
      | 'city'
      | 'subzone'
      | 'cameraNames'
      | 'cameraHashes'
      | 'ipAddress'
      | 'analysisTimeframe',
    value: string
  ) => void;
}

const renderCheckboxList = (
  options: ConnectedIntelligenceFilterOptions[keyof ConnectedIntelligenceFilterOptions],
  selectedValues: string[],
  onToggle: (value: string) => void
) => {
  if (options.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">No options available.</p>
    );
  }

  return (
    <div className="grid gap-2">
      {options.map((option) => {
        const checked = selectedValues.includes(option.value);

        return (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(option.value)}
            />
            <span className="text-sm text-foreground">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

const TIMEFRAME_PRESETS = [
  { label: 'Last 1 hour', value: '60' },
  { label: 'Last 3 hours', value: '180' },
  { label: 'Last 6 hours', value: '360' },
  { label: 'Last 12 hours', value: '720' },
  { label: 'Last 24 hours', value: '1440' },
] as const;

const SectionHeader = ({
  icon: Icon,
  label,
}: {
  icon: typeof Camera;
  label: string;
}) => (
  <span className="flex items-center gap-2">
    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-3.5 w-3.5" />
    </span>
    <span>{label}</span>
  </span>
);

export function ConnectedIntelligenceSidebar({
  filters,
  filterOptions,
  activeCameraCount,
  cameraNamesInScope,
  onToggleMultiFilter,
  onSetSingleFilter,
}: ConnectedIntelligenceSidebarProps) {
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  const totalSelectedFilters =
    filters.zones.length +
    filters.cities.length +
    filters.zipcodes.length +
    filters.cameraTypes.length +
    filters.resolutions.length +
    filters.cameraTags.length +
    (filters.city ? 1 : 0);

  const selectedTimeframe =
    filters.analysisTimeframe && filters.analysisTimeframe.trim().length > 0
      ? filters.analysisTimeframe.trim()
      : '60';
  const selectedTimeframeIsPreset = TIMEFRAME_PRESETS.some(
    (option) => option.value === selectedTimeframe
  );
  const timeframeSelectValue = selectedTimeframeIsPreset
    ? selectedTimeframe
    : '60';

  const onTimeframeSelect = (value: string) => {
    setIsCustomDuration(false);
    setCustomDuration('');
    onSetSingleFilter('analysisTimeframe', value);
  };

  const onApplyCustomDuration = () => {
    const hours = Number.parseFloat(customDuration);
    if (Number.isNaN(hours) || hours <= 0) {
      return;
    }

    const minutes = String(Math.round(hours * 60));
    setIsCustomDuration(true);
    onSetSingleFilter('analysisTimeframe', minutes);
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-background px-3 py-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Filters
          </div>
          <Badge variant="outline" className="rounded-full text-[11px]">
            {totalSelectedFilters} selected
          </Badge>
        </div>

        <Accordion
          type="single"
          collapsible
          className="mt-1.5 w-full"
        ></Accordion>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-2">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="analysis-timeframe">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={Clock} label="Analysis timeframe" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                <div className="grid gap-2">
                  <Select
                    value={timeframeSelectValue}
                    onValueChange={onTimeframeSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAME_PRESETS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="border-t pt-2">
                    <p className="mb-2 text-xs font-medium text-foreground">
                      Enter Duration
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        placeholder="Enter hours"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={onApplyCustomDuration}
                        className="h-8 px-3 text-xs"
                      >
                        Apply
                      </Button>
                    </div>
                    {isCustomDuration ? (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        Custom duration applied.
                      </p>
                    ) : null}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="zones">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={Map} label="Zones" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                {renderCheckboxList(
                  filterOptions.zones,
                  filters.zones,
                  (value) => onToggleMultiFilter('zones', value)
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="cities">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={Building2} label="Cities" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                {renderCheckboxList(
                  filterOptions.cities,
                  filters.cities,
                  (value) => onToggleMultiFilter('cities', value)
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="camera-types">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={Camera} label="Camera types" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                {renderCheckboxList(
                  filterOptions.cameraTypes,
                  filters.cameraTypes,
                  (value) => onToggleMultiFilter('cameraTypes', value)
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="resolutions">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={ScanSearch} label="Resolution" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                {renderCheckboxList(
                  filterOptions.resolutions,
                  filters.resolutions,
                  (value) => onToggleMultiFilter('resolutions', value)
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="zipcodes">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={Hash} label="Zipcodes" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                {renderCheckboxList(
                  filterOptions.zipcodes,
                  filters.zipcodes,
                  (value) => onToggleMultiFilter('zipcodes', value)
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="camera-tags">
              <AccordionTrigger className="px-2 py-3 text-sm">
                <SectionHeader icon={Tags} label="Camera tags" />
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-3">
                {renderCheckboxList(
                  filterOptions.cameraTags,
                  filters.cameraTags,
                  (value) => onToggleMultiFilter('cameraTags', value)
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-border/70 bg-muted/20 px-3 py-2.5">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cameras-in-scope" className="border-b-0">
            <AccordionTrigger className="px-0 py-2 text-sm hover:no-underline">
              <SectionHeader icon={MapPinned} label="Cameras in scope" />
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <div className="mb-2 text-xs text-muted-foreground">
                {activeCameraCount} active cameras
              </div>
              {cameraNamesInScope.length > 0 ? (
                <div className="grid gap-1.5">
                  {cameraNamesInScope.map((cameraName) => (
                    <div
                      key={cameraName}
                      className="rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-foreground transition-colors hover:bg-muted/60"
                    >
                      {cameraName}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No cameras in scope.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
