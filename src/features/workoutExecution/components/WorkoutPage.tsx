import React from 'react';
import { useWorkoutSession } from '../hooks/useWorkoutSession';
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
    selectWorkoutMicrocycle,

    currentGoal,
    performanceReps,
    setPerformanceReps,
    performanceFailedSet,
    setPerformanceFailedSet,
    performanceWeight, setPerformanceWeight,
    performanceDuration, setPerformanceDuration,
    performanceNotes, setPerformanceNotes,
    isLoadingGoals,
    isLoggingPerformance,
    isPausingGoal,
    error,

    selectNextGoal,
    handleLogPerformance,
    handlePauseCurrentGoal,
  } = useWorkoutSession();

  if (isLoadingMicrocycles) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando microciclos disponibles...</p>
      </div>
    );
  }


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
        <CardContent>
          <p>{error}</p>

        </CardContent>
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
          {isLoadingMicrocycles ? (
            <p className="text-muted-foreground">Cargando microciclos...</p>
          ) : userMicrocycles.length > 0 ? (
            <select
              value={selectedWorkoutMicrocycle?.toString() ?? ''}
              onChange={(e) => selectWorkoutMicrocycle(Number(e.target.value))}
              className="w-full p-2 border rounded bg-background text-foreground focus:ring-primary focus:border-primary"
              disabled={isLoadingGoals}
            >
              <option value="" disabled={selectedWorkoutMicrocycle !== null}>-- Elige un microciclo --</option>
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


      {(selectedWorkoutMicrocycle !== null && (currentGoal || isLoadingGoals)) && (
      <div className="space-y-6">
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
          disabled={isLoggingPerformance || isPausingGoal}
          className="w-full text-lg py-6"
        >
          {isLoggingPerformance ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          Hecho / Registrar Set
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handlePauseCurrentGoal}
            variant="outline"
            disabled={isLoggingPerformance || isPausingGoal}
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
      </div>
      )}


      {selectedWorkoutMicrocycle !== null && !currentGoal && !isLoadingGoals && userMicrocycles.length > 0 && (
         <Card className="w-full max-w-lg mx-auto text-center mt-6">
           <CardHeader><CardTitle>¡Microciclo {selectedWorkoutMicrocycle} Listo!</CardTitle></CardHeader>
           <CardContent>
             <p>No hay más ejercicios activos para el Microciclo {selectedWorkoutMicrocycle} o ya los completaste todos.</p>
             <p>¡Buen trabajo! Puedes seleccionar otro microciclo o añadir nuevas metas.</p>
           </CardContent>
         </Card>
      )}
    </div>
  );
};

export default WorkoutPage;