import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Opciones predefinidas (podrían venir de una constante o configuración)
const GENERAL_CATEGORIES = ['Fuerza', 'Flexibilidad', 'Cardio'];
const SPECIFIC_CATEGORIES_MAP: { [key: string]: string[] } = {
  Fuerza: ['Push', 'Pull', 'Upper Body', 'Lower Body', 'Piernas', 'Brazos', 'Core'],
  Flexibilidad: ['Isquiotibiales', 'Hombros', 'Espalda', 'Cadera', 'Pectorales', 'Cuádriceps'],
  Cardio: ['Resistencia Aeróbica', 'Intervalos de Alta Intensidad (HIIT)', 'Bajo Impacto'], 
};
const EQUIPMENT_OPTIONS = ['Bodyweight', 'Bandas Elásticas', 'Mancuernas', 'Barra y Discos', 'Kettlebell', 'Máquinas de Gimnasio', 'Cuerda para Saltar', 'Bicicleta', 'Cinta de Correr'];

interface Step1CategoryEquipmentProps {
  selectedGeneral: string[];
  onGeneralChange: (selected: string[]) => void;
  selectedSpecific: { [key: string]: string[] };
  onSpecificChange: (selected: { [key: string]: string[] }) => void;
  selectedEquipment: string[];
  onEquipmentChange: (selected: string[]) => void;
}

const Step1CategoryEquipment: React.FC<Step1CategoryEquipmentProps> = ({
  selectedGeneral,
  onGeneralChange,
  selectedSpecific,
  onSpecificChange,
  selectedEquipment,
  onEquipmentChange,
}) => {

  const handleGeneralCategoryToggle = (category: string) => {
    const newSelection = selectedGeneral.includes(category)
      ? selectedGeneral.filter(c => c !== category)
      : [...selectedGeneral, category];
    onGeneralChange(newSelection);

    // Si se deselecciona una categoría general, limpiar también sus específicas seleccionadas
    if (!newSelection.includes(category)) {
      const newSpecifics = { ...selectedSpecific };
      delete newSpecifics[category];
      onSpecificChange(newSpecifics);
    }
  };

  const handleSpecificCategoryToggle = (generalCategory: string, specificCategory: string) => {
    const currentSpecificsForGeneral = selectedSpecific[generalCategory] || [];
    const newSpecificsForGeneral = currentSpecificsForGeneral.includes(specificCategory)
      ? currentSpecificsForGeneral.filter(sc => sc !== specificCategory)
      : [...currentSpecificsForGeneral, specificCategory];
    
    onSpecificChange({
      ...selectedSpecific,
      [generalCategory]: newSpecificsForGeneral,
    });
  };

  const handleEquipmentToggle = (equipment: string) => {
    const newSelection = selectedEquipment.includes(equipment)
      ? selectedEquipment.filter(e => e !== equipment)
      : [...selectedEquipment, equipment];
    onEquipmentChange(newSelection);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Categorías Generales</CardTitle>
          <CardDescription>Elige los tipos principales de entrenamiento que te interesan.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {GENERAL_CATEGORIES.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox 
                id={`gen-cat-${category}`}
                checked={selectedGeneral.includes(category)}
                onCheckedChange={() => handleGeneralCategoryToggle(category)}
              />
              <Label htmlFor={`gen-cat-${category}`} className="font-medium cursor-pointer">{category}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedGeneral.map(gc => {
        const specificOptions = SPECIFIC_CATEGORIES_MAP[gc];
        if (!specificOptions || specificOptions.length === 0) return null;
        return (
          <Card key={`specific-card-${gc}`}>
            <CardHeader>
              <CardTitle className="text-lg">Sub-categorías para: {gc}</CardTitle>
              <CardDescription>Define con más detalle tu enfoque para {gc.toLowerCase()}. (Opcional)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {specificOptions.map(sc => (
                <div key={sc} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`spec-cat-${gc}-${sc}`}
                    checked={(selectedSpecific[gc] || []).includes(sc)}
                    onCheckedChange={() => handleSpecificCategoryToggle(gc, sc)}
                  />
                  <Label htmlFor={`spec-cat-${gc}-${sc}`} className="cursor-pointer">{sc}</Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle>2. Equipamiento Disponible</CardTitle>
          <CardDescription>Selecciona todo el equipamiento al que tienes acceso regularmente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {EQUIPMENT_OPTIONS.map(equipment => (
            <div key={equipment} className="flex items-center space-x-2">
              <Checkbox 
                id={`eq-${equipment}`}
                checked={selectedEquipment.includes(equipment)}
                onCheckedChange={() => handleEquipmentToggle(equipment)}
              />
              <Label htmlFor={`eq-${equipment}`} className="font-medium cursor-pointer">{equipment}</Label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Step1CategoryEquipment;