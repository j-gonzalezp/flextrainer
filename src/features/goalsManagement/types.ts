import type { DoneExerciseLog } from '@/features/workoutExecution/types';

export interface Goal {
  id: number;
  user_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  microcycle: number;
  active: 0 | 1;
  categories?: string[];
  notes?: string | null;
  weight?: number | null;
  duration_seconds?: number | null;
  created_at: string;
  updated_at: string;
  completedSetsCount?: number; // Added for displaying completed sets
}

export type GoalInsert = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'active'> & {
  user_id?: string;
  active?: 0 | 1;
  categories?: string[];
};

export type GoalUpdate = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'microcycle'>>;

export interface DisplayableDoneExercise extends DoneExerciseLog {
  exercise_name: string;
}


// Defines the keys of the Goal object that are eligible for sorting
export type SortableGoalKeys = 'exercise_name' | 'sets' | 'reps' | 'weight' | 'duration_seconds' | 'active' | 'created_at' | 'completedSetsCount';