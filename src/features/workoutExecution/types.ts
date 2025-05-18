import type { Goal } from '@/features/goalsManagement/types';

export interface DoneExerciseLogInsert {
  user_id: string;
  goal_id: Goal['id'];
  goal_microcycle_at_log: number;
  reps_done: number;
  sets_done_for_this_log?: number;
  failed_set?: boolean;
  weight_used?: number | null;
  duration_seconds_done?: number | null;
  notes?: string | null;
}

export interface DoneExerciseLog extends DoneExerciseLogInsert {
  id: number;
  logged_at: string;
}