// import React from 'react';
// import { Check } from 'lucide-react';
// import { cn } from '@/lib/utils';

// interface StepProgressBarProps {
//   steps: Array<{
//     id: string;
//     title: string;
//     description: string;
//   }>;
//   currentStep: number;
//   onStepClick: (stepIndex: number) => void;
// }

// const StepProgressBar: React.FC<StepProgressBarProps> = ({
//   steps,
//   currentStep,
//   onStepClick,
// }) => {
//   return (
//     <div className="rounded-2xl border border-border bg-card/80 px-4 py-5 shadow-sm space-y-3">
//       <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
//         Setup flow
//       </p>

//       <div className="mt-2 space-y-6">
//         {steps.map((step, index) => {
//           const isCompleted = index < currentStep;
//           const isCurrent = index === currentStep;
//           const isClickable = index <= currentStep;

//           return (
//             <div key={step.id} className="flex items-start gap-3">
//               {/* Step indicator + connector */}
//               <div className="flex flex-col items-center">
//                 <button
//                   type="button"
//                   onClick={() => isClickable && onStepClick(index)}
//                   className={cn(
//                     'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
//                     isCompleted
//                       ? 'border-primary bg-primary text-primary-foreground'
//                       : isCurrent
//                         ? 'border-primary bg-primary/10 text-primary shadow-sm'
//                         : 'border-border bg-background text-muted-foreground',
//                     isClickable && 'hover:border-primary hover:text-primary'
//                   )}
//                   aria-current={isCurrent ? 'step' : undefined}
//                 >
//                   {isCompleted ? (
//                     <Check className="h-4 w-4" />
//                   ) : (
//                     <span>{index + 1}</span>
//                   )}
//                 </button>
//                 {index < steps.length - 1 && (
//                   <div className="mt-1 h-10 w-px bg-border/60" />
//                 )}
//               </div>

//               {/* Step copy */}
//               <button
//                 type="button"
//                 onClick={() => isClickable && onStepClick(index)}
//                 className={cn(
//                   'flex-1 text-left rounded-md px-2 py-1.5 transition-colors',
//                   isCurrent
//                     ? 'bg-muted'
//                     : isCompleted
//                       ? 'hover:bg-muted/70'
//                       : 'hover:bg-muted/60'
//                 )}
//               >
//                 <div
//                   className={cn(
//                     'text-sm font-medium',
//                     isCurrent || isCompleted
//                       ? 'text-foreground'
//                       : 'text-muted-foreground'
//                   )}
//                 >
//                   {step.title}
//                 </div>
//                 <p className="mt-0.5 text-xs text-muted-foreground">
//                   {step.description}
//                 </p>
//               </button>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default StepProgressBar;

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FormStep } from './form-steps';

interface StepProgressBarProps {
  steps: FormStep[];

  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="rounded-2xl border border-border bg-card/80 px-4 py-5 shadow-sm space-y-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        Setup flow
      </p>

      <div className="mt-2 space-y-6">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep;

          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Step indicator + connector */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => isClickable && onStepClick(index)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    isCompleted
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border bg-background text-muted-foreground',
                    isClickable && 'hover:border-primary hover:text-primary'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div className="mt-1 h-10 w-px bg-border/60" />
                )}
              </div>

              {/* Step copy */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  'flex-1 text-left rounded-md px-2 py-1.5 transition-colors',
                  isCurrent
                    ? 'bg-muted'
                    : isCompleted
                      ? 'hover:bg-muted/70'
                      : 'hover:bg-muted/60'
                )}
              >
                <div
                  className={cn(
                    'text-sm font-medium',
                    isCurrent || isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgressBar;
