import React from 'react';
import { Bell } from 'lucide-react';

interface EmptyStateProps {
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({ message }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
      <Bell className="w-16 h-16 mb-4" />
      <h3 className="text-xl font-semibold">No Alerts</h3>
      <p className="max-w-xs mt-1">{message}</p>
    </div>
  )
);

EmptyState.displayName = 'EmptyState';
