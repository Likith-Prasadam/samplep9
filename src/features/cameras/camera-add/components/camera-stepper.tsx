import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FORM_STEPS } from './form-steps';

interface CameraStepperProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
  isAutoPopulating?: boolean;
}

export const CameraStepper: React.FC<CameraStepperProps> = ({
  currentStep,
  onNext,
  onPrevious,
  isLoading,
  isAutoPopulating,
}) => {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === FORM_STEPS.length - 1;

  return (
    <div className="flex items-center justify-between pt-6 border-t mt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <div className="text-sm text-muted-foreground">
        Step {currentStep + 1} of {FORM_STEPS.length}
      </div>

      {isLastStep ? (
        <Button
          key="submit-btn"
          type="submit"
          className="gap-2 bg-primary hover:opacity-90"
          disabled={isLoading || isAutoPopulating}
        >
          {isLoading
            ? 'Creating Camera...'
            : isAutoPopulating
              ? 'Loading configurations...'
              : 'Create Camera'}
        </Button>
      ) : (
        <Button key="next-btn" type="button" onClick={onNext} className="gap-2">
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
