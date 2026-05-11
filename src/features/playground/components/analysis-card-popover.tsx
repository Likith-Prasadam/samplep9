import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import LiveDynamicInsightsDashboard from './batch-dynamic-insights-dashboard';

interface AnalysisCardPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceHash?: string;
}

export function AnalysisCardPopover({ open, onOpenChange, sourceHash }: AnalysisCardPopoverProps) {
  const sheetSurfaceClass =
    'border-border/70 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.08),_transparent)]';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={`flex h-full max-h-svh w-full flex-col gap-0 overflow-hidden p-0 shadow-2xl sm:max-w-none md:w-[min(50vw,720px)] md:min-w-[40vw] md:max-w-[50vw] ${sheetSurfaceClass}`}
      >
        <SheetTitle className="sr-only">Analysis Dashboard</SheetTitle>
        <SheetDescription className="sr-only">
          Dynamic insights analysis dashboard
        </SheetDescription>

        <div className="min-h-0 flex-1 overflow-hidden">
          <LiveDynamicInsightsDashboard sourceHash={sourceHash} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
