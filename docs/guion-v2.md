# RUMBO · «La luz de Lumo», versión 2 — Guion (Fase 1)

**Estado:** guion **aprobado** (Fase 1). La Fase 2 lo ha pasado a datos (ver `docs/fase-2.md`). Cuatro introducciones cambiaron de redacción en la Fase 2 para evitar dos puntos al principio de frase (la pantalla de juego los interpreta como «Personaje:»).
**Base:** commit `09338b5` de `dortcal/Rumbo` (174 pruebas en verde). Parte del guion aprobado (Anexo 2) y de la auditoría (Anexo 4).
**Qué contiene:** decisiones abiertas (§1), arco y personajes (§2–§3), la meta visible (§4), las seis chispas (§5), los guiños de la abuela (§6), Bichito en cinco tiempos (§7), secundarios y regalos (§8), la escaleta de escenas con sus frases (§9), los finales por etapa (§10), victoria y diario (§11), las correcciones de continuidad (§12) y las **102 introducciones nuevas** (§13).

> Todas las frases están comprobadas con un script: Infantil ≤ 9 palabras por frase; Primaria ≤ 14; 2–6 intervenciones por escena en Primaria; ninguna menciona «empujar», «sensor de luz» ni «esperar», que no existen como mecánica en los niveles.

---

## 1. Decisiones que necesito de ti antes de pasar a la Fase 2

| # | Decisión | Mi propuesta | Si dices que no |
|---|---|---|---|
| 1 | **Choque de nombres.** La chispa del mar se llama **Destello** y los «destellos» de la abuela también. | Llamar **«guiños»** a la señal de la abuela (corto, corto, largo). La chispa conserva su nombre. En el final, la abuela dice «mis guiños». | Dime otro nombre para la chispa o para la señal. |
| 2 | **Bichito es una chispa sin luz** (giro nuevo del prompt). | Mantenerlo: da sentido a todos sus fallos («sus fallos apuntaban al Faro»). | Se quitan las escenas `BI-4a`, `FIN-01` (parte de Bichito) y una línea del diario; el resto no cambia. |
| 3 | **Infantil y Bichito.** Los retos de depuración de Infantil son 4 (`i4-03`, `i5-02`, `i5-03`, `i5-04`). | Un «bichito travieso» **solo como gag visual** (sin diálogo, sin historia, sin nombre). | Sin gag: se omite. No afecta a nada más. |
| 4 | **El Faro en Infantil.** | Tres lucecitas, una por itinerario completado (3, 4 y 5 años). Nunca se ve «apagado». | Faro fijo y siempre amable, sin progreso. |
| 5 | **Veces que se ve el guiño.** En 5.º–6.º son 11 antes del final; en 1.º–2.º son 5 antes de su cierre de capítulo (ver §6). | Así. Quien juega más, lo ve más. | Añado guiños en M1 (p. ej. tras `m1-06` y `m1-11`), aunque no sean hitos de patrones. |
| 6 | **Identificadores de escena.** El final antiguo usaba `CF-03/04/05`; un perfil que ya los vio no los volvería a ver. | Escenas nuevas con identificadores nuevos (`CAP1-xx`, `CAP2-xx`, `FIN-xx`); los antiguos quedan en desuso. Los perfiles antiguos pueden verlas desde el diario. | Reutilizar `CF-xx`: quien ya lo vio no vería la versión mejorada hasta que lo abra en el diario. |
| 7 | **Disfraces sin regalo en el prompt:** «gafas de inventora» y «capa de aventurero». | Gafas: las dejan las luciérnagas del bosque. Capa: Brasa. | Se quedan sin escena; solo cambia el mensaje de desbloqueo. |
| 8 | **Cómo se presentan los regalos.** Los disfraces se desbloquean por condiciones (3 retos, 10 retos…), no por escena. | El regalo sale **al desbloquearse**, en la pantalla de victoria, con quién lo da y su frase. Las despedidas de cada amigo lo recuerdan («ya lo tienes»). Así no depende del orden en que se juegue. | Escena obligatoria en un nivel fijo (puede quedar desfasada si alguien salta niveles). |
| 9 | **Objeto `tarjeta` en el motor de escenas** (además de brújula, pieza, chispa, faro). | Añadirlo: lo necesita la animación didáctica de repetir (C1-03). | Se resolvería con iconos sueltos; más frágil. |
| 10 | **Bit viaja con Lumo al espacio** (los niveles `m3-14…25` ya hablan de «Bit»). | Sí: Bit despega con Lumo y se despide al final del mundo. | Bit se queda y sus intros del espacio pasan a Lumo. |

---

## 2. El arco completo, en una página

**Premisa (se mantiene):** una tormenta apaga el Faro Mayor. Lumo, la chispa más pequeña de su familia, cae lejos con la brújula rota. Cruza las islas, la repara pieza a pieza (**reparar = depurar**) y vuelve a encender el Faro.

**Lo que se añade:** cada paso del alumnado se ve en el Faro, que se enciende por partes; cada zona termina con una chispa de la familia a salvo; una señal de luz lejana (corto, corto, largo) se repite hasta el final, donde la abuela revela que eran sus guiños; y Bichito, el «fallo» travieso, resulta ser una chispa que perdió su luz.

| Tramo | Dónde | Qué pasa | Qué se ve en el Faro |
|---|---|---|---|
| **Prólogo** | Intro ilustrada + bienvenida | La tormenta apaga el Faro. Lumo cae y aprende a usar las tarjetas. | Apagado; solo la lucecita del guiño |
| **Bosque encantado** | `m1-01…13` | Búho Bruma guía a Lumo entre luciérnagas. Rescata a **Titila**. | 1 ventana |
| **Reino de las montañas** | `m1-14…25` | Brasa «puede sola». Aparece **Bichito** (1). Primera pieza. | 2 ventanas + 1.ª respuesta |
| **Mundo submarino** | `m2-01…13` | Tinta construye un camino de luz. Rescata a **Destello**. | 3 ventanas |
| **Isla volcánica** | `m2-14…25` | El lagarto gigante no cabe en los túneles. **Ascua** gruñe. Bichito (2). Segunda pieza. | 4 ventanas + respuesta más larga |
| **Ciudad tecnológica** | `m3-p1…m3-13` | Bit no sabe improvisar. Bichito (3). Rescata a **Píxel**. | 5 ventanas |
| **Mundo espacial** | `m3-14…25` | Bichito (4): es una chispa sin luz. Rescata a **Cometa**. Tercera pieza. | 6 ventanas |
| **El Faro Mayor** | `f-01…03` | Brújula completa, todos a sus puestos, la luz se enciende. Bichito (5). Abuela Chispa. | **Linterna encendida** |
| **Epílogo** | Laboratorio | «Ahora te toca a ti guiar a otros.» | — |

**Infantil (3–5 años)** vive su propia historia aparte, sin abuela ni pérdida: Lumo cae en el Valle de Colores, hace amigos con Conejo y los animales, y a los 5 años ve su casa (el Faro) a lo lejos.

---

## 3. Personajes: voz y carácter

Cada personaje tiene 3–4 expresiones en el motor de escenas. Lumo tiene **8** (normal, alegre, concentrado, sorprendido, ups, orgulloso, emocionado, tierno); **nunca «triste»**.

| Personaje | Papel | Cómo habla | Expresiones |
|---|---|---|---|
| **Lumo** | Protagonista. Llama pequeña con brújula en el pecho | Curioso, valiente, un poco torpe. Cálido. | las 8 |
| **Conejo** | Amigo de Infantil | Gestos y sonidos; casi no habla | alegre, sorprendido, tierno |
| **Búho Bruma** | Guía del bosque | Poco y despacio. Calma. | sereno, sorprendido, tierno, alegre |
| **Titila** | Chispa del bosque | Tímida, susurra, acaba brillando | tímido, curioso, alegre, tierno |
| **Brasa** | Chispa de las montañas | Cabezota y valiente: «¡Yo puedo sola!» | terco, orgulloso, alegre, emocionado |
| **Tinta** | Pulpa inventora | Entusiasta, siempre construyendo | alegre, emocionado, concentrado, tierno |
| **Destello** | Chispa del mar | Juguetón: «¡Te pillé!» | juguetón, sorprendido, alegre, tierno |
| **Lagarto gigante** | Guardián del volcán (fauna canaria) | Tranquilo y sabio; frases con calma | sereno, sorprendido, divertido, tierno |
| **Ascua** | Chispa del volcán | Gruñona de buen corazón | gruñón, sorprendido, tierno, alegre |
| **Bit** | Robot de la ciudad | Literal y preciso; aprende a improvisar | literal, sorprendido, alegre, concentrado |
| **Píxel** | Chispa de la ciudad | Curiosa: pregunta todo | curioso, sorprendido, alegre, emocionado |
| **Cometa** | Chispa del espacio | Soñadora, habla bajito mirando estrellas | soñador, alegre, tierno, sorprendido |
| **Bichito** | El «fallo» travieso | «¡Ji, ji!» Escurridizo; al final, sincero | travieso, ups, tierno, ilusionado, sincero |
| **Abuela Chispa** | Guardiana del Faro | Cálida y serena; solo en el gran final | serena, tierna, alegre |

---

## 4. Una meta que siempre se ve: el Faro por partes

El estado del Faro **se calcula a partir del progreso que ya existe** (retos superados), sin campos nuevos que puedan romper partidas antiguas:

