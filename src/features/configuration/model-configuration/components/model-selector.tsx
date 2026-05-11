import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ModelSelectorProps } from '../types/types';
import { MODEL_OPTIONS } from '../types/constants';

const ModelSelector: React.FC<ModelSelectorProps> = React.memo(
  ({ model, setModel }) => (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Select the model here
        </h3>
      </div>
      <div className="relative">
        <div className="flex items-center w-full md:w-60 h-9 bg-background text-muted-foreground border border-border rounded-lg p-2 focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-all duration-200">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="flex-grow bg-background text-foreground focus:outline-none appearance-none cursor-pointer"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
        </div>
      </div>
    </div>
  )
);

ModelSelector.displayName = 'ModelSelector';

export default ModelSelector;
