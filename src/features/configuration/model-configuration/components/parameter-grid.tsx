import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import ParameterSlider from './parameter-slider';
import { SLIDERS } from '../types/constants';
import type { ModelParams, ParamKey } from '../types/types';

interface ParameterGridProps {
  params: ModelParams;
  updateParam: (key: ParamKey, value: number) => void;
  loading: boolean;
}

const ParameterGrid: React.FC<ParameterGridProps> = React.memo(
  ({ params, updateParam, loading }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {loading
        ? Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="p-3 bg-card border border-border rounded-xl animate-pulse"
              >
                <Skeleton className="h-8 rounded mb-3" />
                <Skeleton className="h-7 rounded mb-3" />
                <Skeleton className="h-4 rounded" />
              </div>
            ))
        : SLIDERS.map(({ label, key, min, max }) => (
            <ParameterSlider
              key={key}
              label={label}
              paramKey={key}
              min={min}
              max={max}
              value={params[key]}
              setValue={(v) => updateParam(key, v)}
            />
          ))}
    </div>
  )
);

ParameterGrid.displayName = 'ParameterGrid';

export default ParameterGrid;
