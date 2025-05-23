import React from 'react';
import type { DisplayableDoneExercise } from '../types';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns/format';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface DoneExerciseListProps {
  doneExercises: DisplayableDoneExercise[];
  isLoading?: boolean;
}

const DoneExerciseList: React.FC<DoneExerciseListProps> = ({
  doneExercises,
  isLoading,
}) => {

  if (!isLoading && doneExercises.length === 0) {
    return null;
  }

  if (isLoading && doneExercises.length === 0) {
    return (
      <div className="flex items-center justify-center space-x-2 text-muted-foreground py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Cargando ejercicios completados...</span>
      </div>
    );
  }

  return (
    <Table className="animate-fade-in-up">
      <TableCaption>Ejercicios completados para este microciclo.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Ejercicio</TableHead>
          <TableHead className="text-center">Fecha</TableHead>
          <TableHead className="text-center">Reps</TableHead>
          <TableHead className="text-center">Fallo</TableHead>
          <TableHead className="text-center">Peso (kg)</TableHead>
          <TableHead className="text-center">Duración (s)</TableHead>
          <TableHead>Notas</TableHead>

        </TableRow>
      </TableHeader>
      <TableBody>
        {doneExercises.map((exerciseLog) => (


          <TableRow key={exerciseLog.id} className="hover:bg-muted/50">
            <TableCell className="font-medium">{exerciseLog.exercise_name}</TableCell>
            <TableCell className="text-center">

              {exerciseLog.logged_at ? format(new Date(exerciseLog.logged_at), 'dd/MM/yyyy HH:mm') : '-'}
            </TableCell>
            <TableCell className="text-center">{exerciseLog.reps_done}</TableCell>
            <TableCell className="text-center">

              {exerciseLog.failed_set ? (
                <Badge variant="destructive">Sí</Badge>
              ) : (
                <Badge variant="secondary">No</Badge>
              )}
            </TableCell>
            <TableCell className="text-center">{exerciseLog.weight_used !== null ? exerciseLog.weight_used : '-'}</TableCell>
            <TableCell className="text-center">{exerciseLog.duration_seconds_done !== null ? exerciseLog.duration_seconds_done : '-'}</TableCell>
            <TableCell>{exerciseLog.notes || '-'}</TableCell>

          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default DoneExerciseList;