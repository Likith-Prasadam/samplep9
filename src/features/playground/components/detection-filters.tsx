import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface DetectionFiltersProps {
  /** All available detection classes */
  classes: string[];
  /** Currently selected/visible classes */
  selectedClasses: string[];
  /** Confidence threshold [0-1] */
  confidenceThreshold: number;
  /** Show track IDs on labels */
  showTrackIds?: boolean;
  /** Callback when class selection changes */
  onChangeClasses: (classes: string[]) => void;
  /** Callback when confidence threshold changes */
  onChangeConfidence: (value: number) => void;
  /** Callback when track ID display toggle changes */
  onChangeShowTrackIds?: (show: boolean) => void;
}

export function DetectionFilters({
  classes,
  selectedClasses,
  confidenceThreshold,
  showTrackIds = false,
  onChangeClasses,
  onChangeConfidence,
  onChangeShowTrackIds,
}: DetectionFiltersProps) {
  const toggleClass = (className: string) => {
    const isSelected = selectedClasses.includes(className);
    const next = isSelected
      ? selectedClasses.filter((c) => c !== className)
      : [...selectedClasses, className];
    onChangeClasses(next);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor="detection-confidence-slider"
            className="text-sm font-semibold text-foreground"
          >
            Confidence Threshold
          </Label>
          <span
            className="tabular-nums text-sm font-semibold text-primary"
            aria-live="polite"
          >
            {Math.round(confidenceThreshold * 100)}%
          </span>
        </div>
        <div className="[&_[data-slot=slider-range]]:bg-foreground/20 [&_[data-slot=slider-thumb]]:border-border [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-thumb]]:shadow-md dark:[&_[data-slot=slider-range]]:bg-foreground/30">
          <Slider
            id="detection-confidence-slider"
            value={[confidenceThreshold * 100]}
            onValueChange={([value]) => onChangeConfidence(value / 100)}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      {onChangeShowTrackIds && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Label
              htmlFor="show-track-ids"
              className="cursor-pointer text-sm font-semibold text-foreground"
            >
              Show Object IDs
            </Label>
            <Switch
              id="show-track-ids"
              checked={showTrackIds}
              onCheckedChange={onChangeShowTrackIds}
              className="border-2 border-border/60 data-[state=checked]:border-emerald-500/70 data-[state=checked]:bg-emerald-500/25 data-[state=unchecked]:border-rose-400/70 data-[state=unchecked]:bg-rose-500/20 dark:data-[state=checked]:border-emerald-400/70 dark:data-[state=checked]:bg-emerald-400/30 dark:data-[state=unchecked]:border-rose-400/70 dark:data-[state=unchecked]:bg-rose-400/30"
            />
          </div>
          <p className="mt-1 text-xs text-primary/80 dark:text-primary/70">
            Adds a unique ID to each box so you can track the same object across
            frames.
          </p>
        </div>
      )}

      {classes.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-end justify-between gap-1.5">
            <Label className="text-sm font-medium text-foreground">
              Detection Classes
            </Label>
          </div>
          <p className="text-xs text-primary/80 dark:text-primary/70">
            Click a class badge to show or hide its bounding boxes in the video.
          </p>
          <div className="max-h-[3.25rem] overflow-y-auto overflow-x-hidden pr-1 [scrollbar-width:thin]">
            <div className="flex flex-wrap gap-1.5 pb-2">
              {classes.map((className) => {
                const isSelected = selectedClasses.includes(className);
                const label = className.replace(/_/g, ' ');
                return (
                  <button
                    key={className}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Hide' : 'Show'} ${label} detections`}
                    onClick={() => toggleClass(className)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-left text-[11px] font-medium capitalize transition-colors',
                      isSelected
                        ? 'border-primary/40 bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                        : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
