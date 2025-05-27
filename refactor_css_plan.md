# Plan de Refactorización de Clases CSS

El objetivo es refactorizar las clases CSS en el proyecto, reemplazando las clases de utilidad de Tailwind CSS existentes con clases personalizadas predefinidas y asegurando que solo se utilicen los colores permitidos.

## Fase 1: Comprensión de las Clases de Estilo Personalizadas

Esta fase implica entender el diccionario visual de las clases personalizadas que se utilizarán.

*   **Botones**: Se definen cinco tipos de botones con sus respectivas clases personalizadas:
    *   `btn-primary-custom` (Principal)
    *   `btn-outline-custom` (Secundario/Contorno)
    *   `btn-success-custom` (Éxito)
    *   `btn-warning-custom` (Advertencia/Editar)
    *   `btn-danger-custom` (Peligro/Eliminar)
*   **Tarjetas**: Se definen dos tipos de tarjetas:
    *   `card-rounded-custom` (Estándar Redondeada)
    *   `workout-card-custom` o `card-border-top-primary` (Workout/Borde Superior Destacado)
*   **Etiquetas/Badges**: Se definen cuatro tipos de etiquetas:
    *   `tag-primary-custom` (Azul)
    *   `tag-success-custom` (Verde)
    *   `tag-warning-custom` (Amarillo/Ámbar)
    *   `tag-neutral-custom` (Gris)
*   **Elementos Específicos de la Aplicación**:
    *   Contenedor principal del temporizador: `timer-display-custom`
    *   Números del temporizador: `timer-number-custom`
    *   Contenedor exterior de la barra de progreso: `progress-bar-custom`
    *   Relleno interior de la barra de progreso: `progress-fill-custom`
    *   Títulos de Ejercicio: `text-lg font-semibold text-slate-900`
    *   Descripción del Ejercicio: `text-sm text-slate-600`
*   **Colores Permitidos**: Se especifica una lista estricta de colores Tailwind permitidos (azules, verdes esmeralda, amarillos/ámbar, rojos, grises slate, blanco) y una lista de colores estrictamente prohibidos (naranja, teal, cyan, lime, rose, y tonos no exactos de los permitidos).

## Fase 2: Plan de Acción Detallado – Archivo por Archivo

Esta fase implica la revisión y modificación de archivos específicos. Para cada archivo, se buscarán elementos `<button>`, `<div>`, `<span>` y otros que necesiten estilo, se compararán sus `className` actuales con los ejemplos de "ANTES" y se reemplazarán con las clases personalizadas correctas. También se revisarán y corregirán los colores prohibidos.

Los archivos a revisar son:

1.  [`src/App.tsx`](src/App.tsx)
2.  [`src/components/ExerciseTimer.tsx`](src/components/ExerciseTimer.tsx)
3.  [`src/components/Navbar.tsx`](src/components/Navbar.tsx)
4.  [`src/features/authentication/components/LoginSignup.tsx`](src/features/authentication/components/LoginSignup.tsx)
5.  [`src/features/goalsManagement/components/DoneExerciseList.tsx`](src/features/goalsManagement/components/DoneExerciseList.tsx)
6.  [`src/features/goalsManagement/components/GoalForm.tsx`](src/features/goalsManagement/components/GoalForm.tsx)
7.  [`src/features/goalsManagement/components/GoalFormModal.tsx`](src/features/goalsManagement/components/GoalFormModal.tsx)
8.  [`src/features/goalsManagement/components/GoalListItem.tsx`](src/features/goalsManagement/components/GoalListItem.tsx)
9.  [`src/features/goalsManagement/components/GoalsManagementPage.tsx`](src/features/goalsManagement/components/GoalsManagementPage.tsx)
10. [`src/features/goalsManagement/components/NextMicrocycleWizard.tsx`](src/features/goalsManagement/components/NextMicrocycleWizard.tsx)
11. [`src/features/initialSetup/components/ManageMesocycleModal.tsx`](src/features/initialSetup/components/ManageMesocycleModal.tsx)
12. [`src/features/initialSetup/components/Step1CategoryEquipment.tsx`](src/features/initialSetup/components/Step1CategoryEquipment.tsx) a [`src/features/initialSetup/components/Step4ReviewAndCreate.tsx`](src/features/initialSetup/components/Step4ReviewAndCreate.tsx) (todos los archivos "Step").
13. Carpeta completa: [`src/features/workoutExecution/components/`](src/features/workoutExecution/components/) (incluyendo `ChangeExerciseModal.tsx`, `CurrentExerciseDisplay.tsx`, `PerformanceLogger.tsx`, `RestTimerControl.tsx`, `WorkoutPage.tsx`).

## Fase 3: Verificación Final General – El Doble Chequeo

Una vez completadas las modificaciones archivo por archivo, se realizará una verificación global:

*   **Revisión de Colores Prohibidos**: Se utilizará la búsqueda global para encontrar patrones de colores prohibidos (`bg-orange`, `text-orange`, `border-orange`, tonos específicos de rojo, verde, azul, y cualquier otro color no permitido) y se corregirán.
*   **Pruebas Visuales y Funcionales**: Se ejecutará la aplicación en el navegador para verificar visualmente que todos los elementos (botones, tarjetas, etiquetas, temporizadores, barras de progreso, textos) se vean correctamente y que la funcionalidad no se haya roto.
*   **Revisión de la Consola del Navegador**: Se inspeccionará la consola del navegador en busca de errores.

Aquí está un diagrama de flujo que resume el plan:

```mermaid
graph TD
    A[Inicio: Refactorizar Clases CSS] --> B{Entender Clases Personalizadas y Colores Permitidos};
    B --> C[Iterar sobre Archivos Específicos];

    C --> D{Abrir Archivo};
    D --> E{Buscar Elementos HTML (button, div, span)};
    E --> F{Comparar className con Ejemplos "ANTES"};
    F --> G{Reemplazar con Clases *-custom Correctas};
    G --> H{Revisar y Corregir Colores Prohibidos};
    H --> I{Guardar Archivo};
    I --> J{Opcional: Revisar en Navegador};
    J --> K{¿Más Archivos en la Lista?};
    K -- Sí --> D;
    K -- No --> L[Verificación Final General];

    L --> M{Búsqueda Global de Colores Prohibidos};
    M --> N{Corregir Colores Encontrados};
    N --> O{Pruebas Visuales y Funcionales en Navegador};
    O --> P{Revisar Consola del Navegador para Errores};
    P --> Q[Fin: Tarea Completada];