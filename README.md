# RUMBO · Aprende a programar el camino

Videojuego educativo **original** para trabajar el **pensamiento computacional de los 3 a los 12 años**
(Educación Infantil y los tres ciclos de Educación Primaria), alineado con el currículo LOMLOE de Canarias
(Decreto 196/2022 de Infantil y Decreto 211/2022 de Primaria).

Funciona en el navegador, sin instalar nada y **sin enviar datos a ningún servidor**. Se publica tal cual en GitHub Pages.

> **Jugar:** `https://dortcal.github.io/rumbo/` (cuando actives GitHub Pages, ver más abajo)

## La historia

Lumo, una pequeña chispa con una brújula en el pecho, ha perdido el camino a casa: el Faro Mayor se ha apagado.
Con la ayuda del alumnado y de sus amigos (Búho Bruma, Bichito, Tinta, el lagarto gigante, Bit…) recorre cuatro
mundos, repara su brújula —es decir, **depura**— y vuelve a encender el Faro. Al final, el Laboratorio de
programación le da el turno al alumnado: ahora crean ellos los retos.

## Todo el alumnado puede terminar la aventura

Cada curso tiene **su propio final**, con las mismas escenas y créditos y la insignia «Final de la aventura»:
3, 4 y 5 años al completar su itinerario; 1.º–2.º al superar el último reto del Mundo 1; 3.º–4.º el del Mundo 2;
5.º–6.º el último reto del Faro. El Laboratorio se abre al terminar la aventura de cada curso. Quien llega al Mundo 3 sin
haber pasado por los anteriores empieza por **5 retos de calentamiento** (que no bloquean el resto) y recibe la explicación
de cada tarjeta la primera vez que la usa.

## Protección de datos

El juego **no pide ni guarda nombres**. Cada jugador aparece como «Jugador N» con un dibujo. Todo se guarda solo en el navegador.
Los títulos de los retos del Laboratorio llevan un aviso para no escribir nombres de personas.

## Qué contiene

| Campaña | Etapa | Retos | Qué se trabaja |
|---|---|---|---|
| **Mundo 0 · Pequeños exploradores** | Infantil (3, 4 y 5 años) | 15 (3 itinerarios) | Direcciones, secuencias de 1 a 5 tarjetas, giros, patrones, anticipación, detectar errores sencillos. Sin texto ni terminología: voz e imágenes. |
| **Mundo 1 · Primeros programadores** | 1.º–2.º | 25 | Secuencias, giros, recoger, saltar, mecanismos, primeros bucles, depuración. |
| **Mundo 2 · Maestros del código** | 3.º–4.º | 25 | Bucles con cantidades, descomposición, recetas (bloques reutilizables), primera condición, optimización. |
| **Mundo 3 · Expertos en algoritmos** | 5.º–6.º | 30 (5 de calentamiento + 25) | Bucles anidados, condiciones y sensores, «mientras», recetas, límites de tarjetas, depuración avanzada. |
| **El Faro Mayor** | cierre de 5.º–6.º | 3 + 4 retos secretos | Retos integradores por fases. |
| **Laboratorio** | todos | ilimitados | Crear un tablero, resolverlo, compartirlo con un código o un archivo. |

La dificultad **no** crece solo alargando recorridos: cada bloque introduce una forma nueva de pensar
(patrón, repetición, condición, receta, optimización, depuración).

### Las tarjetas

`Avanzar`, `Retroceder`, `Girar izquierda/derecha`, `Saltar`, `Recoger`, `Activar`, `Esperar`, `Repetir`, `Si / si no`,
`Mientras`, `Receta`. Se **desbloquean poco a poco**; la primera vez que aparece una se muestra una explicación animada
que se ejecuta con el intérprete real. Repetir, Si, Mientras y Receta se explican **por pasos** (primero el problema, después la herramienta).

### Estrellas

★ superar el reto · ★★ resolverlo con un número eficiente de tarjetas · ★★★ solución óptima o cumplir una condición extra
(por ejemplo, usar un bucle). **El tiempo y el número de intentos no cuentan nunca** y las estrellas no bloquean el avance.
En Infantil solo hay una estrella de celebración y no se muestra ninguna puntuación.

