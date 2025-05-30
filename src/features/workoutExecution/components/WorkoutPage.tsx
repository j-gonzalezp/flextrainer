import React from 'react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

import CurrentExerciseDisplay from './CurrentExerciseDisplay';
import PerformanceLogger from './PerformanceLogger';
import type { SetData as PerformanceLoggerSetData } from './PerformanceLogger';
import ChangeExerciseModal from './ChangeExerciseModal';
import RestTimerControl from './RestTimerControl';
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
    availableEquipment,
    selectedEquipmentFilters,
    handleSelectEquipmentFilters,
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
    handleOpenPerformanceLoggerModal,
    exerciseTimerControlRef,
    handleExerciseTimerPause,
    handleExerciseTimerComplete,
    handleExerciseTimerSoundTrigger,

    // Rest Timer imports
    restTimerSeconds,
    isRestTimerRunning,
    startRestTimer,
    pauseRestTimer,
    resetRestTimer,
    setRestTimerSeconds,
  } = useWorkoutSession();

  const [controlesVisibles, setControlesVisibles] = React.useState(true);
  const [isPerformanceLoggerModalOpen, setIsPerformanceLoggerModalOpen] = React.useState(false);
  const [isMicrocycleModalOpen, setIsMicrocycleModalOpen] = React.useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = React.useState(false);
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

  React.useEffect(() => { /* Effect logic */ }, [currentGoal, isLoggingPerformance, isPausingGoal, isPerformanceLoggerModalOpen]);

  React.useEffect(() => {
      if (!currentGoal || (currentGoal && currentGoal.id !== (currentGoalRef.current?.id || null))) {
          setIsPerformanceLoggerModalOpen(false);
      }
      currentGoalRef.current = currentGoal;
  }, [currentGoal]);

  console.log('--- WorkoutPage Category Filter Check ---');
  console.log('selectedWorkoutMicrocycle:', selectedWorkoutMicrocycle);
  console.log('isLoadingGoals:', isLoadingGoals);
  console.log('availableCategories:', availableCategories);
  console.log('availableCategories.length:', availableCategories.length);
  console.log('availableEquipment:', availableEquipment);
  console.log('availableEquipment.length:', availableEquipment.length);
  console.log('availableEquipment:', availableEquipment);
  console.log('availableEquipment.length:', availableEquipment.length);
  console.log('--- End WorkoutPage Category Filter Check ---');

  if (isLoadingMicrocycles && !selectedWorkoutMicrocycle) { return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg text-slate-600">Cargando microciclos...</p></div>; }
  if (selectedWorkoutMicrocycle !== null && isLoadingGoals) { return <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-lg text-slate-600">Cargando ejercicios...</p></div>; }
  if (error) { return <Card className="w-full max-w-lg mx-auto mt-10 text-center card-rounded-custom"><CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader><CardContent><p>{error}</p></CardContent></Card>; }
  if (userMicrocycles.length === 0 && !isLoadingMicrocycles) { return <Card className="w-full max-w-lg mx-auto mt-10 text-center card-rounded-custom"><CardHeader><CardTitle>Sin Microciclos</CardTitle></CardHeader><CardContent><p>No hay microciclos.</p></CardContent></Card>; }

  return (
    <div className="max-w-xl mx-auto p-4.5 space-y-6 pb-20 animate-fade-in-up">
      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && !error && (
        <div className="space-y-6">
          {/* Rest Timer Control */}
          <RestTimerControl
            restTimerSeconds={restTimerSeconds}
            isRestTimerRunning={isRestTimerRunning}
            startRestTimer={startRestTimer}
            pauseRestTimer={pauseRestTimer}
            resetRestTimer={resetRestTimer}
            setRestTimerSeconds={setRestTimerSeconds}
          />

          {currentGoal ? (
            <>
              <CurrentExerciseDisplay
                goal={currentGoal}
                onChangeExerciseClick={handleOpenChangeExerciseModal}
                isProcessingChange={isChangeExerciseModalOpen}
                exerciseTimerControlRef={exerciseTimerControlRef}
                onExerciseTimerPause={handleExerciseTimerPause}
                onExerciseTimerComplete={handleExerciseTimerComplete}
                onExerciseTimerSoundTrigger={handleExerciseTimerSoundTrigger}
                onPauseExerciseClick={handlePauseCurrentGoal}
              />
              <Dialog open={isPerformanceLoggerModalOpen} onOpenChange={setIsPerformanceLoggerModalOpen}>
                <DialogContent className="sm:max-w-[425px] card-rounded-custom">
                  <DialogHeader>
                    <DialogTitle>Registrar Set: {currentGoal?.exercise_name || 'Ejercicio Actual'}</DialogTitle>
                    <CardDescription>Anota los detalles del set que realizaste.</CardDescription>
                  </DialogHeader>
                  <PerformanceLogger
                    goal={currentGoal}
                    performanceReps={performanceReps} setPerformanceReps={setPerformanceReps}
                    performanceFailedSet={performanceFailedSet} setPerformanceFailedSet={setPerformanceFailedSet}
                    performanceWeight={performanceWeight} setPerformanceWeight={setPerformanceWeight}
                    performanceDuration={performanceDuration} setPerformanceDuration={setPerformanceDuration}
                    performanceNotes={performanceNotes} setPerformanceNotes={setPerformanceNotes}
                    isSubmitting={isLoggingPerformance || isPausingGoal}
                    onLogSubmit={(setLogged: PerformanceLoggerSetData) => { handleLogPerformance(setLogged); setIsPerformanceLoggerModalOpen(false); }}
                    onCancel={() => setIsPerformanceLoggerModalOpen(false)}
                  />
                </DialogContent>
                <DialogTrigger asChild>
                  {!isPerformanceLoggerModalOpen && (
                    <div className="space-y-3">
                      <Button
                        disabled={isLoggingPerformance || isPausingGoal || !currentGoal}
                        variant="default" // Mantener variant="default"
                        size="lg"
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={() => {
                          handleOpenPerformanceLoggerModal();
                        }}
                      >
                        Hecho / Registrar Set
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={handlePauseCurrentGoal}
                          variant="outline" // Usar variant="outline"
                          disabled={isLoggingPerformance || isPausingGoal || !currentGoal}
                          className="w-full btn-outline-custom" // Usar la clase personalizada
                        >
                          {isPausingGoal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Pausar Ejercicio
                        </Button>
                        <Button
                          onClick={selectNextGoal}
                          variant="outline" // Cambiar a variant="outline" para que no tenga color de fondo
                          disabled={isLoggingPerformance || isPausingGoal || !currentGoal}
                          className="btn-neutral-custom" // Usar la clase personalizada
                        >
                          Siguiente / Omitir
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogTrigger>
              </Dialog>
            </>
          ) : (
             selectedWorkoutMicrocycle !== null && !isLoadingGoals && (
                <Card className="w-full max-w-lg mx-auto text-center mt-6 card-rounded-custom">
                <CardHeader><CardTitle className="text-slate-900">¡Workout del Microciclo {selectedWorkoutMicrocycle} Completado!</CardTitle></CardHeader>
                <CardContent>
                    <p className="mb-2 text-slate-600">No hay más ejercicios activos que coincidan con los filtros seleccionados, o ya los completaste todos.</p>
                    {selectedCategoryFilters.length > 0 && (
                        <Button variant="link" onClick={() => handleSelectCategoryFilters([])} className="mt-2">
                            Limpiar filtros de categoría para ver otros ejercicios
                        </Button>
                    )}
                    <p className="mt-3 text-sm text-slate-600">Puedes seleccionar otro microciclo o añadir nuevas metas.</p>
                </CardContent></Card>
             )
          )}
        </div>
      )}

      {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableCategories.length === 0 && !currentGoal && ( <Card className="w-full max-w-lg mx-auto text-center mt-6 card-rounded-custom"><CardHeader><CardTitle className="text-slate-900">Microciclo {selectedWorkoutMicrocycle} Vacío</CardTitle></CardHeader><CardContent><p>No hay ejercicios.</p></CardContent></Card>)}
      {selectedWorkoutMicrocycle === null && !isLoadingMicrocycles && userMicrocycles.length > 0 && ( <div className="text-center py-8 mt-6"><p className="text-slate-600">Selecciona un microciclo.</p>{!controlesVisibles && (<Button onClick={() => setControlesVisibles(true)} className="btn-primary-custom mt-4">Mostrar Controles</Button>)}</div>)}

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
      <div className={`border-t pt-4 mt-5.5 animate-fade-in-up ${userMicrocycles.length === 0 && !isLoadingMicrocycles ? 'hidden' : ''}`}>
        <div className="flex justify-center mb-4">
            <Button variant="ghost" onClick={() => setControlesVisibles(!controlesVisibles)} className="text-sm text-slate-600 hover:text-foreground">
            {controlesVisibles ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {controlesVisibles ? 'Ocultar Controles del Workout' : 'Mostrar Controles del Workout'}
            </Button>
        </div>

        {controlesVisibles && (
            <div className="space-y-6 card-rounded-custom p-4.5 rounded-lg shadow-elevated">
            <div className="p-1"> {/* Microcycle Selector Block Start */}
              <Label htmlFor="microcycle-selector-trigger" className="text-xs text-slate-600">Microciclo Actual</Label>
              <Dialog open={isMicrocycleModalOpen} onOpenChange={setIsMicrocycleModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    id="microcycle-selector-trigger"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left font-normal mt-1 btn-outline-custom"
                    disabled={isLoadingMicrocycles || isLoadingGoals}
                  >
                    {selectedWorkoutMicrocycle !== null
                      ? `Microciclo ${selectedWorkoutMicrocycle}`
                      : (isLoadingMicrocycles && userMicrocycles.length === 0
                          ? <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</span>
                          : '-- Elige un microciclo --')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xs card-rounded-custom">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Microciclo</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col space-y-1 py-2 max-h-[250px] overflow-y-auto">
                    {isLoadingMicrocycles && userMicrocycles.length === 0 ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <p className="text-slate-600">Cargando microciclos...</p>
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
                      <p className="text-slate-600 text-center py-4">No hay microciclos disponibles.</p>
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
                        className="w-full justify-center text-xs text-slate-600 hover:text-destructive mt-2"
                        >
                        Limpiar selección de microciclo
                    </Button>
                  )}
                </DialogContent>
              </Dialog>
            </div> {/* Microcycle Selector Block End */}

            {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableCategories.length > 0 && (
              <div className="p-1"> {/* Category Filter Block Start */}
                <Label htmlFor="category-filter-trigger" className="text-xs text-slate-600">Filtro de Categorías</Label>
                <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      id="category-filter-trigger"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal mt-1 btn-outline-custom"
                      disabled={isLoggingPerformance || isPausingGoal}
                    >
                      {selectedCategoryFilters.length > 0
                        ? `${selectedCategoryFilters.length} categorí${selectedCategoryFilters.length === 1 ? 'a' : 'as'} seleccionada${selectedCategoryFilters.length === 1 ? '' : 's'}`
                        : 'Todas las categorías'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md card-rounded-custom">
                    <DialogHeader>
                      <DialogTitle>Filtrar Ejercicios por Categoría</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                      <p className="text-sm text-slate-600">
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
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary'
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
                          className="p-0 h-auto text-xs mt-2 w-full justify-center text-slate-600 hover:text-destructive"
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

            {selectedWorkoutMicrocycle !== null && !isLoadingGoals && availableEquipment.length > 0 && (
              <div className="p-1"> {/* Equipment Filter Block Start */}
                <Label htmlFor="equipment-filter-trigger" className="text-xs text-slate-600">Filtro de Equipamiento</Label>
                <Dialog open={isEquipmentModalOpen} onOpenChange={setIsEquipmentModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      id="equipment-filter-trigger"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left font-normal mt-1 btn-outline-custom"
                      disabled={isLoggingPerformance || isPausingGoal}
                    >
                      {selectedEquipmentFilters.length > 0
                        ? `${selectedEquipmentFilters.length} equipamiento${selectedEquipmentFilters.length === 1 ? '' : 's'} seleccionado${selectedEquipmentFilters.length === 1 ? '' : 's'}`
                        : 'Todo el equipamiento'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md card-rounded-custom">
                    <DialogHeader>
                      <DialogTitle>Filtrar Ejercicios por Equipamiento</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 space-y-3">
                      <p className="text-sm text-slate-600">
                        Selecciona uno o más tipos de equipamiento. Se mostrarán ejercicios que requieran CUALQUIERA del equipamiento elegido.
                        Si no seleccionas ninguno, se mostrarán todos los ejercicios activos del microciclo.
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1 rounded-md border">
                        {availableEquipment.map((equipment: string) => {
                          const isSelected = selectedEquipmentFilters.includes(equipment);
                          return (
                            <Button
                              key={equipment}
                              size="sm"
                              onClick={() => {
                                const newFilters = isSelected
                                  ? selectedEquipmentFilters.filter((eq: string) => eq !== equipment)
                                  : [...selectedEquipmentFilters, equipment];
                                handleSelectEquipmentFilters(newFilters);
                              }}
                              disabled={isLoggingPerformance || isPausingGoal}
                              className={`
                                flex-grow sm:flex-grow-0 px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                                focus:outline-none focus:ring-2 focus:ring-offset-1
                                ${isSelected
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary'
                                }
                              `}
                            >
                              {equipment}
                            </Button>
                          );
                        })}
                      </div>
                      {selectedEquipmentFilters.length > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-xs mt-2 w-full justify-center text-slate-600 hover:text-destructive"
                          onClick={() => {
                            handleSelectEquipmentFilters([]);
                          }}
                        >
                          Limpiar filtros de equipamiento
                        </Button>
                      )}
                    </div>
                    <div className="flex justify-end pt-2 border-t mt-4">
                        <Button size="sm" onClick={() => setIsEquipmentModalOpen(false)}>Hecho</Button>
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