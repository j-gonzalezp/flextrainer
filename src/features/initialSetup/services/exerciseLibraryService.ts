import { toast } from 'sonner';
import supabase from '@/assets/supabase/client';


import { LibraryExercise } from '@/features/initialSetup/types';

// --- Type Definitions ---

export interface LibraryExerciseFilter {
  generalCategories?: string[];
  specificCategories?: string[];
  equipment?: string[];
  // userId filter is NO LONGER RELEVANT for the public library
}

/**
 * Fetches exercises from the goals_library based on selected filters.
 * Uses 'overlap' to find exercises that match ANY of the provided categories/equipment.
 */
export const fetchLibraryExercises = async (filters: LibraryExerciseFilter): Promise<LibraryExercise[]> => {
  let query = supabase.from('goals_library').select('*');

  if (filters.generalCategories && filters.generalCategories.length > 0) {
    query = query.filter('general_categories', 'ov', `{${filters.generalCategories.join(',')}}`);
  }

  // Nota: el componente que llama a esta función (el asistente/wizard) debe aplanar
  // sus `selectedSpecific` (que es un mapa) en un solo array de strings para este filtro.
  if (filters.specificCategories && filters.specificCategories.length > 0) {
    query = query.filter('specific_categories', 'ov', `{${filters.specificCategories.join(',')}}`);
  }

  if (filters.equipment && filters.equipment.length > 0) {
    query = query.filter('equipment_needed', 'ov', `{${filters.equipment.join(',')}}`);
  }

  // Ya no filtramos por user_id, ya que la librería es pública para todos.

  const { data, error } = await query.order('exercise_name', { ascending: true });

  if (error) {
    console.error('Error fetching library exercises:', error);
    toast.error('Failed to fetch exercises from library: ' + error.message);
    throw new Error('Failed to fetch exercises from library: ' + error.message);
  }

  return data as LibraryExercise[];
};

export interface LibraryMetadata {
  generalCategories: string[];
  // Mapa de categoría general a un array de sus categorías específicas
  specificCategoriesMap: Map<string, string[]>; 
  equipmentOptions: string[];
}

/**
 * Fetches all available unique categories and equipment from the library,
 * structuring specific categories by their general parent.
 */
export const fetchLibraryMetadata = async (): Promise<LibraryMetadata> => {
  const { data, error } = await supabase
    .from('goals_library')
    .select('general_categories, specific_categories, equipment_needed');

  if (error) {
    console.error('Error fetching library metadata:', error);
    toast.error('Failed to fetch library metadata: ' + error.message);
    throw new Error('Failed to fetch library metadata: ' + error.message);
  }

  const general = new Set<string>();
  const specificCategoriesMap = new Map<string, Set<string>>(); // Usar Set para asegurar unicidad por categoría general
  const equipment = new Set<string>();

  data.forEach(item => {
    // Primero, poblamos las categorías generales y creamos entradas en specificCategoriesMap
    item.general_categories.forEach((genCat: string) => {
      general.add(genCat);
      if (!specificCategoriesMap.has(genCat)) {
        specificCategoriesMap.set(genCat, new Set<string>());
      }
    });

    // Luego, para cada ejercicio, agregamos sus categorías específicas a todas las categorías
    // generales a las que está asociado (en caso de que un ejercicio tenga múltiples generales).
    item.general_categories.forEach((genCat: string) => {
      if (specificCategoriesMap.has(genCat)) { // Asegurar que la categoría general fue añadida
          item.specific_categories.forEach((specCat: string) => {
              specificCategoriesMap.get(genCat)!.add(specCat);
          });
      }
    });

    item.equipment_needed.forEach((eq: string) => equipment.add(eq));
  });

  // Convertir los Sets a arrays ordenados
  const sortedGeneral = Array.from(general).sort();
  const sortedEquipment = Array.from(equipment).sort();
  
  const finalSpecificCategoriesMap = new Map<string, string[]>();
  sortedGeneral.forEach(genCat => {
    if (specificCategoriesMap.has(genCat)) {
      finalSpecificCategoriesMap.set(genCat, Array.from(specificCategoriesMap.get(genCat)!).sort());
    } else {
      finalSpecificCategoriesMap.set(genCat, []); // Asegura que todas las categorías generales tienen una entrada, incluso si vacía
    }
  });

  return {
    generalCategories: sortedGeneral,
    specificCategoriesMap: finalSpecificCategoriesMap, // Ahora estructurado correctamente
    equipmentOptions: sortedEquipment,
  };
};


export const fetchLibraryExercisesByIds = async (ids: string[]): Promise<LibraryExercise[]> => {
  if (ids.length === 0) {
    return [];
  }
  const { data, error } = await supabase
    .from('goals_library')
    .select('*')
    .in('id', ids) // Usa el operador 'in' para buscar múltiples IDs
    .order('exercise_name', { ascending: true });

  if (error) {
    console.error('Error fetching library exercises by IDs:', error);
    toast.error('Failed to fetch variation exercises: ' + error.message);
    throw new Error('Failed to fetch variation exercises: ' + error.message);
  }

  return data as LibraryExercise[];
};