| Elemento | Cuándo se enciende |
|---|---|
| Ventana 1 (Titila) | `m1-13` superado |
| Ventana 2 (Brasa) | `m1-25` |
| Ventana 3 (Destello) | `m2-13` |
| Ventana 4 (Ascua) | `m2-25` |
| Ventana 5 (Píxel) | `m3-13` |
| Ventana 6 (Cometa) | `m3-25` |
| **Linterna** | `f-03` |
| Guiño (rayo corto, corto, largo) | en cada hito de §6 |

- **Portada:** Lumo animado ante el Faro lejano, con el estado del último perfil usado (apagado si no hay perfil).
- **Mapa:** el Faro al final del archipiélago; encima, Lumo marca dónde está el jugador.
- **Infantil:** versión simple con **tres lucecitas** (una por itinerario), sin apagado ni linterna (decisión 4).
- Al volver al Faro, cada chispa rescatada se ve junto a su ventana (en el mapa, tamaño pequeño; en `CF-02` y `FIN-01`, a tamaño completo).

---

## 5. Las seis chispas (la familia de Lumo)

Cada una se anuncia en la **escena de entrada** de su zona (para que el alumnado sepa a quién busca, y el mensaje «Faltan 3 retos para llegar hasta Titila» tenga sentido), aparece en la **casilla de meta del último reto de la zona** (`skin`, sin tocar el motor) y, tras el rescate, **vuela al Faro** y enciende su ventana.

| Chispa | Zona | Carácter | Se anuncia en | Meta (último reto) | Rescate |
|---|---|---|---|---|---|
| **Titila** | Bosque | Miedosa, tímida | `C1-01` (Bruma) | `m1-13` | `CAP1-A` |
| **Brasa** | Montañas | Cabezota y valiente | `C1-06` (voz desde la cumbre) | `m1-25` | `CAP1-01` |
| **Destello** | Mar | Juguetón | `C2-01` (Tinta) | `m2-13` | `CAP2-A` |
| **Ascua** | Volcán | Gruñona de buen corazón | `C2-03` (Lagarto) | `m2-25` | `CAP2-B` |
| **Píxel** | Ciudad | Curiosa | `C3-01` (Bit) | `m3-13` | `CAP3-A` |
| **Cometa** | Espacio | Soñadora | `C3-04` (la estación) | `m3-25` | `CAP3-B` |

> El «rescate» **no es un peligro**: cada chispa estaba perdida, escondida o jugando. Ninguna sufre; Lumo la encuentra y le dice que su familia la espera.

**Piezas de la brújula:** 1.ª en `CAP1-01` (la trae Brasa), 2.ª en `CAP2-02` (Bichito la devuelve: su primera ayuda), 3.ª en `CAP3-B` (el reactor). Se juntan en `CF-01`.

---

## 6. Los guiños de la abuela, sembrados desde el principio

Una señal de luz lejana, **corto, corto, largo**, en la lucecita del Faro. Es también el **tema musical** (se compondrá en la Fase 5). Aparece **2–3 segundos después** de entrar en la pantalla que sigue al hito (resultados o mapa), dura 3 s, no bloquea nada y no tiene texto. Cada guiño se marca como visto (una sola vez por perfil).

| Guiño | Hito | Infantil | Primaria | Comentario de Lumo |
|---|---|---|---|---|
| `G-01` | Primer reto superado del perfil | `i3-01` | `m1-01` (o `m2-01`/`m3-p1` si es el primero que juega) | **Sí**, una sola vez en ese mundo |
| `G-02` | Fin de zona: bosque | — | `m1-13` | — |
| `G-03` | Fin del bloque de patrones (1.er ciclo) | `i5-04` (patrón) | `m1-17` | — |
| `R-1` | **El Faro responde** (débil, 1 destello) | — | `m1-25`, dentro de `CAP1-01` | — |
| `G-04` | Fin de los bloques de bucles (2.º ciclo) | — | `m2-08` | Sí (Mundo 2) |
| `G-05` | Fin de zona: mar | — | `m2-13` | — |
| `R-2` | **El Faro responde** (corto, corto) | — | `m2-25`, dentro de `CAP2-01` | — |
| `G-06` | Fin del bloque de bucles anidados | — | `m3-05` | Sí (Mundo 3) |
| `G-07` | Fin de zona: ciudad | — | `m3-13` | — |
| `G-08` | Fin de zona: espacio | — | `m3-25` | — |
| `R-3` | **El Faro se enciende** (completo) | `C0-04` (solo el guiño) | `FIN-01` | — |

Además, en Infantil: `G-I2` al terminar el itinerario de 4 años (tras `C0-03`).

**Cuántas veces lo ve cada curso antes de su final:**
- **5.º–6.º:** 8 guiños + 2 respuestas = **10**, y el encendido (11).
- **3.º–4.º:** `G-01`…`G-05` + `R-1` + `R-2` = **7** antes de su cierre.
- **1.º–2.º:** `G-01`, `G-02`, `G-03`, la señal de Lumo y Brasa y `R-1` = **5** (decisión 5).
- **Infantil:** `G-01`, `G-I2`, `G-03` y el de `C0-04` = **4**.

Comentarios de Lumo (una vez por mundo; se reproducen como mini-escena de unos 6 s):

| Id | Mundo | Frase |
|---|---|---|
| `GC-0` | 0 (Infantil) | Lumo · sorprendido — «¡Mira! ¡Una luz que parpadea!» |
| `GC-1` | 1 | Lumo · sorprendido — «Esa luz… parpadea como una canción.» |
| `GC-2` | 2 | Lumo · concentrado — «Otra vez esa luz. Corto, corto, largo.» |
| `GC-3` | 3 | Lumo · emocionado — «Corto, corto, largo. ¡Quiere decirme algo!» |

---

## 7. Bichito en cinco tiempos

| Tiempo | Dónde | Qué se ve | Escenas |
|---|---|---|---|
| **1 · Travieso** | Mundo 1, montañas (`m1-18…20`, `m1-24`) | Su figura junto al programa; se ríe y huye al repararlo. Al cerrar el mundo, Lumo lo ve solo con frío y le deja una lucecita. | `C1-02`, `CAP1-02` |
| **2 · Los sigue** | Mundo 2, volcán (`m2-17…20`) | Asoma de lejos entre los roques. Uno de sus fallos **abre un camino** sin querer. Después **devuelve la pieza** de la brújula. | `B2-1`, `B2-2`, `CAP2-02` |
| **3 · Quiere ayudar** | Mundo 3, ciudad (`m3-04`) | Intenta ayudar a Bit a contar y lo estropea. Bit lo acusa; Lumo lo defiende. Bit acaba aceptando que «errar también es aprender». | `BI-3` |
| **4 · Se revela** | Mundo 3, espacio (tras `m3-21`) | Es **una chispa que perdió su luz en la tormenta**; desordena porque busca el camino a casa. Lumo lo invita al grupo. | `BI-4a`, `BI-4b` |
| **5 · Recupera su luz** | Faro | Al encenderse el Faro vuelve a brillar **sin dejar de ser Bichito** (sigue haciendo travesuras). | `FIN-01` |

Mensaje: **los errores no son enemigos; nos acompañan y nos enseñan.** Nadie lo regaña. En los retos de depuración se ve su figura junto al programa (solo decoración: no cambia las reglas del reto).

---

## 8. Secundarios: necesidad, despedida y regalo

| Amigo | Necesidad | Cómo la resuelve el alumnado | Despedida | Regalo (disfraz existente) |
|---|---|---|---|---|
| **Búho Bruma** | Sus luciérnagas guía se han dispersado y no ve el camino a su árbol | `m1-09…11` (recoger luciérnagas) | `BR-2` tras `m1-13` | **Gorra de explorador** (id 1): «te la presto» al desbloquearse; en la despedida, «quédatela» |
| **Tinta** | Quiere terminar un camino de luz con perlas para los peces | `m2-06…13` (perlas, nichos, recetas) | `TIN-2` tras `m2-13` | **Casco de buceo** (id 4) |
| **Lagarto gigante** | No cabe en los túneles del volcán; Lumo sí | `m2-14…25` | `CAP2-01` tras `m2-25` | **Gafas de soldador** (id 5) |
| **Bit** | La ciudad se quedó sin energía; no sabe improvisar; luego, el reactor | `m3-p3`, `m3-08`, `m3-23…25` | `BIT-2` tras `CAP3-B` | **Antena de Bit** (id 6) |
| **Bichito** | Un hogar; recuperar su luz | todo el viaje | `FIN-01` | — |

### Regalos al desbloquear (pantalla de victoria; no cambian las condiciones)

| Disfraz | Se desbloquea | Quién lo da | Frase |
|---|---|---|---|
| 1 Gorra de explorador | 3 retos | Búho Bruma (Primaria) / Conejo (Infantil) | Bruma · sereno — «Te presto mi gorra de guía.» · Lumo · alegre — «¡Una gorra! Gracias, Conejo.» |
| 2 Gafas de inventora | 15 estrellas o 3 años | Las luciérnagas (Primaria) / los animales (Infantil) | Lumo · alegre — «¡Unas gafas! Alguien las dejó para mí.» |
| 3 Capa de aventurero | Fin del Mundo 1 o Infantil completo | Brasa (Primaria) / Conejo (Infantil) | Brasa · orgulloso — «Mi capa vuela mejor contigo.» |
| 4 Casco de buceo | 10 retos del Mundo 2 | Tinta | Tinta · alegre — «Con este casco llegarás al fondo.» |
| 5 Gafas de soldador | Fin del Mundo 2 | Lagarto gigante | (en `CAP2-01`) |
| 6 Antena de Bit | 10 retos del Mundo 3 | Bit | Bit · literal — «Te presto mi antena. Mejora la señal.» |
| 7 Corona del Faro | Fin de la aventura del curso | Infantil: Conejo · 1.º–2.º y 3.º–4.º: los amigos del Faro · 5.º–6.º: Abuela Chispa | Amigos · alegre — «Tus amigos del Faro te mandan una corona de luz.» · Abuela, en `FIN-02` |

