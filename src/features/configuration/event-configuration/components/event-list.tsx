import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import EventItem from './event-item';
import type { EventListProps } from '../types/types';

const SCROLLBAR_STYLES = `
  .event-list-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .event-list-scrollbar::-webkit-scrollbar-track {
    background: hsl(var(--muted));
    border-radius: 4px;
  }
  
  .event-list-scrollbar::-webkit-scrollbar-thumb {
    background: hsl(var(--primary));
    border-radius: 4px;
  }
  
  .event-list-scrollbar::-webkit-scrollbar-thumb:hover {
    background: hsl(var(--primary) / 0.8);
  }
  
  .event-list-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: hsl(var(--primary)) hsl(var(--muted));
  }
`;

const EventList: React.FC<EventListProps> = ({
  events,
  editingIndex,
  loading,
  onEdit,
  onStartEdit,
  onDelete,
}) => {
  if (loading && events.length === 0) {
    return (
      <div className="space-y-2">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p className="text-lg font-medium">No events available</p>
        <p className="text-sm mt-1">Create your first event to get started</p>
      </div>
    );
  }

  return (
    <>
      <style>{SCROLLBAR_STYLES}</style>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 event-list-scrollbar">
        {events.map((event, index) => (
          <EventItem
            key={event.id || `event-${index}`}
            item={event}
            index={index}
            isEditing={editingIndex === index}
            loading={loading}
            onEdit={onEdit}
            onStartEdit={onStartEdit}
            onDelete={onDelete}
            onCancelEdit={() => onStartEdit(null)}
          />
        ))}
      </div>
    </>
  );
};

export default React.memo(EventList);
