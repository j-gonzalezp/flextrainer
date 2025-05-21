import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as workoutService from '../services/workoutService';
import * as goalService from '@/features/goalsManagement/services/goalService';
import type { Goal } from '@/features/goalsManagement/types';
import type { DoneExerciseLogInsert } from '../types';
import { toast } from 'sonner';

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

  const _selectRandomGoalFromList = useCallback((goals: Goal[]): Goal | null => {
    if (goals.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * goals.length);
    return goals[randomIndex];
  }, []);

  const _selectNextDistinctGoalFromList = useCallback((availableGoals: Goal[], lastGoalIdToExclude?: number): Goal | null => {
    const eligibleGoals = lastGoalIdToExclude ? availableGoals.filter(g => g.id !== lastGoalIdToExclude) : availableGoals;
    return _selectRandomGoalFromList(eligibleGoals);
  }, [_selectRandomGoalFromList]);

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

  // Effect 1: Fetch microcycles
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
            setCurrentGoal(null);
            currentGoalRef.current = null;
            setAvailableCategories([]);
            setSelectedCategoryFilters([]);
          }
        })
        .catch(err => {
          console.error('[useWorkoutSession] Error fetching user microcycles:', err);
          setError('Failed to load available microcycles.');
          setUserMicrocycles([]);
          setSelectedWorkoutMicrocycle(null);
        })
        .finally(() => setIsLoadingMicrocycles(false));
    } else {
      setUserMicrocycles([]);
      setSelectedWorkoutMicrocycle(null);
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null);
      currentGoalRef.current = null;
      setAvailableCategories([]);
      setSelectedCategoryFilters([]);
      setIsLoadingMicrocycles(false);
    }
  }, [user?.id]);

  // Effect 2: Fetch goals for microcycle
  useEffect(() => {
    if (user?.id && selectedWorkoutMicrocycle !== null) {
      setIsLoadingGoals(true);
      setError(null);
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null);
      currentGoalRef.current = null;
      setAvailableCategories([]);
      setSelectedCategoryFilters([]);

      workoutService.fetchActiveGoalsForWorkout(user.id, selectedWorkoutMicrocycle)
        .then(fetchedGoals => {
          setAllActiveGoalsForMicrocycle(fetchedGoals);
          setAvailableCategories(getUniqueCategoriesFromGoals(fetchedGoals));
        })
        .catch(err => {
          console.error('[useWorkoutSession] Error fetching active goals:', err);
          setError('Failed to load active goals for the selected microcycle.');
          setAllActiveGoalsForMicrocycle([]);
          setAvailableCategories([]);
        })
        .finally(() => setIsLoadingGoals(false));
    } else if (!selectedWorkoutMicrocycle) {
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null);
      currentGoalRef.current = null;
      setAvailableCategories([]);
      setSelectedCategoryFilters([]);
      prefillOrClearPerformanceInputs(null);
      setIsLoadingGoals(false);
    }
  }, [user?.id, selectedWorkoutMicrocycle, prefillOrClearPerformanceInputs]);

  // Effect 3: Filter goals and set initial/filtered currentGoal
  useEffect(() => {
    if (isLoadingGoals) return;
    
    const newFilteredGoals = selectedCategoryFilters.length === 0
      ? [...allActiveGoalsForMicrocycle]
      : allActiveGoalsForMicrocycle.filter(goal => 
          goal.categories?.some(cat => selectedCategoryFilters.includes(cat))
        );
    
    setFilteredWorkoutGoals(newFilteredGoals);

    const isCurrentGoalTemporaryUnlinked = currentGoal && 
      currentGoal.id === currentGoalRef.current?.id && 
      !allActiveGoalsForMicrocycle.find(g => g.id === currentGoal.id);
    
    const isCurrentGoalInNewFilteredList = currentGoal && 
      newFilteredGoals.find(g => g.id === currentGoal.id);

    if ((!currentGoal && newFilteredGoals.length > 0) || 
        (currentGoal && !isCurrentGoalInNewFilteredList && !isCurrentGoalTemporaryUnlinked)) {
      const nextGoalToSet = _selectRandomGoalFromList(newFilteredGoals);
      setCurrentGoal(nextGoalToSet);
      currentGoalRef.current = nextGoalToSet;
      setSetsDoneForCurrentGoal(0);
      prefillOrClearPerformanceInputs(nextGoalToSet);
    } else if (newFilteredGoals.length === 0 && !isCurrentGoalTemporaryUnlinked) {
      setCurrentGoal(null);
      currentGoalRef.current = null;
      prefillOrClearPerformanceInputs(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allActiveGoalsForMicrocycle, selectedCategoryFilters, isLoadingGoals]);

  // MODIFIED: Renamed proceedToNextGoal and changed its behavior
  const _switchToNewRandomDistinctGoal = useCallback((idToExclude?: number) => {
    const nextGoal = _selectNextDistinctGoalFromList(filteredWorkoutGoals, idToExclude);

    setCurrentGoal(nextGoal);
    currentGoalRef.current = nextGoal;
    setSetsDoneForCurrentGoal(0);
    prefillOrClearPerformanceInputs(nextGoal);

    if (nextGoal) {
      // toast.info(`Siguiente ejercicio: ${nextGoal.exercise_name}`); // Optional: too noisy?
    } else {
      toast.info('¡Parece que no hay más ejercicios con los filtros actuales!');
    }
  }, [filteredWorkoutGoals, _selectNextDistinctGoalFromList, prefillOrClearPerformanceInputs]);

  const handleSelectCategoryFilters = useCallback((categories: string[]) => {
    setSelectedCategoryFilters(categories);
  }, []);

  const selectWorkoutMicrocycleHandler = useCallback((cycleNumber: number | null) => {
    setSelectedWorkoutMicrocycle(cycleNumber);
  }, []);

  const skipCurrentGoalAndSelectNext = useCallback(() => {
    if (currentGoal) {
      toast.info(`Ejercicio ${currentGoal.exercise_name} omitido.`);
      _switchToNewRandomDistinctGoal(currentGoal.id);
    } else {
      _switchToNewRandomDistinctGoal();
    }
  }, [currentGoal, _switchToNewRandomDistinctGoal]);

  const handleLogPerformance = async (recordedSet: SetData) => {
    if (!currentGoal || !user?.id) {
      toast.error('Error: No hay ejercicio actual...');
      return;
    }
    
    if (!recordedSet || !recordedSet.reps) {
      toast.error('Error: Las repeticiones son obligatorias.');
      return;
    }

    const goalLoggedId = currentGoal.id;
    const goalLoggedName = currentGoal.exercise_name;

    setIsLoggingPerformance(true);
    setError(null);
    
    try {
      const logPayload: DoneExerciseLogInsert = {
        user_id: user.id,
        goal_id: goalLoggedId,
        goal_microcycle_at_log: currentGoal.microcycle,
        reps_done: parseInt(recordedSet.reps, 10),
        sets_done_for_this_log: 1,
        failed_set: recordedSet.failed,
        weight_used: recordedSet.weight ? parseFloat(recordedSet.weight) : null,
        duration_seconds_done: recordedSet.duration ? parseInt(recordedSet.duration, 10) : null,
        notes: recordedSet.notes || null
      };
      
      await workoutService.logDoneExercise(logPayload);
      toast.success(`Set de ${goalLoggedName} registrado!`);

      setSetsDoneForCurrentGoal(prev => prev + 1);
      _switchToNewRandomDistinctGoal(goalLoggedId);
    } catch (err: any) {
      const msg = (err as Error).message || 'Error al registrar';
      setError(msg);
      toast.error(`Error: ${msg}`);
    } finally {
      setIsLoggingPerformance(false);
    }
  };

  const handlePauseCurrentGoal = useCallback(async () => {
    if (!currentGoal || !user?.id) {
      toast.error('Error al pausar: Usuario o ejercicio no disponible.');
      return;
    }

    setIsPausingGoal(true);
    setError(null);
    
    const pausedGoalId = currentGoal.id;
    const pausedGoalName = currentGoal.exercise_name;
    
    try {
      const updatedGoal = await goalService.toggleGoalActiveState(pausedGoalId, 0);
      if (updatedGoal && updatedGoal.active === 0) {
        toast.info(`${pausedGoalName} pausado.`);
        setAllActiveGoalsForMicrocycle(prev => prev.filter(g => g.id !== pausedGoalId)); // Remove from session pool
        _switchToNewRandomDistinctGoal(pausedGoalId); // Then pick a new one
      } else {
        toast.error('Error al pausar.');
        setError('Failed to pause.');
      }
    } catch (err: any) {
      const msg = (err as Error).message || 'Error al pausar.';
      setError(msg);
      toast.error(`Error: ${msg}`);
    } finally {
      setIsPausingGoal(false);
    }
  }, [currentGoal, user?.id, _switchToNewRandomDistinctGoal]);

  const handleChangeCurrentGoal = useCallback(async (newSelectedGoalDetails: Goal) => {
    if (!user || selectedWorkoutMicrocycle === null) {
      toast.error("Selecciona usuario y microciclo.");
      return;
    }
    
    let tempReplacedGoal: Goal;
    
    if (currentGoal) {
      tempReplacedGoal = {
        ...currentGoal,
        exercise_name: newSelectedGoalDetails.exercise_name,
        categories: newSelectedGoalDetails.categories || [],
        reps: newSelectedGoalDetails.reps,
        sets: newSelectedGoalDetails.sets,
        weight: newSelectedGoalDetails.weight,
        duration_seconds: newSelectedGoalDetails.duration_seconds,
        notes: newSelectedGoalDetails.notes || '',
      };
    } else {
      tempReplacedGoal = {
        id: newSelectedGoalDetails.id,
        user_id: user.id,
        microcycle: selectedWorkoutMicrocycle,
        active: 1 as const,
        created_at: newSelectedGoalDetails.created_at,
        updated_at: newSelectedGoalDetails.updated_at,
        exercise_name: newSelectedGoalDetails.exercise_name,
        sets: newSelectedGoalDetails.sets,
        reps: newSelectedGoalDetails.reps,
        categories: newSelectedGoalDetails.categories || [],
        weight: newSelectedGoalDetails.weight,
        duration_seconds: newSelectedGoalDetails.duration_seconds,
        notes: newSelectedGoalDetails.notes,
        completedSetsCount: 0,
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
    isLoggingPerformance,
    isPausingGoal,
    error,
    setError,
    selectWorkoutMicrocycle: selectWorkoutMicrocycleHandler,
    selectNextGoal: skipCurrentGoalAndSelectNext,
    handleLogPerformance,
    handlePauseCurrentGoal,
    handleChangeCurrentGoal,
  };
};