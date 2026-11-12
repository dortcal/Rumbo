# RUMBO · «La luz de Lumo» — Informe final de la mejora de historia y atractivo

Rama `mejora-historia` de `dortcal/Rumbo`. No se han añadido ni rehecho niveles.

## Qué ha cambiado
| Fase | Resultado |
|---|---|
| 1 Guion | `docs/guion-v2.md`: arco, seis chispas, Bichito en cinco tiempos, escaleta, finales por curso, 102 introducciones. |
| 2 Datos y disparadores | 50 escenas dirigidas por datos, frases en `voces-es.js`, finales por etapa, «Antes, en RUMBO…». |
| 3 Lumo y motor de escenas | Lumo nuevo (8 expresiones, poses), seis chispas, motor de escenas con entradas/emociones/cámara/objetos. |
| 4 Mapa y tableros | Mapa-archipiélago con el Faro (guiño «corto, corto, largo»), senderos, paisaje en tableros, portada con Faro. |
| 5 Sonido | Música por zona con el motivo del Faro, sonidos de la historia, voz con carácter por personaje. |
| 6 Victoria y diario | Línea de avance, celebración determinista, Faro en pequeño, Bichito en depuraciones, diario de Lumo. |
| 7 Cierre | README, e2e ampliada, `docs/recursos-pendientes.md`, este informe. |

## Capturas antes / después (1280×800, `docs/capturas/`)
`par-1-portada.png`, `par-2-mapa.png`, `par-3-tablero.png`, `par-4-resultado.png` (izquierda: antes, commit `09338b5`; derecha: ahora). Además: `resultado-meta-zona.png`, `diario.png`, `final-faro.png`.

## Comprobado
- 220 pruebas unitarias; e2e en Chrome real (84 comprobaciones, 0 fallos); sin errores de consola.
- Capturas revisadas por mí a 1280×800, 1024×768 y 1920×1080 para escenas, mapa, portada, resultados y diario; tableros principalmente a 1280.
- Infantil nunca ve escenas de Primaria; cada curso tiene su final; ninguna frase supera los límites de palabras.

## No he podido comprobar
- Dispositivos reales (pizarra digital, tableta, móvil): solo Chrome de escritorio con eventos táctiles emulados.
- **Calidad del sonido:** la música es sintetizada; he medido su nivel con un analizador, pero no la he escuchado. La voz depende de las voces del equipo.
- Móvil estrecho (< 760 px) con las nuevas pantallas (mapa-archipiélago, resultados, diario).
- Otros navegadores distintos de Chrome.

## Pendiente
Ver `docs/recursos-pendientes.md` (ilustraciones de escena, rediseño de personajes secundarios, guion de 155 frases para voz grabada) y:
- El motor no carga aún `historia/<id>.jpg` ni `audio/voz/<id>.mp3`.
- Chispa en la casilla meta y gag de Bichito en el tablero de Infantil.
- La tarjeta de resultados hace scroll a 800 px de alto si llegan muchas insignias a la vez.
- Diario de Infantil sin voz.
