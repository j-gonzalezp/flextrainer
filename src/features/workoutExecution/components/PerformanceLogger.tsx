import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

export interface SetData {
  reps: string;
  weight?: string;
  duration?: string;
  notes?: string;
  failed: boolean;
  isAdditional: boolean;
}

interface PerformanceLoggerProps {
  goal: { exercise_name?: string } | null;
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
  const handleSubmit = () => {
    const currentSetData: SetData = {
      reps: performanceReps,
      weight: performanceWeight,
      duration: performanceDuration,
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
            <Label htmlFor="repsDone" className="text-sm font-medium">Reps Realizadas*</Label>
            <Input 
              id="repsDone" 
              type="number" 
              value={performanceReps} 
              onChange={(e) => setPerformanceReps(e.target.value)} 
              placeholder="Ej: 8" 
              disabled={isSubmitting} 
              required 
              aria-required="true"
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
          <Label htmlFor="durationSecondsDone" className="text-sm font-medium">Duración (segundos)</Label>
          <Input 
            id="durationSecondsDone" 
            type="number" 
            value={performanceDuration} 
            onChange={(e) => setPerformanceDuration(e.target.value)} 
            placeholder="Ej: 60" 
            disabled={isSubmitting} 
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
            disabled={isSubmitting || !performanceReps} // Reps are mandatory
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