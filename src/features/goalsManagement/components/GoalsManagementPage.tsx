import NextMicrocycleWizard from './NextMicrocycleWizard';
import React from 'react';
import { useGoalsManagement } from '../hooks/useGoalsManagement';
import GoalList from './GoalList';
import GoalForm from './GoalForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Goal, GoalInsert, GoalUpdate } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as ShadcnCardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ChevronDown, Check } from 'lucide-react';
import ManageMesocycleModal from '@/features/initialSetup/components/ManageMesocycleModal';
import DoneExerciseList from './DoneExerciseList';
import { cn } from '@/lib/utils';

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
    handleEnableNextMicrocycle,
    createNextMicrocycleWithProposedGoals,
  } = useGoalsManagement();

  React.useEffect(() => {
    if (!isLoadingMicrocycles && microcycles.length === 0) {
      console.log('[GoalsManagementPage] No microcycles found for user, opening ManageMesocycleModal.');
      setIsCreateFirstMicrocycleModalOpen(true);
    }
  }, [microcycles, isLoadingMicrocycles]);

  const [isGoalFormOpen, setIsGoalFormOpen] = React.useState(false);
  const [editingGoal, setEditingGoal] = React.useState<Goal | null>(null);
  const [isMicrocyclePopoverOpen, setIsMicrocyclePopoverOpen] = React.useState(false);

  const openGoalFormForCreate = () => {
    setEditingGoal(null);
    setIsGoalFormOpen(true);
  };

  const openGoalFormForEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setIsGoalFormOpen(true);
  };

  const handleMicrocycleSelection = (microcycleNumber: number) => {
    handleSelectMicrocycle(microcycleNumber.toString());
    setIsMicrocyclePopoverOpen(false);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[calc(10vh-var(--navbar-height,4rem))]">
        <Card className="w-full max-w-md card-rounded-custom">
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

      <Card className="shadow-elevated">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            {/* Contenedor principal para el título/selector y los botones */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
              {/* Columna izquierda: Título y Selector de Microciclos (ahora Popover) */}
              <div className="flex-grow">
                {isLoadingMicrocycles && microcycles.length === 0 ? (
                  <div className="flex items-center space-x-2 text-muted-foreground py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Cargando microciclos...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 mt-4">
                    <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                      Microciclo {selectedMicrocycle !== null ? selectedMicrocycle : 'No Seleccionado'}
                    </h2>
                    <Popover open={isMicrocyclePopoverOpen} onOpenChange={setIsMicrocyclePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          disabled={isLoadingNextMicrocycle || isSubmittingGoal || isLoadingGoals || microcycles.length === 0 || isLoadingMicrocycles}
                        >
                          <ChevronDown className="h-4 w-4" />
                          <span className="sr-only">Cambiar microciclo</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 bg-background text-foreground shadow-lg rounded-md border border-border">
                        {microcycles.length === 0 ? (
                          <p className="p-4 text-center text-muted-foreground">No hay microciclos disponibles.</p>
                        ) : (
                          <div className="flex flex-col max-h-[200px] overflow-y-auto">
                            {/* Invertir el orden del array para mostrar el último microciclo primero */}
                            {microcycles.slice().reverse().map((mc) => (
                              <Button
                                key={mc}
                                variant="ghost"
                                className={cn(
                                  "justify-between",
                                  selectedMicrocycle === mc && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => handleMicrocycleSelection(mc)}
                              >
                                Microciclo {mc}
                                {selectedMicrocycle === mc && <Check className="ml-2 h-4 w-4" />}
                              </Button>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {!isLoadingMicrocycles && microcycles.length === 0 && !isLoadingNextMicrocycle && (
                  <p className="text-sm text-muted-foreground mt-3">No hay microciclos definidos. ¡Crea el primero!</p>
                )}
              </div>

              {/* Columna derecha: Botones de acción */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4 sm:mt-0 flex-shrink-0">
                {/* Botón "Añadir Nueva Meta" */}
                <Dialog open={isGoalFormOpen} onOpenChange={setIsGoalFormOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={openGoalFormForCreate}
                      disabled={isSubmittingGoal || isLoadingGoals || selectedMicrocycle === null}
                      className="w-full sm:w-auto btn-primary-custom bg-accent text-accent-foreground hover:bg-accent/90"
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

                {/* Botón "Gestionar Mesociclo" */}
                <Button
                  onClick={() => { setIsCreateFirstMicrocycleModalOpen(true); }}
                  disabled={isLoadingNextMicrocycle || isSubmittingGoal || isLoadingMicrocycles}
                  className="w-full sm:w-auto btn-primary-custom bg-accent text-accent-foreground hover:bg-accent/90"
                  size="sm"
                >
                  {isLoadingNextMicrocycle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gestionar Mesociclo
                </Button>

                {/* Botón "Habilitar Microciclo Siguiente" */}
                <Button
                  onClick={() => { handleEnableNextMicrocycle(); }}
                  disabled={
                    isLoadingNextMicrocycle ||
                    isSubmittingGoal ||
                    isLoadingMicrocycles ||
                    microcycles.length === 0 ||
                    selectedMicrocycle === null ||
                    (selectedMicrocycle !== null && displayedGoals.length === 0)
                  }
                  className="w-full sm:w-auto flex-shrink-0 btn-primary-custom bg-accent text-accent-foreground hover:bg-accent/90"
                  size="sm"
                >
                  {isLoadingNextMicrocycle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Habilitar Microciclo {selectedMicrocycle !== null ? selectedMicrocycle + 1 : 'Siguiente'}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Contenido de las metas y ejercicios, solo visible si hay un microciclo seleccionado */}
        {selectedMicrocycle !== null ? (
          <>
            <CardContent>
              {isLoadingGoals ? (
                <div className="flex items-center justify-center space-x-2 text-muted-foreground py-10">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Cargando metas del microciclo...</span>
                </div>
              ) : (
                <GoalList
                  displayedGoals={displayedGoals}
                  onEditGoal={openGoalFormForEdit}
                  onDeleteGoal={handleDeleteGoal}
                  onToggleActive={handleToggleGoalActive}
                  isLoading={isSubmittingGoal || isLoadingGoals}
                  availableCategories={availableCategories}
                  selectedCategoryFilters={selectedCategoryFilters}
                  sortConfig={sortConfig}
                  onToggleCategoryFilter={handleToggleCategoryFilter}
                  onClearCategoryFilters={handleClearCategoryFilters}
                  onRequestSort={handleRequestSort}
                />
              )}
            </CardContent>

            {/* Card de Ejercicios Completados, ahora dentro del mismo Card principal si hay microciclo seleccionado */}
            <CardFooter className="border-t pt-4 mt-4">
              <div className="w-full">
                <CardTitle className="mb-2">Ejercicios Completados</CardTitle>
                <ShadcnCardDescription className="mb-4">Historial de sets registrados para este microciclo.</ShadcnCardDescription>
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
              </div>
            </CardFooter>
          </>
        ) : (
          // Mensaje cuando no hay microciclo seleccionado y ya se cargaron los microciclos
          !isLoadingMicrocycles && microcycles.length > 0 && (
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                Por favor, selecciona un microciclo para ver o añadir metas.
              </p>
            </CardContent>
          )
        )}
      </Card>

      {isCreateFirstMicrocycleModalOpen && (
        <ManageMesocycleModal
          isOpen={isCreateFirstMicrocycleModalOpen}
          onClose={() => setIsCreateFirstMicrocycleModalOpen(false)}
          onGoalsCreated={(microcycleNumber: number) => {
            setIsCreateFirstMicrocycleModalOpen(false);
            refreshMicrocycles();
            handleSelectMicrocycle(microcycleNumber.toString());
          }}
          hookHandleAddGoal={handleAddGoal}
          targetMicrocycleNumber={microcycles.length > 0 ? microcycles[microcycles.length - 1] : 1}
        />
      )}
      {isNextMicrocycleWizardOpen && selectedMicrocycle !== null && (
        <NextMicrocycleWizard
          isOpen={isNextMicrocycleWizardOpen}
          onClose={() => {
            console.log('[GoalsManagementPage] Closing NextMicrocycleWizard.');
            setIsNextMicrocycleWizardOpen(false);
            setProposedNextGoals([]);
          }}
          proposedGoals={proposedNextGoals}
          setProposedGoals={setProposedNextGoals}
          currentMicrocycleNumber={selectedMicrocycle!}
          nextMicrocycleNumber={selectedMicrocycle! + 1}
          onConfirm={createNextMicrocycleWithProposedGoals}
          isLoading={isLoadingNextMicrocycle}
        />
      )}
    </div>
  );
}

export default GoalsManagementPage;