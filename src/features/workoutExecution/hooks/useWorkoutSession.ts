import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as workoutService from '../services/workoutService';
import * as goalService from '@/features/goalsManagement/services/goalService';
import type { Goal } from '@/features/goalsManagement/types';
import type { DoneExerciseLogInsert } from '../types';

// HELPER FUNCTION - Place it at the top level of the module
const getUniqueCategoriesFromGoals = (goals: Goal[]): string[] => {
  const allCategories = goals.flatMap(goal => goal.categories || []);
  return Array.from(new Set(allCategories)).sort();
};

export const useWorkoutSession = () => {
  const { user } = useAuth();

  // Microcycle selection states
  const [userMicrocycles, setUserMicrocycles] = useState<number[]>([]);
  const [selectedWorkoutMicrocycle, setSelectedWorkoutMicrocycle] = useState<number | null>(null);
  const [isLoadingMicrocycles, setIsLoadingMicrocycles] = useState<boolean>(true);

  // Workout session states
  const [allActiveGoalsForMicrocycle, setAllActiveGoalsForMicrocycle] = useState<Goal[]>([]); // Renamed from activeWorkoutGoals for clarity
  const [filteredWorkoutGoals, setFilteredWorkoutGoals] = useState<Goal[]>([]); // NEW: For category filtered goals
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(false);

  // --- NEW: Category Filtering States ---
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([]);

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
    setPerformanceReps('');
    setPerformanceFailedSet(false);
    setPerformanceWeight('');
    setPerformanceDuration('');
    setPerformanceNotes('');
  }, []);

  // Effect 1: Fetch all available microcycles for the user
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
            setAllActiveGoalsForMicrocycle([]); // Clear all goal related states
            setFilteredWorkoutGoals([]);
            setCurrentGoal(null);
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
        .finally(() => {
          setIsLoadingMicrocycles(false);
        });
    } else {
      setUserMicrocycles([]);
      setSelectedWorkoutMicrocycle(null);
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null);
      setAvailableCategories([]);
      setSelectedCategoryFilters([]);
      setIsLoadingMicrocycles(false);
    }
  }, [user?.id]);

  // Effect 2: Fetch active goals when a workout microcycle is selected
  useEffect(() => {
    if (user?.id && selectedWorkoutMicrocycle !== null) {
      setIsLoadingGoals(true);
      setError(null);
      // Reset states related to goals of a microcycle
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null);
      setAvailableCategories([]);
      setSelectedCategoryFilters([]); // Reset category filters when microcycle changes

      workoutService.fetchActiveGoalsForWorkout(user.id, selectedWorkoutMicrocycle)
        .then(fetchedGoals => {
          setAllActiveGoalsForMicrocycle(fetchedGoals); // Store all active goals for this microcycle
          setAvailableCategories(getUniqueCategoriesFromGoals(fetchedGoals)); // Derive categories
          // Filtering and setting currentGoal will be handled by the next useEffect
        })
        .catch(err => {
          console.error('[useWorkoutSession] Error fetching active goals:', err);
          setError('Failed to load active goals for the selected microcycle.');
          setAllActiveGoalsForMicrocycle([]);
          setAvailableCategories([]);
        })
        .finally(() => {
          setIsLoadingGoals(false);
        });
    } else if (!selectedWorkoutMicrocycle) {
      setAllActiveGoalsForMicrocycle([]);
      setFilteredWorkoutGoals([]);
      setCurrentGoal(null);
      setAvailableCategories([]);
      setSelectedCategoryFilters([]);
      clearPerformanceInputs();
      setIsLoadingGoals(false);
    }
  }, [user?.id, selectedWorkoutMicrocycle, clearPerformanceInputs]); // Removed selectGoalFromList dependency here as it's handled in next effect

  // --- NEW: Effect 3: Filter goals and select current goal ---
  useEffect(() => {
    if (isLoadingGoals) {
        // Don't do anything if goals are still loading for the microcycle
        return;
    }

    let currentFilteredGoals: Goal[];
    if (selectedCategoryFilters.length === 0) {
      currentFilteredGoals = [...allActiveGoalsForMicrocycle]; // No filter, use all
    } else {
      currentFilteredGoals = allActiveGoalsForMicrocycle.filter(goal =>
        goal.categories?.some(cat => selectedCategoryFilters.includes(cat))
      );
    }
    setFilteredWorkoutGoals(currentFilteredGoals); // Update the state for filtered goals

    const newSelectedGoal = selectGoalFromList(currentFilteredGoals);
    setCurrentGoal(newSelectedGoal);
    clearPerformanceInputs(); // Clear inputs for the new/potentially null goal

  }, [allActiveGoalsForMicrocycle, selectedCategoryFilters, isLoadingGoals, selectGoalFromList, clearPerformanceInputs]);


  // --- NEW: Handler to set category filters ---
  const handleSelectCategoryFilters = useCallback((categories: string[]) => {
    setSelectedCategoryFilters(categories);
    // The useEffect for filtering will pick up this change
  }, []);


  // Function to allow UI to change the selected workout microcycle
  const selectWorkoutMicrocycleHandler = useCallback((cycleNumber: number | null) => { // Allow null
    setSelectedWorkoutMicrocycle(cycleNumber);
  }, []);

  // Renamed to skipCurrentGoalAndSelectNext for clarity
  const skipCurrentGoalAndSelectNext = useCallback(() => {
    // Now selects from the already filtered list
    const nextGoal = selectGoalFromList(filteredWorkoutGoals);
    setCurrentGoal(nextGoal);
    clearPerformanceInputs();
  }, [filteredWorkoutGoals, selectGoalFromList, clearPerformanceInputs]);

  const handleLogPerformance = async () => {
    if (!currentGoal || !user?.id) {
      setError('No current goal selected or user not available.');
      return;
    }
    const repsDone = parseInt(performanceReps, 10);
    // Validate reps only if goal expects reps
    if (currentGoal.reps !== null && currentGoal.reps !== undefined && isNaN(repsDone)) {
      setError('Please enter a valid number for reps.');
      return;
    }

    const durationDone = performanceDuration !== '' ? parseInt(performanceDuration, 10) : null;
    // Validate duration only if goal expects duration
    if (currentGoal.duration_seconds !== null && currentGoal.duration_seconds !== undefined && performanceDuration !== '' && (durationDone === null || isNaN(durationDone))) {
        setError('Please enter a valid number for duration.');
        return;
    }

    const logPayload: DoneExerciseLogInsert = {
      user_id: user.id,
      goal_id: currentGoal.id,
      goal_microcycle_at_log: currentGoal.microcycle, // Use the correct property name from Goal type
      reps_done: !isNaN(repsDone) ? repsDone : null,
      sets_done_for_this_log: 1,
      failed_set: performanceFailedSet,
      weight_used: performanceWeight !== '' ? parseFloat(performanceWeight) : null,
      duration_seconds_done: durationDone,
      notes: performanceNotes || null,
    };

    setIsLoggingPerformance(true);
    setError(null);
    try {
      const loggedExercise = await workoutService.logDoneExercise(logPayload);
      if (loggedExercise) {
        // Remove logged goal from the source list to prevent re-selection in this session
        setAllActiveGoalsForMicrocycle(prevGoals => prevGoals.filter(g => g.id !== currentGoal.id));
        // The useEffect for filtering will then pick a new goal
      } else {
        setError('Failed to log performance. Service returned no data.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while logging performance.');
    } finally {
      setIsLoggingPerformance(false);
    }
  };

  const handlePauseCurrentGoal = async () => {
    if (!currentGoal || !user?.id) {
      setError('No current goal selected to pause.');
      return;
    }
    setIsPausingGoal(true);
    setError(null);
    try {
      const updatedGoal = await goalService.toggleGoalActiveState(currentGoal.id, 0);
      if (updatedGoal && updatedGoal.active === 0) {
        // Remove paused goal from the source list
        setAllActiveGoalsForMicrocycle(prevGoals => prevGoals.filter(g => g.id !== currentGoal!.id));
        // The useEffect for filtering will then pick a new goal
      } else {
        setError('Failed to pause goal or goal state did not change as expected.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while pausing the goal.');
    } finally {
      setIsPausingGoal(false);
    }
  };

  return {
    user,
    userMicrocycles,
    selectedWorkoutMicrocycle,
    isLoadingMicrocycles,

    allActiveGoalsForMicrocycle, // Use this to see all remaining goals before filtering
    filteredWorkoutGoals,       // Goals after category filter
    currentGoal,
    isLoadingGoals,

    availableCategories,        // NOW DECLARED
    selectedCategoryFilters,    // NOW DECLARED
    handleSelectCategoryFilters,// NOW DECLARED

    performanceReps, setPerformanceReps,
    performanceFailedSet, setPerformanceFailedSet,
    performanceWeight, setPerformanceWeight,
    performanceDuration, setPerformanceDuration,
    performanceNotes, setPerformanceNotes,

    isLoggingPerformance,
    isPausingGoal,
    error, setError,

    selectWorkoutMicrocycle: selectWorkoutMicrocycleHandler, // Use the handler that accepts null
    selectNextGoal: skipCurrentGoalAndSelectNext,           // Use the renamed function
    handleLogPerformance,
    handlePauseCurrentGoal,
  };
};