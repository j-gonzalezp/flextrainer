import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ProposedGoal, GoalInsert } from '../types'; // Import GoalInsert

interface NextMicrocycleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  proposedGoals: ProposedGoal[];
  setProposedGoals: React.Dispatch<React.SetStateAction<ProposedGoal[]>>;
  currentMicrocycleNumber: number;
  nextMicrocycleNumber: number;
  onConfirm: (goalsToInsert: ProposedGoal[]) => Promise<void>;
  isLoading: boolean;
}

const NextMicrocycleWizard: React.FC<NextMicrocycleWizardProps> = ({
  isOpen,
  onClose,
  proposedGoals,
  setProposedGoals,
  currentMicrocycleNumber,
  nextMicrocycleNumber,
  onConfirm,
  isLoading,
}) => {

  // Internal state for editing proposed goals (synced with parent via setProposedGoals)
  const [editableGoals, setEditableGoals] = useState<ProposedGoal[]>(proposedGoals);

  // Sync internal state when proposedGoals prop changes
  useEffect(() => {
    console.log('Wizard isOpen changed:', isOpen); // Log for debugging
    // Only reset editableGoals if the dialog is opening AND proposedGoals are new/different
    // or if the dialog was closed and then opened again with potentially same goals.
    // A more robust check might be needed if proposedGoals can change while dialog is open
    // and you want to preserve user edits. For now, this is fine.
    if (isOpen) {
        setEditableGoals(proposedGoals);
    }
  }, [proposedGoals, isOpen]); // Added isOpen dependency

  const handleGoalChange = useCallback((
    index: number,
    field: keyof Omit<GoalInsert, 'user_id' | 'microcycle'>,
    value: any
  ) => {
    console.log('handleGoalChange called', { index, field, value });
    setEditableGoals(prevGoals => {
      const newGoals = [...prevGoals];
      // Ensure numeric fields are parsed correctly
      if (field === 'sets' || field === 'reps' || field === 'weight' || field === 'duration_seconds') {
         newGoals[index] = { ...newGoals[index], [field]: value === '' ? null : Number(value) };
      } else {
         newGoals[index] = { ...newGoals[index], [field]: value };
      }
      // Also update the parent state immediately (optional, but good for real-time sync)
      setProposedGoals(newGoals);
      return newGoals;
    });
  }, [setProposedGoals]); // Depend on setProposedGoals

  const handleToggleInclude = useCallback((index: number, checked: boolean) => {
    console.log('handleToggleInclude called', { index, checked });
    setEditableGoals(prevGoals => {
      const newGoals = [...prevGoals];
      newGoals[index] = { ...newGoals[index], includeInNextMicrocycle: checked };
      // Also update the parent state immediately (optional, but good for real-time sync)
      setProposedGoals(newGoals);
      return newGoals;
    });
  }, [setProposedGoals]); // Depend on setProposedGoals


  const handleConfirm = useCallback(async () => {
    console.log('handleConfirm called');
    const goalsToInsert = editableGoals.filter(g => g.includeInNextMicrocycle);
    if (goalsToInsert.length === 0) {
      // Optionally show a warning or prevent confirmation
      alert("Please select at least one goal to include in the next microcycle.");
      return;
    }
    await onConfirm(goalsToInsert);
    // onClose(); // Call onClose after confirmation is complete
  }, [editableGoals, onConfirm]); // Added onClose here

  // Ensure editableGoals state is initialized correctly when dialog opens.
  // The useEffect already handles this, but it's important to remember
  // that `editableGoals` starts as `proposedGoals` *at the time of mount/render*,
  // then updates if `proposedGoals` changes or `isOpen` changes.


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] h-[90vh] flex flex-col card-rounded-custom">
        <DialogHeader>
          <DialogTitle>Habilitar Microciclo {nextMicrocycleNumber}</DialogTitle>
          <DialogDescription>
            Preparando metas para el microciclo {nextMicrocycleNumber}, basado en el rendimiento del microciclo {currentMicrocycleNumber}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {editableGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay metas en el microciclo actual para sugerir un prellenado. Puedes añadir metas manualmente después.
            </div>
          ) : (
            <div className="h-full overflow-y-auto pr-2">
              <div className="space-y-4">
                {editableGoals.map((goal, index) => (
                  <div key={goal.originalGoalId || index} className="card-rounded-custom space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-slate-900">{goal.exercise_name}</h4>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={goal.includeInNextMicrocycle}
                          onCheckedChange={(checked: boolean) => handleToggleInclude(index, checked)}
                          id={`include-${index}`}
                        />
                        <Label htmlFor={`include-${index}`}>Incluir</Label>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {goal.performance ? (
                      <div className="text-sm text-slate-600 space-y-2">
                        <p className="font-medium">Rendimiento anterior (Microciclo {currentMicrocycleNumber}):</p>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <p>Planificado: {goal.performance.totalPlannedSets} sets, {goal.performance.totalPlannedReps} reps</p>
                          <p>Completado: {goal.performance.totalSetsCompleted} sets, {goal.performance.averageRepsPerSet ? goal.performance.averageRepsPerSet.toFixed(1) : 'N/A'} reps (promedio)</p>
                          <p>Volumen Total: {goal.performance.totalVolumeLifted ? goal.performance.totalVolumeLifted.toFixed(1) : 'N/A'} kg</p>
                          <p>Peso Máx/Set: {goal.performance.maxWeightAchievedInASet ? goal.performance.maxWeightAchievedInASet.toFixed(1) : 'N/A'} kg</p>
                          <p>Reps Máx/Set: {goal.performance.maxRepsAchievedInASet ?? 'N/A'}</p>
                          <p>Peso Promedio/Set: {goal.performance.averageWeightPerSet ? goal.performance.averageWeightPerSet.toFixed(1) : 'N/A'} kg</p>
                          <div className="flex items-center col-span-2">
                            Meta Anterior:
                            {goal.performance.wasCompleted ? (
                              <Badge variant="success" className="ml-2">
                                <CheckCircle className="mr-1 h-3 w-3" /> Cumplida
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="ml-2">
                                <XCircle className="mr-1 h-3 w-3" /> No cumplida
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-600 py-2">
                        <p>No hay datos de rendimiento para esta meta en el microciclo anterior.</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`sets-${index}`}>Sets Objetivo</Label>
                        <div className="flex items-center mt-1">
                          <Input
                            id={`sets-${index}`}
                            type="number"
                            value={goal.sets ?? ''}
                            onChange={(e) => handleGoalChange(index, 'sets', e.target.value)}
                            className="flex-grow mr-2"
                          />
                          {goal.performance?.totalPlannedSets !== undefined && goal.sets !== null && (
                            <span className="text-xs text-muted-foreground">
                              ({goal.sets > goal.performance.totalPlannedSets ? '+' : goal.sets < goal.performance.totalPlannedSets ? '-' : '='}{goal.performance.totalPlannedSets})
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`reps-${index}`}>Reps Objetivo</Label>
                        <div className="flex items-center mt-1">
                          <Input
                            id={`reps-${index}`}
                            type="number"
                            value={goal.reps ?? ''}
                            onChange={(e) => handleGoalChange(index, 'reps', e.target.value)}
                            className="flex-grow mr-2"
                          />
                           {goal.performance?.totalPlannedReps !== undefined && goal.reps !== null && (
                            <span className="text-xs text-muted-foreground">
                              ({goal.reps > goal.performance.totalPlannedReps ? '+' : goal.reps < goal.performance.totalPlannedReps ? '-' : '='}{goal.performance.totalPlannedReps})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`comments-${index}`}>Comentarios (Opcional)</Label>
                      <Input
                        id={`comments-${index}`}
                        value={goal.comments ?? ''}
                        onChange={(e) => handleGoalChange(index, 'comments', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="btn-outline-custom">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || editableGoals.filter(g => g.includeInNextMicrocycle).length === 0} className="btn-primary-custom">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Habilitar Microciclo {nextMicrocycleNumber}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NextMicrocycleWizard;