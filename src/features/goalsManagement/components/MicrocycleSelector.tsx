import React from 'react';


interface MicrocycleSelectorProps {
  microcycles: number[];
  selectedMicrocycle: number | null;
  onSelectMicrocycle: (value: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MicrocycleSelector: React.FC<MicrocycleSelectorProps> = ({
  microcycles,
  selectedMicrocycle,
  onSelectMicrocycle,
  isLoading,
  disabled,
}) => {
  if (isLoading && microcycles.length === 0) {
    return <p>Cargando microciclos...</p>;
  }


  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="microcycle-select" className="mr-2 whitespace-nowrap">Selecciona Microciclo:</label>
      <select
        id="microcycle-select"
        value={selectedMicrocycle?.toString() ?? ""}
        onChange={(e) => onSelectMicrocycle(e.target.value)}
        disabled={disabled || microcycles.length === 0 || isLoading}
        className="p-2 border rounded bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600 min-w-[180px]"
      >
        <option value="" disabled={selectedMicrocycle !== null || microcycles.length === 0}>
          {microcycles.length === 0 ? "No hay microciclos" : "Selecciona..."}
        </option>
        {microcycles.map((mc) => (
          <option key={mc} value={mc.toString()}>
            Microciclo {mc}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MicrocycleSelector;