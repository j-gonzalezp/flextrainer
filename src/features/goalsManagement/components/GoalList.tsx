import React from 'react';
import type { Goal } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Edit2, Trash2, MoreVertical, Play, Pause, ChevronUp, ChevronDown, ChevronsUpDown, Filter } from 'lucide-react';

import type { SortableGoalKeys } from '../types';

interface GoalListProps {
  displayedGoals: Goal[];
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: number) => void;
  onToggleActive: (goalId: number, currentState: Goal['active']) => void;
  isLoading?: boolean;
  availableCategories: string[];
  selectedCategoryFilters: string[];
  sortConfig: { key: SortableGoalKeys; direction: 'asc' | 'desc' } | null;
  onToggleCategoryFilter: (category: string) => void;
  onClearCategoryFilters: () => void;
  onRequestSort: (key: SortableGoalKeys) => void;
}

const GoalList: React.FC<GoalListProps> = ({
  displayedGoals,
  onEditGoal,
  onDeleteGoal,
  onToggleActive,
  isLoading = false,
  availableCategories,
  selectedCategoryFilters,
  sortConfig,
  onToggleCategoryFilter,
  onClearCategoryFilters,
  onRequestSort
}) => {
  // Función auxiliar para garantizar que pasemos el estado actual
  const handleToggleActive = (goalId: number, currentState: Goal['active']) => {
    // Pasamos el ID y el estado actual tal cual lo espera la función del hook
    onToggleActive(goalId, currentState);
    
    // Para debugging
    // Updated log to more accurately reflect the toggle logic used in the hook
    console.log(`Toggling goal ${goalId} from ${currentState} to ${currentState === 1 ? 0 : 1}`);
  };

  // Helper to render sort icons
  const renderSortIcon = (columnKey: SortableGoalKeys) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? <ChevronUp className="inline ml-1 h-4 w-4" /> : <ChevronDown className="inline ml-1 h-4 w-4" />;
    }
    // Apply group-hover effect to ChevronsUpDown as well
    return <ChevronsUpDown className="inline ml-1 h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />;
  };

  if (displayedGoals.length === 0 && selectedCategoryFilters.length === 0) {
    // Show 'no goals' message only if no filters are applied resulting in an empty list
    // If filters are applied and the list is empty, it's an expected outcome of filtering
    return <p className="text-center text-muted-foreground py-10">No hay metas definidas para este microciclo. ¡Añade la primera!</p>;
  }

  if (displayedGoals.length === 0 && selectedCategoryFilters.length > 0) {
    return <p className="text-center text-muted-foreground py-10">Ninguna meta coincide con los filtros de categoría seleccionados.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead onClick={() => onRequestSort('exercise_name')} className="cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Ejercicio{renderSortIcon('exercise_name')}</TableHead>
          <TableHead onClick={() => onRequestSort('sets')} className="text-center cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Sets Totales{renderSortIcon('sets')}</TableHead>
          <TableHead onClick={() => onRequestSort('completedSetsCount')} className="text-center cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Sets Realizados{renderSortIcon('completedSetsCount')}</TableHead>
          <TableHead onClick={() => onRequestSort('reps')} className="text-center cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Reps{renderSortIcon('reps')}</TableHead>
          <TableHead onClick={() => onRequestSort('weight')} className="text-center cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Peso{renderSortIcon('weight')}</TableHead>
          <TableHead onClick={() => onRequestSort('duration_seconds')} className="text-center cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Duración{renderSortIcon('duration_seconds')}</TableHead>
          <TableHead className="text-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 h-auto hover:bg-transparent font-semibold group" disabled={isLoading || availableCategories.length === 0}>
                  <span className='sr-only'>Filtrar por </span>Categorías
                  {selectedCategoryFilters.length > 0 ? 
                    <Filter className="inline ml-1 h-3 w-3 text-blue-500" /> : 
                    <ChevronsUpDown className="inline ml-1 h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuLabel>Filtrar por Categoría</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableCategories.length > 0 ? (
                  availableCategories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category}
                      checked={selectedCategoryFilters.includes(category)}
                      onCheckedChange={() => onToggleCategoryFilter(category)}
                      disabled={isLoading}
                    >
                      {category}
                    </DropdownMenuCheckboxItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No hay categorías disponibles</DropdownMenuItem>
                )}
                {availableCategories.length > 0 && selectedCategoryFilters.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={onClearCategoryFilters}
                      className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
                      disabled={isLoading}
                    >
                      Limpiar todos los filtros
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableHead>
          <TableHead onClick={() => onRequestSort('active')} className="text-center cursor-pointer hover:bg-muted/50 group"><span className='sr-only'>Ordenar por </span>Estado{renderSortIcon('active')}</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayedGoals.map((goal) => (
          <TableRow key={goal.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">{goal.exercise_name}</TableCell>
            <TableCell className="text-center">{goal.sets}</TableCell>
            <TableCell className="text-center">{goal.completedSetsCount}</TableCell>
            <TableCell className="text-center">{goal.reps}</TableCell>
            <TableCell className="text-center">{goal.weight !== null && goal.weight !== undefined ? `${goal.weight} kg` : '-'}</TableCell>
            <TableCell className="text-center">{goal.duration_seconds !== null && goal.duration_seconds !== undefined ? `${goal.duration_seconds}s` : '-'}</TableCell>
            <TableCell>
              {goal.categories && goal.categories.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {goal.categories.slice(0, 2).map((category, index) => (
                    <Badge key={index} variant="secondary">{category}</Badge>
                  ))}                  
                  {goal.categories.length > 2 && (
                    <Badge variant="outline">+{goal.categories.length - 2}</Badge>
                  )}
                </div>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell className="text-center">
              <Button
                variant={goal.active === 1 ? "default" : "outline"}
                size="sm"
                className={`px-3 py-1 h-8 ${goal.active === 1 ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 hover:bg-gray-300 border border-gray-300"}`}
                onClick={() => handleToggleActive(goal.id, goal.active)}
                disabled={isLoading}
              >
                {goal.active === 1 ? (
                  <>
                    <span className="mr-1 font-medium">Activa</span>
                    <Pause className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    <span className="mr-1 font-medium text-gray-700">Pausada</span>
                    <Play className="h-3 w-3 text-gray-700" />
                  </>
                )}
              </Button>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading} className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditGoal(goal)} disabled={isLoading}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDeleteGoal(goal.id)} disabled={isLoading} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Borrar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default GoalList;