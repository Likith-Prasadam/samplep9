import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter } from 'lucide-react';

interface StatusFilterDropdownProps {
  value: 'all' | 'pending' | 'processing' | 'completed' | 'failed';
  onChange: (
    value: 'all' | 'pending' | 'processing' | 'completed' | 'failed'
  ) => void;
}

const StatusFilterDropdown: React.FC<StatusFilterDropdownProps> = ({
  value,
  onChange,
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Videos', color: 'text-gray-400' },
    { value: 'pending', label: 'Pending', color: 'text-yellow-400' },
    { value: 'processing', label: 'Processing', color: 'text-blue-400' },
    { value: 'completed', label: 'Completed', color: 'text-green-400' },
    { value: 'failed', label: 'Failed', color: 'text-red-400' },
  ];

  const selectedOption = statusOptions.find((opt) => opt.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] bg-gray-800/50 border-gray-600/50 text-white hover:border-teal-500/50 transition-all duration-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <SelectValue>
            <span className={selectedOption?.color}>
              {selectedOption?.label}
            </span>
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent className="bg-gray-800 border-gray-700">
        {statusOptions.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-white hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
          >
            <span className={option.color}>{option.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StatusFilterDropdown;
