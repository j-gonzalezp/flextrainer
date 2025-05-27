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
    // Create audio with a beep sound data URL
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const createBeepSound = () => {
      const duration = 0.5;
      const sampleRate = audioContext.sampleRate;
      const numSamples = duration * sampleRate;
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Create a beep sound with frequency modulation
        data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 3) * 0.3;
      }
      
      return buffer;
    };

    const playBeep = () => {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const source = audioContext.createBufferSource();
      source.buffer = createBeepSound();
      source.connect(audioContext.destination);
      source.start();
    };

    audioRef.current = { play: playBeep } as any;
  }, []);

  // Check if timer reached zero to play sound
  useEffect(() => {
    if (previousSecondsRef.current > 0 && restTimerSeconds === 0 && isRestTimerRunning) {
      // Timer just reached zero, play sound
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Fallback if audio fails - could add a visual notification here
          console.log('Timer finished!');
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
    console.log(`🔍 Input change - Type: ${type}, Value: "${value}", Length: ${value.length}`);
    
    if (type === 'minutes') {
      if (value.length <= 2) {
        console.log(`✅ Setting minutes to: "${value}"`);
        setInputMinutes(value);
      } else {
        console.log(`❌ Minutes too long: ${value.length} chars`);
      }
    } else {
      if (value.length <= 2 && parseInt(value || '0') < 60) {
        console.log(`✅ Setting seconds to: "${value}"`);
        setInputSeconds(value);
      } else {
        console.log(`❌ Seconds invalid: "${value}" (length: ${value.length}, parsed: ${parseInt(value || '0')})`);
      }
    }
  };

  const handleInputBlur = () => {
    console.log('👁️ Blur event triggered');
    // Only finish editing if focus is leaving the entire timer component
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isStillInTimer = activeElement?.id === 'minutes-input' || activeElement?.id === 'seconds-input';
      console.log(`🔍 Focus check - Active element: ${activeElement?.id}, Still in timer: ${isStillInTimer}`);
      
      if (!isStillInTimer) {
        console.log('✅ Focus left timer - finishing edit');
        finishEditing();
      } else {
        console.log('🚫 Still in timer - not finishing edit');
      }
    }, 10); // Small delay to let focus settle
  };

  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    console.log(`⌨️  Key pressed: "${event.key}" on field: ${target.id}`);
    console.log(`📍 Current state - Minutes: "${inputMinutes}", Seconds: "${inputSeconds}"`);
    
    if (event.key === 'Enter') {
      console.log('🚀 Enter pressed - finishing edit');
      finishEditing();
    } else if (event.key === 'Escape') {
      console.log('🚫 Escape pressed - canceling edit');
      setIsEditing(false);
      setInputMinutes('');
      setInputSeconds('');
    } else if (event.key === 'Tab') {
      console.log('↹ Tab pressed - allowing natural navigation');
      return;
    } else if (event.key === ':' || event.key === ' ') {
      console.log('🎯 Colon/Space pressed - trying to jump to seconds');
      event.preventDefault();
      const secondsInput = target.parentElement?.querySelector('#seconds-input') as HTMLInputElement;
      if (secondsInput && target !== secondsInput) {
        console.log('✅ Jumping to seconds field');
        secondsInput.focus();
        secondsInput.select();
      } else {
        console.log('❌ Could not find seconds input or already on it');
      }
    } else if (target.id === 'minutes-input' && inputMinutes.length === 2 && /\d/.test(event.key)) {
      console.log(`🔄 Auto-jump trigger: minutes="${inputMinutes}" (length: ${inputMinutes.length}), key="${event.key}"`);
      event.preventDefault();
      const secondsInput = target.parentElement?.querySelector('#seconds-input') as HTMLInputElement;
      if (secondsInput) {
        console.log('✅ Auto-jumping to seconds and setting value');
        secondsInput.focus();
        setInputSeconds(event.key);
      } else {
        console.log('❌ Could not find seconds input for auto-jump');
      }
    } else {
      console.log(`ℹ️  Regular key: "${event.key}" - no special handling`);
    }
  };

  const finishEditing = () => {
    console.log(`💾 Finishing edit - Minutes: "${inputMinutes}", Seconds: "${inputSeconds}"`);
    const minutes = parseInt(inputMinutes || '0', 10);
    const seconds = parseInt(inputSeconds || '0', 10);
    console.log(`🔢 Parsed - Minutes: ${minutes}, Seconds: ${seconds}`);
    
    if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
      const totalSeconds = minutes * 60 + seconds;
      console.log(`✅ Valid input - Total seconds: ${totalSeconds}`);
      setRestTimerSeconds(totalSeconds || 30); // Default to 30 if total is 0
      resetRestTimer(totalSeconds || 30);
    } else if (inputMinutes === '' && inputSeconds === '') {
      console.log('🔄 Empty inputs - setting to default 30 seconds');
      setRestTimerSeconds(30);
      resetRestTimer(30);
    } else {
      console.log('❌ Invalid input - not saving');
    }
    setIsEditing(false);
    setInputMinutes('');
    setInputSeconds('');
  };

  const handleReset = () => {
    resetRestTimer(30); // Reset to 30 seconds default
  };

  return (
    <div className="timer-display-custom">
      <div className="flex flex-col items-center space-y-2">
        <Label className="text-sm font-medium text-slate-600">Rest Timer</Label>
        
        {isEditing ? (
          <div className="flex items-center space-x-1">
            <input
              id="minutes-input"
              type="text"
              value={inputMinutes}
              onChange={(e) => handleInputChange(e, 'minutes')}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyPress}
              className="w-12 text-center text-4xl font-mono bg-transparent border-none outline-none focus:bg-blue-50 rounded px-1"
              placeholder="0"
              maxLength={2}
              autoFocus
            />
            <span className="text-4xl font-mono text-slate-600">:</span>
            <input
              id="seconds-input"
              type="text"
              value={inputSeconds}
              onChange={(e) => handleInputChange(e, 'seconds')}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyPress}
              className="w-12 text-center text-4xl font-mono bg-transparent border-none outline-none focus:bg-blue-50 rounded px-1"
              placeholder="30"
              maxLength={2}
            />
          </div>
        ) : (
          <div 
            className={`timer-number-custom cursor-pointer px-4 py-2 rounded transition-colors ${
              !isRestTimerRunning 
                ? 'hover:bg-gray-100 text-blue-700' 
                : 'text-gray-800'
            } ${restTimerSeconds === 0 ? 'text-red-700 font-bold' : ''}`}
            onClick={handleTimeClick}
            title={!isRestTimerRunning ? "Click to edit time" : ""}
          >
            {formatTime(restTimerSeconds)}
          </div>
        )}
        
        {!isEditing && !isRestTimerRunning && (
          <p className="text-xs text-slate-600">Click to edit • Tab/: to switch • Enter to save</p>
        )}
      </div>

      <div className="flex space-x-2">
        <Button 
          onClick={isRestTimerRunning ? pauseRestTimer : startRestTimer}
          disabled={isEditing}
          className={`px-6 ${
            isRestTimerRunning 
              ? 'btn-warning-custom' 
              : 'btn-primary-custom'
          }`}
        >
          {isRestTimerRunning ? 'Pause' : 'Start'}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleReset}
          disabled={isEditing}
          className="px-6 btn-outline-custom"
        >
          Reset
        </Button>
      </div>

      {restTimerSeconds === 0 && (
        <div className="text-red-700 font-semibold animate-pulse">
          Time's up! 🔔
        </div>
      )}
    </div>
  );
};

export default RestTimerControl;