---

## 9. Escaleta de escenas

**Cómo se lee.** Cada escena es una lista de pasos que el motor de escenas (Fase 3) interpretará: `fondo`, `entra`, `sale`, `dice`, `emocion`, `accion` (saltar, temblar, brillar, mirar, abrazar), `objeto` (brújula, pieza, chispa, faro, tarjeta), `camara`, `sonido`, `espera`. Las frases viven en `voces-es.js`; su identificador es `<escena>_<a, b, c…>` por orden de aparición (♻ = conserva su identificador antiguo, solo cambia de escena o de texto). Todas son **saltables**. Duración estimada entre paréntesis.

**Reglas que cumplen todas:** 15–35 s; en Primaria 2–6 intervenciones; en Infantil 1–3, **sin subtítulos** (solo voz e imagen); humor suave y ternura; sin villanos ni miedo; nadie regaña ni se burla de un error.

### 9.1 Infantil (Mundo 0) — solo escenas `C0`

**C0-01 · Un vientazo en el valle** — antes de `i3-01` (~18 s) · fondo: Valle de colores
- `fondo` valle-colores, nubes grandes sin rayos · `camara` plano general del Faro lejano · `sonido` viento-suave
- `accion` el Faro se apaga como una vela soplada · `entra` Lumo rodando · `accion` saltar (aterriza sobre la flor)
- `dice` Lumo · sorprendido — «¡Uy! ¿Dónde estoy?» ♻ `c0_01_a`
- `dice` Lumo · alegre — «Soy Lumo. ¿Me ayudas a moverme?» ♻ `c0_01_b`

**GC-0 · Una luz que parpadea** — tras `G-01` de Infantil (~6 s)
- `objeto` faro (guiño) · `dice` Lumo · sorprendido — «¡Mira! ¡Una luz que parpadea!»

**C0-02 · Conejo y la flor** — tras `i3-05` (~20 s) · fondo: jardín
- `entra` Conejo (salta, mueve las orejas) · `accion` abrazar · `objeto` chispa (la flor brilla)
- `dice` Lumo · alegre — «¡Lo conseguimos! Gracias, amigo.» ♻ `c0_02_a`
- `dice` Lumo · tierno — «Tienes unas orejas muy suaves.»

**C0-03 · El camino de los animales** — tras `i4-05` (~20 s) · fondo: granja
- `entra` Conejo, gallina, ovejita (se ponen en fila, una a una) · `accion` saltar (cada uno, por turnos)
- `dice` Lumo · emocionado — «¡Uno, dos, tres! ¡Qué buena fila!»
- `dice` Lumo · orgulloso — «Primero uno, luego otro. ¡Así se llega!» ♻ `c0_03_a`

**C0-04 · Mira, mi casa** — tras `i5-05` (~22 s) · fondo: playa al atardecer
- `camara` plano largo hasta el Faro, con tres lucecitas · `objeto` faro (guiño completo: corto, corto, largo) · `sonido` tema-faro
- `dice` Lumo · tierno — «Mira, mi casa.» ♻ `c0_04_a`
- `accion` Conejo y los animales saludan al Faro con la mano
- `dice` Lumo · emocionado — «Tengo que llegar allí.» ♻ `c0_04_b`

### 9.2 Primaria: aventura de bienvenida (`BV-01…05`)

Sin cambios de texto. En la Fase 3 pasan al motor de escenas con fondo del jardín y a Lumo redibujado. Solo se les añade, en `BV-05`, el gesto de mirar hacia el bosque.

### 9.3 Mundo 1 · Primeros programadores

**C1-01 · El bosque que parpadea** — antes de `m1-01` (~30 s) · fondo: bosque de noche con luciérnagas (3 capas)
- `camara` plano ancho · `sonido` grillos · `entra` Lumo (cae y rueda) · `emocion` sorprendido · `accion` mirar
- `entra` Búho Bruma (baja de una rama)
- `dice` Búho Bruma · sereno — «Hmm. Una chispa nueva en mi bosque.»
- `dice` Lumo · ups — «Me he caído de lejos. ¡Busco a mi familia!»
- `accion` las luciérnagas parpadean y forman un camino
- `dice` Búho Bruma · sereno — «Las luciérnagas hablan en orden. Escucha su luz.» ♻ `c1_01_a`
- `dice` Búho Bruma · tierno — «Una lucecita se ha perdido por aquí. Se llama Titila.»
- `dice` Lumo · emocionado — «¡Es de mi familia! Vamos a buscarla.»

**C1-06 · La voz de la cumbre** (nueva) — antes de `m1-14` (~22 s) · fondo: montañas al atardecer, nieve que brilla
- `entra` Lumo (sube) · `camara` contrapicado hacia la cumbre · `sonido` eco · `objeto` chispa (un resplandor rojo diminuto, lejos)
- `dice` Brasa · terco — «¡Eh, tú! No necesito ayuda para bajar.»
- `dice` Lumo · alegre — «¡Hola! Soy Lumo. ¿Eres de mi familia?»
- `dice` Brasa · terco — «Soy Brasa. Y puedo sola. ¡Casi siempre!»
- `dice` Lumo · tierno — «Subir juntos es más divertido. Voy ya.» · `accion` saltar

**C1-03 · Siempre lo mismo** — antes de `m1-15`, primer reto con *Repetir* (~28 s) · fondo: escalera de piedra larguísima · *Esta escena fusiona las antiguas `C1-03` y `C1-04`; así «Repetir tres veces» ya no sale antes de que se haya visto por qué hace falta.*
- `entra` Lumo · `objeto` tarjeta (Avanzar, Avanzar, Avanzar… se apilan) · `accion` bostezar
- `dice` Lumo · ups — «Subir, subir, subir… ¡siempre igual!»
- `accion` las tarjetas iguales se agrupan en un bloque · `dice` Lumo · concentrado — «¿Y si repetimos este trozo?» ♻ `c1_03_a`
- `objeto` tarjeta (aparece «×3» sobre el bloque) · `accion` Lumo sube de un salto · `dice` Lumo · orgulloso — «Repetir tres veces. ¡Así es más corto!» ♻ `c1_04_a`

**C1-02 · ¿Quién ha movido las tarjetas?** — antes de `m1-18`, primer reto de depuración (~20 s) · fondo: montañas
- `objeto` tarjeta (programa ordenado) · `entra` Bichito (salta desde detrás de una roca) · `accion` revuelve las tarjetas · `sonido` risa
- `dice` Bichito · travieso — «¡Ji, ji! ¿Quién ha movido las tarjetas?» ♻ `c1_02_a`
- `dice` Lumo · sorprendido — «¡Eh! ¿Quién eres tú?» · `sale` Bichito (huye)
- `dice` Lumo · concentrado — «Un fallo con patas. ¡Vamos a arreglarlo!»

**CAP1-A · La lucecita del arroyo** — tras `m1-13` (~28 s) · fondo: arroyo del bosque de noche
- `objeto` chispa (Titila, detrás de una hoja grande) · `accion` temblar (de timidez)
- `dice` Titila · tímido — «¿Sois… amigos? No me gusta el ruido.»
- `dice` Lumo · tierno — «Soy Lumo, de tu familia. Estás a salvo.» · `accion` abrazar
- `accion` Titila brilla · `sonido` tintineo · `dice` Titila · alegre — «¡Brillo! ¡Hacía tanto que no brillaba!»
- `camara` sigue su luz hasta el Faro · `objeto` faro (se enciende la ventana 1) · `dice` Titila · alegre — «¡Os espero en el Faro!»
- `dice` Lumo · orgulloso — «Una ventana encendida. ¡Queda más familia!»

**BR-2 · La gorra de Bruma** — tras `CAP1-A` (~15 s) · fondo: bosque
- `dice` Búho Bruma · sereno — «Mis luciérnagas vuelven a casa. Gracias, pequeño.»
- `dice` Búho Bruma · tierno — «Te presté mi gorra de guía. Quédatela.» · `accion` Lumo se pone la gorra *(solo si está desbloqueada)*
- `dice` Lumo · orgulloso — «¡Ahora soy un explorador de verdad!»

**CAP1-01 · La primera luz** — tras `m1-25` (~32 s) · fondo: cumbre al atardecer, el Faro diminuto en el horizonte
- `entra` Lumo y Brasa (brazos cruzados)
- `dice` Brasa · terco — «Podía bajar sola. Pero… gracias por subir.»
- `dice` Brasa · orgulloso — «Esto cayó a mi lado. Creo que es tuyo.» · `objeto` pieza (1.ª)
- `dice` Lumo · emocionado — «¡Una pieza de mi brújula! ¡Brilla más!» ♻ `c1_05_a` (texto nuevo, mismo id)
- `dice` Brasa · emocionado — «Desde aquí se ve el Faro. ¡Mándale un guiño!»
- `accion` Lumo y Brasa brillan: **corto, corto, largo** · `sonido` tema-faro · `espera` 2 s · `camara` al Faro · `objeto` faro (**R-1**: la ventana 2 se enciende y un destello débil responde)
- `dice` Lumo · emocionado — «¡El Faro me ha contestado! ¡Está despertando!»
- `dice` Brasa · alegre — «¡Pues no lo dejemos dormir!»

