import React from 'react';
import { Button } from '@/components/ui/button';

interface ActiveButtonProps {
  isActive: boolean;
  onClick: () => void;
}

const ActiveButton: React.FC<ActiveButtonProps> = ({ isActive, onClick }) => {

  return (
    <Button
      onClick={onClick}
      variant="default" /* Use default variant as a base */
      size="sm" /* Adjust size if needed */
      className={isActive ? 'bg-brand-success hover:bg-brand-success/90 text-white' : 'bg-brand-error hover:bg-brand-error/90 text-white'}
    >
      {isActive ? 'Activa' : 'Pausada'}
    </Button>
  );
};

export default ActiveButton;