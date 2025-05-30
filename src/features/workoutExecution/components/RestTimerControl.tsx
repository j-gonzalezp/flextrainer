import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('');
  const [inputSeconds, setInputSeconds] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousSecondsRef = useRef(restTimerSeconds);

  // Initialize audio
  useEffect(() => {
    // Only create AudioContext if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const createBeepSound = () => {
        const duration = 0.5;
        const sampleRate = audioContext.sampleRate;
        const numSamples = duration * sampleRate;
        const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < numSamples; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 3) * 0.3;
        }
        
        return buffer;
      };

      const playBeep = async () => {
        if (audioContext.state === 'suspended') {
          await audioContext.resume(); // Resume context on user interaction
        }
        const source = audioContext.createBufferSource();
        source.buffer = createBeepSound();
        source.connect(audioContext.destination);
        source.start();
      };

      // Assign the play function to the ref
      audioRef.current = { play: playBeep } as any; 
    }
  }, []);

  // Check if timer reached zero to play sound
  useEffect(() => {
    if (previousSecondsRef.current > 0 && restTimerSeconds === 0 && isRestTimerRunning) {
      // Timer just reached zero, play sound
      if (audioRef.current) {
        audioRef.current.play().catch((e: DOMException) => {
          // Handle play() failed promise (e.g., user gesture required)
          if (e.name === 'NotAllowedError') {
            console.warn('Autoplay prevented. Please interact with the page to enable sound.');
          } else {
            console.error('Error playing sound:', e);
          }
        });
      }
    }
    previousSecondsRef.current = restTimerSeconds;
  }, [restTimerSeconds, isRestTimerRunning]);

  const handleTimeClick = () => {
    if (!isRestTimerRunning) {
      setIsEditing(true);
      const minutes = Math.floor(restTimerSeconds / 60);
      const seconds = restTimerSeconds % 60;
      setInputMinutes(minutes.toString());
      setInputSeconds(seconds.toString());
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'minutes' | 'seconds') => {
    const value = event.target.value.replace(/\D/g, ''); // Only allow digits
    
    if (type === 'minutes') {
      if (value.length <= 2) {
        setInputMinutes(value);
      }
    } else {
      if (value.length <= 2 && parseInt(value || '0') < 60) {
        setInputSeconds(value);
      }
    }
  };

  const handleInputBlur = () => {
    // Small delay to let focus settle on other elements within the component
    setTimeout(() => {
      const activeElement = document.activeElement;
      // Check if focus is still within one of the inputs or the main timer div
      const isStillInTimerInputs = (activeElement?.id === 'minutes-input' || activeElement?.id === 'seconds-input');
      const timerContainer = document.querySelector('.compact-rest-timer-container'); // Add a class to the main container
      const isStillInTimerComponent = timerContainer && timerContainer.contains(activeElement);

      if (!isStillInTimerInputs && !isStillInTimerComponent) {
        finishEditing();
      }
    }, 50); 
  };

  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    
    if (event.key === 'Enter') {
      finishEditing();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setInputMinutes('');
      setInputSeconds('');
    } else if (event.key === 'Tab') {
      // Allow default tab behavior
      return;
    } else if (event.key === ':' || event.key === ' ') {
      event.preventDefault(); // Prevent colon/space from being typed
      const secondsInput = target.parentElement?.querySelector('#seconds-input') as HTMLInputElement;
      if (secondsInput && target.id !== 'seconds-input') {
        secondsInput.focus();
        secondsInput.select();
      }
    } else if (target.id === 'minutes-input' && inputMinutes.length === 2 && /\d/.test(event.key)) {
      // Auto-jump to seconds after 2 digits in minutes
      event.preventDefault(); // Prevent the 3rd digit from being typed in minutes
      const secondsInput = target.parentElement?.querySelector('#seconds-input') as HTMLInputElement;
      if (secondsInput) {
        secondsInput.focus();
        setInputSeconds(event.key); // Set the pressed key as the first digit for seconds
      }
    }
  };

  const finishEditing = () => {
    const minutes = parseInt(inputMinutes || '0', 10);
    const seconds = parseInt(inputSeconds || '0', 10);
    
    if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
      const totalSeconds = minutes * 60 + seconds;
      setRestTimerSeconds(totalSeconds || 30); // Default to 30 if total is 0
      resetRestTimer(totalSeconds || 30); // Also reset to the new duration
    } else if (inputMinutes === '' && inputSeconds === '') {
      // If both are empty, reset to default 30 seconds
      setRestTimerSeconds(30);
      resetRestTimer(30);
    } 
    // If input was invalid but not empty, just revert to current value
    setIsEditing(false);
    setInputMinutes('');
    setInputSeconds('');
  };

  const handleReset = () => {
    resetRestTimer(30); // Reset to 30 seconds default
  };

  return (
    // Main container now uses flex-row for a single line
    <div className="compact-rest-timer-container flex items-center space-x-4">
      {/* Label and Timer/Input Group */}
      <div className="flex items-center space-x-2">
        <Label className="text-sm font-medium text-slate-600 min-w-[70px]">Rest Timer:</Label>
        
        {isEditing ? (
          <div className="flex items-center space-x-0.5">
            <input
              id="minutes-input"
              type="text"
              value={inputMinutes}
              onChange={(e) => handleInputChange(e, 'minutes')}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyPress}
              className="w-10 text-center text-2xl font-mono bg-transparent border-none outline-none focus:bg-blue-50 rounded px-0.5 py-0.5"
              placeholder="00"
              maxLength={2}
              autoFocus
            />
            <span className="text-2xl font-mono text-slate-600">:</span>
            <input
              id="seconds-input"
              type="text"
              value={inputSeconds}
              onChange={(e) => handleInputChange(e, 'seconds')}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyPress}
              className="w-10 text-center text-2xl font-mono bg-transparent border-none outline-none focus:bg-blue-50 rounded px-0.5 py-0.5"
              placeholder="30"
              maxLength={2}
            />
          </div>
        ) : (
          <div 
            className={`timer-number-custom font-semibold text-2xl font-mono px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              !isRestTimerRunning 
                ? 'cursor-pointer hover:bg-gray-100 text-blue-700' 
                : 'text-gray-800'
            } ${restTimerSeconds === 0 ? 'text-red-700 font-bold animate-pulse' : ''}`}
            onClick={handleTimeClick}
            title={!isRestTimerRunning ? "Click to edit time" : ""}
          >
            {formatTime(restTimerSeconds)}
            {restTimerSeconds === 0 && <span className="text-xl">🔔</span>} {/* Small bell icon */}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex space-x-2">
        <Button 
          onClick={isRestTimerRunning ? pauseRestTimer : startRestTimer}
          disabled={isEditing}
          className={`px-4 py-2 text-sm ${
            isRestTimerRunning 
              ? 'btn-warning-custom' 
              : 'bg-accent text-accent-foreground hover:bg-accent/90'
          }`}
        >
          {isRestTimerRunning ? 'Pause' : 'Start'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={isEditing}
          className="px-4 py-2 text-sm btn-outline-custom"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default RestTimerControl;