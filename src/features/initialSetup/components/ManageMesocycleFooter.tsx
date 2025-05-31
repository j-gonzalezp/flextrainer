import React from 'react';
import { DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ManageMesocycleFooterProps {
  currentStep: number;
  isSubmitting: boolean;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
  handleSubmitAllGoalsWrapper: () => Promise<void>;
}

const ManageMesocycleFooter: React.FC<ManageMesocycleFooterProps> = ({
  currentStep,
  isSubmitting,
  handlePreviousStep,
  handleNextStep,
  handleSubmitAllGoalsWrapper,
}) => {
  return (
    <DialogFooter className="p-4.5 pt-3.5 border-t flex justify-between sm:justify-end gap-2">
      {currentStep > 1 && (
        <Button variant="secondary" onClick={handlePreviousStep}>
          Previous
        </Button>
      )}
      {currentStep < 4 && (
        <Button onClick={handleNextStep} disabled={isSubmitting}>
          Next
        </Button>
      )}
      {currentStep === 4 && (
        <Button disabled={isSubmitting} onClick={handleSubmitAllGoalsWrapper}>
          {isSubmitting ? 'Submitting...' : 'Create Goals'}
        </Button>
      )}
    </DialogFooter>
  );
};

export default ManageMesocycleFooter;