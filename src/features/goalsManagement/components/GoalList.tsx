import React from 'react';
import type { Goal } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit2, Trash2, MoreVertical, Play, Pause } from 'lucide-react';

interface GoalListProps {
  goals: Goal[];
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: number) => void;
  onToggleActive: (goalId: number, currentState: Goal['active']) => void;
  isLoading?: boolean;
}

const GoalList: React.FC<GoalListProps> = ({
  goals,
  onEditGoal,
  onDeleteGoal,
  onToggleActive,
  isLoading = false
}) => {
  // Función auxiliar para garantizar que pasemos el estado actual
  const handleToggleActive = (goalId: number, currentState: Goal['active']) => {
    // Pasamos el ID y el estado actual tal cual lo espera la función del hook
    onToggleActive(goalId, currentState);
    
    // Para debugging
    console.log(`Toggling goal ${goalId} from ${currentState} to ${currentState === 1 ? 0 : 1}`);
  };

  if (goals.length === 0) {
    return null;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ejercicio</TableHead>
          <TableHead className="text-center">Sets</TableHead>
          <TableHead className="text-center">Reps</TableHead>
          <TableHead className="text-center">Peso</TableHead>
          <TableHead className="text-center">Duración</TableHead>
          <TableHead>Categorías</TableHead>
          <TableHead className="text-center">Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {goals.map((goal) => (
          <TableRow key={goal.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">{goal.exercise_name}</TableCell>
            <TableCell className="text-center">{goal.sets}</TableCell>
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