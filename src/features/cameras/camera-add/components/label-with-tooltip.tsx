import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LabelWithTooltipProps {
  htmlFor: string;
  className?: string;
  wrapperClassName?: string;
  tooltipText: string;
  required?: boolean;
  children: React.ReactNode;
}

export function LabelWithTooltip({
  htmlFor,
  className,
  wrapperClassName = '',
  tooltipText,
  required,
  children,
}: LabelWithTooltipProps) {
  return (
    <div className={`flex items-center gap-1.5 ${wrapperClassName}`}>
      <Label
        htmlFor={htmlFor}
        className={`text-sm font-medium text-muted-foreground ${className ?? ''}`}
      >
        {children} {required && <span className="text-red-600">*</span>}
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/60 bg-transparent text-[10px] leading-none text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground transition-colors"
            >
              i
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
