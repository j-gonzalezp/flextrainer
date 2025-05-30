import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChosenExerciseGoalData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Mapeo de categorías más generales/movimientos a grupos musculares anatómicos de fuerza.
// Esto permite que un ejercicio con categoría "Push" contribuya a "Pecho", "Hombros", "Tríceps".
const CATEGORY_TO_MUSCLE_GROUP_MAP: { [key: string]: string[] } = {
  'Push': ['Pecho', 'Hombros', 'Tríceps'],
  'Pull': ['Espalda', 'Bíceps'],
  'Upper Body': ['Pecho', 'Hombros', 'Tríceps', 'Espalda', 'Bíceps'],
  'Lower Body': ['Piernas', 'Glúteos', 'Cuádriceps', 'Isquiotibiales', 'Pantorrillas', 'Aductores'],
  'Full Body': ['Pecho', 'Hombros', 'Tríceps', 'Espalda', 'Bíceps', 'Core', 'Piernas', 'Glúteos', 'Cuádriceps', 'Isquiotibiales'], 
  'Core': ['Core', 'Abs', 'Oblicuos'],
  // Mapeos directos para categorías que ya son grupos musculares específicos
  'Pecho': ['Pecho'], 'Hombros': ['Hombros'], 'Tríceps': ['Tríceps'],
  'Espalda': ['Espalda'], 'Bíceps': ['Bíceps'],
  'Piernas': ['Piernas'], 'Glúteos': ['Glúteos'], 'Cuádriceps': ['Cuádriceps'],
  'Isquiotibiales': ['Isquiotibiales'], 'Pantorrillas': ['Pantorrillas'], 'Aductores': ['Aductores'],
  'Abs': ['Abs'], 'Oblicuos': ['Oblicuos'],
};

// Lista de los grupos musculares anatómicos principales que manejaremos para el volumen.
// Esta lista es exhaustiva, el filtrado para lo que se muestra en la UI se hace en el componente.
const PRIMARY_STRENGTH_MUSCLE_GROUPS: string[] = [
  'Pecho', 'Hombros', 'Tríceps', 'Espalda', 'Bíceps', 
  'Piernas', 'Glúteos', 'Cuádriceps', 'Isquiotibiales', 'Pantorrillas', 'Aductores', 
  'Core', 'Abs', 'Oblicuos'
];

/**
 * Helper function to determine all unique primary strength muscle groups an exercise contributes to.
 */
const getContributingMuscleGroups = (exercise: ChosenExerciseGoalData): string[] => {
  const allRelevantCategories = [...exercise.categories_general, ...exercise.categories_specific];
  const contributingGroups = new Set<string>();

  allRelevantCategories.forEach(cat => {
    const mappedGroups = CATEGORY_TO_MUSCLE_GROUP_MAP[cat];
    if (mappedGroups) {
      mappedGroups.forEach(group => {
        if (PRIMARY_STRENGTH_MUSCLE_GROUPS.includes(group)) {
          contributingGroups.add(group);
        }
      });
    } else if (PRIMARY_STRENGTH_MUSCLE_GROUPS.includes(cat)) { // Direct match if category is already a primary group
      contributingGroups.add(cat);
    }
  });
  return Array.from(contributingGroups);
};


interface ExerciseParameterConfigItemProps {
  exerciseConfig: ChosenExerciseGoalData;
  onUpdate: (id: string, updatedParams: Partial<ChosenExerciseGoalData>) => void;
  itemKey: string;
}

