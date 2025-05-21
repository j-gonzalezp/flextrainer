export interface StaticExerciseDefaultParamsGuidance {
  reps?: string;
  sets_per_workout_suggestion?: string;
  intensity_cue?: string;
  duration_seconds?: string;
  duration_minutes?: string;
}

export interface StaticExercise {
  id: string;
  name: string;
  category_general: string;
  category_specific: string[];
  equipment_needed: string[];
  description_short?: string;
  variations?: string[]; // Nombres de otros ejercicios en staticExercises.json
  default_parameters_guidance?: StaticExerciseDefaultParamsGuidance;
}

export interface ChosenExerciseGoalData {
  id: string; // uuid temporal del frontend o id del staticExercise si se basa en uno
  exercise_name: string;
  is_custom: boolean;
  static_exercise_ref_id?: string; // ID del staticExercises.json si no es custom

  categories_general?: string[]; // Para la UI del modal, estas se combinarán en 'categories' para GoalInsert
  categories_specific?: string[]; // Para la UI del modal

  // Parámetros que coinciden con los campos de 'Goal'/'GoalInsert'
  sets?: number;          // Objetivo semanal de sets
  reps?: number;          // Objetivo numérico de reps por set
  weight?: number;        // Peso objetivo
  duration_seconds?: number; // Duración objetivo por set (para estiramientos, etc.)
  notes?: string;
  // 'microcycle' y 'active' no son parte de ChosenExerciseGoalData directamente,
  // ya que serán manejados por el hook useGoalsManagement.handleAddGoal al crear la meta.
}

// MVPGoalInsert ya no es necesaria, se preparará directamente GoalInsert (de goalsManagement/types.ts)
// en CreateFirstMicrocycleModal.tsx antes de llamar a hookHandleAddGoal.