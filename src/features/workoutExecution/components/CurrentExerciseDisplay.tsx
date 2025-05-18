import React from 'react';
import type { Goal } from '@/features/goalsManagement/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CurrentExerciseDisplayProps {
  goal: Goal | null;
}

const CurrentExerciseDisplay: React.FC<CurrentExerciseDisplayProps> = ({ goal }) => {
  if (!goal) {


    return null;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">{goal.exercise_name || 'Ejercicio sin nombre'}</CardTitle>
        <CardDescription className="text-base">
          Objetivo: {goal.sets} series x {goal.reps} reps
          {goal.weight !== null && goal.weight !== undefined && ` @ ${goal.weight}kg`}
          {goal.duration_seconds !== null && goal.duration_seconds !== undefined && ` por ${goal.duration_seconds}s`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {goal.notes && (
          <div className="mt-2">
            <h4 className="text-sm font-semibold text-muted-foreground">Notas del Ejercicio:</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{goal.notes}</p>
          </div>
        )}
        {goal.categories && goal.categories.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">Categorías:</h4>
            <div className="flex flex-wrap gap-2">
              {goal.categories.map((category, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-full">
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CurrentExerciseDisplay;