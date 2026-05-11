// src/components/cameras/CameraHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { ChevronDown } from 'lucide-react';

const TOOLTIP_ADD_CAMERA =
  'Add a new camera. Configure processing pipelines for live analysis.';

interface CameraHeaderProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onAddCamera: () => void;
  searchMaxLength: number;
}

export const CameraHeader: React.FC<CameraHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onStatusFilterChange,
  statusFilter,
  onAddCamera,
  searchMaxLength,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Search is debounced, no additional action needed
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={searchTerm}
            onChange={onSearchChange}
            onKeyDown={handleKeyDown}
            placeholder="Search cameras by name..."
            maxLength={searchMaxLength}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Filter Status: {statusFilter}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-gray-800 border-gray-600 text-white">
            <DropdownMenuItem
              onClick={() => onStatusFilterChange('all')}
              className={statusFilter === 'all' ? 'bg-gray-700' : ''}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusFilterChange('active')}
              className={statusFilter === 'active' ? 'bg-gray-700' : ''}
            >
              Active
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onStatusFilterChange('inactive')}
              className={statusFilter === 'inactive' ? 'bg-gray-700' : ''}
            >
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onAddCamera}>Add Camera</Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">{TOOLTIP_ADD_CAMERA}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
