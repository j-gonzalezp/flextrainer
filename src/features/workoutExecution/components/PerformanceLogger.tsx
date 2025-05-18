import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceLoggerProps {
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
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Registrar Rendimiento</CardTitle>
        <CardDescription>Anota cómo te fue en este set/ejercicio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="repsDone">Reps Realizadas*</Label>
            <Input
              id="repsDone"
              type="number"
              value={performanceReps}
              onChange={(e) => setPerformanceReps(e.target.value)}
              placeholder="Ej: 8"
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weightUsed">Peso Utilizado (kg)</Label>
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

        <div className="space-y-1">
          <Label htmlFor="durationSecondsDone">Duración (segundos)</Label>
          <Input
            id="durationSecondsDone"
            type="number"
            value={performanceDuration}
            onChange={(e) => setPerformanceDuration(e.target.value)}
            placeholder="Ej: 60"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="performanceNotes">Notas Adicionales</Label>
          <Textarea
            id="performanceNotes"
            value={performanceNotes}
            onChange={(e) => setPerformanceNotes(e.target.value)}
            placeholder="Ej: Buena forma, última rep costó..."
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="failedSet"
            checked={performanceFailedSet}
            onCheckedChange={(checked) => setPerformanceFailedSet(checked as boolean)}
            disabled={isSubmitting}
          />
          <Label htmlFor="failedSet" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Set Fallido
          </Label>
        </div>
      </CardContent>

    </Card>
  );
};

export default PerformanceLogger;