import React from 'react';
import type { Goal } from '../types';
import { Button } from '@/components/ui/button';
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GoalListItemProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: number) => void;
  onToggleActive: (goalId: number, currentState: Goal['active']) => void;
  disabled?: boolean;
}

const GoalListItem: React.FC<GoalListItemProps> = ({
  goal,
  onEdit,
  onDelete,
  onToggleActive,
  disabled,
}) => {



  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">{goal.exercise_name}</TableCell>
      <TableCell className="text-center">{goal.sets}</TableCell>
      <TableCell className="text-center">{goal.reps}</TableCell>
      <TableCell className="text-center">{goal.weight !== null && goal.weight !== undefined ? `${goal.weight} kg` : '-'}</TableCell>
      <TableCell className="text-center">{goal.duration_seconds !== null && goal.duration_seconds !== undefined ? `${goal.duration_seconds}s` : '-'}</TableCell>
      <TableCell>
        {goal.categories && goal.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
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
          disabled={disabled}
          aria-label="Toggle goal active state"
        />
      </TableCell>
      <TableCell className="text-right">

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={disabled} className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(goal)} disabled={disabled}>
              <Edit2 className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(goal.id)} disabled={disabled} className="text-destructive focus:bg-destructive focus:text-destructive-foreground">
              <Trash2 className="mr-2 h-4 w-4" />
              Borrar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </TableCell>
    </TableRow>
  );
};
export default GoalListItem;