**CAP1-02 · Una lucecita para Bichito** — tras `CAP1-01` (~18 s) · fondo: cumbre de noche
- `camara` abajo, entre las rocas · `objeto` chispa (Bichito, gris, mirando el Faro, con frío)
- `dice` Lumo · tierno — «Bichito está solo y tiene frío.»
- `accion` Lumo deja una lucecita junto a Bichito · Bichito se sorprende, la acerca, sonríe · `sonido` risa suave
- `dice` Bichito · tierno — «¿Para mí? ¡Ji, ji!»
- `dice` Lumo · tierno — «Los fallos también necesitan abrigo.»

**CAP1-03 · Fin del capítulo 1 y avance** — tras `CAP1-02` (~15 s)
- Créditos breves: «Capítulo 1 · La primera luz» — Lumo, Búho Bruma, Titila, Brasa, Bichito. Insignia «Final de la aventura» para 1.º–2.º.
- Avance: `fondo` el mar al amanecer · `entra` Tinta (saluda desde una ola) · `dice` Tinta · alegre — «¡Lumo! ¡Tengo un mundo bajo el mar que enseñarte!»
- `dice` Lumo · emocionado — «¡Allá vamos! El Faro nos espera.»

### 9.4 Mundo 2 · Maestros del código

**C2-01 · Todo funciona con instrucciones** — antes de `m2-01` (~30 s) · fondo: taller submarino
- `entra` Lumo (en una burbuja; chapuzón y sacudida) · `entra` Tinta
- `dice` Tinta · alegre — «¡Bienvenido a mi taller! ¡Todo funciona con instrucciones!» ♻ `c2_01_a` (texto ampliado)
- `dice` Tinta · emocionado — «Construyo un camino de luz para los peces.»
- `dice` Lumo · alegre — «¡Qué bien! ¿Has visto a alguien de mi familia?»
- `dice` Tinta · alegre — «Destello juega por aquí. Se esconde muy bien.»
- `dice` Lumo · emocionado — «¡Pues a buscarlo! Primero, tu camino.»

**C2-02 · Una receta, muchas veces** — antes de `m2-11` (~22 s) · fondo: nichos de coral
- `dice` Lumo · ups — «Otro nicho, otra vez los mismos pasos…»
- `dice` Tinta · alegre — «Una receta se hace una vez y se usa muchas.» ♻ `c2_02_a`
- `accion` los pasos van a un frasco con una «A»; el frasco se usa en tres nichos
- `dice` Lumo · orgulloso — «¡Un frasco de pasos! Me gusta.»

**CAP2-A · Destello se esconde** — tras `m2-13` (~28 s) · fondo: grieta submarina
- `accion` Destello salta desde detrás de una roca (azul brillante) · `sonido` burbujas
- `dice` Destello · juguetón — «¡Te pillé! ¡Ahora te toca esconderte a ti!»
- `dice` Lumo · alegre — «¡Eres Destello! Soy Lumo. Tu familia te busca.»
- `dice` Destello · juguetón — «¿Mi familia? ¡Pues carrera hasta el Faro!»
- `camara` sigue su estela · `objeto` faro (se enciende la ventana 3)
- `dice` Lumo · orgulloso — «Otra ventana encendida. ¡Ya van tres!»

**TIN-2 · El camino de luz** — tras `CAP2-A` (~15 s)
- `dice` Tinta · emocionado — «¡Mi camino de luz está listo! ¡Mira cómo brilla!»
- `dice` Tinta · tierno — «Quédate el casco de buceo. Te llevará lejos.» *(solo si está desbloqueado)*
- `dice` Lumo · alegre — «Gracias, Tinta. ¡Hasta pronto!»

**C2-03 · El lagarto que no cabe** — antes de `m2-14` (~30 s) · fondo: isla volcánica canaria (roques, malpaís, cardones y tabaibas) · *Sustituye a la antigua `C2-03`, que hablaba de «empujar»: esa mecánica no existe.*
- `entra` Lumo (llega en barquita) · `entra` Lagarto gigante (ocupa media pantalla)
- `dice` Lagarto gigante · sereno — «Despacio, pequeño. Aquí la tierra aún está caliente.»
- `dice` Lumo · sorprendido — «¡Qué grande eres! ¿Vives aquí?»
- `dice` Lagarto gigante · sereno — «Cuido el corazón del volcán. Pero yo no quepo.»
- `dice` Lagarto gigante · tierno — «Dentro vive Ascua, de tu familia. Gruñe un poco.»
- `dice` Lumo · orgulloso — «¡Yo sí quepo! Déjamelo a mí.»

**B2-1 · Alguien nos sigue** (antes `C2-04`) — antes de `m2-17`, primer reto de depuración del volcán (~15 s)
- `dice` Lumo · concentrado — «Algo no encaja. ¿Dónde está el fallo?» ♻ `c2_04_a`
- `accion` Bichito asoma entre los roques, saluda con la mano y se esconde
- `dice` Lumo · alegre — «¡Bichito! Nos sigue de lejos. ¡Qué curioso!»

**B2-2 · El fallo que abrió un camino** — antes de `m2-22` (~18 s) · fondo: túneles del volcán
- `accion` un muro cierra el túnel · Bichito tropieza con una piedra · `accion` una grieta abre el muro
- `dice` Bichito · ups — «¡Uy! ¡Ji, ji, ji!»
- `dice` Lagarto gigante · divertido — «Vaya. Su tropiezo ha abierto un camino.»
- `dice` Lumo · emocionado — «¡A veces un fallo enseña algo nuevo!»

**CAP2-B · Ascua, la gruñona** — tras `m2-25` (~32 s) · fondo: el corazón del volcán, lava que late
- `objeto` chispa (Ascua, ceño fruncido, brazos cruzados)
- `dice` Ascua · gruñón — «¡Hmpf! He dicho que no quería ayuda.»
- `dice` Lumo · tierno — «Lo sé. Pero no me iba sin ti.»
- `accion` Ascua mira de reojo; el corazón del volcán late más fuerte · `sonido` latido
- `dice` Ascua · tierno — «…Gracias. Pero no se lo digas a nadie.»
- `camara` sigue su estela · `objeto` faro (se enciende la ventana 4) · `dice` Ascua · alegre — «¡Os espero en el Faro! ¡No tardéis!»

**CAP2-01 · El Faro contesta más fuerte** — tras `CAP2-B` (~30 s) · fondo: borde del volcán al amanecer
- `dice` Lagarto gigante · sereno — «Toma. Estas gafas protegen del calor del volcán.» *(regalo: gafas de soldador)*
- `dice` Lumo · alegre — «¡Me quedan genial! Gracias, Lagarto.»
- `accion` Lumo y el lagarto envían el guiño · `objeto` faro (**R-2**: responde corto, corto, más fuerte)
- `dice` Lumo · emocionado — «¡Contesta más fuerte! Casi dice la canción entera.»
- `dice` Lagarto gigante · sereno — «La luz tarda en llegar. Pero siempre llega.»

**CAP2-02 · La pieza que volvió** — tras `CAP2-01` (~18 s) · *Primera ayuda de Bichito.*
- `objeto` pieza (2.ª, sobre una roca) · `accion` Bichito asoma, tímido, y desaparece
- `dice` Lumo · sorprendido — «¡Una pieza de mi brújula! ¿Quién la dejó?»
- `dice` Lumo · tierno — «Gracias, Bichito. Cada fallo me ha enseñado algo.» ♻ `c2_05_a`

**CAP2-03 · Fin del capítulo 2 y avance** — tras `CAP2-02` (~15 s)
- Créditos breves: «Capítulo 2 · El corazón del volcán» — Tinta, Destello, Lagarto gigante, Ascua, Bichito. Insignia «Final de la aventura» para 3.º–4.º.
- Avance: `fondo` ciudad tecnológica lejana, luces tenues · `dice` Bit · literal — «Saludos. Detecto una chispa visitante. ¿Colaboramos?»
- `dice` Lumo · alegre — «¡Hola, Bit! ¡Vamos a tu ciudad!»

### 9.5 Mundo 3 · Expertos en algoritmos

**C3-01 · La ciudad sin energía** — antes de `m3-p1` (~30 s) · fondo: ciudad al anochecer, medio apagada
- `entra` Bit (se mueve en ángulos rectos)
- `dice` Bit · literal — «Saludos. Soy Bit. Esta ciudad está sin energía.»
- `dice` Lumo · alegre — «¡Hola, Bit! Yo busco a mi familia.»
- `dice` Bit · literal — «Mi vecina Píxel se perdió entre los cables.»
- `dice` Bit · literal — «Yo no sé improvisar. ¿Me enseñas?»
- `dice` Lumo · orgulloso — «Tú me enseñas a pensar. Yo, a improvisar.»

**C3-02 · Observa, decide, actúa** — antes de `m3-06`, primer *Mientras* (~25 s) · *Sustituye a la antigua `C3-02`, que hablaba de un sensor de «luz»: ese sensor no existe. Los sensores reales son: muro delante, vacío delante, objeto aquí, interruptor aquí y meta aquí.*
- `fondo` calle con un muro · `accion` Bit «mira» (aparece el icono del sensor de muro)
- `dice` Bit · literal — «Observa, decide, actúa.» ♻ `c3_01_a` (cambia de escena)
- `dice` Bit · concentrado — «Si no hay muro, avanzo. Si hay muro, giro.» ♻ `c3_02_a` (texto nuevo)
- `dice` Lumo · alegre — «¡Es una regla que decide por ti!»

