import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventCreatorProps } from '../types/types';

const EventCreator: React.FC<EventCreatorProps> = ({
  value,
  loading,
  onChange,
  onAdd,
  disabled,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-lg font-semibold text-foreground block mb-2">
          Create New Event
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          Enter event names (one per line). Maximum 1000 characters each.
        </p>
      </div>
      <textarea
        value={value}
        onChange={onChange}
        className="w-full min-h-[100px] resize-none bg-background text-foreground border border-border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="Enter any event..."
        disabled={loading}
      />
      <div className="flex justify-end">
        <Button
          onClick={onAdd}
          disabled={disabled || loading}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          {loading ? 'Adding...' : 'Add Event(s)'}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(EventCreator);
