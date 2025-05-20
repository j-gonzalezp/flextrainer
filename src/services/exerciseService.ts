// File: training/src/services/exerciseService.ts

import supabase from '@/assets/supabase/client';
import type { ExerciseSystem } from '@/types/exercise';

export const getAllSystemExercises = async (): Promise<ExerciseSystem[]> => {
  const { data, error } = await supabase
    .from('system_exercises') 
    .select(`
      id,
      user_id, 
      name,
      description,
      categories,
      default_reps,
      default_sets,
      default_weight_kg,
      default_duration_seconds,
      default_rest_seconds,
      notes, 
      equipment_needed,
      video_url,
      muscle_groups_primary,
      muscle_groups_secondary,
      created_at,
      updated_at
    `);

  if (error) {
    throw new Error(`Failed to fetch system exercises: ${error.message}`);
  }

  if (!data) {
    return [];
  }
  
  const mappedData = data.map(item => ({
    ...item,
    defaultNotes: item.notes,
    categories: item.categories || [], 
    equipment_needed: item.equipment_needed || [],
    muscle_groups_primary: item.muscle_groups_primary || [],
    muscle_groups_secondary: item.muscle_groups_secondary || [],
  }));

  return mappedData as ExerciseSystem[];
};

// ... other functions ...