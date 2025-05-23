import React, { useState, useEffect, useCallback } from 'react';
import type { LibraryExercise, ChosenExerciseGoalData } from '../types'; 
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

import Step1CategoryEquipment from './Step1CategoryEquipment';
import Step2ExerciseSelection from './Step2ExerciseSelection';
import Step3ParameterConfig from './Step3ParameterConfig';
import Step4ReviewAndCreate from './Step4ReviewAndCreate';

import * as exerciseLibraryService from '../services/exerciseLibraryService';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import type { GoalInsert } from '@/features/goalsManagement/types';

interface SpecificCategorySelection {
  [generalCategory: string]: string[];
}

interface ManageMesocycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalsCreated: (microcycleNumber: number) => void;
  hookHandleAddGoal: (formData: GoalInsert) => Promise<void>; 
  targetMicrocycleNumber: number;
}

const ManageMesocycleModal: React.FC<ManageMesocycleModalProps> = ({
  isOpen,
  onClose,
  onGoalsCreated,
  hookHandleAddGoal,
  targetMicrocycleNumber,
}) => {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);

  // Paso 1 State
  const [selectedGeneralCategories, setSelectedGeneralCategories] = useState<string[]>([]);
  const [selectedSpecificCategories, setSelectedSpecificCategories] = useState<SpecificCategorySelection>({});
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Paso 2 State
  const [suggestedExercises, setSuggestedExercises] = useState<LibraryExercise[]>([]); 
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Paso 3 State (configured exercises)
  const [chosenExercises, setChosenExercises] = useState<ChosenExerciseGoalData[]>([]);

  // Paso 4 State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const resetModalState = useCallback(() => {
    console.log(`[Modal] Resetting modal state.`);
    setCurrentStep(1);
    setSelectedGeneralCategories([]);
    setSelectedSpecificCategories({});
    setSelectedEquipment([]);
    setSuggestedExercises([]);
    setChosenExercises([]);
    setIsLoadingSuggestions(false);
    setIsSubmitting(false);
    setErrorModal(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    resetModalState();
    onClose();
  }, [onClose, resetModalState]);

  // Validación para el paso 3: asegura que todos los ejercicios tienen los parámetros mínimos
  const areAllChosenExercisesConfigured = useCallback((): boolean => {
    if (chosenExercises.length === 0) return false;
    return chosenExercises.every(ex => {
      const hasSets = typeof ex.sets === 'number' && ex.sets > 0;
      const hasReps = typeof ex.reps === 'number' && ex.reps > 0;
      const hasDuration = typeof ex.duration_seconds === 'number' && ex.duration_seconds > 0;
      
      const hasCustomCategory = ex.is_custom ? (ex.categories_general.length > 0) : true;

      return hasSets && (hasReps || hasDuration) && hasCustomCategory;
    });
  }, [chosenExercises]);

  const handleNextStep = useCallback(() => {
    setErrorModal(null);

    if (currentStep === 1) {
      if (selectedGeneralCategories.length === 0 && selectedEquipment.length === 0) {
        setErrorModal("Por favor, selecciona al menos una categoría general o una opción de equipamiento para buscar ejercicios.");
        return;
      }
    } else if (currentStep === 2) {
      if (chosenExercises.length === 0) {
        setErrorModal("Por favor, selecciona al menos un ejercicio o añade uno personalizado.");
        return;
      }
      const customExercisesWithoutCategories = chosenExercises.filter(ex => 
        ex.is_custom && (ex.categories_general.length === 0)
      );
      if (customExercisesWithoutCategories.length > 0) {
        setErrorModal("Algunos ejercicios personalizados no tienen una categoría general asignada. Por favor, revísalos.");
        return;
      }
    } else if (currentStep === 3) {
      if (!areAllChosenExercisesConfigured()) {
        setErrorModal('Algunos ejercicios no tienen definidos todos los parámetros obligatorios (sets y reps/duración).');
        return;
      }
    }
    
    setCurrentStep(prev => prev + 1);
  }, [currentStep, selectedGeneralCategories, selectedEquipment, chosenExercises, areAllChosenExercisesConfigured]);

  const handlePreviousStep = useCallback(() => {
    setErrorModal(null);
    setCurrentStep(prev => prev - 1);
  }, []);

  const handleToggleChosenExercise = useCallback((exercise: LibraryExercise, isSelected: boolean) => {
    setChosenExercises(prevChosen => {
      if (isSelected) {
        const alreadyExists = prevChosen.some(ce => ce.library_exercise_id === exercise.id);
        if (alreadyExists) {
          toast.info(`"${exercise.exercise_name}" ya ha sido seleccionado.`);
          return prevChosen;
        }

        const newChosenExercise: ChosenExerciseGoalData = {
          id: exercise.id,
          exercise_name: exercise.exercise_name,
          is_custom: false,
          library_exercise_id: exercise.id,
          equipment_needed: exercise.equipment_needed || [], // <-- ADD THIS LINE, default to empty array
          // *** CORRECCIÓN CLAVE: NO usar default_sets aquí, dejar que Step3 lo sugiera ***
          sets: '',
          reps: exercise.default_reps ?? '',
          weight: exercise.default_weight ?? '',
          duration_seconds: exercise.default_duration_seconds ?? '',
          categories_general: exercise.general_categories,
          categories_specific: exercise.specific_categories,
          notes: exercise.description,
          active: 1,
        };
        console.log('[Modal] Added chosen exercise:', newChosenExercise);
        return [...prevChosen, newChosenExercise];
      } else {
        console.log('[Modal] Removed chosen exercise with ID:', exercise.id);
        return prevChosen.filter(ce => ce.library_exercise_id !== exercise.id);
      }
    });
  }, []);

  const handleAddCustomChosenExercise = useCallback((customName: string, generalCategories: string[], specificCategories: string[]) => {
    setChosenExercises(prevChosen => {
      const alreadyExists = prevChosen.some(ce => ce.exercise_name.toLowerCase() === customName.toLowerCase() && ce.is_custom);
      if (alreadyExists) {
        toast.info(`El ejercicio personalizado "${customName}" ya ha sido añadido.`);
        return prevChosen;
      }
      const newCustomExercise: ChosenExerciseGoalData = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        exercise_name: customName,
        is_custom: true,
        sets: '', 
        reps: '',
        weight: '',
        duration_seconds: '',
        notes: null,
        active: 1,
        categories_general: generalCategories,
        categories_specific: specificCategories,
      };
      console.log('[Modal] Added custom exercise:', newCustomExercise);
      return [...prevChosen, newCustomExercise];
    });
  }, []);

  const handleUpdateChosenExerciseParameter = useCallback((exerciseId: string, updatedParams: Partial<ChosenExerciseGoalData>) => {
    setChosenExercises(prevChosen =>
      prevChosen.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updatedParams } : ex
      )
    );
  }, []);

  const handleSubmitAllGoalsWrapper = useCallback(async () => {
    if (!user?.id) {
      setErrorModal('Usuario no autenticado. Por favor, inicia sesión.');
      toast.error('Usuario no autenticado.');
      return;
    }
    if (chosenExercises.length === 0) {
      setErrorModal('No hay ejercicios elegidos para crear metas.');
      toast.error('No hay ejercicios elegidos para crear metas.');
      return;
    }
    if (!areAllChosenExercisesConfigured()) {
      setErrorModal('Algunos ejercicios no tienen definidos todos los parámetros obligatorios (sets y reps/duración, o categoría para personalizados). Revisa el paso 3.');
      toast.error('Configuración de ejercicios incompleta.');
      return;
    }

    setIsSubmitting(true);
    setErrorModal(null);
    let allSuccessful = true;
    let processedCount = 0;

    console.log('[Modal] Submitting goals. Chosen exercises:', chosenExercises);

    for (const chosenEx of chosenExercises) {
      const combinedCategories = [
        ...chosenEx.categories_general,
        ...chosenEx.categories_specific
      ].filter(cat => cat && cat.trim() !== '');

      const goalDataForHook: GoalInsert = {
        user_id: user.id,
        exercise_name: chosenEx.exercise_name,
        microcycle: targetMicrocycleNumber,
        categories: combinedCategories,
        sets: typeof chosenEx.sets === 'number' ? chosenEx.sets : 0,
        reps: typeof chosenEx.reps === 'number' ? chosenEx.reps : null,
        weight: typeof chosenEx.weight === 'number' ? chosenEx.weight : null,
        duration_seconds: typeof chosenEx.duration_seconds === 'number' ? chosenEx.duration_seconds : null,
        notes: chosenEx.notes || null,
        exercise_library_id: chosenEx.library_exercise_id || null,
        equipment_needed: chosenEx.equipment_needed || [],
        active: chosenEx.active !== undefined ? chosenEx.active : 1,
      };

      try {
        console.log(`[Modal] Attempting to add goal for '${goalDataForHook.exercise_name}' with microcycle ${goalDataForHook.microcycle}`);
        await hookHandleAddGoal(goalDataForHook);
        processedCount++;
        console.log(`[Modal] Successfully added goal for '${goalDataForHook.exercise_name}'.`);
      } catch (err: any) {
        console.error(`[Modal] Error al crear meta para '${goalDataForHook.exercise_name}':`, err);
        allSuccessful = false;
        setErrorModal((prevError) =>
          (prevError ? prevError + '\n' : '') + `Error al crear meta para '${goalDataForHook.exercise_name}'.`
        );
        toast.error(`Falló la meta para ${goalDataForHook.exercise_name}`);
      }
    }

    setIsSubmitting(false);

    if (allSuccessful) {
      toast.success(`¡Todas las ${processedCount} metas para el Microciclo ${targetMicrocycleNumber} creadas exitosamente!`);
      onGoalsCreated(targetMicrocycleNumber);
      handleCloseModal();
    } else if (processedCount > 0) {
      toast.warning(`Algunas metas fueron creadas (${processedCount}/${chosenExercises.length}), pero otras fallaron. Revisa los mensajes de error.`);
      onGoalsCreated(targetMicrocycleNumber);
    } else {
      toast.error('Ninguna meta pudo ser creada.');
    }
  }, [user?.id, chosenExercises, targetMicrocycleNumber, areAllChosenExercisesConfigured, hookHandleAddGoal, onGoalsCreated, handleCloseModal]);

  useEffect(() => {
    if (isOpen && currentStep === 2 && user?.id) {
      console.log('[Modal useEffect] Step 2 active, fetching suggestions...');
      setIsLoadingSuggestions(true);
      setErrorModal(null);

      const allSelectedSpecificCategories = Object.values(selectedSpecificCategories).flat();

      exerciseLibraryService.fetchLibraryExercises({
        generalCategories: selectedGeneralCategories,
        specificCategories: allSelectedSpecificCategories,
        equipment: selectedEquipment,
      })
      .then((data: LibraryExercise[]) => {
        setSuggestedExercises(data);
        console.log(`[Modal] Fetched ${data.length} suggestions.`);
      })
      .catch(err => {
        console.error('[Modal] Error fetching library exercises for suggestions:', err);
        setErrorModal('Error al cargar sugerencias de ejercicios. ' + err.message);
        toast.error('Error al cargar sugerencias de ejercicios.');
      })
      .finally(() => {
        setIsLoadingSuggestions(false);
      });
    }
  }, [isOpen, currentStep, user?.id, selectedGeneralCategories, selectedSpecificCategories, selectedEquipment]);

  useEffect(() => {
    if (!isOpen) {
      resetModalState();
    }
  }, [isOpen, resetModalState]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return <Step1CategoryEquipment
          selectedGeneral={selectedGeneralCategories}
          onGeneralChange={setSelectedGeneralCategories}
          selectedSpecific={selectedSpecificCategories}
          onSpecificChange={setSelectedSpecificCategories}
          selectedEquipment={selectedEquipment} // ¡CORREGIDO! Pasar el estado, no el setter
          onEquipmentChange={setSelectedEquipment}
        />;
      case 2:
        return <Step2ExerciseSelection
          suggestedExercises={suggestedExercises}
          isLoading={isLoadingSuggestions}
          chosenExercises={chosenExercises}
          onToggleExercise={handleToggleChosenExercise}
          onAddCustomExercise={handleAddCustomChosenExercise}
        />;
      case 3:
        return <Step3ParameterConfig
          exercisesToConfigure={chosenExercises}
          onUpdateExerciseParameters={handleUpdateChosenExerciseParameter}
        />;
      case 4:
        return <Step4ReviewAndCreate
          finalGoalConfigurations={chosenExercises}
          onSubmitGoals={handleSubmitAllGoalsWrapper}
          isSubmitting={isSubmitting}
          error={errorModal}
        />;
      default:
        return <div>Paso Desconocido</div>;
    }
  }, [
    currentStep,
    selectedGeneralCategories, setSelectedGeneralCategories,
    selectedSpecificCategories, setSelectedSpecificCategories,
    selectedEquipment, setSelectedEquipment, // Aquí también se refiere al estado `selectedEquipment`
    suggestedExercises, isLoadingSuggestions,
    chosenExercises, handleToggleChosenExercise, handleAddCustomChosenExercise,
    handleUpdateChosenExerciseParameter,
    isSubmitting, errorModal, handleSubmitAllGoalsWrapper
  ]);

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && handleCloseModal()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[calc(100vh-4rem)] flex flex-col p-0">
        <DialogHeader className="p-4.5 pb-3.5 border-b">
          <DialogTitle className="text-xl">
            Crear Metas (Paso {currentStep} de 4)
          </DialogTitle>
          <DialogDescription>
            Sigue los pasos para configurar las metas de tu primer microciclo ({targetMicrocycleNumber}).
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4.5 space-y-4">
          {errorModal && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">¡Error!</strong>
              <span className="block sm:inline ml-2">{errorModal}</span>
            </div>
          )}
          {renderStepContent()}
        </div>

        <DialogFooter className="p-4.5 pt-3.5 border-t flex justify-between sm:justify-end gap-2">
          {currentStep > 1 && (
            <Button type="button" variant="outline" onClick={handlePreviousStep} disabled={isSubmitting}>
              Anterior
            </Button>
          )}
          {currentStep < 4 && (
            <Button 
              type="button" 
              onClick={handleNextStep} 
              disabled={
                isSubmitting || 
                (currentStep === 1 && selectedGeneralCategories.length === 0 && selectedEquipment.length === 0) ||
                (currentStep === 2 && (chosenExercises.length === 0 || chosenExercises.some(ex => ex.is_custom && ex.categories_general.length === 0))) || 
                (currentStep === 3 && !areAllChosenExercisesConfigured())
              }
            >
              Siguiente
            </Button>
          )}
          {currentStep === 4 && (
            <Button 
              type="button" 
              onClick={handleSubmitAllGoalsWrapper} 
              disabled={isSubmitting || chosenExercises.length === 0 || !areAllChosenExercisesConfigured()}
              className="btn-primary-custom"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear Metas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMesocycleModal;