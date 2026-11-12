# Fase 2 · Datos y disparadores (guion v2 → código)

**Estado:** hecha y probada. Sin cambios en el intérprete, el validador, las estrellas, los mapas, las soluciones ni los identificadores de nivel.

## Qué cambia

| Archivo | Cambio |
|---|---|
| `src/datos/voces-es.js` | Todas las frases de escena del guion v2 (139), con identificador y `escena`. La bienvenida (`bv_*`), las consignas de Infantil, los fallos y las celebraciones **no cambian**. Las 102 introducciones de nivel se registran como `i_<nivel>` igual que antes. |
| `src/datos/escenas.js` (nuevo) | 50 escenas dirigidas por datos: etapa, fondo de zona, disparador (antes/después de un reto), frases y créditos. Incluye las tablas `GUINOS` (12 hitos) y `CHISPAS` (6) y la función pura `pendientes()`, que decide qué escenas toca ver. |
| `src/datos/niveles-*.js` | Campo `i` de los 102 retos reescrito (microhistoria con continuidad; sin «empujar», «sensor de luz» ni «faro» antes de llegar a él). |
| `src/ui/app.js` | Desaparecen `construirDisparos()` y las reglas sueltas por prefijo de identificador: ahora todo sale de `escenas.js`. Los créditos son genéricos y el álbum muestra el título de cada escena. |
| `src/ui/juego.js` | Corrección: la burbuja de introducción solo recorta un prefijo «Quien:» de verdad (antes recortaba cualquier texto con dos puntos). |
| `src/ui/arte.js` | Figuras **provisionales** de Titila, Brasa, Destello, Ascua, Píxel, Cometa y Conejo, para que las escenas no salgan en blanco. Se redibujan en la Fase 3. |
| `tools/build.js` | `escenas.js` entra en el paquete. |
| `pruebas/escenas.test.mjs` (nuevo) | 18 pruebas (ver abajo). Total: **192 pruebas** en verde. |

## Qué se ve ya en el juego

- Infantil: `C0-01` al empezar, `C0-02/03/04` al terminar cada itinerario. Nunca ve escenas de Primaria.
- Primaria: un capítulo de cierre por ciclo (`CAP1-xx` tras `m1-25`, `CAP2-xx` tras `m2-25`) y el gran final (`FIN-01…04`) solo tras `f-03` y solo para 5.º–6.º.
- Las seis chispas se anuncian y se rescatan en su zona; Bichito aparece en sus cinco tiempos; `CF-01` y `CF-02` ya tienen frases.
- «Antes, en RUMBO…» (`AR-2`, `AR-3`) para quien entra al Mundo 2 o 3 sin haber visto el capítulo anterior.
- Los perfiles guardados siguen cargando: las escenas antiguas que figuren como vistas (`CF-03`…) se ignoran en el álbum y no rompen nada.

## Qué NO está todavía (y por qué)

- **Puesta en escena:** las escenas se reproducen aún con el `escena()` antiguo (dos personajes y un bocadillo). Los pasos de entrada, acción, objeto, cámara y sonido se añaden en la **Fase 3**, con el motor de escenas.
- **Guiño visual y comentarios `GC-0…3`:** los datos existen y están probados, pero `GUINOS_ACTIVOS` está en `false` hasta la **Fase 4** (el Faro del mapa). Así nadie oye a Lumo comentar una luz que aún no ha visto.
- **Chispas en la casilla de meta (`skin`)** y **gag de Bichito junto al programa**: necesitan arte nuevo (Fases 3 y 4).
- **Regalos de disfraces al desbloquearse** y **resultados con historia / diario de Lumo**: Fase 6.
- Las figuras de los personajes nuevos son provisionales.

## Pruebas nuevas (`pruebas/escenas.test.mjs`)

Toda escena usa frases y personajes que existen · no hay frases huérfanas · todos los personajes tienen figura · todo disparador apunta a un nivel real · el orden de las escenas es coherente con el de los retos · ninguna frase supera el límite de palabras ni menciona mecánicas inexistentes · número de intervenciones por escena · las 102 introducciones cumplen límites y no rompen la burbuja · Infantil nunca ve escenas de Primaria · cada curso tiene su final y ninguno ve el de otro · las escenas vistas no se repiten · «Antes, en RUMBO…» · los guiños no se ofrecen hasta la Fase 4 · las seis chispas (meta, ventanas, anuncio, rescate) · el guiño se ve ≥ 6 veces antes del final · arco de Bichito y escenas retiradas · `CF-01/02` con frases · «Repetir» se explica en `m1-15`, no antes.