const ExerciseParameterConfigItem: React.FC<ExerciseParameterConfigItemProps> = ({
  exerciseConfig,
  onUpdate,
  itemKey,
}) => {
  const handleParamChange = (paramName: keyof ChosenExerciseGoalData, value: any) => {
    // Convertir a number o null/'' correctamente para los inputs
    let parsedValue = value;
    if (typeof value === 'string' && value.trim() === '') {
        parsedValue = ''; // Mantener vacío para input
    } else if (paramName === 'sets' || paramName === 'reps' || paramName === 'duration_seconds') {
        parsedValue = parseInt(value);
        if (isNaN(parsedValue)) parsedValue = null;
    } else if (paramName === 'weight') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) parsedValue = null;
    }
    onUpdate(exerciseConfig.id, { [paramName]: parsedValue });
  };
  
  return (
    <AccordionItem value={itemKey} key={itemKey}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-col text-left">
          <span className="font-semibold text-slate-900">{exerciseConfig.exercise_name}</span>
          {exerciseConfig.is_custom && <span className="text-xs text-blue-700 font-medium">(Personalizado)</span>}
          {(exerciseConfig.categories_general.length > 0 || exerciseConfig.categories_specific.length > 0) ? (
            <span className="text-xs text-slate-600 mt-0.5">
              Categorías: 
              {exerciseConfig.categories_general.join(', ')}
              {exerciseConfig.categories_specific.length > 0 && ` (${exerciseConfig.categories_specific.join(', ')})`}
            </span>
          ) : (
            exerciseConfig.is_custom && <span className="text-xs text-red-700 font-medium mt-0.5">¡Sin categoría!</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4 px-1 space-y-4 bg-muted/30 rounded-md">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 px-3">
          <div className="space-y-1">
            <Label htmlFor={`sets-${exerciseConfig.id}`} className="text-sm">Sets Semanales*</Label>
            <Input 
              id={`sets-${exerciseConfig.id}`} 
              type="number" 
              min="0"
              placeholder="Ej: 10" 
              value={exerciseConfig.sets ?? ''} 
              onChange={e => handleParamChange('sets', e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`reps-${exerciseConfig.id}`} className="text-sm">Reps por Set (número)*</Label>
            <Input 
              id={`reps-${exerciseConfig.id}`} 
              type="number" 
              min="0"
              placeholder="Ej: 10" 
              value={exerciseConfig.reps ?? ''} 
              onChange={e => handleParamChange('reps', e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`weight-${exerciseConfig.id}`} className="text-sm">Peso (kg)</Label>
            <Input 
              id={`weight-${exerciseConfig.id}`} 
              type="number" 
              step="0.01" 
              min="0"
              placeholder="Ej: 50.5" 
              value={exerciseConfig.weight ?? ''} 
              onChange={e => handleParamChange('weight', e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`duration-${exerciseConfig.id}`} className="text-sm">Duración (seg)*</Label>
            <Input 
              id={`duration-${exerciseConfig.id}`} 
              type="number" 
              min="0"
              placeholder="Ej: 60" 
              value={exerciseConfig.duration_seconds ?? ''} 
              onChange={e => handleParamChange('duration_seconds', e.target.value)} 
            />
          </div>
        </div>
        <div className="px-3 pt-2 space-y-1">
          <Label htmlFor={`notes-${exerciseConfig.id}`} className="text-sm">Notas Adicionales</Label>
          <Textarea 
            id={`notes-${exerciseConfig.id}`} 
            placeholder="Cualquier nota específica para esta meta..." 
            value={exerciseConfig.notes ?? ''} 
            onChange={e => handleParamChange('notes', e.target.value)} 
            rows={2}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

// =========================================================================
// Componente para la configuración de Volumen Total por Grupo Muscular
// =========================================================================

interface MuscleGroupVolumeConfigProps {
  muscleGroups: string[];
  currentVolumes: { [muscleGroup: string]: number };
  onUpdateMuscleGroupVolume: (muscleGroup: string, volume: number) => void;
}

const MuscleGroupVolumeConfig: React.FC<MuscleGroupVolumeConfigProps> = ({
  muscleGroups,
  currentVolumes,
  onUpdateMuscleGroupVolume,
}) => {
  return (
    <Card className="card-rounded-custom">
      <CardHeader>
        <CardTitle>1. Volumen Total por Grupo Muscular</CardTitle>
        <CardDescription>Define la cantidad total de sets semanales que deseas para cada grupo muscular principal de tus ejercicios elegidos. Solo se mostrarán los grupos musculares relevantes para tus ejercicios de fuerza seleccionados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {muscleGroups.length > 0 ? (
          muscleGroups.map(group => (
            <div key={group} className="flex items-center space-x-4">
              <Label htmlFor={`volume-${group}`} className="flex-grow font-medium text-slate-900">Volumen para {group}:</Label>
              <Input
                id={`volume-${group}`}
                type="number"
                min="0"
                value={currentVolumes[group] ?? ''}
                onChange={e => onUpdateMuscleGroupVolume(group, parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-slate-600">sets semanales</span>
            </div>
          ))
        ) : (
          <p className="text-slate-600">No hay grupos musculares de fuerza en los ejercicios elegidos para configurar volumen.</p>
        )}
      </CardContent>
    </Card>
  );
};


// =========================================================================
// Componente principal Step3ParameterConfig
// =========================================================================

interface Step3ParameterConfigProps {
  exercisesToConfigure: ChosenExerciseGoalData[];
  onUpdateExerciseParameters: (id: string, updatedParams: Partial<ChosenExerciseGoalData>) => void;
}

const Step3ParameterConfig: React.FC<Step3ParameterConfigProps> = ({
  exercisesToConfigure,
  onUpdateExerciseParameters,
}) => {
  const [muscleGroupDesiredVolumes, setMuscleGroupDesiredVolumes] = useState<{ [muscleGroup: string]: number }>({});

  const strengthMuscleGroupsInChosenExercises = useMemo(() => {
    const uniqueMuscleGroups = new Set<string>();
    exercisesToConfigure.forEach(ex => {
      const contributingGroups = getContributingMuscleGroups(ex);
      contributingGroups.forEach(group => uniqueMuscleGroups.add(group));
    });
    return Array.from(uniqueMuscleGroups).sort();
  }, [exercisesToConfigure]);

  const distributeSetsBasedOnMuscleGroupVolumes = useCallback((currentDesiredVolumes: { [muscleGroup: string]: number }) => {
    const updates: { id: string; sets: number | '' }[] = [];

    // Paso 1: Establecer sets por defecto para ejercicios que NO son de fuerza
    exercisesToConfigure.forEach(ex => {
        const contributingGroups = getContributingMuscleGroups(ex);
        if (contributingGroups.length === 0) { // No es un ejercicio de fuerza
            if (ex.sets === '' || (typeof ex.sets === 'number' && ex.sets === 0)) {
                updates.push({ id: ex.id, sets: 3 }); 
            }
        }
    });

    // Paso 2: Distribuir volumen deseado entre ejercicios de fuerza
    const exercisesByContributingGroup: { [group: string]: ChosenExerciseGoalData[] } = {};
    strengthMuscleGroupsInChosenExercises.forEach(group => {
        exercisesByContributingGroup[group] = [];
    });

    exercisesToConfigure.forEach(ex => {
        const contributingGroups = getContributingMuscleGroups(ex);
        contributingGroups.forEach(group => {
            if (exercisesByContributingGroup[group]) { // Asegurarse de que el grupo es relevante
                exercisesByContributingGroup[group].push(ex);
            }
        });
    });

    const newExerciseSetsAccumulator: { [id: string]: number } = {};
    const exerciseContributingGroupCount: { [id: string]: number } = {};

    exercisesToConfigure.forEach(ex => {
        const contributingGroups = getContributingMuscleGroups(ex);
        if (contributingGroups.length > 0) {
            exerciseContributingGroupCount[ex.id] = contributingGroups.length;
            newExerciseSetsAccumulator[ex.id] = 0; // Inicializar acumulador
        }
    });


    // Acumular la "contribución" de sets de cada grupo muscular a los ejercicios que lo tocan
    strengthMuscleGroupsInChosenExercises.forEach(group => {
        const desiredVolume = currentDesiredVolumes[group] || 0;
        const exercisesInGroup = exercisesByContributingGroup[group];
        
        if (exercisesInGroup.length > 0) {
            // Calcular la suma de los inversos de los grupos a los que cada ejercicio contribuye
            // para este grupo específico. Esto ayuda a ponderar la distribución.
            let totalInverseContribution = 0;
            exercisesInGroup.forEach(ex => {
                const numGroupsExContributesTo = getContributingMuscleGroups(ex).length;
                if (numGroupsExContributesTo > 0) {
                    totalInverseContribution += (1 / numGroupsExContributesTo);
                }
            });

            if (totalInverseContribution > 0) {
                exercisesInGroup.forEach(ex => {
                    const numGroupsExContributesTo = getContributingMuscleGroups(ex).length;
                    if (numGroupsExContributesTo > 0) {
                        const proportionOfGroupVolume = (1 / numGroupsExContributesTo) / totalInverseContribution;
                        newExerciseSetsAccumulator[ex.id] += desiredVolume * proportionOfGroupVolume;
                    }
                });
            }
        }
    });
    
    // Asignar los sets finales a cada ejercicio de fuerza
    exercisesToConfigure.forEach(ex => {
        const contributingGroups = getContributingMuscleGroups(ex);
        if (contributingGroups.length > 0) { // Solo ejercicios de fuerza
            const suggestedSets = Math.round(newExerciseSetsAccumulator[ex.id] || 0);
            
            // Si el valor sugerido es diferente del actual (o el actual está vacío), actualizamos
            if (suggestedSets !== (ex.sets === '' ? 0 : ex.sets)) { 
                updates.push({ id: ex.id, sets: Math.max(1, suggestedSets) }); // Asegurar al menos 1 set
            }
        }
    });
    
    // Aplicar todas las actualizaciones acumuladas de una vez
    if (updates.length > 0) {
      updates.forEach(update => {
          onUpdateExerciseParameters(update.id, { sets: update.sets });
      });
    }

  }, [exercisesToConfigure, strengthMuscleGroupsInChosenExercises, onUpdateExerciseParameters]);


  useEffect(() => {
    const initialVolumes: { [muscleGroup: string]: number } = {};
    strengthMuscleGroupsInChosenExercises.forEach(group => {
      initialVolumes[group] = muscleGroupDesiredVolumes[group] ?? 3
    });
    setMuscleGroupDesiredVolumes(initialVolumes);

    distributeSetsBasedOnMuscleGroupVolumes(initialVolumes);

  }, [exercisesToConfigure, strengthMuscleGroupsInChosenExercises, distributeSetsBasedOnMuscleGroupVolumes]);

  const handleUpdateMuscleGroupVolume = useCallback((muscleGroup: string, volume: number) => {
    setMuscleGroupDesiredVolumes(prev => {
      const newVolumes = { ...prev, [muscleGroup]: volume };
      distributeSetsBasedOnMuscleGroupVolumes(newVolumes);
      return newVolumes;
    });
  }, [distributeSetsBasedOnMuscleGroupVolumes]);


  if (exercisesToConfigure.length === 0) {
    return <p className="text-center text-slate-600 py-10">No has elegido ningún ejercicio. Vuelve al paso anterior para seleccionar algunos.</p>;
  }

  return (
    <div className="space-y-6">
      <MuscleGroupVolumeConfig
        muscleGroups={strengthMuscleGroupsInChosenExercises}
        currentVolumes={muscleGroupDesiredVolumes}
        onUpdateMuscleGroupVolume={handleUpdateMuscleGroupVolume}
      />

      <Card className="card-rounded-custom">
        <CardHeader>
          <CardTitle>2. Configurar Parámetros de Metas Individuales</CardTitle>
          <CardDescription>Define los objetivos específicos para cada ejercicio elegido. Los campos con * son recomendados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full space-y-2">
            {exercisesToConfigure.map((exercise, index) => (
              <ExerciseParameterConfigItem 
                key={exercise.id || `custom-idx-${index}`} 
                itemKey={exercise.id || `custom-idx-${index}`} 
                exerciseConfig={exercise} 
                onUpdate={onUpdateExerciseParameters} 
              />
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step3ParameterConfig;