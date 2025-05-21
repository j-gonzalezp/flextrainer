export interface User {
  id: string;
  email: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: number;
  exercise_name: string;
  description?: string | null;
  video_url?: string | null;
  target_muscle_groups?: string[] | null; // e.g., ['Chest', 'Triceps']
  equipment_needed?: string[] | null; // e.g., ['Dumbbells', 'Bench']
  created_by?: string | null; // User ID
  created_at: string;
  updated_at: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  rating?: number | null; // Average user rating
  notes?: string | null;
  is_public?: boolean; // Whether it's a custom exercise or a public one
}

export interface Goal {
  id: number;
  user_id: string;
  exercise_id: number;
  microcycle_id: number;
  // Performance targets
  target_sets?: number | null;
  target_reps?: number | null;
  target_weight_kg?: number | null;
  target_duration_seconds?: number | null;
  target_distance_km?: number | null;
  target_rir?: number | null; // Reps in Reserve
  // Tracking
  completed_sets?: number | null;
  completed_reps?: number | null;
  completed_weight_kg?: number | null;
  completed_duration_seconds?: number | null;
  completed_distance_km?: number | null;
  completed_rir?: number | null;
  notes?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  // Metadata
  created_at: string;
  updated_at: string;
  // For UI purposes, joined from exercises table
  exercise_name?: string;
  // For UI, to link back to workout plan details if needed
  workout_plan_id?: number;
  workout_plan_name?: string;
  // For UI, from microcycles
  microcycle_name?: string;
  mesocycle_id?: number;
  mesocycle_name?: string;
  active_in_workout?: boolean | null; // is this goal currently active in the workout session
}

export interface PerformanceLog {
  id: number;
  goal_id: number;
  user_id: string;
  set_number: number;
  reps_completed?: number | null;
  weight_kg?: number | null;
  duration_seconds?: number | null;
  distance_km?: number | null;
  notes?: string | null;
  logged_at: string;
  created_at: string;
  updated_at: string;
  // Optional fields based on what's being tracked
  rir?: number | null;
  difficulty_rating?: number | null; // e.g., RPE
}

export interface Microcycle {
  id: number;
  mesocycle_id: number;
  user_id: string;
  microcycle_name: string; // e.g., \"Week 1 - Accumulation\", \"Deload Week\"
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  is_active: boolean; // Is this the current microcycle the user is running
  order_in_mesocycle: number;
  created_at: string;
  updated_at: string;
  goals?: Goal[]; // populated when fetching microcycle details
}

export interface Mesocycle {
  id: number;
  workout_plan_id: number;
  user_id: string;
  mesocycle_name: string; // e.g., \"Strength Block 1\", \"Hypertrophy Phase\"
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  order_in_plan: number;
  created_at: string;
  updated_at: string;
  microcycles?: Microcycle[]; // populated when fetching mesocycle details
}

export interface WorkoutPlan {
  id: number;
  user_id: string;
  plan_name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean; // Is this the current plan the user is following
  created_at: string;
  updated_at: string;
  mesocycles?: Mesocycle[]; // populated when fetching plan details
}