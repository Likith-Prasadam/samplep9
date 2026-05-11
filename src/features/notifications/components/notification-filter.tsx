import React from 'react';
import { Play, Video } from 'lucide-react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FilterItemProps {
  type: 'batch' | 'live';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

export const FilterItem: React.FC<FilterItemProps> = React.memo(
  ({ icon: Icon, label, isSelected, onClick }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-center px-3 py-1.5 rounded-md transition-all duration-200 border',
            isSelected
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          )}
          onClick={onClick}
          aria-label={label}
        >
          <Icon className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
);

FilterItem.displayName = 'FilterItem';

interface NotificationFiltersProps {
  selectedFilter: 'live' | 'batch';
  onFilterChange: (type: 'live' | 'batch') => void;
}

export const NotificationFilters: React.FC<NotificationFiltersProps> =
  React.memo(({ selectedFilter, onFilterChange }) => (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 h-10">
      <FilterItem
        type="batch"
        icon={Play}
        label="Playground"
        isSelected={selectedFilter === 'batch'}
        onClick={() => onFilterChange('batch')}
      />
      <FilterItem
        type="live"
        icon={Video}
        label="Live Cams"
        isSelected={selectedFilter === 'live'}
        onClick={() => onFilterChange('live')}
      />
    </div>
  ));

NotificationFilters.displayName = 'NotificationFilters';
