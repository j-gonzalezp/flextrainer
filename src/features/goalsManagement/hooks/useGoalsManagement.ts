import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import * as goalService from '../services/goalService';
import type { Goal, GoalInsert, GoalUpdate, DisplayableDoneExercise, SortableGoalKeys } from '../types';
import { toast } from 'sonner';

export const useGoalsManagement = () => {
  const { user } = useAuth();

  // State Variables
  const [microcycles, setMicrocycles] = useState<number[]>([]);
  const [selectedMicrocycle, setSelectedMicrocycle] = useState<number | null>(null);
  const [isLoadingMicrocycles, setIsLoadingMicrocycles] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortableGoalKeys; direction: 'asc' | 'desc' } | null>(null);

  const [doneExercises, setDoneExercises] = useState<DisplayableDoneExercise[]>([]);
  const [isLoadingDoneExercises, setIsLoadingDoneExercises] = useState(false);

  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);
  const [isLoadingNextMicrocycle, setIsLoadingNextMicrocycle] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      completedSetsCount: completedSetsPerGoal[goal.id.toString()] || 0
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
  }, [goals, selectedCategoryFilters, sortConfig, completedSetsPerGoal]);

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
      setIsLoadingMicrocycles(true);
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

  const handleCreateNextMicrocycle = async () => {
    if (!user?.id) {
      console.error('[useGoalsManagement] handleCreateNextMicrocycle: User ID no disponible.');
      toast.error('Error al crear microciclo: Usuario no identificado.');
      return;
    }

    const currentMax = microcycles.length > 0 ? Math.max(...microcycles) : 0;
    console.log('[useGoalsManagement] handleCreateNextMicrocycle: Iniciando. User ID:', user.id, 'Microciclos actuales:', microcycles, 'Current Max:', currentMax);
    setIsLoadingNextMicrocycle(true);

    try {
      if (microcycles.length === 0) { 
        const firstMicrocycleNumber = 1;
        setMicrocycles([firstMicrocycleNumber]);
        setSelectedMicrocycle(firstMicrocycleNumber);
        setGoals([]); 
        console.log('[useGoalsManagement] handleCreateNextMicrocycle: Creando primer microciclo conceptualmente. Estableciendo microcycles a [1] y selectedMicrocycle a 1.');
        toast.success('¡Microciclo 1 listo para añadir metas!');
      } else { 
        await goalService.createNextMicrocycle(user.id, currentMax);
        console.log('[useGoalsManagement] handleCreateNextMicrocycle: Servicio createNextMicrocycle respondió.');
        const updatedMicrocycles = await goalService.fetchMicrocyclesForUser(user.id); 
        setMicrocycles(updatedMicrocycles);
        setSelectedMicrocycle(currentMax + 1);
        console.log('[useGoalsManagement] handleCreateNextMicrocycle: Siguiente microciclo creado:', currentMax + 1);
        toast.success(`¡Microciclo ${currentMax + 1} creado exitosamente!`);
      }
    } catch (err: any) {
      console.error('[useGoalsManagement] handleCreateNextMicrocycle: Error creando siguiente microciclo:', err);
      toast.error(`Error al crear microciclo: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsLoadingNextMicrocycle(false);
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

  const handleUpdateGoal = async (goalId: Goal['id'], formData: GoalUpdate) => {
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

  const handleDeleteGoal = async (goalId: Goal['id']) => {
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

  const handleToggleGoalActive = async (goalId: Goal['id'], currentActiveState: Goal['active']) => {
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
    handleCreateNextMicrocycle,
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
  };
};