**BI-3 · Bichito quiere ayudar** — antes de `m3-04` (~28 s) · fondo: taller de Bit
- `accion` Bichito pone números en el bucle, contento
- `dice` Bichito · ilusionado — «¡Yo cuento! ¡Uno, dos, siete, cuatro!»
- `dice` Bit · literal — «Error detectado. ¡Culpable: Bichito!»
- `dice` Lumo · concentrado — «No es culpable. Quería ayudar.»
- `dice` Bit · sorprendido — «Procesando… Acepto. Errar también es aprender.»

**CAP3-A · Píxel entre los cables** — tras `m3-13` (~28 s) · fondo: serpiente de cables enrollada
- `entra` Píxel (verde azulada, curiosa)
- `dice` Píxel · curioso — «¿Y esto? ¿Y eso? ¿Cómo funcionan los cables?»
- `dice` Bit · literal — «Píxel. Te busqué en 3.482 cables.»
- `dice` Lumo · alegre — «¡Es Píxel! Tu familia te echa de menos.»
- `dice` Píxel · curioso — «¿Mi familia? ¿Y dónde está? ¿Y cómo vamos?»
- `camara` sigue su estela · `objeto` faro (ventana 5) · `dice` Lumo · orgulloso — «Cinco ventanas. ¡Casi está!»

**C3-04 · Rumbo a la estación** (nueva; antes `C3-04`) — antes de `m3-14` (~20 s) · fondo: nave despegando, ciudad de cristal debajo
- `entra` Lumo y Bit (a bordo) · `sonido` despegue
- `dice` Bit · literal — «La señal de Cometa viene de la estación espacial.»
- `dice` Lumo · sorprendido — «¡Cometa! ¿Otra chispa de mi familia?»
- `dice` Bit · alegre — «Afirmativo. Y la nave tiene poca memoria.»

**BI-4a · Una chispa sin luz** — tras `m3-21` (~30 s) · fondo: estación espacial
- `objeto` chispa (Bichito, gris, flotando a la deriva) · `accion` Lumo mira la brújula; la aguja señala a Bichito y luego al Faro · `accion` Bichito brilla un instante y se apaga
- `dice` Bichito · sincero — «No quería romper nada. Solo estaba perdido.» ♻ `c3_03_a`
- `dice` Lumo · sorprendido — «¡Eres una chispa! La tormenta te apagó.»
- `dice` Bichito · sincero — «Lo desordeno todo buscando el camino a casa.»
- `dice` Lumo · tierno — «Tus fallos siempre apuntaban hacia el Faro.»

**BI-4b · Un amigo más** — tras `BI-4a` (~16 s)
- `dice` Lumo · tierno — «Los errores también necesitan amigos.» ♻ `c3_04_a`
- `dice` Lumo · alegre — «Ven con nosotros. ¡Encenderemos el Faro juntos!»
- `accion` Bichito salta de alegría · `dice` Bit · alegre — «Bichito, bienvenido. Te asigno el asiento de copiloto.»

**CAP3-B · Cometa y el reactor** — tras `m3-25` (~32 s) · fondo: reactor de la estación, estrellas tras el cristal
- `objeto` chispa (Cometa, lila, flotando) · `camara` acercamiento
- `dice` Cometa · soñador — «Shhh… escucha cómo bailan las estrellas.»
- `dice` Lumo · tierno — «Cometa, soy Lumo. Es hora de volver a casa.»
- `dice` Cometa · soñador — «¿A casa? Yo creía que el cielo era mi casa.»
- `camara` sigue su estela · `objeto` faro (ventana 6) · `objeto` pieza (3.ª)
- `dice` Bit · literal — «Reactor activo. Aquí tienes la tercera pieza.»
- `dice` Lumo · emocionado — «Ya casi está completa.» ♻ `c3_05_a`

**BIT-2 · La antena de Bit** — tras `CAP3-B` (~16 s)
- `dice` Bit · alegre — «Mi ciudad brillará cuando enciendas el Faro.»
- `dice` Bit · literal — «La antena te queda bien. Es tuya, para siempre.» *(solo si está desbloqueada)*
- `dice` Lumo · alegre — «¡Gracias, Bit! Has aprendido a improvisar.»

### 9.6 El Faro Mayor y el gran final (5.º–6.º)

**CF-01 · La brújula completa** — antes de `f-01` (~28 s; ♻ identificador, ahora con frases) · fondo: el Faro al amanecer gris, con seis ventanas encendidas
- `entra` Lumo, Bit y Bichito · `objeto` pieza (las tres se juntan) · `objeto` brújula (la aguja gira y apunta al Faro) · `sonido` tema-faro
- `dice` Lumo · emocionado — «Tres piezas. Una brújula entera.»
- `dice` Lumo · orgulloso — «Ya sé el camino. Subamos al Faro.»
- `dice` Bichito · ilusionado — «¡Ji! ¡Yo subo el primero!»

**CF-02 · Todos a sus puestos** — antes de `f-03` (~20 s; ♻ identificador, ahora con frases) · fondo: sala de la linterna
- `entra` las seis chispas (cada una junto a su ventana)
- `dice` Titila · tímido — «Yo… yo estoy lista.»
- `dice` Brasa · orgulloso — «¡Yo seré la primera en brillar!»
- `dice` Destello · juguetón — «¿Jugamos? ¡Un juego de luces!»
- `dice` Lumo · concentrado — «Falta el último paso. ¡Con todo lo que sabemos!»

**FIN-01 · El Faro se enciende** — tras `f-03` (~35 s, **escenificado**) · sustituye al antiguo `CF-03`
- `fondo` el Faro de noche, con nubes remanentes · `camara` plano general · `objeto` faro (apagado)
- `dice` Lumo · concentrado — «¡Ahora! ¡Que se encienda la luz!» · `objeto` brújula (brilla en el pecho) · `sonido` tema-faro (lento)
- `accion` **el haz barre el cielo**; las nubes se abren; **cae la noche estrellada** · `camara` sigue el haz
- `accion` **las chispas vuelven una a una** (Titila, Brasa, Destello, Ascua, Píxel, Cometa), cada una a su ventana
- `dice` Brasa · emocionado — «¡Lo hicimos! ¡Juntos!»
- `accion` el haz toca a Bichito: **recupera su luz** · `dice` Bichito · ilusionado — «¡Ji, ji! ¡Yo también brillo!»
- `dice` Lumo · tierno — «Sigues siendo Bichito. Y brillas.» · `accion` Bichito desordena la gorra de Lumo, travieso

**FIN-02 · La abuela Chispa** — tras `FIN-01` (~35 s) · sustituye al antiguo `CF-03` (emotivo)
- `fondo` la sala de la linterna · `entra` Abuela Chispa (sale de la luz)
- `dice` Abuela Chispa · serena — «Cada noche te enviaba mis guiños. Sabía que los reconocerías.» ♻ `cf_03_a` (texto: «destellos» → «guiños», decisión 1)
- `dice` Lumo · sorprendido — «Eran patrones… ¡los he aprendido!» ♻ `cf_03_b`
- `dice` Abuela Chispa · serena — «Nadie te ha dado el camino. Lo has encontrado tú, con cada error.» ♻ `cf_03_c`
- `accion` abrazar · `sonido` tema completo · `dice` Lumo · tierno — «Te he echado mucho de menos, abuela.»
- `dice` Abuela Chispa · tierna — «Esta corona es para quien enciende el Faro.» *(regalo: corona del Faro)*

**FIN-03 · Gracias por encender el Faro** — tras `FIN-02` (créditos, ~35 s; sustituye al antiguo `CF-04`) · un recuerdo por zona, cada uno con su frase
| Zona | Personajes | Recuerdo |
|---|---|---|
| Bosque encantado | Búho Bruma, Titila | «Las luciérnagas hablaban en orden.» |
| Reino de las montañas | Brasa | «Subir juntos es más divertido.» |
| Mundo submarino | Tinta, Destello | «Una receta se usa muchas veces.» |
| Isla volcánica | Lagarto gigante, Ascua | «Hasta un fallo puede abrir un camino.» |
| Ciudad tecnológica | Bit, Píxel | «Observa, decide, actúa.» |
| Mundo espacial | Cometa | «Los errores también necesitan amigos.» |
| El Faro Mayor | Abuela Chispa, Bichito | «Bichito: el fallo que volvió a brillar.» |

**FIN-04 · Ahora te toca a ti** — tras `FIN-03` (~20 s; sustituye al antiguo `CF-05`) · fondo: el Faro de noche estrellada
- `camara` pequeñas chispas llegan por el mar hacia el Faro
- `dice` Lumo · alegre — «Ahora te toca a ti guiar a otros.» ♻ `cf_05_a`
- `dice` Lumo · emocionado — «En el Laboratorio puedes crear tus propios retos.»
- El botón final lleva al **Laboratorio**.

### 9.7 «Antes, en RUMBO…» (quien empieza en el Mundo 2 o 3)

Se muestra **una vez** al entrar por primera vez en el Mundo 2 o 3 sin haber visto el capítulo anterior (`CAP1-03` o `CAP2-03`). Si se entra directo al Mundo 3 sin haber visto ninguno, solo se muestra `AR-3`, que ya lo resume todo.

**AR-2 · Antes, en RUMBO… (hasta el mar)** (~12 s) · montaje con fondo del mapa
- `dice` Lumo · normal — «Antes, en RUMBO: una tormenta apagó el Faro Mayor.» · `accion` flash de la tormenta
- `dice` Lumo · normal — «Mi brújula se rompió y mi familia se perdió.»
- `dice` Lumo · orgulloso — «Ya he encontrado a Titila y a Brasa.» · `objeto` faro (2 ventanas)
- `dice` Lumo · alegre — «Ahora toca el mar. ¿Me ayudas?»

