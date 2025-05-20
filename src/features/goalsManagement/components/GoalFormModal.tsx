import React, { useEffect } from 'react';
import type { Goal, GoalInsert, GoalUpdate } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,

} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formState: Partial<GoalInsert | GoalUpdate>;
  onFormChange: (field: keyof (GoalInsert | GoalUpdate), value: any) => void;
  editingGoal: Goal | null;
  isLoading?: boolean;
  error?: string | null;
  setError?: (error: string | null) => void;
}

const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formState,
  onFormChange,
  editingGoal,
  isLoading = false,
  error,
  setError,
}) => {
  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = formState.categories || [];
    let updatedCategories: string[];
    if (checked) {
      updatedCategories = [...currentCategories, category];
    } else {
      updatedCategories = currentCategories.filter(cat => cat !== category);
    }
    onFormChange('categories', updatedCategories);
  };


  const predefinedCategories = ["empuje", "tracción", "pierna", "core", "calistenia", "pesas", "cardio"];


  useEffect(() => {
    if (setError) setError(null);
  }, [isOpen, editingGoal, setError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto animate-fade-in-up">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Editar Meta' : 'Añadir Nueva Meta'}</DialogTitle>
          {editingGoal && (
            <DialogDescription>
              Modifica los detalles de tu meta "{editingGoal.exercise_name}".
            </DialogDescription>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4.5 py-2">
          <div>
            <Label htmlFor="exercise_name">Nombre del Ejercicio</Label>
            <Input
              id="exercise_name"
              value={formState.exercise_name || ''}
              onChange={(e) => onFormChange('exercise_name', e.target.value)}
              placeholder="Ej: Flexiones, Sentadillas"
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4.5">
            <div>
              <Label htmlFor="sets">Series</Label>
              <Input
                id="sets"
                type="number"
                min="1"
                value={formState.sets || 1}
                onChange={(e) => onFormChange('sets', parseInt(e.target.value, 10) || 1)}
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="reps">Repeticiones</Label>
              <Input
                id="reps"
                type="number"
                min="1"
                value={formState.reps || 1}
                onChange={(e) => onFormChange('reps', parseInt(e.target.value, 10) || 1)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4.5">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.1"
                value={formState.weight === null || formState.weight === undefined ? '' : formState.weight}
                onChange={(e) => onFormChange('weight', e.target.value === '' ? null : parseFloat(e.target.value))}               placeholder="Opcional"
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="duration_seconds">Duración (seg)</Label>
              <Input
                id="duration_seconds"
                type="number"
                min="0"
                value={formState.duration_seconds === null || formState.duration_seconds === undefined ? '' : formState.duration_seconds}
                onChange={(e) => onFormChange('duration_seconds', e.target.value === '' ? null : parseInt(e.target.value, 10))}              placeholder="Opcional"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label>Categorías</Label>
            <div className="p-2 border rounded-md mt-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                    {predefinedCategories.map(cat => (
                        <Button
                            type="button"
                            key={cat}
                            variant={(formState.categories || []).includes(cat) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCategoryChange(cat, !(formState.categories || []).includes(cat))}
                                                    disabled={isLoading}
                        >
                            {cat}
                        </Button>
                    ))}             </div>

            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formState.notes || ''}
              onChange={(e) => onFormChange('notes', e.target.value)}              placeholder="Añade notas adicionales sobre la meta (opcional)"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="active"
              checked={formState.active === 1}
              onCheckedChange={(checked) => onFormChange('active', checked ? 1 : 0)}           disabled={isLoading}
            />
            <Label htmlFor="active" className="font-normal">
              Marcar como meta activa
            </Label>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-100 p-2 rounded-md">{error}</p>}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="btn-outline-custom">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} variant="default" className="btn-primary-custom">
              {isLoading ? (editingGoal ? 'Guardando...' : 'Añadiendo...') : (editingGoal ? 'Guardar Cambios' : 'Añadir Meta')}\n            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormModal;