// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default { // o module.exports = { si usas CommonJS
    content: [
      "./index.html", // Si tienes un index.html en la raíz
      "./src/**/*.{js,ts,jsx,tsx}", // Patrón común para proyectos con Vite, CRA, etc.
      // Añade aquí cualquier otra ruta donde uses clases de Tailwind
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }