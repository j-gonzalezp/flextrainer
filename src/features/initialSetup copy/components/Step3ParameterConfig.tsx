import React from 'react';
import type { ChosenExerciseGoalData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox'; // Para categorías de custom exercises

// Mismas constantes de categorías que en Step1 para consistencia si se necesita
const GENERAL_CATEGORIES_STEP3 = ['Fuerza', 'Flexibilidad', 'Cardio', 'Otro']; // Añadido 'Otro'
const SPECIFIC_CATEGORIES_MAP_STEP3: { [key: string]: string[] } = {
  Fuerza: ['Push', 'Pull', 'Upper Body', 'Lower Body', 'Piernas', 'Brazos', 'Core'],
  Flexibilidad: ['Isquiotibiales', 'Hombros', 'Espalda', 'Cadera', 'Pectorales', 'Cuádriceps'],
  Cardio: ['Resistencia Aeróbica', 'HIIT', 'Bajo Impacto'],
  Otro: ['General', 'Habilidad Específica'],
};

interface ExerciseParameterConfigItemProps {
  exerciseConfig: ChosenExerciseGoalData;
  onUpdate: (id: string, updatedParams: Partial<ChosenExerciseGoalData>) => void;
  itemKey: string; // Para el key del componente React
}

const ExerciseParameterConfigItem: React.FC<ExerciseParameterConfigItemProps> = ({
  exerciseConfig,
  onUpdate,
  itemKey,
}) => {
  const handleParamChange = (paramName: keyof ChosenExerciseGoalData, value: any) => {
    onUpdate(exerciseConfig.id, { [paramName]: value });
  };

  const handleCustomCategoryGeneralToggle = (category: string) => {
    const currentGeneral = exerciseConfig.categories_general || [];
    const newSelection = currentGeneral.includes(category) 
        ? currentGeneral.filter(c => c !== category) 
        : [category]; // Solo permitir una categoría general para custom por simplicidad MVP
    onUpdate(exerciseConfig.id, { categories_general: newSelection });
  };

  const handleCustomCategorySpecificToggle = (generalCategory: string, specificCategory: string) => {
    if (!generalCategory) return;
    const currentSpecific = (exerciseConfig.categories_specific || []);
    const newSelection = currentSpecific.includes(specificCategory)
      ? currentSpecific.filter(sc => sc !== specificCategory)
      : [...currentSpecific, specificCategory];
    onUpdate(exerciseConfig.id, { categories_specific: newSelection });
  };

  return (
    <AccordionItem value={itemKey} key={itemKey}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex flex-col text-left">
          <span className="font-semibold">{exerciseConfig.exercise_name}</span>
          {exerciseConfig.is_custom && <span className="text-xs text-blue-500">(Personalizado)</span>}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4 px-1 space-y-4 bg-muted/30 rounded-md">
        {exerciseConfig.is_custom && (!exerciseConfig.categories_general || exerciseConfig.categories_general.length === 0) && (
          <div className='p-3 border rounded-md bg-background'>
            <Label className="text-sm font-medium mb-2 block">Categoría General (para ejercicio personalizado):</Label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {GENERAL_CATEGORIES_STEP3.map(cat => (
                <div key={`cust-gen-${cat}`} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`cust-gen-${exerciseConfig.id}-${cat}`}
                    checked={(exerciseConfig.categories_general || []).includes(cat)}
                    onCheckedChange={() => handleCustomCategoryGeneralToggle(cat)}
                  />
                  <Label htmlFor={`cust-gen-${exerciseConfig.id}-${cat}`} className="font-normal text-sm cursor-pointer">{cat}</Label>
                </div>
              ))}
            </div>
            {exerciseConfig.categories_general && exerciseConfig.categories_general[0] && SPECIFIC_CATEGORIES_MAP_STEP3[exerciseConfig.categories_general[0]] && (
              <>
                <Label className="text-sm font-medium mb-2 block">Categorías Específicas (opcional):</Label>
                <div className="grid grid-cols-2 gap-2">
                {SPECIFIC_CATEGORIES_MAP_STEP3[exerciseConfig.categories_general[0]].map(scat => (
                  <div key={`cust-spec-${scat}`} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`cust-spec-${exerciseConfig.id}-${scat}`}
                      checked={(exerciseConfig.categories_specific || []).includes(scat)}
                      onCheckedChange={() => handleCustomCategorySpecificToggle(exerciseConfig.categories_general![0], scat)}
                    />
                    <Label htmlFor={`cust-spec-${exerciseConfig.id}-${scat}`} className="font-normal text-sm cursor-pointer">{scat}</Label>
                  </div>
                ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 px-3">
          <div className="space-y-1">
            <Label htmlFor={`sets-${exerciseConfig.id}`} className="text-sm">Sets Semanales*</Label>
            <Input id={`sets-${exerciseConfig.id}`} type="number" placeholder="Ej: 10" value={exerciseConfig.sets ?? ''} onChange={e => handleParamChange('sets', parseInt(e.target.value) || undefined)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`reps-${exerciseConfig.id}`} className="text-sm">Reps por Set (número)*</Label>
            <Input id={`reps-${exerciseConfig.id}`} type="number" placeholder="Ej: 10" value={exerciseConfig.reps ?? ''} onChange={e => handleParamChange('reps', parseInt(e.target.value) || undefined)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`weight-${exerciseConfig.id}`} className="text-sm">Peso (kg)</Label>
            <Input id={`weight-${exerciseConfig.id}`} type="number" step="0.01" placeholder="Ej: 50.5" value={exerciseConfig.weight ?? ''} onChange={e => handleParamChange('weight', parseFloat(e.target.value) || undefined)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`duration-${exerciseConfig.id}`} className="text-sm">Duración (seg)</Label>
            <Input id={`duration-${exerciseConfig.id}`} type="number" placeholder="Ej: 60" value={exerciseConfig.duration_seconds ?? ''} onChange={e => handleParamChange('duration_seconds', parseInt(e.target.value) || undefined)} />
          </div>
        </div>
        <div className="px-3 pt-2 space-y-1">
          <Label htmlFor={`notes-${exerciseConfig.id}`} className="text-sm">Notas Adicionales</Label>
          <Textarea id={`notes-${exerciseConfig.id}`} placeholder="Cualquier nota específica para esta meta..." value={exerciseConfig.notes ?? ''} onChange={e => handleParamChange('notes', e.target.value)} rows={2}/>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

interface Step3ParameterConfigProps {
  exercisesToConfigure: ChosenExerciseGoalData[];
  onUpdateExerciseParameters: (id: string, updatedParams: Partial<ChosenExerciseGoalData>) => void;
}

const Step3ParameterConfig: React.FC<Step3ParameterConfigProps> = ({
  exercisesToConfigure,
  onUpdateExerciseParameters,
}) => {
  if (exercisesToConfigure.length === 0) {
    return <p className="text-center text-muted-foreground py-10">No has elegido ningún ejercicio. Vuelve al paso anterior para seleccionar algunos.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Configurar Parámetros de Metas</CardTitle>
        <CardDescription>Define los objetivos específicos para cada ejercicio elegido. Los campos con * son recomendados.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-2">
          {exercisesToConfigure.map((exercise, index) => (
            <ExerciseParameterConfigItem 
              key={exercise.id || `custom-idx-${index}`} // Fallback key for safety
              itemKey={exercise.id || `custom-idx-${index}`} 
              exerciseConfig={exercise} 
              onUpdate={onUpdateExerciseParameters} 
            />
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default Step3ParameterConfig;