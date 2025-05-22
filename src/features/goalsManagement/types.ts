import type { DoneExerciseLog } from '@/features/workoutExecution/types';

export interface Goal {
  id: string;
  user_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  microcycle: number;
  active: 0 | 1;
  categories?: string[];
  equipment_needed?: string[];
  notes?: string | null;
  weight?: number | null;
  duration_seconds?: number | null;
  // target_rpe?: number | null; // Removed RPE
  comments?: string | null;
  created_at: string;
  updated_at: string;
  exercise_library_id?: string | null;
  completedSetsCount?: number;
}

export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at' | 'completedSetsCount' | 'performance'>;

export type GoalUpdate = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'microcycle'>>;

export interface DisplayableDoneExercise extends DoneExerciseLog {
  exercise_name: string;
  weight_lifted: number;
  sets: number;
  reps: number;
  // rpe?: number | null; // Removed RPE
}


// Defines the keys of the Goal object that are eligible for sorting
export type SortableGoalKeys = keyof Pick<Goal, 'exercise_name' | 'sets' | 'reps' | 'created_at' | 'weight' | 'duration_seconds' | 'active'> | 'completedSetsCount';

export type GoalPerformance = {
  goalId: string;
  totalSetsCompleted: number;
  totalRepsCompleted: number;
  averageRepsPerSet: number;
  averageWeightPerSet: number;
  wasCompleted: boolean;
  setsMet: number;
  repsMet: number;
  totalVolumeLifted: number; // Added
  maxWeightAchievedInASet: number; // Added
  maxRepsAchievedInASet: number; // Added
  totalPlannedSets: number; // Added
  totalPlannedReps: number; // Added
  // lastRPE?: number; // Removed RPE
};

export type ProposedGoal = GoalInsert & {
  originalGoalId?: string;
  performance?: GoalPerformance;
  includeInNextMicrocycle: boolean;
};