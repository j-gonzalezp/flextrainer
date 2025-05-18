import supabase from '@/assets/supabase/client';
import type { Goal, GoalInsert, GoalUpdate, DisplayableDoneExercise } from '../types';

export const fetchMicrocyclesForUser = async (userId: string): Promise<number[]> => {
  console.log(`[goalService] fetchMicrocyclesForUser: Calling Supabase with userId: ${userId}`);
  const { data, error } = await supabase
    .from('goals')
    .select('microcycle')
    .eq('user_id', userId)
    .order('microcycle', { ascending: true });


  if (error) {
    console.error('[goalService] fetchMicrocyclesForUser: Supabase error:', error);
    throw error;
  }

  const microcycles = data ? [...new Set(data.map(item => item.microcycle))].sort((a, b) => a - b) : [];
  console.log(`[goalService] fetchMicrocyclesForUser: Supabase response - Processed microcycles:`, microcycles);
  return microcycles;
};

export const fetchGoalsForMicrocycle = async (userId: string, microcycleNumber: number): Promise<Goal[]> => {
  console.log('[goalService] fetchGoalsForMicrocycle: Calling Supabase with userId:', userId, 'microcycleNumber:', microcycleNumber);
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('microcycle', microcycleNumber)
    .order('created_at', { ascending: true });
  console.log('[goalService] fetchGoalsForMicrocycle: Supabase response - Data:', data, 'Error:', error);

  if (error) {
    console.error(`Error fetching goals for microcycle ${microcycleNumber}:`, error.message);
    throw error;
  }


  return data || [];
};

export const createGoal = async (goalData: GoalInsert, userId: string): Promise<Goal | null> => {
  const goalToInsert = {
    ...goalData,
    user_id: userId,
    active: goalData.active ?? 1,

  };
  console.log('[goalService] createGoal: Calling Supabase with goalToInsert:', goalToInsert);

  const { data, error } = await supabase
    .from('goals')
    .insert(goalToInsert)
    .select()
    .single();
  console.log('[goalService] createGoal: Supabase response - Data:', data, 'Error:', error);

  if (error) {
    console.error('Error creating goal:', error.message);
    throw error;
  }

  return data;
};


export const updateGoal = async (goalId: number, goalData: GoalUpdate): Promise<Goal | null> => {
  console.log('[goalService] updateGoal: Calling Supabase with goalId:', goalId, 'goalData:', goalData);

  const { data, error } = await supabase
    .from('goals')
    .update(goalData)
    .eq('id', goalId)
    .select()
    .single();
  console.log('[goalService] updateGoal: Supabase response - Data:', data, 'Error:', error);
  if (error) {
    console.error('Error updating goal:', error.message);
    throw error;
  }

  return data;
};

export const deleteGoal = async (goalId: number): Promise<boolean> => {
  console.log('[goalService] deleteGoal: Calling Supabase with goalId:', goalId);
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);
  console.log('[goalService] deleteGoal: Supabase response - Error:', error);
  if (error) {
    console.error('Error deleting goal:', error.message);
    throw error;
  }
  return !error;
};

export const toggleGoalActiveState = async (goalId: number, currentState: 0 | 1): Promise<Goal | null> => {
  console.log('[goalService] toggleGoalActiveState: Calling Supabase with goalId:', goalId, 'newActiveState:', currentState === 1 ? 0 : 1);
  const { data, error } = await supabase
    .from('goals')
    .update({ active: currentState === 1 ? 0 : 1 })
    .eq('id', goalId)
    .select()
    .single();
  console.log('[goalService] toggleGoalActiveState: Supabase response - Data:', data, 'Error:', error);
  if (error) {
    console.error('Error toggling goal active state:', error.message);
    throw error;
  }

  return data;
};

