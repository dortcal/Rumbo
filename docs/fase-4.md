# Fase 4 — Mapa, senderos, tableros y portada

## Qué cambia
- **Mapa-archipiélago** (Primaria): mar con olas y barquito, una isla por mundo unidas por un sendero punteado, y Lumo saludando sobre la isla donde toca jugar.
  Infantil mantiene su tarjeta única.
- **El Faro, visible**: isla del Faro con la torre, sus seis ventanas (se encienden al rescatar cada chispa: «2 de 6 luces») y la linterna que hace el
  guiño «corto, corto, largo» cada 9 s. También aparece en la portada.
- **Guiños activos** (`GUINOS_ACTIVOS = true`): ya existe el guiño visual, así que se ofrecen las escenas GC-0…GC-3 que lo comentan.
- **Senderos por mundo**: pantalla de cada mundo con el paisaje de su zona detrás y camino punteado entre nodos (continuo en los superados).
- **Tableros con paisaje**: el panel del tablero ya no queda vacío; lleva cielo, capas lejanas, suelo, motas de luz y fauna (mariposas, gaviotas, peces, luciérnagas).
  Infantil sin fauna, para no distraer. «Reducir animaciones» lo deja estático.
- **Portada**: la insignia Creative Commons es ahora un SVG local (antes pedía una imagen a licensebuttons.net).
- Módulo `UI.Escenas.paisaje(zona)` y `UI.Escenas.faroSvg(n)` reutilizables.

## Pendiente / no hecho
- La chispa en la casilla de meta de su último reto (aspecto de la meta) y el gag de Bichito: no incluidos en esta fase.
- Móviles estrechos (<760 px): el archipiélago cae a una cuadrícula de dos columnas sin sendero; no revisado en dispositivo real.
- Las ventanas del Faro cuentan las chispas por la escena de rescate vista, no por el nivel superado.

## Pruebas
- 197 unitarias, 79 e2e en Chrome (se ajustó una prueba: ahora salta la escena de guiño al volver al mapa antes de abrir otro nivel).
- Capturas revisadas: portada, mapa, mundo y tablero a 1280×800, 1024×768 y 1920×1080 (el tablero y el mundo sólo se miraron a 1280).
