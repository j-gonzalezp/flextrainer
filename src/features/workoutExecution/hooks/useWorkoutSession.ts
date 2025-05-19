import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as workoutService from '../services/workoutService';
import * as goalService from '@/features/goalsManagement/services/goalService';
import type { Goal } from '@/features/goalsManagement/types'; // Goal is already imported
import type { DoneExerciseLogInsert } from '../types';
import { toast } from 'sonner';

// --- REMOVED ExerciseSystem placeholder type ---

export interface SetData {
  reps: string;
  weight?: string;
  duration?: string;
  notes?: string;
  failed: boolean;
  isAdditional: boolean;
}

const getUniqueCategoriesFromGoals = (goals: Goal[]): string[] => {
  const allCategories = goals.flatMap(goal => goal.categories || []);
  return Array.from(new Set(allCategories)).sort();
};

export const useWorkoutSession = () => {
  const { user } = useAuth();

  const [userMicrocycles, setUserMicrocycles] = useState<number[]>([]);
  const [selectedWorkoutMicrocycle, setSelectedWorkoutMicrocycle] = useState<number | null>(null);
  const [isLoadingMicrocycles, setIsLoadingMicrocycles] = useState<boolean>(true);

  const [allActiveGoalsForMicrocycle, setAllActiveGoalsForMicrocycle] = useState<Goal[]>([]);
  const [filteredWorkoutGoals, setFilteredWorkoutGoals] = useState<Goal[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const currentGoalRef = useRef<Goal | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(false);

  const [setsDoneForCurrentGoal, setSetsDoneForCurrentGoal] = useState<number>(0);

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);

  const [performanceReps, setPerformanceReps] = useState<string>('');
  const [performanceFailedSet, setPerformanceFailedSet] = useState<boolean>(false);
  const [performanceWeight, setPerformanceWeight] = useState<string>('');
  const [performanceDuration, setPerformanceDuration] = useState<string>('');
  const [performanceNotes, setPerformanceNotes] = useState<string>('');

  const [isLoggingPerformance, setIsLoggingPerformance] = useState<boolean>(false);
  const [isPausingGoal, setIsPausingGoal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectGoalFromList = useCallback((goals: Goal[]): Goal | null => {
    if (goals.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * goals.length);
    return goals[randomIndex];
  }, []);

  const prefillOrClearPerformanceInputs = useCallback((goalToPreload: Goal | null) => {
    if (goalToPreload) {
      setPerformanceReps(goalToPreload.reps?.toString() || '');
      setPerformanceWeight(goalToPreload.weight?.toString() || '');
      setPerformanceDuration(goalToPreload.duration_seconds?.toString() || '');
      setPerformanceNotes(goalToPreload.notes || '');
      setPerformanceFailedSet(false);
    } else {
      setPerformanceReps('');
      setPerformanceFailedSet(false);
      setPerformanceWeight('');
      setPerformanceDuration('');
      setPerformanceNotes('');
    }
  }, []);

  // Effect 1: Fetch microcycles (no significant change)
  useEffect(() => {
    if (user?.id) {
      setIsLoadingMicrocycles(true);
      setError(null);
      goalService.fetchMicrocyclesForUser(user.id)
        .then(fetchedUserMicrocycles => {
          setUserMicrocycles(fetchedUserMicrocycles);
          if (fetchedUserMicrocycles.length > 0 && selectedWorkoutMicrocycle === null) {
            const latestMicrocycle = fetchedUserMicrocycles[fetchedUserMicrocycles.length - 1];
            setSelectedWorkoutMicrocycle(latestMicrocycle);
          } else if (fetchedUserMicrocycles.length === 0) {
            setSelectedWorkoutMicrocycle(null);
            setAllActiveGoalsForMicrocycle([]);
            setFilteredWorkoutGoals([]);
            setCurrentGoal(null); currentGoalRef.current = null;
            setAvailableCategories([]);
            setSelectedCategoryFilters([]);
          }
        })
        .catch(err => { console.error('[useWorkoutSession] Error fetching user microcycles:', err); setError('Failed to load available microcycles.'); setUserMicrocycles([]); setSelectedWorkoutMicrocycle(null);})
        .finally(() => setIsLoadingMicrocycles(false));
    } else { setUserMicrocycles([]); setSelectedWorkoutMicrocycle(null);setAllActiveGoalsForMicrocycle([]);setFilteredWorkoutGoals([]);setCurrentGoal(null); currentGoalRef.current = null;setAvailableCategories([]);setSelectedCategoryFilters([]);setIsLoadingMicrocycles(false);}
  }, [user?.id]);

  // Effect 2: Fetch goals for microcycle (no significant change)
  useEffect(() => {
    if (user?.id && selectedWorkoutMicrocycle !== null) {
      setIsLoadingGoals(true);
      setError(null);
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null); currentGoalRef.current = null;
      setAvailableCategories([]);
      setSelectedCategoryFilters([]);
      workoutService.fetchActiveGoalsForWorkout(user.id, selectedWorkoutMicrocycle)
        .then(fetchedGoals => { setAllActiveGoalsForMicrocycle(fetchedGoals); setAvailableCategories(getUniqueCategoriesFromGoals(fetchedGoals)); })
        .catch(err => { console.error('[useWorkoutSession] Error fetching active goals:', err); setError('Failed to load active goals for the selected microcycle.'); setAllActiveGoalsForMicrocycle([]); setAvailableCategories([]);})
        .finally(() => setIsLoadingGoals(false));
    } else if (!selectedWorkoutMicrocycle) { setAllActiveGoalsForMicrocycle([]); setFilteredWorkoutGoals([]); setCurrentGoal(null); currentGoalRef.current = null; setAvailableCategories([]); setSelectedCategoryFilters([]); prefillOrClearPerformanceInputs(null); setIsLoadingGoals(false); }
  }, [user?.id, selectedWorkoutMicrocycle, prefillOrClearPerformanceInputs]);

  // Effect 3: Filter and select current goal (no significant change in this part)
  useEffect(() => {
    if (isLoadingGoals) return;
    if (currentGoal && currentGoal.id === currentGoalRef.current?.id && !allActiveGoalsForMicrocycle.find(g => g.id === currentGoal.id)) {
      let tempFiltered = [currentGoal];
      if (selectedCategoryFilters.length > 0) {
          if (!currentGoal.categories?.some(cat => selectedCategoryFilters.includes(cat))) {
              tempFiltered = [];
          }
      }
      const otherFilteredGoals = allActiveGoalsForMicrocycle.filter(g => 
          g.id !== currentGoal.id && 
          (selectedCategoryFilters.length === 0 || g.categories?.some(cat => selectedCategoryFilters.includes(cat)))
      );
      setFilteredWorkoutGoals([...tempFiltered, ...otherFilteredGoals].filter((value, index, self) => 
          index === self.findIndex((t) => (t.id === value.id))
      ));
      return; 
    }
    let currentFiltered: Goal[];
    if (selectedCategoryFilters.length === 0) { currentFiltered = [...allActiveGoalsForMicrocycle]; } 
    else { currentFiltered = allActiveGoalsForMicrocycle.filter(goal => goal.categories?.some(cat => selectedCategoryFilters.includes(cat))); }
    setFilteredWorkoutGoals(currentFiltered);
    const isCurrentGoalStillValid = currentGoal && currentFiltered.find(g => g.id === currentGoal.id);
    if (!isCurrentGoalStillValid) { 
        const newSelectedGoal = selectGoalFromList(currentFiltered);
        setCurrentGoal(newSelectedGoal); currentGoalRef.current = newSelectedGoal;
        setSetsDoneForCurrentGoal(0);
        prefillOrClearPerformanceInputs(newSelectedGoal);
    }
  }, [allActiveGoalsForMicrocycle, selectedCategoryFilters, isLoadingGoals, selectGoalFromList, prefillOrClearPerformanceInputs, currentGoal]);

  const handleSelectCategoryFilters = useCallback((categories: string[]) => { setSelectedCategoryFilters(categories); }, []);
  const selectWorkoutMicrocycleHandler = useCallback((cycleNumber: number | null) => { setSelectedWorkoutMicrocycle(cycleNumber); }, []);
  const skipCurrentGoalAndSelectNext = useCallback(() => { if (currentGoal) { setAllActiveGoalsForMicrocycle(prevGoals => prevGoals.filter(g => g.id !== currentGoal.id)); } }, [currentGoal]);
  
  const handleLogPerformance = async (recordedSet: SetData) => { 
    if (!currentGoal || !user?.id) { toast.error('Error: No hay ejercicio actual o usuario no disponible.'); return; }
    if (!recordedSet || !recordedSet.reps) { toast.error('Error: Las repeticiones son obligatorias.'); return; }
    setIsLoggingPerformance(true); setError(null);
    try {
      const repsDone = parseInt(recordedSet.reps, 10);
      const durationDone = recordedSet.duration && recordedSet.duration !== '' ? parseInt(recordedSet.duration, 10) : null;
      const weightUsed = recordedSet.weight && recordedSet.weight !== '' ? parseFloat(recordedSet.weight) : null;
      if (isNaN(repsDone) && !durationDone) { toast.error('Error: Ingresa repeticiones o duración válidas.'); setIsLoggingPerformance(false); return; }
      const logPayload: DoneExerciseLogInsert = { user_id: user.id, goal_id: currentGoal.id, goal_microcycle_at_log: currentGoal.microcycle, reps_done: !isNaN(repsDone) ? repsDone : null, sets_done_for_this_log: 1, failed_set: recordedSet.failed, weight_used: weightUsed, duration_seconds_done: durationDone, notes: recordedSet.notes || null, };
      await workoutService.logDoneExercise(logPayload);
      toast.success(`Set de ${currentGoal.exercise_name} registrado!`);
      const newTotalSetsDone = setsDoneForCurrentGoal + 1;
      setSetsDoneForCurrentGoal(newTotalSetsDone);
      const isTemporaryGoal = !allActiveGoalsForMicrocycle.find(g => g.id === currentGoal.id) && currentGoal.id === currentGoalRef.current?.id;
      if (newTotalSetsDone >= (currentGoal.sets || 1)) {
        if (!isTemporaryGoal) { setAllActiveGoalsForMicrocycle(prevGoals => prevGoals.filter(g => g.id !== currentGoal!.id)); } 
        else { setCurrentGoal(null); currentGoalRef.current = null; }
      } else { prefillOrClearPerformanceInputs(currentGoal); }
    } catch (err: any) { const errorMessage = (err as Error).message || 'Ocurrió un error al registrar el set.'; setError(errorMessage); toast.error(`Error al registrar: ${errorMessage}`); } 
    finally { setIsLoggingPerformance(false); }
  };
  const handlePauseCurrentGoal = async () => { /* ... (existing logic with toasts) ... */ if (!currentGoal || !user?.id) return; setIsPausingGoal(true);setError(null);try {const updatedGoal = await goalService.toggleGoalActiveState(currentGoal.id, 0);if (updatedGoal && updatedGoal.active === 0) {setAllActiveGoalsForMicrocycle(prevGoals => prevGoals.filter(g => g.id !== currentGoal!.id));toast.info(`${currentGoal.exercise_name} pausado.`);} else {setError('Failed to pause goal or goal state did not change as expected.');toast.error('Error al pausar el ejercicio.');}} catch (err: any) {const errorMessage = (err as Error).message || 'Ocurrió un error al pausar el ejercicio.';setError(errorMessage);toast.error(`Error al pausar: ${errorMessage}`);} finally {setIsPausingGoal(false);}};

  // --- MODIFIED: handleChangeCurrentGoal now expects a Goal object ---
  const handleChangeCurrentGoal = useCallback(async (newSelectedGoalDetails: Goal) => { // Parameter changed to Goal
    if (!user || selectedWorkoutMicrocycle === null) {
        toast.error("No se puede cambiar el ejercicio sin un usuario o microciclo seleccionado.");
        return;
    }

    let tempReplacedGoal: Goal;

    if (currentGoal) { // Replacing an existing currentGoal in the workout session
        tempReplacedGoal = {
          ...currentGoal, // Retain original ID (to replace the "slot"), original microcycle, active status
          exercise_name: newSelectedGoalDetails.exercise_name,
          categories: newSelectedGoalDetails.categories || [],
          // Use the NEWLY selected goal's own target reps/sets/weight for the session
          reps: newSelectedGoalDetails.reps, 
          sets: newSelectedGoalDetails.sets, // Use the sets from the new goal, making it the new plan for this instance
          weight: newSelectedGoalDetails.weight,
          duration_seconds: newSelectedGoalDetails.duration_seconds,
          notes: newSelectedGoalDetails.notes || '', 
        };
    } else { // No current goal, so this is like adding an ad-hoc first exercise to the session
        tempReplacedGoal = {
            // Create a fully new Goal structure based on newSelectedGoalDetails
            // This means we are effectively starting this new "Goal" from scratch for the session
            id: newSelectedGoalDetails.id, // Use the ID of the selected Goal from the library
            user_id: user.id, // Should match newSelectedGoalDetails.user_id if it's user specific
            microcycle: selectedWorkoutMicrocycle, 
            active: 1 as const, // It's active for this session
            created_at: newSelectedGoalDetails.created_at, // Use existing timestamps
            updated_at: newSelectedGoalDetails.updated_at, // Use existing timestamps
            
            exercise_name: newSelectedGoalDetails.exercise_name,
            sets: newSelectedGoalDetails.sets, // Target sets from the selected Goal
            reps: newSelectedGoalDetails.reps, // Target reps from the selected Goal
            categories: newSelectedGoalDetails.categories || [],
            weight: newSelectedGoalDetails.weight,
            duration_seconds: newSelectedGoalDetails.duration_seconds,
            notes: newSelectedGoalDetails.notes,
            completedSetsCount: 0, // Reset completed sets for this new exercise in session
        };
    }
    
    setCurrentGoal(tempReplacedGoal); 
    currentGoalRef.current = tempReplacedGoal;
    setSetsDoneForCurrentGoal(0);
    prefillOrClearPerformanceInputs(tempReplacedGoal);
    toast.info(`Ejercicio cambiado a: ${tempReplacedGoal.exercise_name}`);
    
  }, [currentGoal, prefillOrClearPerformanceInputs, user, selectedWorkoutMicrocycle]);


  return {
    user,
    userMicrocycles,
    selectedWorkoutMicrocycle,
    isLoadingMicrocycles,
    allActiveGoalsForMicrocycle,
    filteredWorkoutGoals,
    currentGoal,
    setsDoneForCurrentGoal,
    isLoadingGoals,
    availableCategories,
    selectedCategoryFilters,
    handleSelectCategoryFilters,
    performanceReps, setPerformanceReps,
    performanceFailedSet, setPerformanceFailedSet,
    performanceWeight, setPerformanceWeight,
    performanceDuration, setPerformanceDuration,
    performanceNotes, setPerformanceNotes,
    isLoggingPerformance,
    isPausingGoal,
    error, setError, 
    selectWorkoutMicrocycle: selectWorkoutMicrocycleHandler,
    selectNextGoal: skipCurrentGoalAndSelectNext,
    handleLogPerformance,
    handlePauseCurrentGoal,
    handleChangeCurrentGoal,
  };
};