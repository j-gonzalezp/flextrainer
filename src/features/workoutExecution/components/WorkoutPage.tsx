import React from 'react';
import { useWorkoutSession } from '../hooks/useWorkoutSession'; // Ensure this path is correct
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import CurrentExerciseDisplay from './CurrentExerciseDisplay';
import PerformanceLogger from './PerformanceLogger';

const WorkoutPage: React.FC = () => {
  const {
    userMicrocycles,
    selectedWorkoutMicrocycle,
    isLoadingMicrocycles,
    selectWorkoutMicrocycle, // This is selectWorkoutMicrocycleHandler from the hook

    currentGoal,
    isLoadingGoals,
    error,

    availableCategories,      // Should now be recognized
    selectedCategoryFilters,  // Should now be recognized
    handleSelectCategoryFilters, // Should now be recognized

    performanceReps, setPerformanceReps,
    performanceFailedSet, setPerformanceFailedSet,
    performanceWeight, setPerformanceWeight,
    performanceDuration, setPerformanceDuration,
    performanceNotes, setPerformanceNotes,
    isLoggingPerformance, isPausingGoal,

    selectNextGoal, // This is skipCurrentGoalAndSelectNext from the hook
    handleLogPerformance,
    handlePauseCurrentGoal,
  } = useWorkoutSession();

  const onCategoryFilterChange = (category: string, checked: boolean) => {
    if (checked) {
      handleSelectCategoryFilters([...selectedCategoryFilters, category]);
    } else {
      handleSelectCategoryFilters(selectedCategoryFilters.filter((c: string) => c !== category));
    }
  };

  if (isLoadingMicrocycles && !selectedWorkoutMicrocycle) { // Show initial microcycle loading
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando microciclos disponibles...</p>
      </div>
    );
  }

  // Show goal loading if a microcycle is selected and goals are being fetched
  if (selectedWorkoutMicrocycle !== null && isLoadingGoals) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando ejercicios de tu workout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center">
        <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
        <CardContent><p>{error}</p></CardContent>
      </Card>
    );
  }

  if (userMicrocycles.length === 0 && !isLoadingMicrocycles) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center">
        <CardHeader><CardTitle>Sin Microciclos</CardTitle></CardHeader>
        <CardContent>
          <p>No se encontraron microciclos para tu usuario.</p>
          <p>Dirígete a la sección de Gestión de Metas para crear tu primer microciclo y metas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-8">
      <Card className="shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Microciclo para Workout</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMicrocycles && userMicrocycles.length === 0 ? ( // More specific loading for initial fetch
            <p className="text-muted-foreground">Cargando microciclos...</p>
          ) : userMicrocycles.length > 0 ? (
            <select
              value={selectedWorkoutMicrocycle?.toString() ?? ''}
              onChange={(e) => selectWorkoutMicrocycle(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 border rounded bg-background text-foreground focus:ring-primary focus:border-primary"
              disabled={isLoadingGoals || isLoadingMicrocycles} // Disable while any primary loading is happening
            >
              <option value="">-- Elige un microciclo --</option>
              {userMicrocycles.map(mc => (
                <option key={mc} value={mc.toString()}>
                  Microciclo {mc}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-muted-foreground">No hay microciclos para seleccionar. Ve a Gestión de Metas.</p>
          )}
        </CardContent>
      </Card>

      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableCategories.length > 0 && (
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-base">Filtrar Ejercicios por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selecciona una o más categorías. Se mostrarán ejercicios que pertenezcan a CUALQUIERA de las categorías elegidas.
                Si no seleccionas ninguna, se mostrarán todos los ejercicios activos del microciclo.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category: string) => (
                  <Button
                    key={category}
                    variant={selectedCategoryFilters.includes(category) ? "default" : "outline"}
                    size="sm"
                    onClick={() => onCategoryFilterChange(category, !selectedCategoryFilters.includes(category))}
                    disabled={isLoggingPerformance || isPausingGoal}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              {selectedCategoryFilters.length > 0 && (
                 <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-2" onClick={() => handleSelectCategoryFilters([])}>
                    Limpiar filtros de categoría
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && !error && ( // Don't show if goals still loading
        <div className="space-y-6">
          {currentGoal ? (
            <>
              <CurrentExerciseDisplay goal={currentGoal} />
              <PerformanceLogger
                performanceReps={performanceReps}
                setPerformanceReps={setPerformanceReps}
                performanceFailedSet={performanceFailedSet}
                setPerformanceFailedSet={setPerformanceFailedSet}
                performanceWeight={performanceWeight}
                setPerformanceWeight={setPerformanceWeight}
                performanceDuration={performanceDuration}
                setPerformanceDuration={setPerformanceDuration}
                performanceNotes={performanceNotes}
                setPerformanceNotes={setPerformanceNotes}
                isSubmitting={isLoggingPerformance || isPausingGoal}
              />
              <div className="space-y-3">
                <Button
                  onClick={handleLogPerformance}
                  disabled={isLoggingPerformance || isPausingGoal || !currentGoal}
                  className="w-full text-lg py-6"
                >
                  {isLoggingPerformance ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Hecho / Registrar Set
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handlePauseCurrentGoal}
                    variant="outline"
                    disabled={isLoggingPerformance || isPausingGoal || !currentGoal}
                    className="w-full"
                  >
                    {isPausingGoal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Pausar Ejercicio
                  </Button>
                  <Button
                    onClick={selectNextGoal}
                    variant="secondary"
                    disabled={isLoggingPerformance || isPausingGoal}
                    className="w-full"
                  >
                    Siguiente / Omitir
                  </Button>
                </div>
              </div>
            </>
          ) : (
             selectedWorkoutMicrocycle !== null && !isLoadingGoals && ( // Only show this if a microcycle is selected and goals are done loading
                <Card className="w-full max-w-lg mx-auto text-center mt-6">
                <CardHeader><CardTitle>¡Microciclo {selectedWorkoutMicrocycle}!</CardTitle></CardHeader>
                <CardContent>
                    {availableCategories.length === 0 && userMicrocycles.length > 0 ? (
                        <>
                            <p>No se encontraron ejercicios activos para el Microciclo {selectedWorkoutMicrocycle}.</p>
                            <p>Añade nuevas metas a este microciclo o selecciona otro.</p>
                        </>
                    ) : (
                        <>
                            <p>No hay más ejercicios activos para el Microciclo {selectedWorkoutMicrocycle} que coincidan con los filtros seleccionados (o ya los completaste todos).</p>
                            <p>Prueba a cambiar los filtros de categoría, selecciona otro microciclo o añade nuevas metas.</p>
                            {selectedCategoryFilters.length > 0 && (
                                <Button variant="link" onClick={() => handleSelectCategoryFilters([])} className="mt-2">
                                    Limpiar filtros de categoría
                                </Button>
                            )}
                        </>
                    )}
                </CardContent>
                </Card>
             )
          )}
        </div>
      )}

      {/* Fallback if microcycle selected, but no goals available for it at all (and not loading) */}
      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableCategories.length === 0 && !currentGoal && (
         <Card className="w-full max-w-lg mx-auto text-center mt-6">
           <CardHeader><CardTitle>Microciclo {selectedWorkoutMicrocycle} Vacío</CardTitle></CardHeader>
           <CardContent>
             <p>No se encontraron ejercicios activos para el Microciclo {selectedWorkoutMicrocycle}.</p>
             <p>Añade nuevas metas a este microciclo o selecciona otro.</p>
           </CardContent>
         </Card>
      )}
    </div>
  );
};

export default WorkoutPage;