import React from 'react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

import CurrentExerciseDisplay from './CurrentExerciseDisplay';
import PerformanceLogger, { SetData as PerformanceLoggerSetData } from './PerformanceLogger';
import ChangeExerciseModal from './ChangeExerciseModal';
import type { Goal } from '@/features/goalsManagement/types';

const WorkoutPage: React.FC = () => {
  const {
    userMicrocycles,
    selectedWorkoutMicrocycle,
    isLoadingMicrocycles,
    selectWorkoutMicrocycle, 
    currentGoal,
    isLoadingGoals,
    error,
    availableCategories,
    selectedCategoryFilters,
    handleSelectCategoryFilters,
    performanceReps, setPerformanceReps,
    performanceFailedSet, setPerformanceFailedSet,
    performanceWeight, setPerformanceWeight,
    performanceDuration, setPerformanceDuration,
    performanceNotes, setPerformanceNotes,
    isLoggingPerformance, isPausingGoal,
    selectNextGoal,
    handleLogPerformance,
    handlePauseCurrentGoal,
    handleChangeCurrentGoal,
  } = useWorkoutSession();

  const [controlesVisibles, setControlesVisibles] = React.useState(true);
  const [mostrarFormularioRendimiento, setMostrarFormularioRendimiento] = React.useState(false);
  const [isMicrocycleModalOpen, setIsMicrocycleModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isChangeExerciseModalOpen, setIsChangeExerciseModalOpen] = React.useState(false);

  const currentGoalRef = React.useRef(currentGoal);

  const onCategoryFilterChange = (category: string, checked: boolean) => {
    let newFilters;
    if (checked) {
      newFilters = [...selectedCategoryFilters, category];
    } else {
      newFilters = selectedCategoryFilters.filter((c: string) => c !== category);
    }
    handleSelectCategoryFilters(newFilters);
  };
  
  const handleOpenChangeExerciseModal = () => {
    setIsChangeExerciseModalOpen(true);
  };

  React.useEffect(() => { /* Effect logic */ }, [currentGoal, isLoggingPerformance, isPausingGoal, mostrarFormularioRendimiento]);
  
  React.useEffect(() => {
      if (!currentGoal || (currentGoal && currentGoal.id !== (currentGoalRef.current?.id || null))) {
          setMostrarFormularioRendimiento(false);
      }
      currentGoalRef.current = currentGoal;
  }, [currentGoal]);

  if (isLoadingMicrocycles && !selectedWorkoutMicrocycle) { return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg text-muted-foreground">Cargando microciclos...</p></div>; }
  if (selectedWorkoutMicrocycle !== null && isLoadingGoals) { return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg text-muted-foreground">Cargando ejercicios...</p></div>; }
  if (error) { return <Card className="w-full max-w-lg mx-auto mt-10 text-center"><CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader><CardContent><p>{error}</p></CardContent></Card>; }
  if (userMicrocycles.length === 0 && !isLoadingMicrocycles) { return <Card className="w-full max-w-lg mx-auto mt-10 text-center"><CardHeader><CardTitle>Sin Microciclos</CardTitle></CardHeader><CardContent><p>No hay microciclos.</p></CardContent></Card>; }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 pb-20">
      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && !error && (
        <div className="space-y-6">
          {currentGoal ? (
            <>
              <CurrentExerciseDisplay 
                goal={currentGoal} 
                onChangeExerciseClick={handleOpenChangeExerciseModal}
                isProcessingChange={isChangeExerciseModalOpen} 
              />
              {mostrarFormularioRendimiento && (
                <PerformanceLogger
                  goal={currentGoal}
                  performanceReps={performanceReps} setPerformanceReps={setPerformanceReps}
                  performanceFailedSet={performanceFailedSet} setPerformanceFailedSet={setPerformanceFailedSet}
                  performanceWeight={performanceWeight} setPerformanceWeight={setPerformanceWeight}
                  performanceDuration={performanceDuration} setPerformanceDuration={setPerformanceDuration}
                  performanceNotes={performanceNotes} setPerformanceNotes={setPerformanceNotes}
                  isSubmitting={isLoggingPerformance || isPausingGoal}
                  onLogSubmit={(setLogged: PerformanceLoggerSetData) => { handleLogPerformance(setLogged); }}
                  onCancel={() => setMostrarFormularioRendimiento(false)}
                />
              )}
              {!mostrarFormularioRendimiento && (
                <div className="space-y-3">
                  <Button onClick={() => setMostrarFormularioRendimiento(true)} disabled={isLoggingPerformance || isPausingGoal || !currentGoal} variant="default" size="lg" className="w-full">
                    Hecho / Registrar Set
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button onClick={handlePauseCurrentGoal} variant="outline" disabled={isLoggingPerformance || isPausingGoal || !currentGoal} className="w-full">
                      {isPausingGoal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Pausar Ejercicio
                    </Button>
                    <Button onClick={selectNextGoal} variant="secondary" disabled={isLoggingPerformance || isPausingGoal || !currentGoal} className="w-full border border-input hover:bg-accent">
                      Siguiente / Omitir
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : ( 
             selectedWorkoutMicrocycle !== null && !isLoadingGoals && ( 
                <Card className="w-full max-w-lg mx-auto text-center mt-6">
                <CardHeader><CardTitle>¡Workout del Microciclo {selectedWorkoutMicrocycle} Completado!</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-2">No hay más ejercicios activos que coincidan con los filtros seleccionados, o ya los completaste todos.</p>
                    {selectedCategoryFilters.length > 0 && (
                        <Button variant="link" onClick={() => handleSelectCategoryFilters([])} className="mt-2">
                            Limpiar filtros de categoría para ver otros ejercicios
                        </Button>
                    )}
                    <p className="mt-3 text-sm text-muted-foreground">Puedes seleccionar otro microciclo o añadir nuevas metas.</p>
                </CardContent></Card>
             )
          )}
        </div>
      )}

      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableCategories.length === 0 && !currentGoal && ( <Card className="w-full max-w-lg mx-auto text-center mt-6"><CardHeader><CardTitle>Microciclo {selectedWorkoutMicrocycle} Vacío</CardTitle></CardHeader><CardContent><p>No hay ejercicios.</p></CardContent></Card>)}
      {selectedWorkoutMicrocycle === null && !isLoadingMicrocycles && userMicrocycles.length > 0 && ( <div className="text-center py-8 mt-6"><p>Selecciona un microciclo.</p>{!controlesVisibles && (<Button onClick={() => setControlesVisibles(true)} className="mt-4">Mostrar Controles</Button>)}</div>)}

      {isChangeExerciseModalOpen && ( 
        <ChangeExerciseModal
          isOpen={isChangeExerciseModalOpen}
          onClose={() => setIsChangeExerciseModalOpen(false)}
          currentCategoryFilters={selectedCategoryFilters || []}
          selectedMicrocycle={selectedWorkoutMicrocycle}
          onExerciseSelected={(selectedExercise: Goal) => {
            handleChangeCurrentGoal(selectedExercise);
            setIsChangeExerciseModalOpen(false);
          }}
        />
      )}

      {/* --- Bloque de Controles: Restored original structure, with category button styling updated --- */}
      <div className={`border-t pt-4 mt-8 ${userMicrocycles.length === 0 && !isLoadingMicrocycles ? 'hidden' : ''}`}>
        <div className="flex justify-center mb-4">
            <Button variant="ghost" onClick={() => setControlesVisibles(!controlesVisibles)} className="text-sm text-muted-foreground hover:text-foreground">
            {controlesVisibles ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {controlesVisibles ? 'Ocultar Controles del Workout' : 'Mostrar Controles del Workout'}
            </Button>
        </div>

        {controlesVisibles && (
            <div className="space-y-6 bg-card p-4 rounded-lg shadow">
            <div className="p-1"> {/* Microcycle Selector Block Start */}
              <Label htmlFor="microcycle-selector-trigger" className="text-xs text-muted-foreground">Microciclo Actual</Label>
              <Dialog open={isMicrocycleModalOpen} onOpenChange={setIsMicrocycleModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    id="microcycle-selector-trigger"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left font-normal mt-1"
                    disabled={isLoadingMicrocycles || isLoadingGoals}
                  >
                    {selectedWorkoutMicrocycle !== null 
                      ? `Microciclo ${selectedWorkoutMicrocycle}` 
                      : (isLoadingMicrocycles && userMicrocycles.length === 0 
                          ? <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</span> 
                          : '-- Elige un microciclo --')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Microciclo</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col space-y-1 py-2 max-h-[250px] overflow-y-auto">
                    {isLoadingMicrocycles && userMicrocycles.length === 0 ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <p className="text-muted-foreground">Cargando microciclos...</p>
                      </div>
                    ) : userMicrocycles.length > 0 ? (
                      userMicrocycles.map(mc => (
                        <Button
                          key={mc}
                          variant={selectedWorkoutMicrocycle === mc ? "default" : "ghost"} 
                          onClick={() => {
                            selectWorkoutMicrocycle(mc); 
                            setIsMicrocycleModalOpen(false);
                          }}
                          className="w-full justify-start h-9 text-sm"
                        >
                          Microciclo {mc}
                        </Button>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No hay microciclos disponibles.</p>
                    )}
                  </div>
                  {userMicrocycles.length > 0 && (
                    <Button 
                        variant={"link"}
                        size="sm"
                        onClick={() => {
                            selectWorkoutMicrocycle(null); 
                            setIsMicrocycleModalOpen(false);
                        }}
                        className="w-full justify-center text-xs text-muted-foreground hover:text-destructive mt-2"
                        >
                        Limpiar selección de microciclo
                    </Button>
                  )}
                </DialogContent>
              </Dialog>
            </div> {/* Microcycle Selector Block End */}

            {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableCategories.length > 0 && (
              <div className="p-1"> {/* Category Filter Block Start */}
                <Label htmlFor="category-filter-trigger" className="text-xs text-muted-foreground">Filtro de Categorías</Label>
                <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      id="category-filter-trigger"
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start text-left font-normal mt-1"
                      disabled={isLoggingPerformance || isPausingGoal} 
                    >
                      {selectedCategoryFilters.length > 0 
                        ? `${selectedCategoryFilters.length} categorí${selectedCategoryFilters.length === 1 ? 'a' : 'as'} seleccionada${selectedCategoryFilters.length === 1 ? '' : 's'}`
                        : 'Todas las categorías'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Filtrar Ejercicios por Categoría</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Selecciona una o más categorías. Se mostrarán ejercicios que pertenezcan a CUALQUIERA de las categorías elegidas.
                        Si no seleccionas ninguna, se mostrarán todos los ejercicios activos del microciclo.
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 rounded-md border">
                        {availableCategories.map((category: string) => {
                          const isSelected = selectedCategoryFilters.includes(category);
                          return (
                            <Button
                              key={category}
                              size="sm"
                              onClick={() => onCategoryFilterChange(category, !isSelected)}
                              disabled={isLoggingPerformance || isPausingGoal}
                              // RE-APPLIED RED/GREEN STYLING
                              className={`
                                flex-grow sm:flex-grow-0 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                                focus:outline-none focus:ring-2 focus:ring-offset-1
                                ${isSelected 
                                  ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' 
                                  : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                                }
                              `}
                            >
                              {category}
                            </Button>
                          );
                        })}
                      </div>
                      {selectedCategoryFilters.length > 0 && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto text-xs mt-2 w-full justify-center text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            handleSelectCategoryFilters([]);
                          }}
                        >
                          Limpiar filtros de categoría
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-end pt-2 border-t mt-4">
                        <Button size="sm" onClick={() => setIsCategoryModalOpen(false)}>Hecho</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div> 
            )}
            </div>
        )}
      </div> 
    </div>
  );
};

export default WorkoutPage;