**AR-3 · Antes, en RUMBO… (hasta la ciudad)** (~15 s)
- `dice` Lumo · normal — «Antes, en RUMBO: una tormenta apagó el Faro Mayor.»
- `dice` Lumo · normal — «Mi brújula se rompió. La voy reparando pieza a pieza.»
- `dice` Lumo · orgulloso — «Cuatro chispas de mi familia ya brillan en el Faro.» · `objeto` faro (4 ventanas)
- `dice` Lumo · alegre — «Y un amigo travieso, Bichito, nos sigue de lejos.»
- `dice` Lumo · emocionado — «Ahora toca la ciudad de Bit. ¿Me ayudas?»

---

## 10. Un final distinto por etapa

No se tocan `finalHecho` ni `FINAL_CURSO`: solo cambia **qué escenas se reproducen** en el último reto de cada curso. Infantil **nunca** ve escenas `CAP`, `CF` ni `FIN`.

| Curso | Último reto | Escenas que se reproducen | Qué cierra |
|---|---|---|---|
| 3 años | último de `i3` | `C0-02` | Conejo y la flor |
| 4 años | último de `i4` | `C0-03` | El camino de los animales |
| 5 años | último de `i5` | `C0-04` | Ve el Faro a lo lejos: historia abierta, sin pérdida |
| 1.º y 2.º | `m1-25` | `CAP1-01`, `CAP1-02`, `CAP1-03` | **Capítulo 1 · La primera luz**: 1.ª pieza, Titila y Brasa, el Faro responde |
| 3.º y 4.º | `m2-25` | `CAP2-B`, `CAP2-01`, `CAP2-02`, `CAP2-03` | **Capítulo 2 · El corazón del volcán**: 2.ª pieza, Destello y Ascua, 1.ª ayuda de Bichito |
| 5.º y 6.º | `f-03` | `FIN-01`, `FIN-02`, `FIN-03`, `FIN-04` | El gran final y el epílogo que abre el Laboratorio |

- Los capítulos se ven también en cursos superiores (un 5.º pasa por `CAP1` y `CAP2` camino del Faro): son parte de la historia, no solo un final.
- Todas las etapas conservan la insignia **«Final de la aventura»**, el disfraz «Corona del Faro» y la apertura del Laboratorio.
- **«Antes, en RUMBO…»** (§9.7) cubre a quien entra directo al Mundo 2 o 3.
- Todas las escenas se pueden **volver a ver desde el diario de Lumo** (§11).

### Tiempo de escena por curso (suma de las duraciones estimadas de cada escena; todas saltables)

| Curso | Escenas | Tiempo aprox. en toda la aventura |
|---|---|---|
| 3 años | `C0-01`, `GC-0`, `C0-02` | ≈ 45 s |
| 4 años | + `C0-03` | ≈ 1 min 5 s |
| 5 años | + `C0-04` | ≈ 1 min 25 s |
| 1.º–2.º | `BV-01…05`, `C1-01`, `C1-06`, `C1-03`, `C1-02`, `CAP1-A`, `BR-2`, `CAP1-01…03`, 3 `GC` | ≈ 4 min (+ la bienvenida) |
| 3.º–4.º | lo anterior + `AR-2`, `C2-01`, `C2-02`, `CAP2-A`, `TIN-2`, `C2-03`, `B2-1`, `B2-2`, `CAP2-B`, `CAP2-01…03` | ≈ 8 min |
| 5.º–6.º | todo + `C3-01`, `C3-02`, `BI-3`, `CAP3-A`, `C3-04`, `BI-4a/b`, `CAP3-B`, `BIT-2`, `CF-01`, `CF-02`, `FIN-01…04` | ≈ 15 min repartidos a lo largo de toda la aventura |

---

## 11. Victoria con historia y diario de Lumo

### 11.1 Pantalla de resultados

Primaria muestra, **bajo las estrellas**, una línea de avance narrativo (≤ 14 palabras) calculada con los retos de esa zona aún sin superar; Infantil no muestra texto, solo la celebración.

| Zona | Meta | Mientras faltan retos | Al llegar |
|---|---|---|---|
| Bosque | Titila | «Faltan {n} retos para llegar hasta Titila.» | «¡Has encontrado a Titila!» |
| Montañas | Brasa | «Faltan {n} retos para llegar hasta Brasa.» | «¡Has llegado a la cumbre con Brasa!» |
| Mar | Destello | «Faltan {n} retos para encontrar a Destello.» | «¡Has encontrado a Destello!» |
| Volcán | Ascua | «Faltan {n} retos para llegar hasta Ascua.» | «¡Has llegado al corazón del volcán!» |
| Ciudad | Píxel | «Faltan {n} retos para encontrar a Píxel.» | «¡Has encontrado a Píxel!» |
| Espacio | Cometa | «Faltan {n} retos para llegar hasta Cometa.» | «¡Has llegado a Cometa y al reactor!» |
| Faro | La luz | «Faltan {n} retos para encender el Faro.» | «¡El Faro está encendido!» |

- Con 1 reto: «**Falta 1 reto** para …». El texto no cuenta los calentamientos de la ciudad (`m3-p1…p5`) ni los secretos.
- **Celebración variada, sin azar:** se elige según el tipo de reto (normal, depurar, optimizar), las estrellas y la posición en la zona (rotación fija), así dos jugadores ven lo mismo. Variantes de baile de Lumo: salto con voltereta, giro con brújula, baile de zona (con el accesorio del disfraz), abrazo con el amigo de la zona. El **último reto de cada zona** y `f-03` tienen celebración propia (la chispa vuela al Faro).
- La victoria de una depuración muestra a **Bichito escabulléndose**, riéndose, sin burlarse del jugador.
- **El Faro en pequeño** aparece en la pantalla de resultados con la ventana nueva encendida.
- Nada de esto cambia estrellas, validación ni reglas.

### 11.2 El diario de Lumo (sustituye al «Álbum de recuerdos»)

Una página por chispa y por amigo. Cada página se desbloquea al superar un reto o ver una escena, **sin campos nuevos obligatorios** (los perfiles antiguos cargan igual: las páginas se calculan desde `vistos.escenas` y los retos superados). Tocar una página permite **volver a ver** su escena.

| Página | Se abre con | Texto (letra de Lumo) |
|---|---|---|
| Lumo y su brújula | siempre | «Soy Lumo, la chispa más pequeña de mi familia.» |
| Conejo | `i3-02` superado | «Conejo salta mucho. Y le encantan las zanahorias.» |
| Búho Bruma | `m1-13` | «Bruma habla poco. Pero siempre sabe dónde está el camino.» |
| Titila | `m1-13` | «Titila brilla con timidez. Su luz es la más suave.» |
| Brasa | `m1-25` | «Brasa dice que puede sola. Y casi siempre puede.» |
| Tinta | `m2-13` | «Tinta construye de todo. Hasta recetas de pasos.» |
| Destello | `m2-13` | «Destello se esconde muy bien. ¡Pero lo encontré!» |
| Lagarto gigante | `m2-25` | «El lagarto gigante es lento y sabio. Cuida el volcán.» |
| Ascua | `m2-25` | «Ascua gruñe mucho. Pero brilla más que nadie.» |
| Bit | `m3-25` | «Bit dice las cosas tal cual. Y aprende a improvisar.» |
| Píxel | `m3-13` | «Píxel pregunta todo. Así se aprende.» |
| Cometa | `m3-25` | «Cometa mira las estrellas. Dice que bailan.» |
| Bichito (5 dibujos) | `C1-02` → `FIN-01` | 1 «Me desordena las tarjetas. ¡Ji, ji!» · 2 «Nos sigue de lejos.» · 3 «Quiso ayudar y se equivocó.» · 4 «Es una chispa sin luz. Solo busca su casa.» · 5 «¡Ya brilla! Sigue siendo Bichito.» |
| La brújula | `CAP1-01` / `CAP2-02` / `CAP3-B` | 1 «Tengo una pieza. Faltan dos.» · 2 «Dos piezas. Falta una.» · 3 «¡Ya está completa!» |
| El guiño de luz | `G-01` | «Corto, corto, largo. ¿Quién me llama?» (tras `FIN-02`: «Era la abuela.») |
| Abuela Chispa | `FIN-02` | «Mi abuela me esperaba. Siempre me guiaba.» |

Infantil ve el diario con **dibujos y voz** (sin texto): Lumo, Conejo, los animales, el guiño. Sin chispas ni abuela.

---

## 12. Correcciones de continuidad (diagnóstico, punto 7)

| Error | Corrección |
|---|---|
| «Repetir tres veces» (`C1-04`) saltaba en `m1-14`, antes de `C1-03` | `C1-03` y `C1-04` se fusionan en una sola escena en `m1-15` (primer reto con *Repetir*); en `m1-14` solo salta `C1-06` (la voz de Brasa) |
| `C2-03` hablaba de «empujar» | Se reescribe: el lagarto no cabe en los túneles y presenta a Ascua |
| `C3-02` hablaba de un sensor de «luz» | Se reescribe con los sensores reales: «Si no hay muro, avanzo. Si hay muro, giro.» |
| `CF-01` y `CF-02` no tenían frases | Tienen frases y se muestran (antes de `f-01` y `f-03`) |
| `m1-21`: «cierra el paso al faro» en el Mundo 1 | Nueva intro: «Una puerta de hielo cierra el paso a la cumbre.» |
| Todos los cursos veían el mismo final | Un final por etapa (§10) |
| Los destellos de la abuela solo aparecían en el final | Guiños sembrados desde el primer reto (§6) |

