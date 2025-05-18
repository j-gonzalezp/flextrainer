import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as workoutService from '../services/workoutService';
import * as goalService from '@/features/goalsManagement/services/goalService';
import type { Goal } from '@/features/goalsManagement/types';
import type { DoneExerciseLogInsert } from '../types';

export const useWorkoutSession = () => {
  const { user } = useAuth();

  // Microcycle selection states
  const [userMicrocycles, setUserMicrocycles] = useState<number[]>([]);
  const [selectedWorkoutMicrocycle, setSelectedWorkoutMicrocycle] = useState<number | null>(null);
  const [isLoadingMicrocycles, setIsLoadingMicrocycles] = useState<boolean>(true);

  // Workout session states
  const [activeWorkoutGoals, setActiveWorkoutGoals] = useState<Goal[]>([]);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(false); // True when fetching goals for a selected microcycle

  // Performance tracking states
  const [performanceReps, setPerformanceReps] = useState<string>('');
  const [performanceFailedSet, setPerformanceFailedSet] = useState<boolean>(false);
  const [performanceWeight, setPerformanceWeight] = useState<string>('');
  const [performanceDuration, setPerformanceDuration] = useState<string>('');
  const [performanceNotes, setPerformanceNotes] = useState<string>('');

  // Operation/Error states
  const [isLoggingPerformance, setIsLoggingPerformance] = useState<boolean>(false);
  const [isPausingGoal, setIsPausingGoal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to select a random goal from a list
  const selectGoalFromList = useCallback((goals: Goal[]): Goal | null => {
    if (goals.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * goals.length);
    return goals[randomIndex];
  }, []);

  // Helper to clear performance inputs
  const clearPerformanceInputs = useCallback(() => {
    console.log('[useWorkoutSession] clearPerformanceInputs: Clearing performance inputs.');
    setPerformanceReps('');
    setPerformanceFailedSet(false);
    setPerformanceWeight('');
    setPerformanceDuration('');
    setPerformanceNotes('');
  }, []);

  // Effect 1: Fetch all available microcycles for the user
  useEffect(() => {
    if (user?.id) {
      console.log('[useWorkoutSession] useEffect (fetch user microcycles): Triggered. User ID:', user.id);
      setIsLoadingMicrocycles(true);
      setError(null); // Clear previous errors
      goalService.fetchMicrocyclesForUser(user.id)
        .then(fetchedUserMicrocycles => {
          console.log('[useWorkoutSession] useEffect (fetch user microcycles): Service responded. Fetched microcycles:', fetchedUserMicrocycles);
          setUserMicrocycles(fetchedUserMicrocycles);
          if (fetchedUserMicrocycles.length > 0 && selectedWorkoutMicrocycle === null) {
            // Auto-select the latest microcycle on initial load if none is selected
            const latestMicrocycle = fetchedUserMicrocycles[fetchedUserMicrocycles.length - 1];
            setSelectedWorkoutMicrocycle(latestMicrocycle);
            console.log('[useWorkoutSession] useEffect (fetch user microcycles): Auto-selected latest microcycle:', latestMicrocycle);
          } else if (fetchedUserMicrocycles.length === 0) {
            setSelectedWorkoutMicrocycle(null); // No microcycles, so none can be selected
            setActiveWorkoutGoals([]); // No goals if no microcycles
            setCurrentGoal(null);
          }
        })
        .catch(err => {
          console.error('[useWorkoutSession] Error fetching user microcycles:', err);
          setError('Failed to load available microcycles.');
          setUserMicrocycles([]);
          setSelectedWorkoutMicrocycle(null);
        })
        .finally(() => {
          setIsLoadingMicrocycles(false);
          console.log('[useWorkoutSession] useEffect (fetch user microcycles): Finished loading microcycles.');
        });
    } else {
      setUserMicrocycles([]);
      setSelectedWorkoutMicrocycle(null);
      setActiveWorkoutGoals([]);
      setCurrentGoal(null);
      setIsLoadingMicrocycles(false);
    }
  }, [user?.id]); // Runs when user.id changes

  // Effect 2: Fetch active goals when a workout microcycle is selected (or user changes)
  useEffect(() => {
    if (user?.id && selectedWorkoutMicrocycle !== null) {
      console.log('[useWorkoutSession] useEffect (fetch active goals for workout): Triggered. User ID:', user.id, 'Selected Workout Microcycle:', selectedWorkoutMicrocycle);
      setIsLoadingGoals(true);
      setError(null); // Clear previous errors related to goal fetching
      workoutService.fetchActiveGoalsForWorkout(user.id, selectedWorkoutMicrocycle)
        .then(fetchedGoals => {
          console.log('[useWorkoutSession] useEffect (fetch active goals for workout): Service responded. Fetched goals:', fetchedGoals);
          setActiveWorkoutGoals(fetchedGoals);
          const initialGoal = selectGoalFromList(fetchedGoals);
          setCurrentGoal(initialGoal);
          console.log('[useWorkoutSession] useEffect (fetch active goals for workout): Initial goal selected for workout:', initialGoal);
          clearPerformanceInputs();
        })
        .catch(err => {
          console.error('[useWorkoutSession] Error fetching active goals for selected workout microcycle:', err);
          setError('Failed to load active goals for the selected microcycle.');
          setActiveWorkoutGoals([]);
          setCurrentGoal(null);
        })
        .finally(() => {
          setIsLoadingGoals(false);
          console.log('[useWorkoutSession] useEffect (fetch active goals for workout): Finished loading goals.');
        });
    } else if (!selectedWorkoutMicrocycle) {
      // If no microcycle is selected (e.g., user deselects or no microcycles available)
      setActiveWorkoutGoals([]);
      setCurrentGoal(null);
      clearPerformanceInputs();
      setIsLoadingGoals(false); // Ensure loading is false
    }
  }, [user?.id, selectedWorkoutMicrocycle, selectGoalFromList, clearPerformanceInputs]);

  // Function to allow UI to change the selected workout microcycle
  const selectWorkoutMicrocycle = useCallback((cycleNumber: number) => {
    console.log('[useWorkoutSession] selectWorkoutMicrocycle: Microcycle selected for workout:', cycleNumber);
    setSelectedWorkoutMicrocycle(cycleNumber);
    // The useEffect for fetching active goals will trigger due to this change
  }, []);

  const selectNextGoal = useCallback(() => {
    console.log('[useWorkoutSession] selectNextGoal: Selecting next goal from active list:', activeWorkoutGoals);
    const nextGoal = selectGoalFromList(activeWorkoutGoals);
    setCurrentGoal(nextGoal);
    console.log('[useWorkoutSession] selectNextGoal: Next goal selected:', nextGoal);
    clearPerformanceInputs();
    if (!nextGoal) {
        console.log('[useWorkoutSession] selectNextGoal: No more active goals in the list.');
    }
  }, [activeWorkoutGoals, selectGoalFromList, clearPerformanceInputs]);

  const handleLogPerformance = async () => {
    if (!currentGoal || !user?.id) {
      console.error('[useWorkoutSession] handleLogPerformance: No current goal or user to log performance for.');
      setError('No current goal selected or user not available.');
      return;
    }
    const repsDone = parseInt(performanceReps, 10);
    if (isNaN(repsDone)) {
      setError('Please enter a valid number for reps.');
      console.error('[useWorkoutSession] handleLogPerformance: Invalid reps input:', performanceReps);
      return;
    }
    const logPayload: DoneExerciseLogInsert = {
      user_id: user.id,
      goal_id: currentGoal.id,
      goal_microcycle_at_log: currentGoal.microcycle,
      reps_done: repsDone,
      sets_done_for_this_log: 1,
      failed_set: performanceFailedSet,
      weight_used: performanceWeight !== '' ? parseFloat(performanceWeight) : null,
      duration_seconds_done: performanceDuration !== '' ? parseInt(performanceDuration, 10) : null,
      notes: performanceNotes || null,
    };
    console.log('[useWorkoutSession] handleLogPerformance: Construyendo log con:', JSON.parse(JSON.stringify(logPayload)));
    setIsLoggingPerformance(true);
    setError(null);
    try {
      const loggedExercise = await workoutService.logDoneExercise(logPayload);
      console.log('[useWorkoutSession] handleLogPerformance: Service responded. Logged exercise:', loggedExercise);
      if (loggedExercise) {
        selectNextGoal();
      } else {
        setError('Failed to log performance. Service returned no data.');
      }
    } catch (err: any) {
      console.error('[useWorkoutSession] Error logging performance:', err);
      setError(err.message || 'An error occurred while logging performance.');
    } finally {
      setIsLoggingPerformance(false);
      console.log('[useWorkoutSession] handleLogPerformance: Finished logging performance.');
    }
  };

  const handlePauseCurrentGoal = async () => {
    if (!currentGoal || !user?.id) {
      console.error('[useWorkoutSession] handlePauseCurrentGoal: No current goal to pause.');
      setError('No current goal selected to pause.');
      return;
    }

    console.log('[useWorkoutSession] handlePauseCurrentGoal: Initiating for goal ID:', currentGoal.id);
    setIsPausingGoal(true);
    setError(null);

    try {
      const updatedGoal = await goalService.toggleGoalActiveState(currentGoal.id, 0); // Pass 0 to set to inactive
      console.log('[useWorkoutSession] handlePauseCurrentGoal: Service responded. Updated goal:', updatedGoal);

      if (updatedGoal && updatedGoal.active === 0) { // Check if the goal is now inactive (0)
        console.log('[useWorkoutSession] handlePauseCurrentGoal: Condición CUMPLIDA. Meta pausada localmente.');
        const newActiveGoals = activeWorkoutGoals.filter(goal => goal.id !== currentGoal!.id);
        setActiveWorkoutGoals(newActiveGoals);
        console.log('[useWorkoutSession] handlePauseCurrentGoal: Active goals list updated:', newActiveGoals);
        const nextGoal = selectGoalFromList(newActiveGoals);
        setCurrentGoal(nextGoal);
        console.log('[useWorkoutSession] handlePauseCurrentGoal: Next goal selected after pause:', nextGoal);
        clearPerformanceInputs();
      } else {
        console.log('[useWorkoutSession] handlePauseCurrentGoal: Condición NO CUMPLIDA. updatedGoal.active ES:', updatedGoal?.active, 'SE ESPERABA: 0');
        setError('Failed to pause goal or goal state did not change as expected.');
      }
    } catch (err: any) {
      console.error('[useWorkoutSession] Error pausing goal:', err);
      setError(err.message || 'An error occurred while pausing the goal.');
    } finally {
      setIsPausingGoal(false);
      console.log('[useWorkoutSession] handlePauseCurrentGoal: Finished pausing goal attempt.');
    }
  };

  return {
    user,
    userMicrocycles,
    selectedWorkoutMicrocycle,
    isLoadingMicrocycles,
    activeWorkoutGoals,
    currentGoal,
    isLoadingGoals,
    performanceReps, setPerformanceReps,
    performanceFailedSet, setPerformanceFailedSet,
    performanceWeight, setPerformanceWeight,
    performanceDuration, setPerformanceDuration,
    performanceNotes, setPerformanceNotes,
    isLoggingPerformance,
    isPausingGoal,
    error, setError,
    selectWorkoutMicrocycle,
    selectNextGoal,
    handleLogPerformance,
    handlePauseCurrentGoal,
  };
};