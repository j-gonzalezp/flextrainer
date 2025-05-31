// Define la interfaz para un ejercicio tal como se almacena en la tabla 'goals_library' en Supabase.
export interface LibraryExercise {
  id: string;
  created_at: string;
  exercise_name: string;
  description: string | null;
  general_categories: string[];
  specific_categories: string[];
  equipment_needed: string[];
  suggested_variations: string[] | null;
  default_sets: number | null;
  default_reps: number | null;
  default_weight: number | null;
  default_duration_seconds: number | null;
  is_public: boolean;
  [key: string]: unknown; // Allow additional properties
}

// Define la interfaz para un ejercicio elegido en el modal para crear una meta
export interface ChosenExerciseGoalData {
  id: string; 
  exercise_name: string;
  is_custom: boolean;
  library_exercise_id?: string | null; 

  sets?: number | '' | null;
  reps?: number | '' | null;
  weight?: number | '' | null;
  duration_seconds?: number | '' | null;
  
  // Arrays are required but can be empty
  categories_general: string[]; 
  categories_specific: string[];
  equipment_needed?: string[];

  notes?: string | null;
  active?: 0 | 1;
  
  [key: string]: unknown; // Allow additional properties
}

// Definición de las interfaces para la tabla 'goals' (Metas planificadas por el usuario)
export type SortableGoalKeys = 'exercise_name' | 'sets' | 'reps' | 'weight' | 'duration_seconds' | 'completedSetsCount' | 'notes' | 'active' | 'created_at';

export type Goal = {
  id: string;
  user_id: string;
  exercise_name: string;
  microcycle: number;
  sets: number;
  reps: number | null;
  weight: number | null;
  duration_seconds: number | null;
  categories: string[] | null;
  notes: string | null;
  active: 0 | 1; 
  created_at: string;
  updated_at: string;
  [key: string]: unknown; // Allow additional properties
};

export type GoalInsert = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type GoalUpdate = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'microcycle'>>;

export type DoneExercise = {
  id: string;
  user_id: string;
  goal_id: string | null; 
  exercise_name: string;
  date: string;
  sets_completed: number;
  reps_completed: number | null;
  weight_used: number | null;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
  [key: string]: unknown; // Allow additional properties
};

export type DisplayableDoneExercise = DoneExercise & {
  goal_exercise_name?: string;
  goal_microcycle?: number;
}