---

## 13. Las 102 introducciones nuevas

Es el campo de introducción de cada reto. **No se cambian los objetivos (`o`), los mapas, las soluciones ni los identificadores.** Cada intro cuenta quién necesita qué y qué acaba de pasar; ninguna menciona una mecánica que no exista. La columna «Antes» sirve para comparar.

### Mundo 0 · Infantil (15)

| Reto | Zona | Antes | **Nueva introducción** |
|---|---|---|---|
| `i3-01` | Jardín | Lumo quiere oler una flor. | **Lumo ve una flor enorme. ¡Vamos a olerla!** |
| `i3-02` | Jardín | Lumo tiene mucha hambre. | **Conejo tiene hambre. Lumo busca su zanahoria.** |
| `i3-03` | Jardín | El árbol está arriba. | **El árbol está arriba. ¡Hay sombra fresquita!** |
| `i3-04` | Jardín | La casa está abajo. | **Conejo vive en la casita de abajo. ¡Vamos!** |
| `i3-05` | Jardín | Lumo ha encontrado una fruta. | **Una fruta rica para Conejo. Recógela y sigue.** |
| `i4-01` | Granja | El camino tiene una curva. | **El camino de la granja hace una curva.** |
| `i4-02` | Granja | Hay una zanahoria en medio. | **Una zanahoria en el camino. ¡Cógela!** |
| `i4-03` | Granja | Alguien ha movido las tarjetas. | **Un bichito travieso ha movido las tarjetas.** |
| `i4-04` | Granja | El agua está fría. | **El agua está fría. Rodéala sin mojarte.** |
| `i4-05` | Granja | Un camino pequeño con una sorpresa. | **Tras la curva hay una sorpresa.** |
| `i5-01` | Playa | Un cofre en la playa. | **Un cofre brillante en la playa. ¡Planea el camino!** |
| `i5-02` | Playa | Una tarjeta se ha caído. | **Una tarjeta se ha caído. ¿Cuál falta?** |
| `i5-03` | Playa | Lumo se ha equivocado de giro. | **Lumo se ha despistado con un giro.** |
| `i5-04` | Playa | Las conchas siguen un patrón. | **Las conchas siguen un patrón. ¡Míralas bien!** |
| `i5-05` | Playa | El tesoro está cerca. | **El tesoro está cerca. Recoge la concha.** |

### Mundo 1 · Primeros programadores (25)

| Reto | Zona | Antes | **Nueva introducción** |
|---|---|---|---|
| `m1-01` | Bosque | Lumo despierta en el bosque. Su brújula brilla poquito. | **Lumo ha caído en el bosque. Las luciérnagas señalan la puerta de luz.** |
| `m1-02` | Bosque | Las luciérnagas se han ido por el camino. | **Las luciérnagas se alejan hacia abajo. ¡Síguelas!** |
| `m1-03` | Bosque | Lumo se ha pasado de camino. | **Lumo se ha pasado de camino. Hay que volver un paso.** |
| `m1-04` | Bosque | El camino del bosque da una curva. | **Búho Bruma avisa de que el sendero gira. Lumo debe girar con él.** |
| `m1-05` | Bosque | Otra curva, pero hacia el otro lado. | **Bruma vuela delante. Esta curva va hacia el otro lado.** |
| `m1-06` | Bosque | El sendero zigzaguea entre los árboles. | **El sendero zigzaguea entre los árboles como una serpiente de luz.** |
| `m1-07` | Bosque | Lumo tiene que pensar desde su propio sitio. | **Desde donde mira Lumo, la puerta de luz queda a su izquierda.** |
| `m1-08` | Bosque | Lumo se ha dado la vuelta sin querer. | **Un ruido sorprende a Lumo y se da la vuelta. La puerta quedó atrás.** |
| `m1-09` | Bosque | Una luciérnaga está atrapada. | **Una luciérnaga se ha enredado en las ramas. Bruma pide ayuda.** |
| `m1-10` | Bosque | Siguen una detrás de otra. | **Dos luciérnagas más, una detrás de otra. ¡Bruma ya casi las tiene!** |
| `m1-11` | Bosque | La meta está arriba, pero la luz está en el camino. | **La última luciérnaga brilla en el camino. La puerta de luz está arriba.** |
| `m1-12` | Bosque | Un muro de piedra bloquea el camino. | **Un muro de piedra tapa el sendero. Bruma propone rodearlo.** |
| `m1-13` | Bosque | Un arroyo cruza el bosque. | **Un arroyo cruza el bosque. Al otro lado, una lucecita tímida espera.** |
| `m1-14` | Montañas | En las montañas, saltar será muy útil. | **Lumo sube a las montañas. Desde la cumbre alguien grita: «¡Yo puedo sola!»** |
| `m1-15` | Montañas | La escalera de piedra repite siempre lo mismo. | **La escalera de piedra repite siempre el mismo paso. Brasa sigue gritando.** |
| `m1-16` | Montañas | Cuatro luces en fila, igual que cuatro notas. | **Cuatro luces en fila suenan como cuatro notas de una canción.** |
| `m1-17` | Montañas | Hay piedras para cruzar el río, una sí y otra no. | **El río se cruza por piedras: una sí y otra no. ¡Hay un patrón!** |
| `m1-18` | Montañas | ¡Ji, ji! Bichito ha cambiado las tarjetas de sitio. | **Bichito se ríe, ha desordenado el programa de Lumo. ¡Ordénalo!** |
| `m1-19` | Montañas | Bichito ha cambiado un giro. | **Bichito se esconde tras una roca. Ha cambiado un giro.** |
| `m1-20` | Montañas | Bichito se ha comido una tarjeta. | **Bichito se ha llevado una tarjeta. Al programa le falta algo.** |
| `m1-21` | Montañas | Una puerta cierra el paso al faro. | **Una puerta de hielo cierra el paso a la cumbre. Hay un interruptor.** |
| `m1-22` | Montañas | El interruptor se esconde en un hueco. | **El interruptor se ha escondido en un hueco. Actívalo y regresa.** |
| `m1-23` | Montañas | En las montañas, las luces están sobre abismos. | **Las luces del camino flotan sobre abismos. Sus saltos repiten un ritmo.** |
| `m1-24` | Montañas | La brújula de Lumo cuenta mal. | **Bichito ha tocado el número de la repetición. ¡Ahora cuenta mal!** |
| `m1-25` | Montañas | La última escalera lleva a la cumbre. | **La última escalera lleva a la cumbre. Allí espera Brasa.** |

### Mundo 2 · Maestros del código (25)

| Reto | Zona | Antes | **Nueva introducción** |
|---|---|---|---|
| `m2-01` | Mar | Tinta ha construido un túnel submarino larguísimo. | **Tinta ha excavado un túnel larguísimo para sus máquinas.** |
| `m2-02` | Mar | El túnel tiene un codo. | **El túnel de Tinta hace un codo. Ella dibuja el plano con sus tentáculos.** |
| `m2-03` | Mar | Las escaleras de coral nunca se acaban. | **Las escaleras de coral de Tinta nunca se acaban. Siempre repiten lo mismo.** |
| `m2-04` | Mar | Un anillo de coral rodea la isla. | **Tinta rodea la isla con un anillo de coral. Tiene tres lados iguales.** |
| `m2-05` | Mar | Tinta dibuja el recorrido en la arena. | **Tinta dibuja el recorrido en la arena. Cada tramo mide distinto.** |
| `m2-06` | Mar | Las medusas brillan de dos en dos. | **Las perlas brillan de dos en dos, como las medusas. Tinta las necesita.** |
| `m2-07` | Mar | Perlas primero, corrientes después. | **Perlas primero, corrientes después. Tinta recoge y salta con Lumo.** |
| `m2-08` | Mar | Las dunas submarinas suben y bajan. | **Las dunas submarinas suben y bajan, suben y bajan. ¡Cuenta los zigzags!** |
| `m2-09` | Mar | Una puerta separa dos salas del barco hundido. | **Dentro del barco hundido hay dos salas y una puerta. Resuelve cada sala.** |
| `m2-10` | Mar | Cada nicho esconde una perla. | **Tinta guarda sus perlas en tres nichos. Cada visita es igual.** |
| `m2-11` | Mar | Tinta: «Una receta se hace una vez y se usa muchas». | **Tinta tiene un truco, guardar la visita al nicho en una receta.** |
| `m2-12` | Mar | Algunos nichos están por encima del camino. | **Algunos nichos están arriba y otros abajo. Hacen falta dos recetas.** |
| `m2-13` | Mar | La grieta es larga y tiene muchos nichos. | **La grieta tiene muchos nichos. En uno juega Destello, escondido.** |
| `m2-14` | Volcán | El lagarto gigante guarda una puerta de roca. | **El lagarto gigante guarda el volcán. Él no cabe en los túneles, pero Lumo sí.** |
| `m2-15` | Volcán | Dos obstáculos de lava, dos soluciones distintas. | **Lava y una barrera. El lagarto señala dos formas de pasar.** |
| `m2-16` | Volcán | El camino del volcán tiene de todo. | **Luz, interruptor, puerta y lava. El lagarto aconseja ir despacio, paso a paso.** |
| `m2-17` | Volcán | Bichito ha cambiado un número. | **Desde lejos, Bichito ha cambiado un número del bucle.** |
| `m2-18` | Volcán | Las medusas se esconden si se las busca tarde. | **Las gemas del volcán brillan y se esconden. Lumo pasa de largo sin recogerlas.** |
| `m2-19` | Volcán | Una perla sin recoger es una pista perdida. | **Lumo llega a la meta, pero deja gemas atrás. ¿Qué falta?** |
| `m2-20` | Volcán | Un fallo en una receta se repite cada vez que se usa. | **Bichito ha toqueteado la receta. Su fallo se repite cada vez que se usa.** |
| `m2-21` | Volcán | Tinta: «Un programa corto es un programa elegante». | **El programa funciona, pero es larguísimo. El lagarto pide uno más corto.** |
| `m2-22` | Volcán | El lagarto gigante: «Aquí las paredes mandan». | **El lagarto avisa de que en estos túneles aparecen paredes sin avisar.** |
| `m2-23` | Volcán | Los ríos de lava aparecen cada dos casillas. | **Los ríos de lava aparecen cada dos casillas. Lumo debe decidir sobre la marcha.** |
| `m2-24` | Volcán | Los túneles forman una espiral hacia el corazón del volcán. | **Los túneles forman una espiral hacia el corazón del volcán. Algo brilla dentro.** |
| `m2-25` | Volcán | El corazón del volcán late. ¡Último reto del mundo! | **El corazón del volcán late flojito. Allí gruñe Ascua: «¡Dejadme en paz!»** |

