import React, { useState, useMemo } from 'react';
import type { StaticExercise, ChosenExerciseGoalData } from '../types';
import * as StaticExerciseService from '../services/StaticExerciseService'; // Para resolver variaciones

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';

interface SuggestedExerciseItemProps {
  exercise: StaticExercise;
  isSelected: boolean;
  onToggle: (exercise: StaticExercise, selected: boolean) => void;
  allStaticExercises: StaticExercise[]; // Para buscar variaciones
  chosenExercises: ChosenExerciseGoalData[]; // Para saber si una variación ya fue elegida
  onToggleVariation: (variationExercise: StaticExercise, selected: boolean) => void;
  depth?: number; // Para posible indentación o lógica de UI diferente para variaciones
}

const SuggestedExerciseItem: React.FC<SuggestedExerciseItemProps> = ({
  exercise,
  isSelected,
  onToggle,
  allStaticExercises,
  chosenExercises,
  onToggleVariation,
  depth = 0,
}) => {
  const [showVariations, setShowVariations] = useState(false);

  const variationObjects = useMemo(() => {
    if (!exercise.variations || exercise.variations.length === 0) return [];
    return exercise.variations
      .map(varName => StaticExerciseService.getExerciseByName(allStaticExercises, varName))
      .filter(Boolean) as StaticExercise[];
  }, [exercise.variations, allStaticExercises]);

  return (
    <Card className={`mb-3 ${depth > 0 ? 'ml-4 border-l-2 border-blue-200 pl-3' : ''} bg-card`}>
      <CardHeader className="p-3">
        <div className="flex items-start space-x-3">
          <Checkbox
            id={`ex-${exercise.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => onToggle(exercise, !!checked)}
            className="mt-1"
          />
          <div className="flex-grow">
            <Label htmlFor={`ex-${exercise.id}`} className="font-semibold text-base cursor-pointer">
              {exercise.name}
            </Label>
            {exercise.description_short && (
              <p className="text-xs text-muted-foreground mt-0.5">{exercise.description_short}</p>
            )}
            {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">Equipamiento: {exercise.equipment_needed.join(', ')}</p>
            )}
          </div>
        </div>
      </CardHeader>
      {variationObjects.length > 0 && (
        <CardContent className="p-3 pt-1">
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowVariations(!showVariations)}>
                {showVariations ? 'Ocultar' : 'Mostrar'} {variationObjects.length} variaci{variationObjects.length === 1 ? 'ón' : 'ones'} sugerida{variationObjects.length === 1 ? '' : 's'}
            </Button>
            {showVariations && (
                <div className="mt-2 space-y-2 pl-4 border-l border-dashed">
                    {variationObjects.map(variationEx => {
                        const isVariationSelected = chosenExercises.some(ce => ce.static_exercise_ref_id === variationEx.id || (ce.is_custom && ce.exercise_name === variationEx.name));
                        return (
                            <SuggestedExerciseItem 
                                key={`var-${variationEx.id}`}
                                exercise={variationEx} 
                                isSelected={isVariationSelected}
                                onToggle={onToggleVariation} // Usar un handler específico para variaciones si se necesita lógica distinta
                                allStaticExercises={allStaticExercises}
                                chosenExercises={chosenExercises}
                                onToggleVariation={onToggleVariation} // Pasar para anidación si es necesario
                                depth={depth + 1}
                            />
                        );
                    })}
                </div>
            )}
        </CardContent>
      )}
    </Card>
  );
};

interface Step2ExerciseSelectionProps {
  suggestedExercises: StaticExercise[];
  isLoading: boolean;
  chosenExercises: ChosenExerciseGoalData[];
  onToggleExercise: (exercise: StaticExercise, selected: boolean, isVariation?: boolean, variationSourceId?: string) => void; 
  onAddCustomExercise: (customName: string) => void;
  allStaticExercises: StaticExercise[]; // Necesario para que SuggestedExerciseItem resuelva variaciones
}

const Step2ExerciseSelection: React.FC<Step2ExerciseSelectionProps> = ({
  suggestedExercises,
  isLoading,
  chosenExercises,
  onToggleExercise,
  onAddCustomExercise,
  allStaticExercises,
}) => {
  const [customExerciseName, setCustomExerciseName] = useState('');

  const handleAddCustom = () => {
    if (customExerciseName.trim()) {
      onAddCustomExercise(customExerciseName.trim());
      setCustomExerciseName('');
    }
  };

  // Handler para cuando se selecciona/deselecciona una variación desde SuggestedExerciseItem
  // La idea es que una variación seleccionada se trate como un ejercicio principal elegido.
  const handleToggleVariationAsChosenExercise = (variationExercise: StaticExercise, selected: boolean) => {
    // Aquí, variationSourceId podría ser el ID del ejercicio original que sugirió esta variación.
    // Podrías querer pasar ese 'parent' ID si es relevante para la lógica de `onToggleExercise`.
    onToggleExercise(variationExercise, selected, true /*isVariation*/);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Ejercicios Sugeridos</CardTitle>
          <CardDescription>
            Basado en tus selecciones de categorías y equipamiento. Elige los que quieras incluir.
            Las variaciones se añaden como ejercicios separados si las seleccionas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {!isLoading && suggestedExercises.length === 0 && (
            <p className="text-center text-muted-foreground py-4">No hay ejercicios sugeridos para tus filtros actuales. Intenta cambiar tus selecciones en el Paso 1 o añade ejercicios personalizados abajo.</p>
          )}
          {!isLoading && suggestedExercises.length > 0 && (
            <ScrollArea className="h-[300px] pr-3">
              {suggestedExercises.map(exercise => {
                const isSelected = chosenExercises.some(ce => ce.static_exercise_ref_id === exercise.id && !ce.is_custom);
                return (
                  <SuggestedExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    isSelected={isSelected}
                    onToggle={onToggleExercise} // Para el ejercicio principal
                    allStaticExercises={allStaticExercises}
                    chosenExercises={chosenExercises}
                    onToggleVariation={handleToggleVariationAsChosenExercise} // Para las variaciones dentro del item
                  />
                );
              })}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Añadir Ejercicio Personalizado</CardTitle>
          <CardDescription>Si no encuentras un ejercicio, añádelo aquí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="customExerciseName">Nombre del Ejercicio Personalizado:</Label>
          <div className="flex space-x-2">
            <Input
              id="customExerciseName"
              value={customExerciseName}
              onChange={(e) => setCustomExerciseName(e.target.value)}
              placeholder="Ej: Curl de Bíceps Concentrado con Giro Supino"
            />
            <Button onClick={handleAddCustom} disabled={!customExerciseName.trim()}>Añadir</Button>
          </div>
        </CardContent>
      </Card>

      {chosenExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ejercicios Elegidos ({chosenExercises.length})</CardTitle>
            <CardDescription>Estos son los ejercicios que configurarás en el siguiente paso.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[150px] pr-3">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {chosenExercises.map(ex => (
                  <li key={ex.id}>{ex.exercise_name} {ex.is_custom ? <span className="text-xs text-blue-500">(Personalizado)</span> : ''}</li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Step2ExerciseSelection;