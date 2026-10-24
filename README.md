# Strike · Ejercicio multi-asset

Prototipo funcional del flujo "Crear ejercicio de seguridad con múltiples assets" (Challenge UX-UI Strike), construido desde el Figma.

## Correr

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build estándar en dist/
npm run build:single # un único index.html autocontenido en dist-single/
```

## Qué incluye

- Las 13 pantallas del happy path: listado → detalles (paso 1) → selección de assets (paso 2) → configuración (paso 3, con edición masiva, confirmación, toast y drawer por asset) → review (paso 4) → ejercicio creado → listado con el ejercicio nuevo.
- Búsqueda, filtros por columna (con chips) y paginación en las tres tablas.
- Herencia de configuración: cada asset hereda los valores del ejercicio y puede tener overrides, marcados como "Custom override".
- Smiley animado en el header: saluda al cargar, parpadea, guiña y sonríe al pasar el mouse, y festeja al crear el ejercicio.
- Strike Assistant (botón del robot): chat que explica cómo crear un ejercicio y cómo aplicar la configuración a los assets, con un tour que resalta en pantalla el paso donde estás.

Stack: React 18 + Vite + TypeScript + Tailwind CSS, íconos lucide-react.