### Mundo 3 · Expertos en algoritmos (30)

| Reto | Zona | Antes | **Nueva introducción** |
|---|---|---|---|
| `m3-p1` | Ciudad | Bit enseña a Lumo las calles de la ciudad tecnológica. | **Bit, el robot de la ciudad, enseña sus calles a Lumo. ¡Primer paseo!** |
| `m3-p2` | Ciudad | Las calles tienen esquinas. | **En la ciudad todas las calles hacen esquina. Bit marca el giro.** |
| `m3-p3` | Ciudad | Hay paneles solares por recoger. | **Los paneles solares están apagados. Bit necesita dos para arrancar.** |
| `m3-p4` | Ciudad | Una calle recta y muy larga. | **Una calle recta y larguísima. ¿Cuántas tarjetas iguales harán falta?** |
| `m3-p5` | Ciudad | La calle hace una S. | **La calle hace una S con tres tramos. Bit cuenta cada uno.** |
| `m3-01` | Ciudad | Bit, el robot de la ciudad, ha construido una escalera con escalones largos. | **Bit ha construido una escalera de escalones largos. Hay dos cuentas a la vez.** |
| `m3-02` | Ciudad | Los paneles solares están en filas. Hay que recogerlos todos. | **Los paneles solares están en filas. Hay que recoger cada fila y volver.** |
| `m3-03` | Ciudad | La plaza central es un cuadrado enorme. | **La plaza central es un cuadrado enorme. Bit quiere recorrerla entera.** |
| `m3-04` | Ciudad | Bit se ha equivocado al contar. | **Bichito quiso ayudar a Bit a contar. Ahora el bucle de dentro cuenta mal.** |
| `m3-05` | Ciudad | Bit: «Si lo repites, ponlo en un bucle». | **Funciona, pero repite tres veces lo mismo. Bit propone un bucle.** |
| `m3-06` | Ciudad | Bit: «Observa, decide, actúa». | **Bit repite su lema, «observa, decide, actúa». Hoy toca avanzar mientras no haya muro.** |
| `m3-07` | Ciudad | La ciudad tiene un laberinto de calles. | **Bit conoce cada calle del laberinto, pero no sabe decidir en los cruces.** |
| `m3-08` | Ciudad | Hay baterías esparcidas por la calle. | **Hay baterías esparcidas por la calle. Bit las necesita todas.** |
| `m3-09` | Ciudad | La puerta del taller se abre con un interruptor. | **La puerta del taller de Bit solo se abre con un interruptor.** |
| `m3-10` | Ciudad | Unos huecos de energía cortan las calles. | **Unos huecos de energía cortan las calles. Hay que saltar o girar.** |
| `m3-11` | Ciudad | Bit: «Una función se escribe una vez». | **Bit quiere guardar «recoger una fila» en una receta para no repetirla.** |
| `m3-12` | Ciudad | Los cables forman una serpiente. | **Los cables de la ciudad forman una serpiente. Algo curioso se mueve dentro.** |
| `m3-13` | Ciudad | La serpiente de cables se ha enrollado. | **La serpiente de cables se ha enrollado. Una lucecita curiosa asoma entre ellos.** |
| `m3-14` | Espacio | La nave tiene poca memoria: solo caben unas pocas tarjetas. | **Bit y Lumo despegan hacia la estación. La nave tiene poca memoria.** |
| `m3-15` | Espacio | La torre de la estación espacial tiene escalones de dos pasos. | **La torre de la estación tiene escalones de dos pasos. Caben pocas tarjetas.** |
| `m3-16` | Espacio | Los anillos de la estación giran en espiral. | **Los anillos de la estación giran en espiral. Hay cuatro estrellas por recoger.** |
| `m3-17` | Espacio | Bit tiene el sensor mal conectado. | **Algo pequeño se mueve tras Bit, y su sensor no funciona.** |
| `m3-18` | Espacio | Un fallo escondido en una receta afecta a todo. | **Un fallo se esconde dentro de una receta. Estropea todos sus usos.** |
| `m3-19` | Espacio | Bit ha cruzado dos cables. | **Bit ha cruzado dos cables. Ahora «si» y «si no» hacen lo contrario.** |
| `m3-20` | Espacio | Bit se ha quedado esperando. | **Bit se ha quedado esperando, inmóvil. Algo falta en su decisión.** |
| `m3-21` | Espacio | La escalera tiene un escalón torcido. | **Un escalón de la torre está torcido. Ordena el interior del bucle grande.** |
| `m3-22` | Espacio | La ciudad de cristal brilla con baterías en las esquinas. | **En la ciudad de cristal hay baterías en cada esquina. Recógelas con un solo bucle.** |
| `m3-23` | Espacio | Para activar el reactor hay que cruzar el vacío. | **Para activar el reactor hay que cruzar un vacío. Después, un interruptor.** |
| `m3-24` | Espacio | Los anillos del reactor están sellados. | **Los anillos del reactor están sellados. Hay un interruptor y una puerta.** |
| `m3-25` | Espacio | Bit: «El faro me enseñó a pensar. Ahora te toca a ti». | **El reactor late al fondo. Cometa, la soñadora, mira las estrellas desde allí.** |

### El Faro Mayor (3)

| Reto | Zona | Antes | **Nueva introducción** |
|---|---|---|---|
| `f-01` | Faro | El Faro Mayor está dentro de una gran espiral. Su luz se apagó. | **Lumo y sus amigos llegan al Faro Mayor. Hay que subir por dentro.** |
| `f-02` | Faro | Las lentes del Faro se mueven con un gran mecanismo. | **Las lentes del Faro giran con un gran mecanismo. ¡Hay que ponerlo en marcha!** |
| `f-03` | Faro | Lumo está a punto de encender la luz. | **Lumo está a punto de encender la luz. Todos sus amigos esperan.** |

### Retos secretos (4)

| Reto | Zona | Antes | **Nueva introducción** |
|---|---|---|---|
| `sec-1` | Bosque | Un claro secreto del bosque. | **Las luciérnagas guardan un claro secreto. Sus luces forman un dibujo.** |
| `sec-2` | Mar | Una caverna escondida bajo el mar. | **Tinta esconde una caverna bajo el mar. Solo los más curiosos la encuentran.** |
| `sec-3` | Espacio | Una galaxia secreta con memoria escasa. | **Una galaxia secreta con muy poca memoria. Bit la recomienda para pensar mucho.** |
| `sec-4` | Faro | Detrás del Faro hay una sala que nadie conoce. | **Detrás del Faro hay una sala olvidada. Un mecanismo guarda un guiño de luz.** |

---

## 14. Qué no se toca y qué viene después

**No se toca:** intérprete, validador, reglas de estrellas, mapas, soluciones de referencia, identificadores de nivel, formato de los códigos de partida, `finalHecho`, `FINAL_CURSO` ni las condiciones de desbloqueo de disfraces e insignias. Los perfiles guardados siguen cargando (los campos nuevos tienen valor por defecto).

**Pedagogía intacta:** sin temporizadores, vidas, rachas, clasificaciones ni recompensas aleatorias; el error nunca se castiga; las estrellas no bloquean el avance; Infantil sigue sin texto.

**Fase 2 (cuando des el visto bueno):** pasar este guion a datos (`voces-es.js`, nuevo `src/datos/escenas.js`, campo `intro`, finales por etapa, «Antes, en RUMBO…») y añadir `pruebas/escenas.test.mjs` con las comprobaciones del prompt: toda escena usa frases y personajes que existen; todo disparador apunta a un nivel real; el orden de escenas de cada mundo es coherente; ninguna frase supera el límite; Infantil nunca ve escenas `CAP`/`CF`/`FIN`; cada curso tiene su final; y ninguna frase menciona una tarjeta que no exista en el intérprete.

**Riesgos que ya veo:**
- Las escenas que se solapan al terminar una zona (rescate de chispa + despedida + capítulo) son largas. Se reproducen encadenadas y **todas se saltan con un toque**; si en pruebas con alumnado resultan largas, se parte en «ver ahora / ver en el diario».
- La calidad de la voz del navegador cambia de un equipo a otro; el carácter por personaje (tono y velocidad) es solo un respaldo hasta que haya audios grabados.
- Un perfil antiguo que ya vio el final antiguo no verá automáticamente el nuevo: lo tendrá en el diario (decisión 6).
