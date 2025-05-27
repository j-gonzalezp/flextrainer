import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchLibraryMetadata } from '../services/exerciseLibraryService';
import { toast } from 'sonner'; // Para notificaciones al usuario

// Define la interfaz para el mapa de categorías específicas que se pasarán como props.
// Esto permite que el componente padre gestione el estado de las subcategorías,
// agrupadas por su categoría general.
interface SpecificCategorySelection {
  [generalCategory: string]: string[];
}

interface Step1CategoryEquipmentProps {
  selectedGeneral: string[]; // Array de categorías generales seleccionadas
  onGeneralChange: (selected: string[]) => void; // Callback para actualizar categorías generales
  selectedSpecific: SpecificCategorySelection; // Objeto/mapa de subcategorías seleccionadas
  onSpecificChange: (selected: SpecificCategorySelection) => void; // Callback para actualizar subcategorías
  selectedEquipment: string[]; // Array de equipamiento seleccionado
  onEquipmentChange: (selected: string[]) => void; // Callback para actualizar equipamiento
}

const Step1CategoryEquipment: React.FC<Step1CategoryEquipmentProps> = ({
  selectedGeneral,
  onGeneralChange,
  selectedSpecific,
  onSpecificChange,
  selectedEquipment,
  onEquipmentChange,
}) => {
  // Estados internos para almacenar las opciones disponibles cargadas de la librería
  const [allGeneralCategories, setAllGeneralCategories] = useState<string[]>([]);
  // Este mapa es crucial: asocia cada categoría general con un array de sus subcategorías DISPONIBLES.
  const [availableSpecificCategoriesMap, setAvailableSpecificCategoriesMap] = useState<Map<string, string[]>>(new Map());
  const [allEquipmentOptions, setAllEquipmentOptions] = useState<string[]>([]);
  
  // Estados para el manejo de la carga y errores
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar las opciones de categorías y equipamiento al montar el componente
  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      setError(null); // Resetear error en cada intento de carga
      try {
        const metadata = await fetchLibraryMetadata(); // Llama al servicio para obtener los datos
        setAllGeneralCategories(metadata.generalCategories);
        setAvailableSpecificCategoriesMap(metadata.specificCategoriesMap); // Se carga el mapa de subcategorías dinámico
        setAllEquipmentOptions(metadata.equipmentOptions);
        
        // Opcional: Si el usuario ya tenía categorías seleccionadas que ya no existen en la metadata,
        // podrías limpiarlas aquí para evitar desincronización. Por simplicidad, no se implementa ahora.
      } catch (err: any) {
        console.error("Error al cargar la metadata de la librería de ejercicios:", err);
        setError("Error al cargar las opciones de categorías y equipamiento.");
        toast.error("Error al cargar las opciones de categorías y equipamiento. Intenta de nuevo más tarde.");
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    loadMetadata();
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

  // Manejador para el toggle de categorías generales
  const handleGeneralCategoryToggle = (category: string) => {
    const newSelection = selectedGeneral.includes(category)
      ? selectedGeneral.filter(c => c !== category) // Deseleccionar
      : [...selectedGeneral, category]; // Seleccionar
    onGeneralChange(newSelection); // Actualizar el estado del padre

    // IMPORTANTE: Si se deselecciona una categoría general, también limpiamos sus subcategorías seleccionadas
    if (!newSelection.includes(category)) {
      const newSpecifics = { ...selectedSpecific };
      delete newSpecifics[category]; // Eliminar la entrada completa para esa categoría general
      onSpecificChange(newSpecifics);
    }
  };

  // Manejador para el toggle de subcategorías específicas
  const handleSpecificCategoryToggle = (generalCategory: string, specificCategory: string) => {
    const currentSpecificsForGeneral = selectedSpecific[generalCategory] || []; // Obtener las ya seleccionadas para esa general
    const newSpecificsForGeneral = currentSpecificsForGeneral.includes(specificCategory)
      ? currentSpecificsForGeneral.filter(sc => sc !== specificCategory) // Deseleccionar subcategoría
      : [...currentSpecificsForGeneral, specificCategory]; // Seleccionar subcategoría
    
    // Actualizar el mapa de subcategorías en el estado del padre
    onSpecificChange({
      ...selectedSpecific, // Mantener las demás categorías generales intactas
      [generalCategory]: newSpecificsForGeneral, // Actualizar solo la entrada de esta categoría general
    });
  };

  // Manejador para el toggle de opciones de equipamiento
  const handleEquipmentToggle = (equipment: string) => {
    const newSelection = selectedEquipment.includes(equipment)
      ? selectedEquipment.filter(e => e !== equipment) // Deseleccionar
      : [...selectedEquipment, equipment]; // Seleccionar
    onEquipmentChange(newSelection); // Actualizar el estado del padre
  };

  // --- Renderizado Condicional de Estados ---
  if (isLoadingMetadata) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-slate-600">Cargando opciones de entrenamiento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-48 text-red-700">
        <p>{error}</p>
      </div>
    );
  }

  // --- Renderizado del Formulario ---
  return (
    <div className="space-y-6">
      {/* Sección de Categorías Generales */}
      <Card>
        <CardHeader>
          <CardTitle>1. Categorías Generales</CardTitle>
          <CardDescription>Elige los tipos principales de entrenamiento que te interesan. Estas opciones se cargan dinámicamente de la librería de ejercicios.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {allGeneralCategories.length > 0 ? (
            allGeneralCategories.map(category => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox 
                  id={`gen-cat-${category}`}
                  checked={selectedGeneral.includes(category)}
                  onCheckedChange={() => handleGeneralCategoryToggle(category)}
                />
                <Label htmlFor={`gen-cat-${category}`} className="font-medium cursor-pointer">{category}</Label>
              </div>
            ))
          ) : (
            <p className="col-span-full text-slate-600">No hay categorías generales disponibles en la librería de ejercicios. Asegúrate de que la librería contenga ejercicios.</p>
          )}
        </CardContent>
      </Card>

      {/* Sección de Sub-categorías Específicas (se muestra solo si hay categorías generales seleccionadas) */}
      {selectedGeneral.map(gc => {
        // Obtener las subcategorías disponibles para la categoría general actual desde el mapa dinámico
        const specificOptions = availableSpecificCategoriesMap.get(gc); 
        // Si no hay subcategorías definidas para esta categoría general, no renderizar la tarjeta
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
                    // Verificar si esta subcategoría está seleccionada dentro de su categoría general
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

      {/* Sección de Equipamiento Disponible */}
      <Card>
        <CardHeader>
          <CardTitle>2. Equipamiento Disponible</CardTitle>
          <CardDescription>Selecciona todo el equipamiento al que tienes acceso regularmente. Estas opciones también se cargan dinámicamente.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {allEquipmentOptions.length > 0 ? (
            allEquipmentOptions.map(equipment => (
              <div key={equipment} className="flex items-center space-x-2">
                <Checkbox 
                  id={`eq-${equipment}`}
                  checked={selectedEquipment.includes(equipment)}
                  onCheckedChange={() => handleEquipmentToggle(equipment)}
                />
                <Label htmlFor={`eq-${equipment}`} className="font-medium cursor-pointer">{equipment}</Label>
              </div>
            ))
          ) : (
            <p className="col-span-full text-slate-600">No hay opciones de equipamiento disponibles en la librería de ejercicios. Asegúrate de que la librería contenga ejercicios.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Step1CategoryEquipment;