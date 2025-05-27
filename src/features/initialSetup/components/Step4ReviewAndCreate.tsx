import React from 'react';
import type { ChosenExerciseGoalData } from '../types';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';

// ... (imports)

interface Step4ReviewAndCreateProps {
  finalGoalConfigurations: ChosenExerciseGoalData[];
  onSubmitGoals: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const Step4ReviewAndCreate: React.FC<Step4ReviewAndCreateProps> = ({
  finalGoalConfigurations,
  
  isSubmitting,
  error,
}) => {
  // Ya tienes una buena lógica para cuando no hay nada que revisar
  if (finalGoalConfigurations.length === 0 && !isSubmitting && !error) { // Añadido !error para evitar mensaje de "nada que revisar" si hay un error previo
    return (
      <Card className="text-center card-rounded-custom">
        <CardHeader>
          <CardTitle>Nada que Revisar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">No has configurado ninguna meta. Por favor, vuelve a los pasos anteriores.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-rounded-custom">
        <CardHeader>
          <CardTitle>4. Revisión Final y Creación de Metas</CardTitle>
          <CardDescription>
            Confirma los detalles de las metas que se crearán para tu primer microciclo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* El componente Alert para el error es excelente */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error al Crear Metas</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {/* Esto también es bueno para cuando está enviando, sin ocultar el contenido */}
          {isSubmitting && (
            <div className="flex justify-center items-center py-4 text-primary">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Creando metas... Por favor, espera.</span>
            </div>
          )}
          <ScrollArea className="h-[350px] pr-3">
            <div className="space-y-3">
              {finalGoalConfigurations.map((goal, index) => (
                <Card key={goal.id || `review-${index}`} className="card-rounded-custom bg-muted/20">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-md flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      {goal.exercise_name}
                      {goal.is_custom && <span className="ml-2 text-xs font-normal text-blue-700">(Personalizado)</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs px-4 pb-3 space-y-0.5 text-slate-600">
                    <p><strong>Sets Semanales:</strong> {goal.sets || 'N/A'}</p>
                    <p><strong>Reps por Set:</strong> {goal.reps || 'N/A'}</p>
                    {/* Convertir a string para mostrar "N/A" si es null/undefined/'' */}
                    {goal.weight !== null && goal.weight !== undefined && goal.weight !== '' && <p><strong>Peso:</strong> {goal.weight} kg</p>}
                    {goal.duration_seconds !== null && goal.duration_seconds !== undefined && goal.duration_seconds !== '' && <p><strong>Duración por Set:</strong> {goal.duration_seconds}s</p>}
                    
                    {(goal.categories_general && goal.categories_general.length > 0) && 
                        <p><strong>Cat. General:</strong> {goal.categories_general.join(', ')}</p>}
                    {(goal.categories_specific && goal.categories_specific.length > 0) && 
                        <p><strong>Cat. Específicas:</strong> {goal.categories_specific.join(', ')}</p>}
                    {goal.notes && goal.notes.trim() !== '' && <p className="mt-1"><strong>Notas:</strong> <span className="italic">{goal.notes}</span></p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step4ReviewAndCreate;