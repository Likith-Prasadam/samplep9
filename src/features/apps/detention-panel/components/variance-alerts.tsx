import React, { useState } from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface VarianceAlert {
  time: string;
  zone: string;
  delta: number;
  id: string;
}

interface VarianceAlertsPanelProps {
  activeAlerts: VarianceAlert[];
}

const VarianceAlertsPanel: React.FC<VarianceAlertsPanelProps> = ({
  activeAlerts,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveAlerts = activeAlerts.length > 0;

  const getSeverityVariant = (delta: number) => {
    const absDelta = Math.abs(delta);
    if (absDelta >= 5) return 'destructive';
    if (absDelta >= 3) return 'warning';
    return 'default';
  };

  const getSeverityIcon = (delta: number) => {
    return Math.abs(delta) >= 5 ? (
      <AlertTriangle className="h-4 w-4 text-destructive" />
    ) : (
      <TrendingUp className="h-4 w-4 text-primary" />
    );
  };

  return (
    <>
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-15deg); }
          20%, 40%, 60%, 80% { transform: rotate(15deg); }
        }
        .bell-animate { animation: bellRing 1s ease-in-out; transform-origin: top center; }
      `}</style>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative bg-transparent border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Bell
              className={cn('h-5 w-5', hasActiveAlerts && 'bell-animate')}
            />
            {hasActiveAlerts && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full animate-pulse" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[420px] max-h-[65vh] bg-blur-lg backdrop-blur-lg border-border p-0 mt-2 shadow-lg"
          align="end"
          sideOffset={5}
        >
          <div className="p-4 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Variance Alerts
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="max-h-[calc(65vh-120px)] overflow-y-auto p-4 space-y-3 scrollbar-thin">
            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => {
                const severity = getSeverityVariant(alert.delta);

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-all cursor-default',
                      severity === 'destructive' &&
                        'border-destructive/30 bg-destructive/5',
                      severity === 'warning' &&
                        'border-orange-500/30 bg-orange-500/5'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getSeverityIcon(alert.delta)}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-foreground">
                          {alert.zone}
                        </p>
                        <Badge
                          variant={
                            severity === 'destructive'
                              ? 'destructive'
                              : severity === 'warning'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {alert.delta > 0 ? '+' : ''}
                          {alert.delta}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        {alert.time}
                      </div>
                    </div>

                    <Button size="sm" variant="outline">
                      Trace <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold text-green-600 dark:text-green-400">
                  All Systems Normal
                </h3>
                <p className="text-muted-foreground text-sm mt-2">
                  No active variance alerts detected
                </p>

                <div className="grid grid-cols-3 gap-4 mt-8 max-w-xs mx-auto">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      100%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Compliance
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Alerts
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      12
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Zones
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default VarianceAlertsPanel;
