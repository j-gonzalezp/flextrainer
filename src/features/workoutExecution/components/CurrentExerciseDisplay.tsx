import React, { useEffect, useRef } from 'react';
import type { Goal } from '@/features/goalsManagement/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Replace } from 'lucide-react';
import ExerciseTimer from '@/components/ExerciseTimer';
import type { TimerRef } from '@/components/ExerciseTimer';

interface CurrentExerciseDisplayProps {
  goal: Goal | null;
  onChangeExerciseClick: () => void;
  onPauseExerciseClick: () => void;
  isProcessingChange?: boolean;
  isPausing?: boolean; // Added for button state
  exerciseTimerControlRef: React.RefObject<TimerRef | null>; // Add the new prop
  onExerciseTimerComplete: () => void; // Add new prop
  onExerciseTimerPause: (remaining: number) => void; // Add new prop
  onExerciseTimerSoundTrigger: (type: 'complete') => void; // Add new prop
}

const CurrentExerciseDisplay: React.FC<CurrentExerciseDisplayProps> = ({
  goal,
  onChangeExerciseClick,
  isProcessingChange = false,
  isPausing = false, // Added for button state
  exerciseTimerControlRef, // Destructure the new prop
  onExerciseTimerComplete, // Destructure new prop
  onExerciseTimerPause, // Destructure new prop
  onExerciseTimerSoundTrigger, // Destructure new prop
}) => {
  const prevGoalIdRef = useRef<string | null | undefined>(goal?.id);
  // Remove the local timerRef as we are now using the one from the hook
  // const timerRef = useRef<TimerRef | null>(null);

  useEffect(() => {
    const currentGoalId = goal?.id;
    if (prevGoalIdRef.current !== currentGoalId) {
      // console.log(`[CurrentExerciseDisplay] Goal ID changed from ${prevGoalIdRef.current} to ${currentGoalId}.`);
      prevGoalIdRef.current = currentGoalId;
    }

    if (goal) {
      console.log(
        `[CurrentExerciseDisplay] Rendering for goal ID: ${currentGoalId}. Effective initial duration for timer: ${goal.duration_seconds}s`
      );
    } else {
      console.log('[CurrentExerciseDisplay] Rendering with no goal.');
    }
  }, [goal]);

  if (!goal) {
    return null;
  }

  const effectiveInitialDuration = goal.duration_seconds;

  const formatObjective = () => {
    let objective = `1 serie x ${goal.reps || 'N/A'} reps`;
    if (goal.weight && goal.weight > 0) {
      objective += ` @ ${goal.weight}kg`;
    }
    if (goal.duration_seconds && goal.duration_seconds > 0) { // Assuming goal.duration_seconds is for display in objective
      objective += ` por ${goal.duration_seconds}s`;
    }
    return objective;
  };

  // Asegúrate de que goal no sea null antes de acceder a sus propiedades
  const completedSets = goal?.performance?.totalSetsCompleted ?? 0;
  const totalPlannedSets = goal?.performance?.totalPlannedSets ?? goal?.sets ?? 0;

  return (
    <Card className="card-rounded-custom flex flex-col min-h-[180px]">
      <div className="flex-grow flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-grow">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
                  {goal.exercise_name || 'Ejercicio sin nombre'}
                </CardTitle>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onChangeExerciseClick}
                    aria-label="Cambiar ejercicio actual"
                    disabled={isProcessingChange || isPausing}
                    className="text-slate-600 hover:bg-accent/10 w-24 justify-center"
                  >
                    <Replace className="h-4 w-4" />
                    <span className="ml-1.5">Cambiar</span>
                  </Button>
                </div>
              </div>
              <CardDescription className="text-base text-slate-600 mt-2">
                <span className="font-medium">Objetivo (serie actual):</span> {formatObjective()}
              </CardDescription>
              <CardDescription className="text-base text-slate-600 mt-1">
                <span className="font-medium">Progreso:</span> {completedSets} / {totalPlannedSets} series completadas
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pt-1 pb-4 px-6">
          <div className="flex flex-col h-full">
            {goal.notes && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                  Notas:
                </h4>
                <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                  {goal.notes}
                </p>
              </div>
            )}


            {typeof goal.duration_seconds === 'number' && // Check for number type
             goal.duration_seconds > 0 &&
             typeof effectiveInitialDuration === 'number' && ( // Check for number type
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                    Temporizador:
                  </h4>
                  <ExerciseTimer
                    key={goal.id.toString()}
                    goalId={goal.id.toString()}
                    initialDurationSeconds={effectiveInitialDuration}
                    onTimerPause={onExerciseTimerPause} // Pass the prop
                    onTimerComplete={onExerciseTimerComplete} // Pass the prop
                    onSoundTrigger={onExerciseTimerSoundTrigger} // Pass the prop
                    autoStart={false}
                    controlRef={exerciseTimerControlRef} // Pass the prop here
                  />
                </div>
              )}

            <div className={goal.notes ? 'mt-auto' : ''}>
              {goal.categories && goal.categories.length > 0 ? (
                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-600 tracking-wider mb-1.5">
                    Categorías:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {goal.categories.map((category, index) => (
                      <span
                        key={index}
                        className="tag-neutral-custom"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-6" />
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default CurrentExerciseDisplay;