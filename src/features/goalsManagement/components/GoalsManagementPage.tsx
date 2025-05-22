import NextMicrocycleWizard from './NextMicrocycleWizard';
import type { ProposedGoal } from '../types'; // Ensure ProposedGoal is imported
import React from 'react';
import { useGoalsManagement } from '../hooks/useGoalsManagement';
import MicrocycleSelector from './MicrocycleSelector';
import GoalList from './GoalList';
import GoalForm from './GoalForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { Goal, GoalInsert, GoalUpdate } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react';
import ManageMesocycleModal from '@/features/initialSetup/components/ManageMesocycleModal';
import DoneExerciseList from './DoneExerciseList';

const GoalsManagementPage: React.FC = () => {
  const [isCreateFirstMicrocycleModalOpen, setIsCreateFirstMicrocycleModalOpen] = React.useState(false);
  
  const {
    user,
    microcycles,
    selectedMicrocycle,
    displayedGoals,
    isLoadingMicrocycles,
    isLoadingGoals,
    isSubmittingGoal,
    isLoadingNextMicrocycle,
    error,
    setError,
    handleSelectMicrocycle,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleToggleActive: handleToggleGoalActive,
    refreshMicrocycles,
    availableCategories,
    selectedCategoryFilters,
    sortConfig,
    handleToggleCategoryFilter,
    handleClearCategoryFilters,
    handleRequestSort,
    doneExercises,
    isLoadingDoneExercises,
    isNextMicrocycleWizardOpen,
    setIsNextMicrocycleWizardOpen,
    proposedNextGoals,
    setProposedNextGoals,
    handleEnableNextMicrocycle, // The new button handler
    createNextMicrocycleWithProposedGoals, // The function to confirm the wizard
    goalsPerformance // Goal performance data (passed to the wizard)
  } = useGoalsManagement();
// Detectar ausencia de microciclos y abrir modal automáticamente
  React.useEffect(() => {
    // console.log('[GoalsManagementPage] Checking for microcycles:', microcycles.length, 'Loading:', isLoadingMicrocycles);
    if (!isLoadingMicrocycles && microcycles.length === 0) {
      console.log('[GoalsManagementPage] No microcycles found for user, opening ManageMesocycleModal.');
      setIsCreateFirstMicrocycleModalOpen(true);
    } else if (!isLoadingMicrocycles && microcycles.length > 0 && selectedMicrocycle === null) {
      // Si ya hay microciclos pero ninguno está seleccionado (ej. después de un logout/login)
      // Puedes decidir seleccionar el último microciclo automáticamente aquí.
      // const latestMicrocycle = microcycles[microcycles.length - 1];
      // handleSelectMicrocycle(latestMicrocycle.microcycle_number); // Assuming microcycle object has microcycle_number
    }
  }, [microcycles, isLoadingMicrocycles, selectedMicrocycle, handleSelectMicrocycle]); // Asegúrate de incluir handleSelectMicrocycle si lo usas aquí.

  // const handleFirstMicrocycleCreated = (microcycleNumber: number) => {
  //   // El hook useGoalsManagement debería tener una función para refrescar y seleccionar,
  //   // o su useEffect debería manejar la carga de metas para el nuevo microciclo seleccionado.
  //   // Por ahora, asumimos que la lógica del hook se encarga de recargar las metas cuando cambia selectedMicrocycle.
  //   // Primero, podríamos intentar refrescar la lista de microciclos para incluir el nuevo.
  //   // La prop 'refreshMicrocycles' fue añadida al hook useGoalsManagement anteriormente.
  //   // selectedMicrocycle ya debería ser 'microcycleNumber' (1) debido a la lógica de apertura del modal.
  //   // La llamada a hookHandleAddGoal habrá actualizado el estado 'goals' dentro del hook.
  //   // Solo necesitamos refrescar la lista de microciclos para que el selector muestre '1'.
  //   if (refreshMicrocycles) {
  //     refreshMicrocycles(); // Esto actualizará la lista de microciclos disponibles en la UI.
  //                          // El useEffect en useGoalsManagement que depende de user.id y selectedMicrocycle
  //                          // ya se habrá disparado para cargar las metas del microciclo 1.
  //   }
  //   // No es necesario llamar a handleSelectMicrocycle(microcycleNumber) aquí de nuevo si ya se hizo al abrir.
  //   setIsCreateFirstMicrocycleModalOpen(false); // Cerrar el modal
  // };

  const [isGoalFormOpen, setIsGoalFormOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);

  const openGoalFormForCreate = () => {
    setEditingGoal(null);
    setIsGoalFormOpen(true);
  };

  const openGoalFormForEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[calc(100vh-var(--navbar-height,4rem))]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Requerido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Por favor, inicia sesión para gestionar tus metas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle className="font-semibold">Ocurrió un Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button onClick={() => setError(null)} variant="link" className="p-0 h-auto ml-2 text-xs text-destructive-foreground hover:underline hover:bg-transparent">
              Descartar
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4.5 sm:p-6 lg:p-8 animate-fade-in-up">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Gestión de Metas</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Organiza y planifica tus objetivos de entrenamiento por microciclos.</p>
      </header>

      <Card className="shadow-elevated">
        <CardHeader>
          <CardTitle>Selector de Microciclos</CardTitle>
          <ShadcnCardDescription>
            Elige un microciclo para ver sus metas, o crea uno nuevo si es necesario.
          </ShadcnCardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          {isLoadingMicrocycles && microcycles.length === 0 ? (
            <div className="flex items-center space-x-2 text-muted-foreground py-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Cargando microciclos...</span>
            </div>
          ) : (
            <MicrocycleSelector
              microcycles={microcycles}
              selectedMicrocycle={selectedMicrocycle}
              onSelectMicrocycle={handleSelectMicrocycle}
              isLoading={isLoadingMicrocycles}
              disabled={isLoadingNextMicrocycle || isSubmittingGoal || isLoadingGoals}
            />
          )}
           {!isLoadingMicrocycles && microcycles.length === 0 && !isLoadingNextMicrocycle && (
            <p className="text-sm text-muted-foreground mt-3">No hay microciclos definidos. ¡Crea el primero!</p>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          {/* Button for creating the first microcycle */}
          {/* Button for managing mesocycle (formerly creating the first microcycle) */}
            <Button
              onClick={() => {
                // This button will now always open the modal for managing the mesocycle.
                // The modal logic will handle whether it's the first microcycle or editing.
                // We don't need to set selectedMicrocycle here anymore based on microcycle count.
                setIsCreateFirstMicrocycleModalOpen(true); // This state will control the renamed modal
              }}
              disabled={isLoadingNextMicrocycle || isSubmittingGoal || isLoadingMicrocycles}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground transition-colors mr-2"
              size="sm"
            >
              {isLoadingNextMicrocycle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Gestionar Mesociclo
            </Button>

          {/* Button for creating subsequent microcycles */}
{/* NUEVO BOTÓN: Habilitar Siguiente Microciclo */}
<Button
  onClick={() => {
    console.log('[GoalsManagementPage] "Habilitar Siguiente Microciclo" button clicked.');
    handleEnableNextMicrocycle(); // Calls the new hook function
  }}
  disabled={
    isLoadingNextMicrocycle ||
    isSubmittingGoal ||
    isLoadingMicrocycles ||
    microcycles.length === 0 ||
    selectedMicrocycle === null ||
    (selectedMicrocycle !== null && displayedGoals.length === 0) // Deshabilita si el microciclo seleccionado no tiene metas
  }
  className="flex-shrink-0 bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-colors"
  size="sm"
>
  {isLoadingNextMicrocycle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Habilitar Microciclo {selectedMicrocycle !== null ? selectedMicrocycle + 1 : 'Siguiente'}
</Button>
        </CardFooter>
      </Card>

      {selectedMicrocycle !== null && (
        <Card className="shadow-elevated">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
              <div>
                <CardTitle>Metas del Microciclo {selectedMicrocycle}</CardTitle>
                <ShadcnCardDescription className="mt-1">
                  Añade, edita o elimina las metas para este microciclo.
                </ShadcnCardDescription>
              </div>
              <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={openGoalFormForCreate}
                    disabled={isSubmittingGoal || isLoadingGoals}
                    className="w-full sm:w-auto flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
                    size="sm"
                  >
                    Añadir Nueva Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingGoal ? 'Editar Meta' : 'Añadir Nueva Meta'}</DialogTitle>
                    <DialogDescription>
                      {editingGoal ? 'Modifica los detalles de tu meta.' : `Define una nueva meta para el microciclo ${selectedMicrocycle}.`}
                    </DialogDescription>
                  </DialogHeader>
                  <GoalForm
                    initialData={editingGoal}
                    onSubmit={async (dataFromForm) => {
                      if (editingGoal) {
                        const { id, user_id, created_at, updated_at, microcycle, ...updateData } = dataFromForm as any;
                        await handleUpdateGoal(editingGoal.id, updateData as GoalUpdate);
                      } else {
                        await handleAddGoal(dataFromForm as GoalInsert);
                      }
                      setIsGoalFormOpen(false);
                      setEditingGoal(null);
                    }}
                    isSubmitting={isSubmittingGoal}
                    selectedMicrocycle={selectedMicrocycle}
                    onCancel={() => {
                      setIsGoalFormOpen(false);
                      setEditingGoal(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingGoals ? (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Cargando metas del microciclo...</span>
              </div>
            ) : (
              <GoalList
                displayedGoals={displayedGoals} // Changed from goals to displayedGoals
                onEditGoal={openGoalFormForEdit}
                onDeleteGoal={handleDeleteGoal}
                onToggleActive={handleToggleGoalActive}
                isLoading={isSubmittingGoal || isLoadingGoals} // isLoadingGoals might also affect interaction
                availableCategories={availableCategories}
                selectedCategoryFilters={selectedCategoryFilters}
                sortConfig={sortConfig}
                onToggleCategoryFilter={handleToggleCategoryFilter}
                onClearCategoryFilters={handleClearCategoryFilters}
                onRequestSort={handleRequestSort}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedMicrocycle !== null && (
        <Card className="mt-5.5 shadow-elevated">
          <CardHeader>
            <CardTitle>Ejercicios Completados</CardTitle>
            <ShadcnCardDescription>Historial de sets registrados para este microciclo.</ShadcnCardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDoneExercises ? (
              <div className="flex items-center justify-center space-x-2 text-muted-foreground py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Cargando ejercicios completados...</span>
              </div>
            ) : doneExercises.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                No hay ejercicios completados para este microciclo.
              </p>
            ) : (
              <DoneExerciseList
                doneExercises={doneExercises}
              />
            )}
          </CardContent>
        </Card>
      )}

      {selectedMicrocycle === null && !isLoadingMicrocycles && microcycles.length > 0 && (
         <div className="text-center py-10">
            <p className="text-muted-foreground">
              Por favor, selecciona un microciclo para ver o añadir metas.
            </p>
         </div>
      )}
      {/* ... resto del JSX de GoalsManagementPage */}
      {isCreateFirstMicrocycleModalOpen && (
        <ManageMesocycleModal
          isOpen={isCreateFirstMicrocycleModalOpen}
          onClose={() => setIsCreateFirstMicrocycleModalOpen(false)}
          onGoalsCreated={(microcycleNumber: number) => {
            // toast.success(`¡Metas del Microciclo ${microcycleNumber} creadas exitosamente!`); // Assuming toast is available
            setIsCreateFirstMicrocycleModalOpen(false); // Cierra el modal
            refreshMicrocycles(); // Refresca la lista de microciclos y metas en la página
            handleSelectMicrocycle(microcycleNumber); // Asegura que el microciclo recién creado esté seleccionado
          }}
          hookHandleAddGoal={handleAddGoal} // Pasa la función del hook para añadir metas
          targetMicrocycleNumber={1} // Siempre será 1 para este flujo
        />
      )}
      {/* NUEVO WIZARD PARA HABILITAR EL SIGUIENTE MICROCICLO */}
      {isNextMicrocycleWizardOpen && selectedMicrocycle !== null && ( // Only render if open and a microcycle is selected
        <NextMicrocycleWizard
          isOpen={isNextMicrocycleWizardOpen}
          onClose={() => {
            console.log('[GoalsManagementPage] Closing NextMicrocycleWizard.');
            setIsNextMicrocycleWizardOpen(false);
            setProposedNextGoals([]); // Clear proposed goals when closing the wizard
          }}
          proposedGoals={proposedNextGoals}
          setProposedGoals={setProposedNextGoals} // Pass the set function so the wizard can modify the list
          currentMicrocycleNumber={selectedMicrocycle}
          nextMicrocycleNumber={selectedMicrocycle + 1} // Calculate the next microcycle number
          onConfirm={createNextMicrocycleWithProposedGoals} // Pass the function for final confirmation
          isLoading={isLoadingNextMicrocycle}
        />
      )}
    </div>
  );
}
export default GoalsManagementPage;