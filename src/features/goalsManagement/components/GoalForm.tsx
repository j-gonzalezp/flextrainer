import React, { useState, useEffect } from 'react';
import type { Goal, GoalInsert, GoalUpdate } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface GoalFormProps {
  initialData?: Goal | null;
  onSubmit: (data: GoalInsert | GoalUpdate) => Promise<void>;
  isSubmitting: boolean;
  selectedMicrocycle: number | null;
  onCancel?: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  selectedMicrocycle,
  onCancel,
}) => {
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState<number | ''>('');
  const [reps, setReps] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [durationSeconds, setDurationSeconds] = useState<number | ''>('');
  const [categories, setCategories] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState<0 | 1>(1);

  useEffect(() => {
    if (initialData) {
      setExerciseName(initialData.exercise_name || '');
      setSets(initialData.sets || '');
      setReps(initialData.reps || '');
      setWeight(initialData.weight ?? '');
      setDurationSeconds(initialData.duration_seconds ?? '');
      setCategories(initialData.categories?.join(', ') || '');
      setNotes(initialData.notes || '');
      setActive(initialData.active !== undefined ? initialData.active : 1);
    } else {

      setExerciseName('');
      setSets('');
      setReps('');
      setWeight('');
      setDurationSeconds('');
      setCategories('');
      setNotes('');
      setActive(1);
    }
  }, [initialData]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedMicrocycle === null && !initialData?.microcycle) {
        alert("No hay un microciclo seleccionado para asignar la meta.");
        return;
    }

    const categoriesArray = categories.split(',').map(cat => cat.trim()).filter(cat => cat.length > 0);


    let goalPayload: Partial<Goal> = {
      exercise_name: exerciseName,
      sets: Number(sets),
      reps: Number(reps),
      weight: weight === '' ? null : Number(weight),
      duration_seconds: durationSeconds === '' ? null : Number(durationSeconds),
      categories: categoriesArray.length > 0 ? categoriesArray : undefined,
      notes: notes || null,
      active: active,
    };

    if (initialData) {

      const { microcycle, ...updateDataSpecific } = goalPayload;
      await onSubmit(updateDataSpecific as GoalUpdate);

    } else {
      goalPayload.microcycle = selectedMicrocycle as number;
      await onSubmit(goalPayload as GoalInsert);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="exerciseName">Nombre del Ejercicio</Label>
        <Input id="exerciseName" value={exerciseName} onChange={(e) => setExerciseName(e.target.value)} required disabled={isSubmitting} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sets">Sets</Label>
          <Input id="sets" type="number" min="0" value={sets} onChange={(e) => setSets(e.target.value === '' ? '' : Number(e.target.value))} required disabled={isSubmitting} />
        </div>
        <div>
          <Label htmlFor="reps">Reps</Label>
          <Input id="reps" type="number" min="0" value={reps} onChange={(e) => setReps(e.target.value === '' ? '' : Number(e.target.value))} required disabled={isSubmitting} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input id="weight" type="number" step="0.01" min="0" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))} disabled={isSubmitting} />
        </div>
        <div>
          <Label htmlFor="durationSeconds">Duración (segundos)</Label>
          <Input id="durationSeconds" type="number" min="0" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value === '' ? '' : Number(e.target.value))} disabled={isSubmitting} />
        </div>
      </div>
      <div>
        <Label htmlFor="categories">Categorías (separadas por coma)</Label>
        <Input id="categories" value={categories} onChange={(e) => setCategories(e.target.value)} disabled={isSubmitting} />
      </div>
      <div>
        <Label htmlFor="notes">Notas</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isSubmitting} />
      </div>
       <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="active"
            checked={active === 1}
            onCheckedChange={(checked) => setActive(checked ? 1 : 0)}
            disabled={isSubmitting}
            aria-label="Meta activa"
          />
          <Label
            htmlFor="active"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Activo
          </Label>
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialData ? 'Guardando Cambios...' : 'Creando Meta...') : (initialData ? 'Guardar Cambios' : 'Crear Meta')}
        </Button>
      </div>
    </form>
  );
};

export default GoalForm;