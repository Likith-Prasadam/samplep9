import React, { useState } from 'react';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChatSession {
  id: string;
  title: string;
  date: Date;
}

const ChatHistoryPanel: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([
    // Sample data - in real implementation this would come from storage/API
    {
      id: '1',
      title: 'Camera 1 Setup Discussion',
      date: new Date('2026-01-31T10:30:00'),
    },
    {
      id: '2',
      title: 'Configuration Settings',
      date: new Date('2026-01-31T09:15:00'),
    },
    {
      id: '3',
      title: 'System Status Check',
      date: new Date('2026-01-30T15:45:00'),
    },
  ]);

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all chat history?')) {
      setSessions([]);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else {
      return formatTimeInTimezone(date, getUserTimezone(), 'date');
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Chat History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {sessions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              <p>No chat history yet</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground">
                    {session.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(session.date)}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="ml-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete this session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Delete All Button */}
        {sessions.length > 0 && (
          <Button
            onClick={handleDeleteAll}
            variant="destructive"
            size="sm"
            className="w-full"
          >
            Delete All History
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatHistoryPanel;
