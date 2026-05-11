import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ParameterSliderProps } from '../types/types';
import { PARAM_DEFINITIONS, getProgressColor } from '../types/constants';
import { Info } from 'lucide-react';

const ParameterSlider: React.FC<ParameterSliderProps> = React.memo(
  ({ label, paramKey, min, max, value, setValue }) => {
    const percent = ((value - min) / (max - min)) * 100;
    const barColor = getProgressColor(value, paramKey);
    const isInteger = paramKey === 'max_tokens';

    return (
      <div className="p-3 bg-card rounded-xl shadow-lg hover:shadow-xl border border-border">
        <div className="flex items-center justify-between mb-3">
          <label className="text-lg font-medium text-card-foreground flex items-center gap-1">
            {label}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger onClick={(e) => e.stopPropagation()}>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="text-sm p-2 rounded shadow-lg whitespace-pre-line max-w-xs">
                  {PARAM_DEFINITIONS[paramKey]}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </label>
          <div className="bg-muted rounded-lg px-3 py-1">
            <input
              type="number"
              value={value}
              min={min}
              max={max}
              step={isInteger ? '1' : '0.01'}
              onChange={(e) => {
                const newValue = isInteger
                  ? parseInt(e.target.value || '0')
                  : parseFloat(e.target.value || min.toString());
                setValue(Math.max(min, Math.min(max, newValue)));
              }}
              className="w-16 text-center bg-transparent text-foreground text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="mb-3">
          <div className="relative h-7 flex items-center">
            <div
              className="absolute left-0 right-0 bg-muted"
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                height: '4px',
                borderRadius: '2px',
                zIndex: 0,
              }}
            />
            <div
              className={`absolute left-0 ${barColor}`}
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
                height: '4px',
                width: `${percent}%`,
                borderRadius: '2px',
                zIndex: 1,
              }}
            />
            <input
              type="range"
              value={value}
              min={min}
              max={max}
              step={isInteger ? 1 : 0.01}
              onChange={(e) => {
                const newValue = isInteger
                  ? parseInt(e.target.value)
                  : parseFloat(e.target.value);
                setValue(newValue);
              }}
              className="w-full h-4 appearance-none slider bg-transparent"
              style={{
                position: 'relative',
                zIndex: 2,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      </div>
    );
  }
);

ParameterSlider.displayName = 'ParameterSlider';

export default ParameterSlider;
