# Strike · Ejercicio multi-asset

Prototipo funcional del flujo "Crear ejercicio de seguridad con múltiples assets" (Challenge UX-UI Strike), construido desde el Figma.

**Demo:** https://juliangerardi.github.io/Strike-Challenge/

## Correr

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # build estándar en dist/
npm run build:single # un único index.html autocontenido en dist-single/
```

Cada push a `main` vuelve a publicar la demo (`.github/workflows/deploy.yml` construye y sube `dist/` a la rama `gh-pages`).

## Qué incluye

- Las 13 pantallas del happy path: listado → detalles (paso 1) → selección de assets (paso 2) → configuración (paso 3, con edición masiva, confirmación, toast y drawer por asset) → review (paso 4) → ejercicio creado → listado con el ejercicio nuevo.
- Formulario que arranca vacío, con validación de nombre y fechas. Desde el paso 2 se puede cancelar el ejercicio (con confirmación) y volver al listado sin guardar nada.
- Búsqueda, filtros por columna (con chips) y paginación en las tres tablas.
- Herencia de configuración: cada asset hereda los valores del ejercicio y puede tener overrides, marcados como "Custom override".
- Inglés y español: selector EN/ES en el header que traduce pantallas, estados, fechas, asistente y tours.
- Smiley animado en el header: saluda al entrar a cada pantalla, parpadea, guiña al pasar el mouse y festeja al crear el ejercicio.
- Strike Assistant: botón flotante que se puede arrastrar a cualquier borde u ocultar, y que se corre solo para no tapar texto ni botones. Explica cómo crear un ejercicio y cómo aplicar la configuración a los assets, con un tour que resalta la acción exacta de cada paso. Si cerrás un tour que arrancó desde el listado, volvés al listado.
- Íconos pixel por sección, tipografía Aeonik Fono donde la usa el diseño, y layout responsive (celular, tablet y desktop).
