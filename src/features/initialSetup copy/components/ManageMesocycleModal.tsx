import React, { useState, useEffect } from 'react';
import type { StaticExercise, ChosenExerciseGoalData } from '../types';
import { useAuth } from '@/contexts/AuthContext';

// Importar subcomponentes de los pasos (se crearán/llenarán más adelante)
import Step1CategoryEquipment from './Step1CategoryEquipment';
import Step2ExerciseSelection from './Step2ExerciseSelection';
import Step3ParameterConfig from './Step3ParameterConfig';
import Step4ReviewAndCreate from './Step4ReviewAndCreate';

import * as StaticExerciseService from '../services/StaticExerciseService';

// Importar componentes de UI de Shadcn (ejemplos, se añadirán según se necesiten)
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

import type { GoalInsert } from '@/features/goalsManagement/types'; // Importar GoalInsert

interface ManageMesocycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalsCreated: (microcycleNumber: number) => void;
  // Prop para pasar la función handleAddGoal del hook useGoalsManagement
  // La firma de handleAddGoal en el hook es async (formData: GoalInsert) => void
  // y ya maneja el selectedMicrocycle internamente, pero para el primer microciclo siempre es 1.
  // El hook espera que formData no tenga microcycle, ya que lo añade él.
  // Así que el modal DEBE asegurar que targetMicrocycleNumber (que será 1) se use correctamente.
  // Es más simple si el hook handleAddGoal puede tomar opcionalmente el microciclo, o si el modal
  // prepara el formData con el microcycle correcto ANTES de llamar a handleAddGoal.
  // Revisando useGoalsManagement.handleAddGoal: él añade el 'selectedMicrocycle' del hook.
  // Para este modal, necesitamos que ese 'selectedMicrocycle' sea '1' cuando se llamen estas funciones.
  // Esto se puede manejar en GoalsManagementPage asegurando que selectedMicrocycle es 1 ANTES de que este modal llame a handleAddGoal.
  // O, este modal podría no usar directamente el handleAddGoal del hook si causa problemas con selectedMicrocycle,
  // y en su lugar usar directamente goalService.createGoal, y luego onGoalsCreated notifica para refrescar.
  // Para mantener la consistencia de UI (toasts, estado local del hook), usar el handleAddGoal del hook es preferible.
  // GoalsManagementPage se asegurará que selectedMicrocycle sea 1 antes de que esto se llame masivamente.
  // Alternativamente, si handleAddGoal se modifica para aceptar un microciclo: handleAddGoal(data, microcycleNum)
  // Por ahora, asumimos que GoalsManagementPage pondrá selectedMicrocycle = 1 antes de la iteración de submits.
  hookHandleAddGoal: (formData: GoalInsert) => Promise<void>; 
  targetMicrocycleNumber: number; // Siempre será 1 para este flujo
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

  // Estado para el Paso 1: Selección de Categorías y Equipamiento
  const [selectedGeneralCategories, setSelectedGeneralCategories] = useState<string[]>([]);
  const [selectedSpecificCategories, setSelectedSpecificCategories] = useState<{ [key: string]: string[] }>({});
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);

  // Estado para el Paso 2: Sugerencia y Selección de Ejercicios
  const [allStaticExercises, setAllStaticExercises] = useState<StaticExercise[]>([]); // Todos los datos del JSON
  const [suggestedExercises, setSuggestedExercises] = useState<StaticExercise[]>([]); // Filtrados para mostrar
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Estado para el Paso 3: Configuración de Parámetros (y se va llenando desde el Paso 2)
    console.log('[Modal][useEffect_isOpen] isOpen:', isOpen, 'allStaticExercises.length:', allStaticExercises.length);
  const [chosenExercises, setChosenExercises] = useState<ChosenExerciseGoalData[]>([]);

  // Estado para el Paso 4: Revisión y Envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);


  // Cargar todos los ejercicios estáticos cuando el modal se monta o se abre por primera vez
  useEffect(() => {

    if (isOpen && allStaticExercises.length === 0) { // Solo cargar si está abierto y no se han cargado aún
      const fetchData = async () => {


        StaticExerciseService.loadStaticExerciseData().then((data: StaticExercise[]) => {
            setAllStaticExercises(data);
            // console.log('[Modal] Static data primed/retrieved, count:', data.length);
        }).catch(err => {
            // console.error('[Modal] Error loading static exercise data:', err);
            setErrorModal('Error al cargar datos base de ejercicios.');
        });
      };
      fetchData();
    }
  }, [isOpen]); // Dependencia en isOpen para re-evaluar si es necesario (aunque la condición interna lo previene si ya están cargados)


  // Efecto para actualizar sugerencias cuando cambian las selecciones del Paso 1 y es el Paso 2
  useEffect(() => {
    if (currentStep === 2 && allStaticExercises.length > 0) {
    console.log('[Modal] Resetting modal state. Current step:', currentStep);
      // console.log('[Modal] Step 2 active, recalculating suggestions...');
      setIsLoadingSuggestions(true);
      // Simular un pequeño delay para la carga de sugerencias si es necesario
      // setTimeout(() => { 
        const suggestions: StaticExercise[] = StaticExerciseService.getExerciseSuggestions(
          allStaticExercises,
          selectedGeneralCategories,
          selectedSpecificCategories,
          selectedEquipment
        );
        setSuggestedExercises(suggestions);
        // console.log('[Modal] Suggestions updated, count:', suggestions.length);
        setIsLoadingSuggestions(false);

    }
  }, [currentStep, allStaticExercises, selectedGeneralCategories, selectedSpecificCategories, selectedEquipment]);

  const resetModalState = () => {
    console.log(`[Modal] Resetting modal state. Current step: ${currentStep}`);
    setCurrentStep(1);
    setSelectedGeneralCategories([]);
    setSelectedSpecificCategories({});
    setSelectedEquipment([]);
    setSuggestedExercises([]);
    setChosenExercises([]);
    setIsLoadingSuggestions(false);
    setIsSubmitting(false);
    setErrorModal(null);
  };

  const handleNextStep = () => {
    // Validaciones antes de pasar al siguiente paso
    if (currentStep === 1 && selectedGeneralCategories.length === 0) {
      setErrorModal("Por favor, selecciona al menos una categoría general.");
      return;
    }
    // Podríamos añadir más validaciones específicas por paso
    setErrorModal(null); // Limpiar error si pasa validación
    setCurrentStep(prev => prev + 1);
  };

  const handlePreviousStep = () => {
    setErrorModal(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleToggleChosenExercise = (exercise: StaticExercise, isSelected: boolean) => {
    setChosenExercises(prevChosen => {
      if (isSelected) {
        // Evitar duplicados si el ejercicio (o su variación) ya fue añadido por su ID de referencia estático o nombre (para custom)
        const alreadyExists = prevChosen.some(ce =>
          (exercise.id && ce.static_exercise_ref_id === exercise.id) ||
          (ce.is_custom && ce.exercise_name === exercise.name) // Check custom exercises by name
        );
        if (alreadyExists) {
          console.log('[Modal][handleToggleChosenExercise] Exercise already exists, skipping add.');
          return prevChosen;
        }

        const newChosenExercise: ChosenExerciseGoalData = {
          id: exercise.id || `static-goal-${Date.now()}-${Math.random()}`, // Use static ID or temp ID
          exercise_name: exercise.name,
          is_custom: false,
          static_exercise_ref_id: exercise.id,
          // Las categorías y parámetros se definirán en el siguiente paso
        };
        console.log('[Modal][handleToggleChosenExercise] Updated chosenExercises (add):', newChosenExercise);
        return [...prevChosen, newChosenExercise];
      } else {
        console.log('[Modal][handleToggleChosenExercise] Updated chosenExercises (remove).');
        // Eliminar por static_exercise_ref_id si existe, o por nombre si es custom
        return prevChosen.filter(ce =>
          !(exercise.id && ce.static_exercise_ref_id === exercise.id) &&
          !(ce.is_custom && ce.exercise_name === exercise.name)
        );
      }
    });
  };

  const handleAddCustomChosenExercise = (customName: string) => {
    // Lógica para añadir un ejercicio custom a chosenExercises
    setChosenExercises(prevChosen => {
      const alreadyExists = prevChosen.some(ce => ce.exercise_name === customName && ce.is_custom);
      if (alreadyExists) {
        // Podrías mostrar un error/toast aquí si se desea
        console.warn(`El ejercicio personalizado \"${customName}\" ya ha sido añadido.`);
        return prevChosen; // Explicitly return previous state if duplicate
      }
      const newCustomExercise: ChosenExerciseGoalData = {
        id: `custom-${Date.now()}-${Math.random()}`, // ID único temporal
        exercise_name: customName,
        is_custom: true,
        // Las categorías y parámetros se definirán en el siguiente paso
      };
      console.log('[Modal][handleAddCustomChosenExercise] Updated chosenExercises (add):', newCustomExercise);
      return [...prevChosen, newCustomExercise];
    });
  };

  const areAllChosenExercisesConfigured = (): boolean => {
    if (chosenExercises.length === 0) return false;
    return chosenExercises.every(ex => {
      const hasSets = typeof ex.sets === 'number' && ex.sets > 0;
      const hasReps = typeof ex.reps === 'number' && ex.reps > 0;
      const hasDuration = typeof ex.duration_seconds === 'number' && ex.duration_seconds > 0;
      const hasCustomCategory = ex.is_custom ? (ex.categories_general && ex.categories_general.length > 0) : true;
      // At least sets and (reps OR duration_seconds) are required
      return hasSets && (hasReps || hasDuration) && hasCustomCategory;
    });
  };

  const handleUpdateChosenExerciseParameter = (exerciseId: string, updatedParams: Partial<ChosenExerciseGoalData>) => {
    // Lógica para actualizar un ejercicio en chosenExercises
    setChosenExercises(prevChosen =>
      prevChosen.map(ex =>
        ex.id === exerciseId ? { ...ex, ...updatedParams } : ex
      )
    );
  };

  const handleSubmitAllGoalsWrapper = async () => {
    // Validaciones previas cruciales
    if (!user) {
      setErrorModal('Usuario no autenticado. Por favor, inicia sesión.');
      return; // No continuar si no hay usuario
    }
    if (chosenExercises.length === 0) {
      setErrorModal('No hay ejercicios elegidos para crear metas.');
      return; // No continuar si no hay ejercicios
    }
    if (!areAllChosenExercisesConfigured()) {
      setErrorModal('Algunos ejercicios no tienen definidos todos los parámetros obligatorios (sets y reps/duración, o categoría para personalizados). Revisa el paso 3.');
      return; // No continuar si no están configurados
    }

    setIsSubmitting(true);
    setErrorModal(null);
    let allSuccessful = true;
    let processedCount = 0;

    // Es crucial que selectedMicrocycle en useGoalsManagement sea targetMicrocycleNumber (1)
    // ANTES de que este bucle comience a llamar a hookHandleAddGoal.
    // GoalsManagementPage se encargará de esto en su onGoalsCreated o lógica de botón que abre el modal.

    for (const chosenEx of chosenExercises) {
      // Preparamos el objeto para GoalInsert, que es lo que espera hookHandleAddGoal.
      // GoalInsert (según goalsManagement/types.ts) omite 'id', 'user_id', 'created_at', 'updated_at', 'active'.
      // El hook `handleAddGoal` se encarga de añadir `microcycle` (usando su `selectedMicrocycle`),
      // `user_id` (del `useAuth`), y `active` (por defecto).
      const goalDataForHook: GoalInsert = {
        exercise_name: chosenEx.exercise_name,
        categories: [...(chosenEx.categories_general || []), ...(chosenEx.categories_specific || [])].filter(Boolean),
        sets: chosenEx.sets as number, // Asertamos a number porque areAllChosenExercisesConfigured() lo valida
        reps: chosenEx.reps as number, // Asertamos a number porque areAllChosenExercisesConfigured() lo valida
        weight: chosenEx.weight,
        duration_seconds: chosenEx.duration_seconds,
        notes: chosenEx.notes,
        microcycle: targetMicrocycleNumber, // Add the missing microcycle property
        // No incluimos 'active' aquí; el hook los gestiona.
      };

      // Limpiar claves opcionales con valor undefined para asegurar que no se envíen si no tienen valor
      (Object.keys(goalDataForHook) as Array<keyof GoalInsert>).forEach(key => {
        if (goalDataForHook[key] === undefined) {
          delete goalDataForHook[key];
        }
      });


      try {
        // hookHandleAddGoal es la prop que viene de useGoalsManagement.handleAddGoal
        await hookHandleAddGoal(goalDataForHook);
        processedCount++;
      } catch (_err: any) { // Use _err to indicate unused variable
        console.error(`[Modal] Error reported by hookHandleAddGoal for ${goalDataForHook.exercise_name}:`, _err);
        allSuccessful = false;
        setErrorModal((prevError) =>
          (prevError ? prevError + '\n' : '') + `Error al crear meta para '${goalDataForHook.exercise_name}'.`
        );
        // Continuamos para intentar añadir las demás metas
      }
    }

    setIsSubmitting(false);

    if (allSuccessful && processedCount === chosenExercises.length) {

      alert('¡Todas las metas del Microciclo ' + targetMicrocycleNumber + ' han sido procesadas exitosamente!');
      onGoalsCreated(targetMicrocycleNumber); // Notificar al padre para refrescar
      handleCloseModal(); // Cerrar y resetear el modal
    } else if (processedCount > 0 && !allSuccessful) {

       alert('Algunas metas fueron creadas, pero otras fallaron. Revisa los mensajes de error si los hubo (ver consola).');
       onGoalsCreated(targetMicrocycleNumber); // Para refrescar y ver las que sí se crearon
    } else if (!allSuccessful && processedCount === 0) {
        // Ninguna meta se pudo crear, el errorModal debería tener info o los toasts del hook ya aparecieron.
    }
  };

  const handleCloseModal = () => {
    resetModalState();
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1CategoryEquipment
          selectedGeneral={selectedGeneralCategories}
          onGeneralChange={setSelectedGeneralCategories}
          selectedSpecific={selectedSpecificCategories}
          onSpecificChange={setSelectedSpecificCategories}
          selectedEquipment={selectedEquipment}
          onEquipmentChange={setSelectedEquipment}
        />;
      case 2:
        return <Step2ExerciseSelection
          suggestedExercises={suggestedExercises}
          isLoading={isLoadingSuggestions}
          chosenExercises={chosenExercises}
          onToggleExercise={handleToggleChosenExercise}
          onAddCustomExercise={handleAddCustomChosenExercise}
          allStaticExercises={allStaticExercises} // Para que SuggestedExerciseItem pueda resolver variaciones
        />;
      case 3:
        return <Step3ParameterConfig
          exercisesToConfigure={chosenExercises}
          onUpdateExerciseParameters={handleUpdateChosenExerciseParameter}
        />;
      case 4:
        return <Step4ReviewAndCreate
          finalGoalConfigurations={chosenExercises}
          onSubmitGoals={handleSubmitAllGoalsWrapper} // El botón del footer lo llamará
          isSubmitting={isSubmitting}
          error={errorModal}
        />;
      default:
        return <div>Paso Desconocido</div>;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => !openState && handleCloseModal()}>
      <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col">
        <DialogHeader className="p-4.5 pb-3.5 border-b">
          <DialogTitle className="text-xl">
            Gestionar Mesociclo (Paso {currentStep})
          </DialogTitle>
          {/* La descripción podría cambiar según el paso */}
          <DialogDescription>
            Sigue los pasos para configurar las metas de tu primer microciclo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4.5 space-y-4">
          {renderStepContent()}
        </div>

        {/* Los botones de navegación y envío irán aquí, posiblemente en el DialogFooter */}
        {/* y su visibilidad/acción dependerá del currentStep */}
        <DialogFooter className="p-4.5 pt-3.5 border-t">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handlePreviousStep} disabled={isSubmitting}>
              Anterior
            </Button>
          )}
          {currentStep < 4 && (
            <Button onClick={handleNextStep} disabled={isSubmitting || (currentStep === 1 && selectedGeneralCategories.length === 0) || (currentStep === 2 && chosenExercises.length === 0) || (currentStep === 3 && !areAllChosenExercisesConfigured()) }>
              Siguiente
            </Button>
          )}
          {currentStep === 4 && (
            <Button onClick={handleSubmitAllGoalsWrapper} disabled={isSubmitting || chosenExercises.length === 0}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Crear Metas
            </Button>
          )}
          {/* <DialogClose asChild>
            <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
          </DialogClose> */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageMesocycleModal;