import React from 'react';
import type { ChosenExerciseGoalData } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';

interface Step4ReviewAndCreateProps {
  finalGoalConfigurations: ChosenExerciseGoalData[];
  onSubmitGoals: () => void; // Se cambiará a Promise<void> si el submit es async
  isSubmitting: boolean;
  error: string | null;
}

const Step4ReviewAndCreate: React.FC<Step4ReviewAndCreateProps> = ({
  finalGoalConfigurations,
  onSubmitGoals,
  isSubmitting,
  error,
}) => {
  if (finalGoalConfigurations.length === 0 && !isSubmitting) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle>Nada que Revisar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No has configurado ninguna meta. Por favor, vuelve a los pasos anteriores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>4. Revisión Final y Creación de Metas</CardTitle>
          <CardDescription>
            Confirma los detalles de las metas que se crearán para tu primer microciclo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error al Crear Metas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ScrollArea className="h-[350px] pr-3">
            <div className="space-y-3">
              {finalGoalConfigurations.map((goal, index) => (
                <Card key={goal.id || `review-${index}`} className="bg-muted/20">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-md flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {goal.exercise_name}
                      {goal.is_custom && <span className="ml-2 text-xs font-normal text-blue-500">(Personalizado)</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs px-4 pb-3 space-y-0.5 text-muted-foreground">
                    <p><strong>Sets Semanales:</strong> {goal.sets || 'N/A'}</p>
                    <p><strong>Reps por Set:</strong> {goal.reps || 'N/A'}</p>
                    {goal.weight !== undefined && <p><strong>Peso:</strong> {goal.weight} kg</p>}
                    {goal.duration_seconds !== undefined && <p><strong>Duración por Set:</strong> {goal.duration_seconds}s</p>}
                    {(goal.categories_general && goal.categories_general.length > 0) && 
                        <p><strong>Cat. General:</strong> {goal.categories_general.join(', ')}</p>}
                    {(goal.categories_specific && goal.categories_specific.length > 0) && 
                        <p><strong>Cat. Específicas:</strong> {goal.categories_specific.join(', ')}</p>}
                    {goal.notes && <p className="mt-1"><strong>Notas:</strong> <span className="italic">{goal.notes}</span></p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* El botón de submit está en el footer del Dialog en el componente padre CreateFirstMicrocycleModal */}
      {/* Este componente principalmente muestra la revisión. El padre maneja el botón de acción final. */}
      {/* Sin embargo, si quisiéramos un botón aquí (además del del footer): */}
      {/* 
      <div className="flex justify-end">
        <Button onClick={onSubmitGoals} disabled={isSubmitting || finalGoalConfigurations.length === 0}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Crear Metas del Microciclo 1
        </Button>
      </div>
      */}
    </div>
  );
};

export default Step4ReviewAndCreate;