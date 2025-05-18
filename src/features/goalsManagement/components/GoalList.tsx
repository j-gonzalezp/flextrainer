import React from 'react';
import type { Goal } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit2, Trash2, MoreVertical } from 'lucide-react';

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
          <TableHead className="text-center">Activo</TableHead>
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
              <Switch
                id={`active-toggle-${goal.id}`}
                checked={goal.active === 1}
                onCheckedChange={() => onToggleActive(goal.id, goal.active)}
                disabled={isLoading}
                aria-label="Toggle goal active state"
              />
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