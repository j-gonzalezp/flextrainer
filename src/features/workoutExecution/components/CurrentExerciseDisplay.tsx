import React from 'react';
import type { Goal } from '@/features/goalsManagement/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Replace } from 'lucide-react'; // Using Replace icon for "swap" or "change"

interface CurrentExerciseDisplayProps {
  goal: Goal | null;
  onChangeExerciseClick: () => void;
  isProcessingChange?: boolean;
}

const CurrentExerciseDisplay: React.FC<CurrentExerciseDisplayProps> = ({ 
  goal, 
  onChangeExerciseClick,
  isProcessingChange = false 
}) => {
  if (!goal) {
    return null;
  }

  const formatObjective = () => {
    let objective = `${goal.sets} series x ${goal.reps} reps`;
    if (goal.weight !== null && goal.weight !== undefined && goal.weight > 0) {
      objective += ` @ ${goal.weight}kg`;
    }
    if (goal.duration_seconds !== null && goal.duration_seconds !== undefined && goal.duration_seconds > 0) {
      objective += ` por ${goal.duration_seconds}s`;
    }
    return objective;
  };

  return (
    <Card className="shadow-lg border-accent/30">
      <CardHeader className="pb-4"> {/* Increased pb slightly for button */}
        <div className="flex justify-between items-center gap-2"> {/* items-center */}
          <div className="flex-grow">
            <CardTitle className="text-2xl font-semibold text-primary leading-tight">
              {goal.exercise_name || 'Ejercicio sin nombre'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Objetivo: {formatObjective()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">
        {goal.notes && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Notas:</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-2 rounded-md mt-1">{goal.notes}</p>
          </div>
        )}
        {goal.categories && goal.categories.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1">Categorías:</h4>
            <div className="flex flex-wrap gap-2">
              {goal.categories.map((category, index) => (
                <span 
                  key={index} 
                  className="px-2.5 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-full font-medium"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* More explicit button placed in CardContent for better flow */}
        <div className="pt-2 text-right"> 
          <Button 
            variant="outline" // Shadcn outline button style
            size="sm"         // Smaller button
            onClick={onChangeExerciseClick} 
            aria-label="Cambiar ejercicio actual"
            disabled={isProcessingChange}
            className="mt-2" // Margin top for spacing
          >
            <Replace className="mr-2 h-4 w-4" /> 
            Cambiar Ejercicio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentExerciseDisplay;