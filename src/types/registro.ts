// Base types for time tracking
export interface TimeRange {
  start: Date;
  end: Date;
}

// Interface for empty periods (vacío)
export interface PeriodoVacioAnotado {
  id?: string; // UUID de Supabase (opcional al crear)
  user_id?: string; // ID del usuario (Supabase/servicio puede añadirlo)
  fecha: Date; // La fecha del día al que pertenece este vacío
  hora_inicio: string | null; // La hora de inicio (TIME WITH TIME ZONE viene como string)
  hora_fin: string | null; // La hora de fin
  duracion_segundos: number; // Duración calculada
  etiquetas?: string[] | null; // Etiquetas aplicadas
  nota?: string | null; // Nota personal
  timestamp_creacion?: Date; // Cuando se hizo la anotación
}

// Interface for routine templates
export interface PasoRutina {
  id: string;
  descripcion: string;
  duracion_estimada?: number; // en segundos
  completado?: boolean;
}

export interface RutinaTemplate {
  id: string;
  user_id: string;
  nombre: string;
  descripcion?: string;
  estructura_pasos: PasoRutina[];
  activa: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

// Interface for routine instances
export type EstadoRutina = 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';

export interface RutinaInstance {
  id: string;
  user_id: string;
  rutina_id: string;
  timestamp_inicio: Date;
  timestamp_fin?: Date;
  estado: EstadoRutina;
  registros_vinculados: string[]; // IDs de registros vinculados
  creado_en: Date;
  actualizado_en: Date;
}
