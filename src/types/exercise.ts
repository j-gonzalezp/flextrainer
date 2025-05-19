// File: training/src/types/exercise.ts

/**
 * Represents a base exercise definition in the system.
 * This is different from a "Goal" or "WorkoutExercise" which is an instance
 * of an exercise planned within a specific workout/microcycle with specific targets.
 */
export interface ExerciseSystem {
  id: string; // Or number, depending on your database primary key for exercises
  user_id?: string | null; // From DB schema, optional if exercises can be global
  name: string;
  description?: string | null; // Optional detailed description
  categories: string[];       // Array of category names or IDs
  
  // Default target values that can be used when adding this exercise to a plan
  default_reps?: number | null;
  default_sets?: number | null; 
  default_weight_kg?: number | null;
  default_duration_seconds?: number | null;
  default_rest_seconds?: number | null; 
  defaultNotes?: string | null; // Mapped from 'notes' column in DB
  
  // Other potential useful fields
  equipment_needed?: string[] | null; // e.g., ['barbell', 'bench']
  video_url?: string | null;          // Link to an instructional video
  muscle_groups_primary?: string[] | null; // e.g., ['chest', 'triceps']
  muscle_groups_secondary?: string[] | null; // e.g., ['shoulders']
  
  // Timestamps if you track when exercise definitions are created/updated
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