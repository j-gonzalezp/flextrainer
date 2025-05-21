import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { LibraryExercise, ChosenExerciseGoalData } from '../types';
import * as exerciseLibraryService from '../services/exerciseLibraryService';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedExerciseItemProps {
  exercise: LibraryExercise;
  isSelected: boolean;
  onToggle: (exercise: LibraryExercise, selected: boolean) => void;
  chosenExercises: ChosenExerciseGoalData[];
  depth?: number;
}

const SuggestedExerciseItem: React.FC<SuggestedExerciseItemProps> = ({
  exercise,
  isSelected,
  onToggle,
  chosenExercises,
  depth = 0,
}) => {
  const [showVariations, setShowVariations] = useState(false);
  const [variationObjects, setVariationObjects] = useState<LibraryExercise[]>([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);

  useEffect(() => {
    if (showVariations && exercise.suggested_variations && exercise.suggested_variations.length > 0) {
      setIsLoadingVariations(true);
      exerciseLibraryService.fetchLibraryExercisesByIds(exercise.suggested_variations)
        .then(data => {
          setVariationObjects(data);
        })
        .catch(err => {
          console.error("Error fetching suggested variations:", err);
          toast.error("Error al cargar variaciones sugeridas.");
        })
        .finally(() => {
          setIsLoadingVariations(false);
        });
    } else if (!showVariations) {
      setVariationObjects([]);
    }
  }, [showVariations, exercise.suggested_variations]);

  const isVariationSelected = useCallback((variationExId: string) => {
    return chosenExercises.some(ce => ce.library_exercise_id === variationExId && !ce.is_custom);
  }, [chosenExercises]);

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
              {exercise.exercise_name}
            </Label>
            {exercise.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{exercise.description}</p>
            )}
            {exercise.equipment_needed && exercise.equipment_needed.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">Equipamiento: {exercise.equipment_needed.join(', ')}</p>
            )}
          </div>
        </div>
      </CardHeader>
      {/* CORRECCIÓN: El cierre de CardHeader estaba incorrecto. La sección de variaciones debe ir DENTRO de Card pero FUERA de CardHeader. */}
      {exercise.suggested_variations && exercise.suggested_variations.length > 0 && (
        <CardContent className="p-3 pt-1">
            <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setShowVariations(!showVariations)}>
                {showVariations ? 'Ocultar' : 'Mostrar'} {exercise.suggested_variations.length} variaci{exercise.suggested_variations.length === 1 ? 'ón' : 'ones'} sugerida{exercise.suggested_variations.length === 1 ? '' : 's'}
            </Button>
            {showVariations && (
                <div className="mt-2 space-y-2 pl-4 border-l border-dashed">
                    {isLoadingVariations && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin" /></div>}
                    {!isLoadingVariations && variationObjects.length === 0 && (
                        <p className="text-xs text-muted-foreground">No se encontraron detalles para estas variaciones o no están disponibles.</p>
                    )}
                    {!isLoadingVariations && variationObjects.map(variationEx => (
                        <SuggestedExerciseItem 
                            key={`var-${variationEx.id}`}
                            exercise={variationEx} 
                            isSelected={isVariationSelected(variationEx.id)}
                            onToggle={onToggle}
                            chosenExercises={chosenExercises}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </CardContent>
      )}
    </Card>
  );
};

interface Step2ExerciseSelectionProps {
  suggestedExercises: LibraryExercise[];
  isLoading: boolean;
  chosenExercises: ChosenExerciseGoalData[];
  onToggleExercise: (exercise: LibraryExercise, selected: boolean) => void;
  onAddCustomExercise: (customName: string, generalCategories: string[], specificCategories: string[]) => void;
}

const Step2ExerciseSelection: React.FC<Step2ExerciseSelectionProps> = ({
  suggestedExercises,
  isLoading,
  chosenExercises,
  onToggleExercise,
  onAddCustomExercise,
}) => {
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customGeneralCategories, setCustomGeneralCategories] = useState<string[]>([]);
  const [customSpecificCategories, setCustomSpecificCategories] = useState<string[]>([]);

  const [allAvailableGeneralCategories, setAllAvailableGeneralCategories] = useState<string[]>([]);
  const [availableSpecificCategoriesMap, setAvailableSpecificCategoriesMap] = useState<Map<string, string[]>>(new Map());
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const metadata = await exerciseLibraryService.fetchLibraryMetadata();
        setAllAvailableGeneralCategories(metadata.generalCategories);
        setAvailableSpecificCategoriesMap(metadata.specificCategoriesMap);
      } catch (err) {
        console.error("Error loading categories for custom exercises in Step 2:", err);
        toast.error("Error al cargar opciones de categorías para ejercicios personalizados.");
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  const handleCustomCategoryGeneralToggle = (category: string) => {
    const newSelection = customGeneralCategories.includes(category) 
        ? []
        : [category];
    setCustomGeneralCategories(newSelection);
    setCustomSpecificCategories([]);
  };

  const handleCustomCategorySpecificToggle = (specificCategory: string) => {
    const currentSpecific = customSpecificCategories;
    const newSelection = currentSpecific.includes(specificCategory)
      ? currentSpecific.filter(sc => sc !== specificCategory)
      : [...currentSpecific, specificCategory];
    setCustomSpecificCategories(newSelection);
  };

  const selectedGeneralForCustom = customGeneralCategories.length > 0 ? customGeneralCategories[0] : null;
  const specificOptionsForSelectedGeneral = selectedGeneralForCustom 
    ? availableSpecificCategoriesMap.get(selectedGeneralForCustom) 
    : [];

  const handleAddCustom = () => {
    if (!customExerciseName.trim()) {
      toast.error('El nombre del ejercicio personalizado no puede estar vacío.');
      return;
    }
    if (customGeneralCategories.length === 0) {
      toast.error('Por favor, selecciona al menos una categoría general para tu ejercicio personalizado.');
      return;
    }

    onAddCustomExercise(customExerciseName.trim(), customGeneralCategories, customSpecificCategories);
    setCustomExerciseName('');
    setCustomGeneralCategories([]);
    setCustomSpecificCategories([]);
  };

  const hasUncategorizedCustomExercise = useMemo(() => {
    return chosenExercises.some(ex => ex.is_custom && ex.categories_general.length === 0);
  }, [chosenExercises]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Ejercicios Sugeridos</CardTitle>
          <CardDescription>
            Basado en tus selecciones de categorías y equipamiento. Elige los que quieras incluir.
            Las variaciones sugeridas se pueden seleccionar como ejercicios individuales.
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
                const isSelected = chosenExercises.some(ce => ce.library_exercise_id === exercise.id && !ce.is_custom);
                return (
                  <SuggestedExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    isSelected={isSelected}
                    onToggle={onToggleExercise}
                    chosenExercises={chosenExercises}
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
          <CardDescription>Si no encuentras un ejercicio, añádelo aquí. Debes asignarle al menos una categoría general.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="customExerciseName">Nombre del Ejercicio Personalizado:</Label>
            <Input
              id="customExerciseName"
              value={customExerciseName}
              onChange={(e) => setCustomExerciseName(e.target.value)}
              placeholder="Ej: Curl de Bíceps Concentrado con Giro Supino"
            />
          </div>
          
          {isLoadingMetadata ? (
            <p className="text-center text-muted-foreground">Cargando opciones de categorías...</p>
          ) : (
            <div className='p-3 border rounded-md bg-muted/30'>
              <Label className="text-sm font-medium mb-2 block">Categorías para este Ejercicio Personalizado:</Label>
              
              {/* Selección de Categoría General */}
              <h4 className="font-semibold text-sm mb-2">Categoría General:*</h4>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {allAvailableGeneralCategories.length > 0 ? (
                  allAvailableGeneralCategories.map(cat => (
                    <div key={`custom-add-gen-${cat}`} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`custom-add-gen-${cat}`}
                        checked={customGeneralCategories.includes(cat)}
                        onCheckedChange={() => handleCustomCategoryGeneralToggle(cat)}
                      />
                      <Label htmlFor={`custom-add-gen-${cat}`} className="font-normal text-sm cursor-pointer">{cat}</Label>
                    </div>
                  ))
                ) : (
                  <p className="col-span-full text-xs text-muted-foreground">No hay categorías generales disponibles.</p>
                )}
              </div>

              {/* Selección de Categorías Específicas */}
              {selectedGeneralForCustom && specificOptionsForSelectedGeneral && specificOptionsForSelectedGeneral.length > 0 && (
                <>
                  <h4 className="font-semibold text-sm mb-2 mt-4">Categorías Específicas (opcional):</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {specificOptionsForSelectedGeneral.map(scat => (
                      <div key={`custom-add-spec-${scat}`} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`custom-add-spec-${scat}`}
                          checked={customSpecificCategories.includes(scat)}
                          onCheckedChange={() => handleCustomCategorySpecificToggle(scat)}
                        />
                        <Label htmlFor={`custom-add-spec-${scat}`} className="font-normal text-sm cursor-pointer">{scat}</Label>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <Button onClick={handleAddCustom} disabled={!customExerciseName.trim() || customGeneralCategories.length === 0}>Añadir Ejercicio Personalizado</Button>
        </CardContent>
      </Card>

      {chosenExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ejercicios Elegidos ({chosenExercises.length})</CardTitle>
            <CardDescription>Estos son los ejercicios que configurarás en el siguiente paso.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasUncategorizedCustomExercise && (
              <p className="text-sm text-red-500 mb-2">¡Atención! Algunos ejercicios personalizados aún no tienen categoría general asignada y no podrás avanzar.</p>
            )}
            <ScrollArea className="h-[150px] pr-3">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {chosenExercises.map(ex => (
                  <li key={ex.id}>
                    {ex.exercise_name} 
                    {ex.is_custom ? <span className="text-xs text-blue-500 font-medium ml-1">(Personalizado)</span> : ''}
                    {ex.is_custom && ex.categories_general.length === 0 && <span className="text-xs text-red-500 font-medium ml-1">(¡Falta categoría!)</span>}
                  </li>
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