export const createNextMicrocycle = async (userId: string, currentMaxMicrocycle: number): Promise<Goal[]> => {
  console.log('[goalService] createNextMicrocycle: Initiating for userId:', userId, 'from currentMaxMicrocycle:', currentMaxMicrocycle);

  const { data: activeGoals, error: fetchError } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .eq('microcycle', currentMaxMicrocycle)
    .eq('active', 1);
  console.log('[goalService] createNextMicrocycle: Fetch active goals for duplication - Supabase call with userId:', userId, 'currentMaxMicrocycle:', currentMaxMicrocycle);


  console.log('[goalService] createNextMicrocycle: Fetch active goals response - Data:', activeGoals, 'Error:', fetchError);
  if (fetchError) {
    console.error('Error fetching active goals for duplication:', fetchError.message);
    throw fetchError;
  }

  if (!activeGoals || activeGoals.length === 0) {

    console.log('[goalService] createNextMicrocycle: No active goals found to duplicate. Creating minimal goal for new microcycle.');
    const newMicrocycleNumber = currentMaxMicrocycle + 1;
    const minimalGoalToInsert = {
      user_id: userId,
      microcycle: newMicrocycleNumber,
      exercise_name: `Microciclo ${newMicrocycleNumber} - Placeholder`,
      active: 1,

    };

    const { data: minimalGoal, error: minimalInsertError } = await supabase
      .from('goals')
      .insert(minimalGoalToInsert)
      .select()
      .single();

    if (minimalInsertError) {
      console.error('Error inserting minimal goal for new microcycle:', minimalInsertError.message);
      throw minimalInsertError;
    }


    return minimalGoal ? [minimalGoal] : [];
  }


  const newMicrocycleNumber = currentMaxMicrocycle + 1;
  const goalsToInsert: GoalInsert[] = activeGoals.map(goal => {
    const { id, created_at, updated_at, user_id: uid, microcycle, ...rest } = goal;
    return {
      ...rest,
      microcycle: newMicrocycleNumber,


      active: 1,

    };
  });


  console.log('[goalService] createNextMicrocycle: Inserting new goals - goalsToInsert:', goalsToInsert);
  const { data: newGoals, error: insertError } = await supabase
    .from('goals')
    .insert(goalsToInsert)
    .select();
  console.log('[goalService] createNextMicrocycle: Insert new goals response - Data:', newGoals, 'Error:', insertError);

  if (insertError) {
    console.error('Error inserting new goals for next microcycle:', insertError.message);
    throw insertError;
  }


  return newGoals || [];
};

export const fetchDoneExercisesForMicrocycle = async (userId: string, microcycleNumber: number): Promise<DisplayableDoneExercise[]> => {
  console.log(`[goalService] fetchDoneExercisesForMicrocycle: Calling Supabase for userId: ${userId}, microcycle: ${microcycleNumber}`);

  const { data, error } = await supabase
    .from('done_exercises')
    .select("*, goals(exercise_name)")
    .eq('user_id', userId)
    .eq('goal_microcycle_at_log', microcycleNumber)
    .order('logged_at', { ascending: false });

  console.log(`[goalService] fetchDoneExercisesForMicrocycle: Supabase response - Data:`, data, 'Error:', error);

  if (error) {
    console.error('[goalService] fetchDoneExercisesForMicrocycle: Supabase error:', error);
    throw error;
  }


  const processedData: DisplayableDoneExercise[] = data ? data.map(log => {
    const logWithGoalName = log as any;
    return {
      ...logWithGoalName,
      exercise_name: logWithGoalName.goals?.exercise_name || 'Nombre desconocido',

      goals: undefined,
    };
  }) : [];

  console.log(`[goalService] fetchDoneExercisesForMicrocycle: Processed data:`, processedData);

  return processedData;
};

export const fetchUserMaxMicrocycle = async (userId: string): Promise<number | null> => {
  console.log('[goalService] fetchUserMaxMicrocycle: Calling Supabase with userId:', userId);
  const { data, error } = await supabase
    .from('goals')
    .select('microcycle')
    .eq('user_id', userId)
    .order('microcycle', { ascending: false })
    .limit(1)
    .single();

  console.log('[goalService] fetchUserMaxMicrocycle: Supabase response - Data:', data, 'Error:', error);


  if (error && error.code !== 'PGRST116') {
    console.error('[goalService] Error fetching max microcycle:', error.message);
    throw error;
  }
  return data ? data.microcycle : null;
};