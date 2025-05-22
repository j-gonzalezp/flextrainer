import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RestTimerControlProps {
  restTimerSeconds: number;
  isRestTimerRunning: boolean;
  startRestTimer: () => void;
  pauseRestTimer: () => void;
  resetRestTimer: (newDuration?: number) => void;
  setRestTimerSeconds: (seconds: number) => void;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const RestTimerControl: React.FC<RestTimerControlProps> = ({
  restTimerSeconds,
  isRestTimerRunning,
  startRestTimer,
  pauseRestTimer,
  resetRestTimer,
  setRestTimerSeconds,
}) => {
  const [inputDuration, setInputDuration] = useState(restTimerSeconds.toString());

  useEffect(() => {
    // Update input field when restTimerSeconds changes externally (e.g., reset)
    setInputDuration(restTimerSeconds.toString());
  }, [restTimerSeconds]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputDuration(event.target.value);
  };

  const handleInputBlur = () => {
    const seconds = parseInt(inputDuration, 10);
    if (!isNaN(seconds) && seconds >= 0) {
      setRestTimerSeconds(seconds);
    } else {
      // Revert to current valid state if input is invalid
      setInputDuration(restTimerSeconds.toString());
    }
  };

  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-md">
      <div className="flex flex-col items-center">
        <Label htmlFor="rest-timer-input" className="mb-1">Rest Timer (seconds)</Label>
        <Input
          id="rest-timer-input"
          type="number"
          value={inputDuration}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyPress={handleInputKeyPress}
          className="w-20 text-center"
          min="0"
        />
      </div>
      <div className="text-2xl font-mono">
        {formatTime(restTimerSeconds)}
      </div>
      <div className="flex space-x-2">
        <Button onClick={isRestTimerRunning ? pauseRestTimer : startRestTimer}>
          {isRestTimerRunning ? 'Pause' : 'Start'}
        </Button>
        <Button variant="outline" onClick={() => resetRestTimer()}>
          Reset
        </Button>
      </div>
    </div>
  );
};

export default RestTimerControl;