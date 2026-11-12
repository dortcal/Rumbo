# Fase 5 — Música, sonidos y voz con carácter

## Qué cambia
- **Una pieza propia por zona** (`src/audio/musica-datos.js`, datos + generador puro de eventos): jardín, granja, playa, bosque, montañas, mar, volcán, ciudad, espacio, Faro y mapa.
  Cada una tiene tonalidad, escala (pentatónica, dórica, menor, frigia, lidia…), tempo (60–112), timbres, melodía de 4 compases, bajo y acompañamiento propios;
  volcán y ciudad llevan percusión, bosque y espacio destellos sueltos, playa/mar/Faro eco.
- **El motivo del Faro «corto, corto, largo»** (dos notas cortas y una larga, la misma nota): firma de la pieza del Faro (último compás de cada vuelta),
  del mapa (cada cuarta vuelta) y del efecto `guino`. Suena en el mapa a la vez que el primer guiño visual de la linterna.
- **Secuenciador** nuevo en `sonido.js`: planifica por compases con antelación (sin el desfase del temporizador anterior).
- **Sonidos de la historia**: `guino`, `chispa` (destello ascendente), `pieza` (clic + acorde de la brújula), `faro` (ventana que se enciende), `aparece`,
  `abuela` (dos notas cálidas), `bichito` (risa corta). El motor de escenas los dispara al entrar cada personaje y al aparecer la pieza de brújula o la luz.
- **Voz con carácter** (`voz.js`: `PERFILES`, `perfilDeVoz`): cada personaje cambia el tono y el ritmo de la voz sintética (Bichito agudo y rápido, Búho Bruma y Lagarto graves y lentos,
  Abuela Chispa cálida y pausada…) y la emoción de la frase añade un matiz. Se activa con `caracter: true` en las escenas y en las intros de los niveles; el resto de usos no cambia.

## Verificado
- `npm test`: 210 correctas (13 nuevas: piezas, motivo del Faro, perfiles de voz).
- **Audio real en Chrome** (analizador en la salida): las 11 piezas suenan, nivel pico 0,05–0,11 (sin saturar), y los 8 efectos de historia/victoria se oyen.
  Medido por máquina: **no he podido escuchar** el resultado; el gusto musical y el equilibrio de volumen hay que juzgarlos con oídos.

## Límites y pendiente
- La música es **sintetizada** (Web Audio), sin archivos: suena funcional y coherente, no como una banda sonora grabada. Si se quiere calidad de producción, hacen falta piezas compuestas (ver recursos pendientes en la fase 7).
- La **voz sigue siendo la sintética del navegador**: el carácter se limita a tono y ritmo; no hay timbres distintos. Las voces grabadas (`audio/voz/<id>.mp3`) seguirán funcionando con prioridad cuando existan; el guion de locución irá en `docs/recursos-pendientes.md`.
- Los efectos de la fase 3 que no tenían sonido propio (p. ej. cámara, cambio de fondo) siguen en silencio.