### Los errores no se castigan

Lumo reacciona con humor y con una pista («¿Y si repetimos esta secuencia?»); hay un botón grande de **Pista** (tres pistas progresivas por reto; parpadea solo tras dos fallos o un rato sin tocar nada) y, tras
varios intentos, «Lumo te lo enseña» (con 1 estrella como máximo). Hay retos cuyo objetivo es **encontrar y reparar** programas
con fallos (tarjetas desordenadas, que faltan, sobran, bucles mal contados, condiciones erróneas) y retos de optimización.

## Modo docente

En la portada: **Docentes** → mantener pulsado dos segundos.

- Progreso por jugador: retos superados, intentos, ayudas pedidas, estrellas (en Infantil no se califica: solo participación).
- Errores más frecuentes y estrategias utilizadas (bucles, condiciones, recetas…).
- Cada nivel muestra, **por separado**, sus referencias al currículo oficial y las propuestas didácticas propias del juego.
- **Matriz curricular** automática: qué retos trabajan cada criterio.
- Probar cualquier nivel sin registrar progreso, desbloquear niveles (uno, todos o «abrir todo» en el mapa), cambiar el curso de un
  jugador, reiniciar partidas, informe en CSV, copia de seguridad en JSON.

## Guardar y continuar en otro equipo

El progreso se guarda **automáticamente en el navegador** (`localStorage`). Para continuar en otro equipo:

- **Código corto** (Primaria): 11 símbolos. Restaura mundos desbloqueados y estrellas por mundo (no el detalle de cada nivel).
- **Código con dibujos** (Infantil): 6 dibujos que se tocan en orden.
- **Código largo** y **copia JSON** (docentes): conservan las estrellas de cada reto.

## Publicar en GitHub Pages (paso a paso)

1. Sube el contenido de este repositorio a la rama `main` (ya incluye el paquete `js/rumbo.js`; no hace falta compilar nada).
2. En GitHub: **Settings → Pages**.
3. En *Build and deployment* elige **Source: Deploy from a branch**, rama **main**, carpeta **/ (root)** y pulsa **Save**.
4. Espera uno o dos minutos. La web quedará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.
5. Abre esa dirección en Chrome. Tras la primera carga, el juego funciona **sin conexión** (service worker) y se puede
   instalar como aplicación desde el menú de Chrome («Instalar RUMBO»).

Todas las rutas son relativas y el repositorio incluye `.nojekyll`, así que funciona en cualquier subcarpeta.

## Para quien desarrolle

```
index.html            página única
css/rumbo.css         estilos
js/rumbo.js           paquete generado (NO editar a mano)
sw.js                 service worker generado (versión según el contenido)
src/engine/           intérprete de tarjetas, estrellas y validador de niveles (puros, sin DOM)
src/datos/            niveles (JSON-like con un pequeño DSL), catálogo, logros, voces, retos del Laboratorio
src/progreso/         perfiles, desbloqueos, códigos de partida
src/audio/            capa de voz (voz sintética del navegador o audios grabados)
src/ui/               arte SVG, escenario, editor de tarjetas, juego, pantallas, docente, laboratorio
tools/build.js        concatena los módulos en js/rumbo.js y genera sw.js
pruebas/              pruebas unitarias (node --test) y pruebas en Chrome real (e2e)
fonts/, icons/        tipografías (licencia OFL) e iconos de la aplicación
```

```bash
npm run build     # regenera js/rumbo.js y sw.js tras cambiar algo en /src
npm test          # pruebas del motor, niveles, progreso, códigos, voz y retos (no necesitan navegador)
npm i && npm run e2e   # pruebas en Chrome real (necesita Chrome y puppeteer-core)
```

Para usar otra ubicación de Chrome o de puppeteer: `CHROME=/ruta/chrome PUPPETEER=/ruta/puppeteer-core npm run e2e`.

### Añadir un nivel

