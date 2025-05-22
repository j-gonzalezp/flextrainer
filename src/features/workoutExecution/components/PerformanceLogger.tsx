import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import type { Goal } from '@/features/goalsManagement/types'; // Import Goal type
import { toast } from 'sonner'; // Import toast from sonner

export interface SetData {
  reps: string;
  weight?: string;
  duration?: string;
  notes?: string;
  failed: boolean;
  isAdditional: boolean;
}

interface PerformanceLoggerProps {
  goal: Goal | null; // Use the imported Goal type
  onLogSubmit: (set: SetData) => void;
  onCancel: () => void;
  performanceReps: string;
  setPerformanceReps: (value: string) => void;
  performanceFailedSet: boolean;
  setPerformanceFailedSet: (value: boolean) => void;
  performanceWeight: string;
  setPerformanceWeight: (value: string) => void;
  performanceDuration: string;
  setPerformanceDuration: (value: string) => void;
  performanceNotes: string;
  setPerformanceNotes: (value: string) => void;
  isSubmitting: boolean;
}

const PerformanceLogger: React.FC<PerformanceLoggerProps> = ({
  goal,
  onLogSubmit,
  onCancel,
  performanceReps,
  setPerformanceReps,
  performanceFailedSet,
  setPerformanceFailedSet,
  performanceWeight,
  setPerformanceWeight,
  performanceDuration,
  setPerformanceDuration,
  performanceNotes,
  setPerformanceNotes,
  isSubmitting,
}) => {
  React.useEffect(() => {
    if (goal) {
      // Pre-cargar Reps si el goal tiene reps definidas
      if (goal.reps !== undefined && goal.reps !== null) {
        setPerformanceReps(goal.reps.toString());
      } else {
        // Opcional: si no hay reps en el goal, puedes limpiar el campo o dejarlo como estaba
        // setPerformanceReps(''); // Descomenta si quieres limpiar si no hay reps en el goal
      }

      // Pre-cargar Peso si el goal tiene peso definido
      if (goal.weight !== undefined && goal.weight !== null) {
        setPerformanceWeight(goal.weight.toString());
      } else {
        // Opcional: si no hay peso en el goal, puedes limpiar el campo o dejarlo como estaba
        // setPerformanceWeight(''); // Descomenta si quieres limpiar si no hay peso en el goal
      }

      // Opcional: Pre-cargar Duración si el goal tiene duración definida
      // if (goal.duration_seconds !== undefined && goal.duration_seconds !== null) {
      //   setPerformanceDuration(goal.duration_seconds.toString());
      // } else {
      //   // setPerformanceDuration('');
      // }

    } else {
      // Si no hay goal, limpiar los campos (o manejar como prefieras)
      setPerformanceReps('');
      setPerformanceWeight('');
      // setPerformanceDuration('');
      // setPerformanceNotes(''); // Considera si también quieres limpiar las notas
      // setPerformanceFailedSet(false); // Considera si quieres resetear el estado de fallo
    }
  }, [goal, setPerformanceReps, setPerformanceWeight]); // Removed setPerformanceDuration as it's commented out in the effect

  const handleSubmit = () => {
    if (!goal) {
      toast.error('Error: No hay ejercicio actual para registrar.');
      return;
    }

    if (goal.reps !== undefined && goal.reps !== null && !performanceReps) {
      toast.error('Las repeticiones son obligatorias para este ejercicio.');
      return;
    }

    if (goal.duration_seconds !== undefined && goal.duration_seconds !== null && !performanceDuration) {
      toast.error('La duración es obligatoria para este ejercicio.');
      return;
    }

    const currentSetData: SetData = {
      reps: performanceReps || '0', // Pass '0' if reps are not required and empty
      weight: performanceWeight,
      duration: performanceDuration || undefined, // Pass undefined if duration is not required and empty
      notes: performanceNotes,
      failed: performanceFailedSet,
      isAdditional: false,
    };
    onLogSubmit(currentSetData);
  };

  return (
    <Card className="shadow-elevated border-primary/20 animate-fade-in-up"> {/* Added a subtle border */}
      <CardHeader>
        <CardTitle className="text-xl">
          Registrar Set: {goal?.exercise_name || 'Ejercicio Actual'}
        </CardTitle>
        <CardDescription>Anota los detalles del set que realizaste.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
          <div className="space-y-1.5">
            <Label htmlFor="repsDone" className="text-sm font-medium">Reps Realizadas{goal?.reps !== undefined && goal?.reps !== null ? '*' : ''}</Label>
            <Input
              id="repsDone"
              type="number"
              value={performanceReps}
              onChange={(e) => setPerformanceReps(e.target.value)}
              placeholder="Ej: 8"
              disabled={isSubmitting}
              required={goal?.reps !== undefined && goal?.reps !== null}
              aria-required={goal?.reps !== undefined && goal?.reps !== null}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightUsed" className="text-sm font-medium">Peso Utilizado (kg)</Label>
            <Input
              id="weightUsed"
              type="number"
              step="0.01"
              value={performanceWeight}
              onChange={(e) => setPerformanceWeight(e.target.value)}
              placeholder="Ej: 50.5"
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationSecondsDone" className="text-sm font-medium">Duración (segundos){goal?.duration_seconds !== undefined && goal?.duration_seconds !== null ? '*' : ''}</Label>
          <Input
            id="durationSecondsDone"
            type="number"
            value={performanceDuration}
            onChange={(e) => setPerformanceDuration(e.target.value)}
            placeholder="Ej: 60"
            disabled={isSubmitting}
            required={goal?.duration_seconds !== undefined && goal?.duration_seconds !== null}
            aria-required={goal?.duration_seconds !== undefined && goal?.duration_seconds !== null}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="performanceNotes" className="text-sm font-medium">Notas del Set</Label>
          <Textarea
            id="performanceNotes"
            value={performanceNotes}
            onChange={(e) => setPerformanceNotes(e.target.value)}
            placeholder="Ej: Última rep difícil, buena técnica..."
            disabled={isSubmitting}
            rows={2}
          />
        </div>
        <div className="flex items-center space-x-2 pt-3.5">
          <Checkbox
            id="failedSet"
            checked={performanceFailedSet}
            onCheckedChange={(checked) => setPerformanceFailedSet(checked as boolean)}
            disabled={isSubmitting}
          />
          <Label
            htmlFor="failedSet"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            ¿Set Fallido?
          </Label>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto border-muted-foreground/30 text-foreground hover:bg-muted/50 hover:border-primary/50 transition-colors"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (goal?.reps !== undefined && goal?.reps !== null && !performanceReps) ||
              (goal?.duration_seconds !== undefined && goal?.duration_seconds !== null && !performanceDuration)
            }
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Registrar Set
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceLogger;