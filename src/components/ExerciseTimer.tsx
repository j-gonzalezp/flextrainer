import React, { useEffect, useState, useRef, useImperativeHandle, useCallback } from 'react';
export type TimerRef = { getTimeLeft: () => number; pause: () => void; start: () => void; reset: (newDuration: number) => void; };

interface ExerciseTimerProps {
  initialDurationSeconds: number;
  goalId: string; // For logging/debugging
  onTimerPause: (remainingSeconds: number) => void;
  onTimerComplete: () => void;
  onSoundTrigger: (type: 'complete') => void; // Add new prop
  autoStart: boolean;
  controlRef?: React.RefObject<TimerRef | null>; // Allow null
}

const ExerciseTimer = React.forwardRef<TimerRef | null, ExerciseTimerProps>( // Allow null in forwardRef type
  ({ initialDurationSeconds, goalId, onTimerPause, onTimerComplete, onSoundTrigger, autoStart, controlRef }, _) => {
    const [timeLeft, setTimeLeft] = useState(initialDurationSeconds);
    const [isRunning, setIsRunning] = useState(autoStart && initialDurationSeconds > 0);
    const [isCompleted, setIsCompleted] = useState(initialDurationSeconds <= 0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    console.log(`[ExerciseTimer-${goalId}] Initializing with duration: ${initialDurationSeconds}, autoStart: ${autoStart}`);

    // Effect to initialize timeLeft and isCompleted when initialDurationSeconds changes
    useEffect(() => {
      console.log(`[ExerciseTimer-${goalId}] initialDurationSeconds effect triggered. New duration: ${initialDurationSeconds}`);
      setTimeLeft(initialDurationSeconds);
      setIsCompleted(initialDurationSeconds <= 0);
      // Stop any running timer if duration changes significantly or to 0
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Re-evaluate isRunning based on autoStart and new duration
      setIsRunning(autoStart && initialDurationSeconds > 0);
    }, [initialDurationSeconds, autoStart, goalId]); // Depend on relevant props

    // Effect for countdown logic
    useEffect(() => {
      console.log(`[ExerciseTimer-${goalId}] Countdown effect triggered. isRunning: ${isRunning}, timeLeft: ${timeLeft}`);
      if (isRunning && timeLeft > 0) {
        intervalRef.current = setInterval(() => {
          setTimeLeft((prevTime) => {
            const newTime = prevTime - 1;
            console.log(`[ExerciseTimer-${goalId}] Interval tick. New timeLeft: ${newTime}`);
            if (newTime <= 0) {
              console.log(`[ExerciseTimer-${goalId}] Timer reached zero.`);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              setIsRunning(false);
              setIsCompleted(true);
              onTimerComplete(); // Call completion callback
              onSoundTrigger('complete'); // Trigger sound on complete
              return 0;
            }
            return newTime;
          });
        }, 1000); // Decrement every second
      } else {
        // Clear interval if timer is not running or is finished
        console.log(`[ExerciseTimer-${goalId}] Clearing interval. isRunning: ${isRunning}, timeLeft: ${timeLeft}`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }

      // Cleanup function: clear interval on unmount or when effect dependencies change
      return () => {
        console.log(`[ExerciseTimer-${goalId}] Cleanup effect. Clearing interval.`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [isRunning, timeLeft, onTimerComplete, goalId]); // Depend on state and callback

    // State change logging
    useEffect(() => {
        console.log(`[ExerciseTimer-${goalId}] State updated: timeLeft=${timeLeft}, isRunning=${isRunning}, isCompleted=${isCompleted}`);
    }, [timeLeft, isRunning, isCompleted, goalId]);


    const handlePlayPause = useCallback(() => {
      console.log(`[ExerciseTimer-${goalId}] Play/Pause button clicked. Current isRunning: ${isRunning}`);
      if (isRunning) {
        // Pausing
        setIsRunning(false);
        console.log(`[ExerciseTimer-${goalId}] Pause button clicked. Remaining: ${timeLeft}. Now isRunning: false`);
        onTimerPause(timeLeft); // Call pause callback
      } else {
        // Starting/Resuming
        if (timeLeft > 0) {
             setIsRunning(true);
             setIsCompleted(false); // Ensure not marked completed if resuming before 0
             console.log(`[ExerciseTimer-${goalId}] Play button clicked. Now isRunning: true`);
        } else {
             // If timeLeft is already 0, maybe reset or just do nothing?
             console.log(`[ExerciseTimer-${goalId}] Play button clicked, but timeLeft is 0. Not starting.`);
        }
      }
    }, [isRunning, timeLeft, onTimerPause, goalId]); // Depend on state and callback


    const formatTime = (totalSeconds: number): string => {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Imperative Handle
    useImperativeHandle(controlRef, () => ({ // Use controlRef here
      getTimeLeft: () => {
        console.log(`[ExerciseTimer-${goalId}] Imperative getTimeLeft() called, returning: ${timeLeft}`);
        return timeLeft;
      },
      pause: () => {
        console.log(`[ExerciseTimer-${goalId}] Imperative pause() called.`);
        if (isRunning) {
          handlePlayPause(); // Use the internal handler to trigger pause logic
        }
      },
       start: () => {
        console.log(`[ExerciseTimer-${goalId}] Imperative start() called.`);
         if (!isRunning && timeLeft > 0) {
            handlePlayPause(); // Use the internal handler to trigger start logic
         }
      },
       reset: (newDuration: number) => {
           console.log(`[ExerciseTimer-${goalId}] Imperative reset(${newDuration}) called.`);
           if (intervalRef.current) {
             clearInterval(intervalRef.current);
             intervalRef.current = null;
           }
           setTimeLeft(newDuration);
           setIsRunning(false); // Usually reset means paused initially
           setIsCompleted(newDuration <= 0);
       }
    }));

     useEffect(() => {
        return () => {
             console.log(`[ExerciseTimer-${goalId}] Component unmounting. Current timeLeft: ${timeLeft}, isRunning: ${isRunning}`);
            // Consider if persistence should happen here on unmount, or rely solely on parent component's effect
            // As per plan, parent (CurrentExerciseDisplay) handles persistence via its effect listening to goal changes/unmount.
        };
    }, [timeLeft, isRunning, goalId]); // Only depends on state and goalId for logging


    // Prevent rendering if duration is 0 or less initially, unless you want to show "00:00" and a completion state
    if (initialDurationSeconds <= 0 && !isCompleted && timeLeft <= 0) {
        return null; // Or render a message like "No duration"
    }


    return (
      <div className="flex items-center space-x-4">
        <div className={`text-xl font-mono ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
          {formatTime(timeLeft)}
        </div>
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
          disabled={isCompleted && !isRunning} // Disable if completed and not running
        >
          {isRunning ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
            </svg>
          )}
        </button>
        {isCompleted && <span className="text-sm text-green-600">¡Hecho!</span>}
      </div>
    );
  }
);

ExerciseTimer.displayName = 'ExerciseTimer';

export default ExerciseTimer;