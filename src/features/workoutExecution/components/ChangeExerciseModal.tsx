// training/src/features/workoutExecution/components/ChangeExerciseModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import type { Goal } from '@/features/goalsManagement/types';
import { fetchAllActiveUserGoals } from '@/features/goalsManagement/services/goalService';

interface ChangeExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCategoryFilters: string[];
  onExerciseSelected: (selectedGoal: Goal) => void;
  selectedMicrocycle: number | null; // <-- NEW PROP
}

const ChangeExerciseModal: React.FC<ChangeExerciseModalProps> = ({
  isOpen,
  onClose,
  currentCategoryFilters,
  onExerciseSelected,
  selectedMicrocycle, // <-- Destructure new prop
}) => {
  const { user } = useAuth();
  const [allUserGoals, setAllUserGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if modal is open, user exists, AND a microcycle is selected
    if (isOpen && user?.id && selectedMicrocycle !== null) { 
      setIsLoading(true);
      setError(null);
      setSearchTerm(''); 

      // Pass selectedMicrocycle to the service function
      fetchAllActiveUserGoals(user.id, selectedMicrocycle) 
        .then(data => {
          setAllUserGoals(data || []); 
        })
        .catch(err => {
          console.error("Failed to fetch user goals for modal:", err);
          setError("No se pudieron cargar los ejercicios para este microciclo. Intenta de nuevo.");
          setAllUserGoals([]); 
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (isOpen && !user?.id) {
        setError("Usuario no autenticado. No se pueden cargar ejercicios.");
        setIsLoading(false);
        setAllUserGoals([]);
    } else if (isOpen && selectedMicrocycle === null) {
        setError("No hay un microciclo seleccionado para cargar ejercicios.");
        setIsLoading(false);
        setAllUserGoals([]);
    }
  }, [isOpen, user?.id, selectedMicrocycle]); // <-- Added selectedMicrocycle to dependencies

  const filteredExercises = useMemo(() => {
    let exercisesToFilter: Goal[] = allUserGoals;

    if (currentCategoryFilters.length > 0) {
      exercisesToFilter = exercisesToFilter.filter(goal =>
        goal.categories?.some(cat => currentCategoryFilters.includes(cat))
      );
    }

    if (searchTerm.trim() !== '') {
      exercisesToFilter = exercisesToFilter.filter(goal =>
        goal.exercise_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return exercisesToFilter;
  }, [allUserGoals, currentCategoryFilters, searchTerm]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[calc(100vh-4rem)] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">
            Seleccionar Ejercicio del Microciclo {selectedMicrocycle ?? ''}
          </DialogTitle>
          <DialogDescription>
            Elige un ejercicio (meta activa) de este microciclo para reemplazar el actual.
            {currentCategoryFilters.length > 0 
              ? ` Se muestran ejercicios de ${currentCategoryFilters.length} categorí${currentCategoryFilters.length === 1 ? 'a' : 'as'} seleccionada${currentCategoryFilters.length === 1 ? '' : 's'}.`
              : ' Se muestran todos los ejercicios activos del microciclo.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre de ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchTerm('')}
              >
                <XCircle className="h-4 w-4 text-muted-foreground"/>
              </Button>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-hidden px-6">
          {isLoading ? ( /* ... */ <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>)
           : error ? ( /* ... */ <div className="flex flex-col justify-center items-center h-full text-center px-4"><p className="text-destructive">{error}</p><Button variant="outline" onClick={onClose} className="mt-4">Cerrar</Button></div>)
           : (
            <ScrollArea className="h-full pr-2 -mr-2">
              {filteredExercises.length > 0 ? (
                <div className="space-y-1 py-1">
                  {filteredExercises.map(goal => (
                    <Button
                      key={goal.id}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-2.5 px-3"
                      onClick={() => { onExerciseSelected(goal); }}
                    >
                      <div>
                        <p className="font-medium text-sm leading-snug">{goal.exercise_name}</p> 
                        {goal.categories && goal.categories.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {goal.categories.join(' / ')}
                          </p>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-full">
                    <p className="text-sm text-muted-foreground text-center py-10 px-4">
                    No hay ejercicios (metas) que coincidan para este microciclo y filtros.
                    </p>
                </div>
              )}
            </ScrollArea>
          )}
        </div>
        
        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild> 
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeExerciseModal;