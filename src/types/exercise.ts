// File: training/src/types/exercise.ts

export interface ExerciseSystem {
  id: string;
  user_id?: string | null;
  name: string;
  description?: string | null;
  categories: string[];
  default_reps?: number | null;
  default_sets?: number | null;
  default_weight_kg?: number | null;
  default_duration_seconds?: number | null;
  default_rest_seconds?: number | null;
  defaultNotes?: string | null;
  equipment_needed?: string[] | null;
  video_url?: string | null;
  muscle_groups_primary?: string[] | null;
  muscle_groups_secondary?: string[] | null;
  created_at?: string;
  updated_at?: string;
}

// You might also want a type for inserting/updating system exercises if you have an admin panel for it
export type ExerciseSystemInsert = Omit<ExerciseSystem, 'id' | 'created_at' | 'updated_at' | 'user_id'> & {
  user_id?: string; // user_id might be set automatically based on logged-in user
  created_at?: string; 
  updated_at?: string; 
};

export type ExerciseSystemUpdate = Partial<ExerciseSystemInsert>;