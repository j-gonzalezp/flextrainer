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
import DoneExerciseList from './DoneExerciseList';

const GoalsManagementPage: React.FC = () => {
  const {
    user,
    microcycles,
    selectedMicrocycle,
    displayedGoals, // This is the filtered and sorted list for rendering
    isLoadingMicrocycles,
    isLoadingGoals,
    isSubmittingGoal,
    isLoadingNextMicrocycle,
    error,
    setError,
    handleSelectMicrocycle,
    handleCreateNextMicrocycle,
    handleAddGoal,
    handleUpdateGoal,
    handleDeleteGoal,
    handleToggleActive: handleToggleGoalActive,
    // Filter and sort related state and handlers
    availableCategories,
    selectedCategoryFilters,
    sortConfig,
    handleToggleCategoryFilter,
    handleClearCategoryFilters,
    handleRequestSort,
    doneExercises,
    isLoadingDoneExercises,
  } = useGoalsManagement();

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
            <Button onClick={() => setError(null)} variant="link" className="p-0 h-auto ml-2 text-xs text-destructive-foreground hover:underline">
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
          <Button
            onClick={handleCreateNextMicrocycle}
            disabled={isLoadingNextMicrocycle || isSubmittingGoal || isLoadingMicrocycles}
            className="w-full sm:w-auto"
            size="sm"
          >
            {isLoadingNextMicrocycle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {microcycles.length > 0 ? 'Crear Siguiente Microciclo' : 'Crear Primer Microciclo'}
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
                    className="w-full sm:w-auto flex-shrink-0"
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
        <Card className="mt-5.5" shadow-elevated>
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
    </div>
  );
}
export default GoalsManagementPage;