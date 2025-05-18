import supabase from '@/assets/supabase/client';
import type { Goal } from '@/features/goalsManagement/types';

import type { DoneExerciseLog, DoneExerciseLogInsert } from '../types';

export const fetchActiveGoalsForWorkout = async (userId: string, microcycleNumber: number | null): Promise<Goal[]> => {
  console.log('[workoutService] fetchActiveGoalsForWorkout: Initiating for userId:', userId, 'and microcycleNumber:', microcycleNumber);

  if (microcycleNumber === null || microcycleNumber === undefined) {
    console.log('[workoutService] fetchActiveGoalsForWorkout: microcycleNumber is null/undefined, returning empty array.');
    return [];
  }


  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('microcycle', microcycleNumber)
    .eq('active', 1);

  console.log('[workoutService] fetchActiveGoalsForWorkout: Supabase response - Data:', data, 'Error:', error);

  if (error) {
    console.error('[workoutService] Error fetching active goals for workout:', error.message);
    throw error;
  }

  return data || [];
};

export const logDoneExercise = async (logData: DoneExerciseLogInsert): Promise<DoneExerciseLog | null> => {
  console.log('[workoutService] logDoneExercise: Calling Supabase with logData:', JSON.parse(JSON.stringify(logData)));

  const { data, error } = await supabase
    .from('done_exercises')
    .insert(logData)
    .select()
    .single();

  console.log('[workoutService] logDoneExercise: Supabase response - Data:', data, 'Error:', error);

  if (error) {
    console.error('[workoutService] Error logging done exercise:', error.message);
    throw error;
  }
  return data;
};