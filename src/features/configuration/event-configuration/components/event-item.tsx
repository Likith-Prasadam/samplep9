import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EventItemProps } from '../types/types';
import { sanitizeInput } from '../types/validation';

const EventItem: React.FC<EventItemProps> = ({
  item,
  index,
  isEditing,
  loading,
  onEdit,
  onStartEdit,
  onDelete,
  onCancelEdit,
}) => {
  const [localValue, setLocalValue] = useState(item.event_name);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) {
      setLocalValue(item.event_name);
    }
  }, [isEditing, item.event_name]);

  const handleSave = () => {
    onEdit(index, localValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(sanitizeInput(e.target.value));
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg">
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-background text-foreground border border-border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Edit event"
          autoFocus
        />
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={!localValue.trim() || loading}
            size="sm"
          >
            Save
          </Button>
          <Button
            onClick={onCancelEdit}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent transition-colors">
      <span className="flex-1 text-card-foreground break-words pr-4">
        {item.event_name}
      </span>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onStartEdit(index)}
          disabled={loading}
          size="sm"
          variant="outline"
        >
          <Edit className="w-4 h-4 mr-1" />
          Update
        </Button>
        <Button
          onClick={() => onDelete(index)}
          disabled={loading}
          size="sm"
          variant="destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
};

export default React.memo(EventItem);
