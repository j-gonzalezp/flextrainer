import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as goalService from '../services/goalService';
import type { Goal, GoalInsert, GoalUpdate, DisplayableDoneExercise, SortableGoalKeys, ProposedGoal, GoalPerformance } from '../types';
import { toast } from 'sonner';

export const useGoalsManagement = () => {
  const { user } = useAuth();

  // State Variables
  const [microcycles, setMicrocycles] = useState<number[]>([]);
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<number | null>(null);
  const [isLoadingMicrocycles, setIsLoadingMicrocycles] = useState(true);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortableGoalKeys; direction: 'asc' | 'desc' } | null>(null);

  const [doneExercises, setDoneExercises] = useState<DisplayableDoneExercise[]>([]);
  const [isLoadingDoneExercises, setIsLoadingDoneExercises] = useState(false);

  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isLoadingNextMicrocycle, setIsLoadingNextMicrocycle] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNextMicrocycleWizardOpen, setIsNextMicrocycleWizardOpen] = useState(false);
  const [proposedNextGoals, setProposedNextGoals] = useState<ProposedGoal[]>([]);

  // Memoized Derived State
  const completedSetsPerGoal = useMemo(() => {
    console.log('[useGoalsManagement] Recalculating completed sets per goal from doneExercises:', doneExercises);
    const counts: { [goalId: string]: number } = {};
    if (doneExercises && doneExercises.length > 0) {
      doneExercises.forEach(de => {
        if (de.goal_id) { // Ensure goal_id exists
          counts[de.goal_id.toString()] = (counts[de.goal_id.toString()] || 0) + 1; // Use toString for goal_id as key
        }
      });
    }
    console.log('[useGoalsManagement] Completed sets per goal calculated:', counts);
    return counts;
  }, [doneExercises]);
  
  // NUEVO: Calcular rendimiento detallado por meta
  // Modificado: Calcular rendimiento detallado por meta (sin RPE)
  const goalsPerformance = useMemo(() => {
    console.log('[useGoalsManagement] Calculating detailed goals performance from doneExercises and goals. (No RPE)');
    const performanceMap: { [goalId: string]: GoalPerformance } = {};

    goals.forEach(goal => {
      const relevantDoneExercises = doneExercises.filter(de => de.goal_id === goal.id);
      let totalSets = 0;
      let totalRepsSum = 0;
      let totalWeightSum = 0; // Para calcular volumen total
      let setsMeetingTarget = 0; // Keep this for wasCompleted logic

      relevantDoneExercises.forEach(de => {
        totalSets += 1;
        totalRepsSum += de.reps || 0;
        totalWeightSum += (de.weight_lifted || 0) * (de.reps || 0); // Volumen levantado = Peso * Reps
        if (de.reps && goal.target_reps && de.reps >= goal.target_reps) {
          setsMeetingTarget++;
        }
      });

      const averageRepsPerSet = totalSets > 0 ? totalRepsSum / totalSets : 0;
      const averageWeightPerSet = totalSets > 0 ? (totalWeightSum / totalSets) / totalSets : 0; // Promedio de peso POR SET (corregido)
      // NOTA: averageWeightPerSet es el promedio del peso levantado por set.

      // Lógica de "cumplida":
      // Consideramos cumplida si el número total de sets completados es >= al objetivo
      // Y el promedio de reps por set es >= al objetivo de reps
      const wasCompleted = (totalSets >= (goal.target_sets || 0)) && (averageRepsPerSet >= (goal.target_reps || 0));

      performanceMap[goal.id.toString()] = {
        goalId: goal.id.toString(),
        totalSetsCompleted: totalSets,
        totalRepsCompleted: totalRepsSum,
        averageRepsPerSet: parseFloat(averageRepsPerSet.toFixed(1)), // Redondea para visualización
        averageWeightPerSet: parseFloat(averageWeightPerSet.toFixed(1)), // Redondea para visualización
        wasCompleted: wasCompleted,
        setsMet: setsMeetingTarget,
        repsMet: averageRepsPerSet, // Repeticiones promedio logradas
      };
    });
    console.log('[useGoalsManagement] Goals performance calculated (No RPE):', performanceMap);
    return performanceMap;
  }, [goals, doneExercises]); // Dependencias: `goals` y `doneExercises`

  const availableCategories = useMemo(() => {
    console.log('[useGoalsManagement] Recalculating available categories from goals:', goals);
    const allCats = new Set<string>();
    goals.forEach(goal => {
      goal.categories?.forEach(cat => allCats.add(cat));
    });
    const sortedCategories = Array.from(allCats).sort();
    console.log('[useGoalsManagement] Available categories calculated:', sortedCategories);
    return sortedCategories;
  }, [goals]);

  const displayedGoals = useMemo(() => {
    console.log('[useGoalsManagement] Processing displayedGoals. Raw goal count:', goals.length, 'Filters:', selectedCategoryFilters, 'Sort:', sortConfig, 'CompletedSetCounts:', completedSetsPerGoal);
    // Map goals to include completedSetsCount
    let processedGoals = goals.map(goal => ({
      ...goal,
      completedSetsCount: completedSetsPerGoal[goal.id.toString()] || 0,
      performance: goalsPerformance[goal.id.toString()] // <-- Añadir esta línea
    }));
    console.log('[useGoalsManagement] Goals after mapping completedSetsCount. Raw goal count:', goals.length, 'Count after mapping completed sets:', processedGoals.length);

    // Apply category filters
    if (selectedCategoryFilters.length > 0) {
      processedGoals = processedGoals.filter(goal =>
        goal.categories?.some(cat => selectedCategoryFilters.includes(cat))
      );
      console.log('[useGoalsManagement] Goals after category filtering:', processedGoals.length);
    }

    // Apply sorting
    if (sortConfig) {
      processedGoals.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue == null && bValue != null) return 1;
        if (aValue != null && bValue == null) return -1;
        if (aValue == null && bValue == null) return 0;

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
      console.log('[useGoalsManagement] Goals after sorting:', processedGoals.length);
    }
    return processedGoals;
  }, [goals, selectedCategoryFilters, sortConfig, completedSetsPerGoal, goalsPerformance]); // <-- Añadir goalsPerformance a las dependencias

  // Callback Handlers
  const handleToggleCategoryFilter = useCallback((category: string) => {
    setSelectedCategoryFilters(prevFilters => {
      const newFilters = prevFilters.includes(category)
        ? prevFilters.filter(f => f !== category)
        : [...prevFilters, category];
      console.log('[useGoalsManagement] Category filter toggled. Category:', category, 'New filters:', newFilters);
      return newFilters;
    });
  }, []);

  const handleClearCategoryFilters = useCallback(() => {
    setSelectedCategoryFilters([]);
    console.log('[useGoalsManagement] Category filters cleared.');
  }, []);

  const handleRequestSort = useCallback((key: SortableGoalKeys) => {
    setSortConfig(prevConfig => {
      let newSortConfig: { key: SortableGoalKeys; direction: 'asc' | 'desc' } | null = null;
      if (prevConfig && prevConfig.key === key) {
        if (prevConfig.direction === 'asc') {
          newSortConfig = { key, direction: 'desc' as const };
        } else {
          newSortConfig = null; // Clear sort if it was 'desc'
        }
      } else {
        newSortConfig = { key, direction: 'asc' as const }; // New key, sort 'asc'
      }
      console.log('[useGoalsManagement] Sort requested for key:', key, 'New config:', newSortConfig);
      return newSortConfig;
    });
  }, []); 

  // Effect Hooks
  useEffect(() => {
    if (user?.id) {
      console.log('[useGoalsManagement] useEffect (fetch user microcycles): Triggered. User ID:', user.id);
      setError(null);

      goalService.fetchMicrocyclesForUser(user.id)
        .then(fetchedUserMicrocycles => {
          console.log('[useGoalsManagement] useEffect (fetch user microcycles): Service responded. Fetched microcycles:', fetchedUserMicrocycles);
          setMicrocycles(fetchedUserMicrocycles);
          if (fetchedUserMicrocycles.length > 0 && selectedMicrocycle === null) {
            const latestMicrocycle = fetchedUserMicrocycles[fetchedUserMicrocycles.length - 1];
            setSelectedMicrocycle(latestMicrocycle);
            console.log('[useGoalsManagement] useEffect (fetch user microcycles): Auto-selected latest microcycle:', latestMicrocycle);
          } else if (fetchedUserMicrocycles.length === 0) {
            setSelectedMicrocycle(null);
            setGoals([]);
            setDoneExercises([]);
            console.log('[useGoalsManagement] useEffect (fetch user microcycles): No microcycles found.');
          }
        })
        .catch(err => {
          console.error('[useGoalsManagement] Error fetching user microcycles:', err);
          setError('Failed to load available microcycles.');
          setMicrocycles([]);
          setSelectedMicrocycle(null);
        })
        .finally(() => {
          setIsLoadingMicrocycles(false);
          console.log('[useGoalsManagement] useEffect (fetch user microcycles): Finished loading microcycles.');
        });
    } else {
      setMicrocycles([]);
      setSelectedMicrocycle(null);
      setGoals([]);
      setDoneExercises([]);
      setIsLoadingMicrocycles(false);
      setIsLoadingGoals(false);
      setIsLoadingDoneExercises(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const currentSelectedMicrocycle = selectedMicrocycle;
    console.log('[useGoalsManagement] useEffect (fetch metas y ejercicios hechos): Disparado. User ID:', user?.id, 'Microciclo seleccionado:', currentSelectedMicrocycle);

    if (user?.id && currentSelectedMicrocycle !== null) {
      setIsLoadingGoals(true);
      setIsLoadingDoneExercises(true);
      setError(null);

      Promise.all([
        goalService.fetchGoalsForMicrocycle(user.id, currentSelectedMicrocycle),
        goalService.fetchDoneExercisesForMicrocycle(user.id, currentSelectedMicrocycle)
      ])
        .then(([fetchedGoals, fetchedDoneExercises]) => {
          console.log('[useGoalsManagement] useEffect (fetch metas y ejercicios hechos): Service responded.');
          setGoals(fetchedGoals);
          console.log('[useGoalsManagement] useEffect (fetch metas y ejercicios hechos): Metas planeadas actualizadas:', fetchedGoals);
          setDoneExercises(fetchedDoneExercises);
          console.log('[useGoalsManagement] useEffect (fetch metas y ejercicios hechos): Ejercicios completados actualizados:', fetchedDoneExercises);
        })
        .catch(err => {
          console.error(`[useGoalsManagement] Error fetching data for microcycle ${currentSelectedMicrocycle}:`, err);
          setError("Error al cargar datos para el microciclo.");
          setGoals([]);
          setDoneExercises([]);
        })
        .finally(() => {
          setIsLoadingGoals(false);
          setIsLoadingDoneExercises(false);
          console.log('[useGoalsManagement] useEffect (fetch metas y ejercicios hechos): Finished loading.');
        });
    } else {
      setGoals([]); 
      setDoneExercises([]); 
      setIsLoadingGoals(false); 
      setIsLoadingDoneExercises(false);
    }
  }, [user?.id, selectedMicrocycle]);

  const handleSelectMicrocycle = useCallback((microcycleNumber: number | string) => {
    const num = typeof microcycleNumber === 'string' ? parseInt(microcycleNumber, 10) : microcycleNumber;
    if (!isNaN(num)) {
        console.log('[useGoalsManagement] handleSelectMicrocycle: Microciclo seleccionado:', num);
        setSelectedMicrocycle(num);
    }
  }, []);

  const refreshMicrocycles = useCallback(async () => {
    console.log('[useGoalsManagement] refreshMicrocycles: Initiating. User ID:', user?.id);
    if (user?.id) {
      setIsLoadingMicrocycles(true);
      try {
        const data = await goalService.fetchMicrocyclesForUser(user.id);
        console.log('[useGoalsManagement] refreshMicrocycles: Service responded. Fetched microcycles:', data);
        setMicrocycles(data);
        if (data.length > 0 && (selectedMicrocycle === null || !data.includes(selectedMicrocycle))) {
            const latestMicrocycle = data[data.length - 1];
            setSelectedMicrocycle(latestMicrocycle);
             console.log('[useGoalsManagement] refreshMicrocycles: Auto-selected latest microcycle after refresh:', latestMicrocycle);
        } else if (data.length === 0) {
            setSelectedMicrocycle(null);
            setGoals([]);
            setDoneExercises([]);
             console.log('[useGoalsManagement] refreshMicrocycles: No microciclos after refresh.');
        } else {
             console.log('[useGoalsManagement] refreshMicrocycles: Kept current selected microcycle:', selectedMicrocycle);
        }
        return data;
      } catch (err) {
        console.error("[useGoalsManagement] Error refreshing microcycles:", err);
        setError("Error al recargar microciclos.");
        return microcycles; 
      } finally {
        setIsLoadingMicrocycles(false);
        console.log('[useGoalsManagement] refreshMicrocycles: Finished refreshing microcycles.');
      }
    }
    return microcycles; 
  }, [user?.id, microcycles, selectedMicrocycle]); 

  // Modificado: Lógica de progresión de metas (sin RPE)
  const suggestProgression = useCallback((goal: Goal, performance: GoalPerformance): ProposedGoal => {
    const baseGoal: Omit<GoalInsert, 'user_id' | 'microcycle'> = {
      exercise_name: goal.exercise_name,
      target_sets: goal.target_sets,
      target_reps: goal.target_reps,
      comments: goal.comments,
      categories: goal.categories,
      active: 1,
    };

    if (performance.wasCompleted) {
      // Si la meta se cumplió, sugerir progresión
      const currentSets = goal.target_sets || 0;
      const currentReps = goal.target_reps || 0;

      let newSets = currentSets;
      let newReps = currentReps;
      let suggestionText = '';

      // Estrategia de progresión simplificada (sin RPE):
      // Priorizar aumento de reps si reps son bajas a moderadas.
      // Si reps ya son altas, priorizar aumento de sets.

      if (currentReps < 12) { // Umbral arbitrario para reps (ej. 12 reps)
        newReps = currentReps + 1;
        suggestionText = `Sugerencia: ${newSets}x${newReps} (aumentar repeticiones)`;
      } else {
        newSets = currentSets + 1;
        suggestionText = `Sugerencia: ${newSets}x${newReps} (aumentar sets)`;
      }

      toast.info(`${goal.exercise_name}: ${suggestionText}`, {
        description: `Meta anterior: ${currentSets}x${currentReps}. Cumplida: Sí.`,
        duration: 3000
      });

      console.log(`[useGoalsManagement] suggestProgression: Goal ${goal.exercise_name} was completed. Suggesting progression to ${newSets} sets, ${newReps} reps.`);
      return {
        ...baseGoal,
        target_sets: newSets,
        target_reps: newReps,
        originalGoalId: goal.id,
        performance: performance,
        includeInNextMicrocycle: true,
        user_id: user!.id, // Added missing user_id
        microcycle: (selectedMicrocycle || 0) + 1, // Added missing microcycle
      };
    } else {
      // Si la meta NO se cumplió, sugerir repetirla tal cual
      toast.info(`${goal.exercise_name}: Repetir objetivo original`, {
        description: `Meta anterior: ${goal.target_sets}x${goal.target_reps}. Cumplida: No.`,
        duration: 3000
      });
      console.log(`[useGoalsManagement] suggestProgression: Goal ${goal.exercise_name} was NOT completed. Suggesting to repeat original goal.`);
      return {
        ...baseGoal,
        originalGoalId: goal.id,
        performance: performance,
        includeInNextMicrocycle: true,
        user_id: user!.id, // Added missing user_id
        microcycle: (selectedMicrocycle || 0) + 1, // Added missing microcycle
      };
    }
  }, []); // Dependencias: Ninguna función externa mutable.
  
  // Función para preparar las metas para el wizard del siguiente microciclo
  const prepareGoalsForNextMicrocycleWizard = useCallback(() => {
    if (goals.length === 0) {
      toast.info("No hay metas en el microciclo actual para sugerir un prellenado.");
      setProposedNextGoals([]); // Asegura que el array esté vacío
      setIsNextMicrocycleWizardOpen(true); // Abre el wizard, que mostrará "No hay metas"
      return;
    }
  
    const nextGoals: ProposedGoal[] = goals.map(goal => {
      const performance = goalsPerformance[goal.id.toString()];
      if (performance) {
        return suggestProgression(goal, performance);
      } else {
        // Si no hay datos de rendimiento (ej. meta recién añadida y no realizada), copiar la meta tal cual
        return {
          ...goal, // Copy existing goal properties
          user_id: user!.id, // Ensure correct user_id
          microcycle: (selectedMicrocycle || 0) + 1, // Set next microcycle number
          originalGoalId: goal.id.toString(),
          performance: undefined, // No performance data for new goals
          includeInNextMicrocycle: true,
          // Remove properties that should not be copied directly or are handled by ...goal
          id: undefined, // ID should not be copied for a new goal
          created_at: undefined, // created_at should not be copied
          updated_at: undefined, // updated_at should not be copied
          completedSetsCount: undefined, // completedSetsCount should not be copied
          // target_rpe: undefined, // Ensure target_rpe is not included
        };
      }
    });
    setProposedNextGoals(nextGoals);
    setIsNextMicrocycleWizardOpen(true); // Abre el wizard con las metas propuestas
  }, [goals, goalsPerformance, suggestProgression]); // Dependencias: `goals`, `goalsPerformance`, `suggestProgression`
  
  // El manejador anterior `handleCreateNextMicrocycle` se eliminará o ya no se usará.
  // Este es el nuevo manejador que se conectará al botón "Habilitar Siguiente Microciclo".
  
  const handleEnableNextMicrocycle = useCallback(() => {
    if (!user?.id || selectedMicrocycle === null) {
      toast.error('Por favor, selecciona un microciclo actual para habilitar el siguiente.');
      return;
    }
    // Llama a la función que prepara los datos y abre el diálogo
    prepareGoalsForNextMicrocycleWizard();
  }, [user?.id, selectedMicrocycle, prepareGoalsForNextMicrocycleWizard]);

  // Modificado: Crear el siguiente microciclo con las metas propuestas (sin RPE)
  const createNextMicrocycleWithProposedGoals = async (goalsToInsert: ProposedGoal[]) => {
    if (!user?.id || selectedMicrocycle === null) {
      console.error('[useGoalsManagement] createNextMicrocycleWithProposedGoals: User ID o selectedMicrocycle no disponible.');
      toast.error('Error al crear microciclo: Usuario no identificado o microciclo actual no seleccionado.');
      return;
    }

    const nextMicrocycleNumber = (selectedMicrocycle || 0) + 1;
    console.log(`[useGoalsManagement] createNextMicrocycleWithProposedGoals: Iniciando creación de microciclo ${nextMicrocycleNumber}.`);
    setIsLoadingNextMicrocycle(true);

    try {
      // 1. **IMPORTANTE: ELIMINAR la llamada a goalService.createNextMicrocycle (que da 404).**
      //    Ahora, la existencia del microciclo se infiere cuando se insertan metas con un nuevo número.
      //    El servicio `bulkCreateGoals` simplemente insertará metas con el `nextMicrocycleNumber`.
      //    No necesitamos una operación explícita para "crear un microciclo" en la base de datos si no hay una tabla `microcycles`.
      //    Si en el futuro se crea una tabla 'microcycles', entonces se reintroduciría esta llamada.
      console.log(`[useGoalsManagement] createNextMicrocycleWithProposedGoals: Preparando para metas del microciclo ${nextMicrocycleNumber}.`);
      // Si más adelante decides usar una tabla 'microcycles', aquí reintroducirías la llamada.
      // Por ahora, asumimos que insertar metas con ese número es suficiente para "crearlo".

      // 2. Filtrar y mapear las metas propuestas a `GoalInsert` para la inserción masiva.
      const goalsToSave: GoalInsert[] = goalsToInsert
        .filter(g => g.includeInNextMicrocycle)
        .map(g => ({
          exercise_name: g.exercise_name,
          target_sets: g.target_sets, // Use target_sets
          target_reps: g.target_reps, // Use target_reps
          comments: g.comments,
          categories: g.categories,
          active: g.active,
          user_id: user.id,
          microcycle: nextMicrocycleNumber,
        }));

      if (goalsToSave.length > 0) {
        console.log(`[useGoalsManagement] createNextMicrocycleWithProposedGoals: Preparando para insertar ${goalsToSave.length} metas.`);
        await goalService.bulkCreateGoals(goalsToSave);
        console.log(`[useGoalsManagement] createNextMicrocycleWithProposedGoals: ${goalsToSave.length} metas insertadas en microciclo ${nextMicrocycleNumber}.`);
      } else {
        console.log(`[useGoalsManagement] createNextMicrocycleWithProposedGoals: No se seleccionaron metas para insertar en microciclo ${nextMicrocycleNumber}.`);
      }

      toast.success(`¡Microciclo ${nextMicrocycleNumber} habilitado con tus metas!`);

      // 3. Refrescar la lista de microciclos y seleccionar el nuevo.
      console.log('[useGoalsManagement] createNextMicrocycleWithProposedGoals: Refrescando lista de microciclos y seleccionando el nuevo.');
      await refreshMicrocycles();
      setSelectedMicrocycle(nextMicrocycleNumber);

      setIsNextMicrocycleWizardOpen(false);
      setProposedNextGoals([]);
    } catch (err: any) {
      console.error('[useGoalsManagement] createNextMicrocycleWithProposedGoals: Error al habilitar microciclo:', err);
      toast.error(`Error al habilitar microciclo: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsLoadingNextMicrocycle(false);
      console.log('[useGoalsManagement] createNextMicrocycleWithProposedGoals: Proceso de habilitación finalizado.');
    }
  };
  
  const handleAddGoal = async (formData: GoalInsert) => {
    if (!user?.id || selectedMicrocycle === null) {
      console.error('[useGoalsManagement] handleAddGoal: User ID o selectedMicrocycle no disponible.');
      toast.error('Faltan datos para añadir la meta.');
      return;
    }
  
    console.log('[useGoalsManagement] handleAddGoal: Iniciando con datos:', formData, 'para microciclo:', selectedMicrocycle);
    setIsSubmittingGoal(true);
  
    try {
      const newGoal = await goalService.createGoal({
        ...formData,
        microcycle: selectedMicrocycle
      }, user.id);
  
      if (newGoal) {
        console.log('[useGoalsManagement] handleAddGoal: Servicio createGoal respondió con:', newGoal);
        setGoals(prevGoals => [...prevGoals, newGoal].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        console.log('[useGoalsManagement] handleAddGoal: Estado de metas actualizado.');
        toast.success('¡Meta añadida exitosamente!');
      } else {
        console.error('[useGoalsManagement] handleAddGoal: El servicio createGoal no devolvió una nueva meta.');
        toast.error('Error al añadir: no se recibió confirmación.');
      }
    } catch (err: any) {
      console.error('[useGoalsManagement] handleAddGoal: Error añadiendo meta:', err);
      toast.error(`Error al añadir meta: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleUpdateGoal = async (goalId: string, formData: GoalUpdate) => {
    if (!user?.id) {
      console.error('[useGoalsManagement] handleUpdateGoal: User ID no disponible.');
      toast.error('Error al actualizar: Usuario no identificado.');
      return;
    }

    console.log('[useGoalsManagement] handleUpdateGoal: Iniciando con ID:', goalId, 'y datos:', formData);
    setIsSubmittingGoal(true);

    try {
      const updatedGoal = await goalService.updateGoal(goalId, formData);

      if (updatedGoal) {
        setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? updatedGoal : g));
        console.log('[useGoalsManagement] handleUpdateGoal: Estado de metas actualizado con:', updatedGoal);
        toast.success('¡Meta actualizada exitosamente!');
      } else {
        console.warn('[useGoalsManagement] handleUpdateGoal: El servicio updateGoal no devolvió la meta actualizada.');
        toast.error('Error al actualizar: no se recibió confirmación.');
      }
    } catch (err: any) {
      console.error('[useGoalsManagement] handleUpdateGoal: Error actualizando meta:', err);
      toast.error(`Error al actualizar meta: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user?.id) {
      console.error('[useGoalsManagement] handleDeleteGoal: User ID no disponible.');
      toast.error('Error al eliminar: Usuario no identificado.');
      return;
    }

    console.log('[useGoalsManagement] handleDeleteGoal: Iniciando con ID:', goalId);
    setIsSubmittingGoal(true);

    try {
      await goalService.deleteGoal(goalId);
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      console.log('[useGoalsManagement] handleDeleteGoal: Meta eliminada con ID:', goalId);
      toast.success('¡Meta eliminada exitosamente!');
    } catch (err: any) {
      console.error('[useGoalsManagement] handleDeleteGoal: Error eliminando meta:', err);
      toast.error(`Error al eliminar meta: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  const handleToggleGoalActive = async (goalId: string, currentActiveState: Goal['active']) => {
    if (!user?.id) {
      console.error('[useGoalsManagement] handleToggleGoalActive: User ID no disponible.');
      toast.error('Error al cambiar estado: Usuario no identificado.');
      return;
    }

    const newActiveValue = currentActiveState === 1 ? 0 : 1; // Assuming currentActiveState is already 0 | 1
    console.log('[useGoalsManagement] handleToggleGoalActive: Iniciando con ID:', goalId, 'estado actual:', currentActiveState, 'nuevo valor:', newActiveValue);
    setIsSubmittingGoal(true);
    setError(null);

    try {
      const updatedGoal = await goalService.toggleGoalActiveState(goalId, newActiveValue);
      console.log('[useGoalsManagement] handleToggleGoalActive: Service responded. Updated goal:', updatedGoal);

      if (updatedGoal) {
        const normalizedActiveValueFromResponse = updatedGoal.active ? 1 : 0 as (0 | 1);
        const goalWithNormalizedActive = { ...updatedGoal, active: normalizedActiveValueFromResponse };

        setGoals(prevGoals => prevGoals.map(g => g.id === goalId ? goalWithNormalizedActive : g));
        console.log('[useGoalsManagement] handleToggleGoalActive: Estado de meta actualizado para ID:', goalId, 'a', normalizedActiveValueFromResponse);
        toast.success(normalizedActiveValueFromResponse === 1 ? 'Meta activada.' : 'Meta pausada.');
      } else {
        console.warn('[useGoalsManagement] handleToggleGoalActive: El servicio no devolvió el estado esperado para ID:', goalId);
        toast.error('Error al cambiar estado: la respuesta no fue la esperada.');
      }
    } catch (err: any)  {
      console.error('[useGoalsManagement] handleToggleGoalActive: Error cambiando estado de meta:', err);
      toast.error(`Error al cambiar estado: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsSubmittingGoal(false);
      console.log('[useGoalsManagement] handleToggleGoalActive: Finished toggling goal active state attempt.');
    }
  };

  // Return statement
  return {
    user,
    microcycles,
    selectedMicrocycle,
    isLoadingMicrocycles,
    goals, // Raw goals for the current microcycle
    isLoadingGoals,
    doneExercises,
    isLoadingDoneExercises,
    isSubmittingGoal,
    isLoadingNextMicrocycle,
    error,
    setError, // Expose setError if needed externally
    handleSelectMicrocycle,
    // handleCreateNextMicrocycle, // Old handler removed
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleToggleActive: handleToggleGoalActive,
    // Filter and sort related
    displayedGoals, // Filtered and sorted goals for rendering
    availableCategories,
    selectedCategoryFilters,
    sortConfig,
    handleToggleCategoryFilter,
    handleClearCategoryFilters,
    handleRequestSort,
    refreshMicrocycles,
  
    // NUEVAS EXPOSICIONES PARA EL WIZARD
    isNextMicrocycleWizardOpen,
    setIsNextMicrocycleWizardOpen,
    proposedNextGoals,
    setProposedNextGoals, // Para que el componente del wizard pueda modificar las metas
    handleEnableNextMicrocycle, // El nuevo botón que inicia el wizard
    createNextMicrocycleWithProposedGoals, // La función que el wizard llamará al confirmar
    goalsPerformance // Exponer el rendimiento de las metas para el wizard
  };
};