Los niveles son **datos**, no código del motor (`src/datos/niveles-*.js`). Ejemplo:

```js
N({ id: 'm1-26', e: 'primaria-1c', tt: 'Mi reto', b: 3, z: 'bosque',
    i: 'Lumo mira el camino.', o: 'Lleva a Lumo hasta la meta.',
    m: ['>..', '.#.', '..G'],                       // > = Lumo mirando al este
    c: ['avanzar', 'girar-d'],                       // tarjetas disponibles
    ref: [A, A, D, A, A],                            // solución de referencia (obligatoria)
    cur: ['m1_41'], ext: ['Secuencias de cinco pasos'] })
```

La solución de referencia se ejecuta con el intérprete al pasar las pruebas: **un nivel que no se puede resolver, o sin las
tres estrellas alcanzables, hace fallar `npm test`.**

### Voz

Las frases están **todas** en `src/datos/voces-es.js`. El juego elige automáticamente la mejor voz en español del equipo
(prefiere voces «naturales/neuronales» de es‑ES, descarta las de red si no hay conexión) y puede cambiarse en *Ajustes*.
Si algún día se graban audios, basta con asociarlos a esos mismos identificadores (`audios` en `src/audio/voz.js`).

## Decisiones técnicas importantes

- **SVG + DOM en lugar de Phaser 3.** El diseño inicial proponía Phaser para el escenario. Al ser un juego por casillas con
  animaciones sencillas, el SVG propio es más ligero (≈310 KB en total con todos los niveles, el arte y las pruebas fuera),
  se ve nítido en pizarras digitales y no añade dependencias ni licencias. El motor de reglas está separado de la vista, así que
  se podría sustituir la capa visual sin tocar los niveles.
- **Intérprete puro y con pruebas.** La interfaz solo reproduce la «traza» que produce el intérprete.
- **Sin dependencias en el juego.** Solo HTML, CSS y JavaScript. Fuentes propias (Baloo 2 y Nunito, licencia OFL).
- **Sonido sin archivos:** efectos y música generados con Web Audio.
- **Privacidad:** nada sale del navegador; no hay cuentas ni analítica.

## Limitaciones conocidas (para no crear falsas expectativas)

- **No se ha probado en pizarras ni tabletas reales.** Se ha probado en Chrome de escritorio con eventos de ratón y táctiles
  emulados. Conviene una prueba en el aula antes de usarlo con el grupo.
- **La calidad de la voz depende de las voces instaladas en cada equipo.** Chrome exige un primer toque antes de hablar. Sin voz en
  español, el juego muestra subtítulos. No se han grabado audios.
- **Variables, contadores, parámetros y eventos** (propuestos para 5.º–6.º en el encargo) **no están en el intérprete**: el tercer
  ciclo trabaja bucles anidados, condiciones, «mientras», recetas y límites de tarjetas. «Empujar», ascensores y sensores avanzados
  tampoco. Se indican como propuestas futuras.
- **Referencias curriculares:** están redactadas a partir de los decretos (los PDF del proyecto) y se muestran separadas de la
  «extensión» propia del juego. Deben contrastarse con el BOC antes de citarlas en documentos oficiales; el juego no puede comprobar
  que un criterio exista.
- La música es sencilla (generada por código); no hay una pista compuesta por mundo.
- Probado en Chrome actualizado. Otros navegadores modernos deberían funcionar, pero no se ha verificado.

## Licencias y créditos

- Diseñado por **David OZC** · © 2026 David. Arte (Lumo, personajes, escenarios, iconos), niveles, textos y código: obra original creada para este proyecto, publicada bajo licencia **[Creative Commons Reconocimiento-NoComercial-SinObraDerivada 4.0 (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es)**. Uso gratuito en centros educativos.
- Tipografías **Baloo 2** y **Nunito**: SIL Open Font License 1.1 (`fonts/OFL-*.txt`).
- No se usa ningún personaje, gráfico, sonido ni elemento protegido de otros videojuegos. Lightbot, Code‑a‑pillar y Smile and
  Learn fueron solo inspiración de mecánicas pedagógicas.
