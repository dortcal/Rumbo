# Recursos pendientes

Lo que el juego aún no trae y se puede añadir sin tocar el motor. Todo es opcional: el juego funciona sin ello.

## 1. Ilustraciones de escena (opcional)

Archivo: `historia/<id>.jpg` (16:9, 1600×900). **El motor de escenas aún no las carga** (los fondos son SVG propios): al encargarlas hay que añadir la carga en `src/ui/escena-motor.js`. Se listan las escenas con más peso emocional.

| Id | Título | Zona |
|---|---|---|
| C0-01 | Un vientazo en el valle | jardin |
| CAP1-A | La lucecita del arroyo | bosque |
| CAP1-01 | La primera luz | montanas |
| CAP2-A | Destello se esconde | mar |
| CAP2-B | Ascua, la gruñona | volcan |
| CAP3-A | Píxel entre los cables | ciudad |
| CAP3-B | Cometa y el reactor | espacio |
| BI-4a | Una chispa sin luz | espacio |
| CF-01 | La brújula completa | faro |
| FIN-01 | El Faro se enciende | faro |
| FIN-02 | La abuela Chispa | faro |
| FIN-03 | Gracias por encender el Faro | faro |
| FIN-04 | Ahora te toca a ti | faro |

## 2. Otros dibujos

- Rediseño de los personajes secundarios al estilo nuevo de Lumo y las chispas: Búho Bruma, Bichito (con 5 estados: travieso, de lejos, equivocado, sin luz, con luz), Tinta, lagarto gigante, Bit, Conejo, Abuela Chispa.
- Página propia de diario para las tres piezas de la brújula y para el guiño (hoy reutilizan a Lumo).
- Chispa en la casilla meta (variante del tablero) y gag de Bichito en Infantil sobre el tablero.

## 3. Guion de voz grabada

Archivo: `audio/voz/<id>.mp3` (mono, 44,1 kHz). **Aún no se cargan**: hoy se usa la voz del navegador con tono y ritmo por personaje (`src/audio/voz.js`). Frases de las escenas (Infantil ≤ 9 palabras; Primaria ≤ 14).

| Id | Quién | Texto |
|---|---|---|
| c0_01_a | Lumo (sorprendido) | ¡Uy! ¿Dónde estoy? |
| c0_01_b | Lumo (alegre) | Soy Lumo. ¿Me ayudas a moverme? |
| bv_01_a | Lumo (normal) | ¡Hola! Soy Lumo, una chispa curiosa y muy despistada. |
| bv_01_b | Lumo (normal) | Mi brújula se ha roto y me he perdido cerca del Faro Mayor. |
| bv_01_c | Lumo (normal) | Yo solo no sé encontrar el camino. ¡Necesito que me des órdenes! |
| bv_01_d | Lumo (normal) | Cada tarjeta es una orden. Las pones en fila y yo las sigo. |
| bv_01_e | Lumo (normal) | Cuando estén listas, pulsa el botón verde. |
| bv_01_f | Lumo (normal) | Si te atascas, toca la bombilla naranja. ¡Te echaré una mano! |
| bv_02_a | Lumo (normal) | ¡Muy bien! Ahora hacen falta dos pasos. |
| bv_02_b | Lumo (normal) | Las órdenes se cumplen una tras otra, en el mismo orden. |
| bv_03_a | Lumo (normal) | Mira bajo mis pies: la flecha amarilla indica hacia dónde miro. |
| bv_03_b | Lumo (normal) | Para cambiar de dirección tengo que girar. ¡Prueba la tarjeta de giro! |
| bv_04_a | Lumo (normal) | ¡Una fruta! Está justo en mi camino. |
| bv_04_b | Lumo (normal) | Primero la recojo y después sigo andando. El orden importa. |
| gc_0_a | Lumo (sorprendido) | ¡Mira! ¡Una luz que parpadea! |
| bv_05_a | Lumo (normal) | ¡Lo hemos conseguido! Ya sabes mover, girar y recoger. |
| bv_05_b | Lumo (normal) | Con estas tarjetas voy a arreglar mi brújula. |
| bv_05_c | Lumo (normal) | Más allá del bosque me espera el Faro Mayor. |
| bv_05_d | Lumo (normal) | Toda la aventura empieza ahora. ¿Vienes conmigo? |
| c0_02_a | Lumo (alegre) | ¡Lo conseguimos! Gracias, amigo. |
| c0_02_b | Lumo (tierno) | Tienes unas orejas muy suaves. |
| c0_03_b | Lumo (emocionado) | ¡Uno, dos, tres! ¡Qué buena fila! |
| c0_03_a | Lumo (orgulloso) | Primero uno, luego otro. ¡Así se llega! |
| c0_04_a | Lumo (tierno) | Mira, mi casa. |
| c0_04_b | Lumo (emocionado) | Tengo que llegar allí. |
| c1_01_b | Búho Bruma (sereno) | Hmm. Una chispa nueva en mi bosque. |
| c1_01_c | Lumo (ups) | Me he caído de lejos. ¡Busco a mi familia! |
| c1_01_a | Búho Bruma (sereno) | Las luciérnagas hablan en orden. Escucha su luz. |
| c1_01_d | Búho Bruma (tierno) | Una lucecita se ha perdido por aquí. Se llama Titila. |
| c1_01_e | Lumo (emocionado) | ¡Es de mi familia! Vamos a buscarla. |
| gc_1_a | Lumo (sorprendido) | Esa luz… parpadea como una canción. |
| cap1_a_a | Lumo (tierno) | Soy Lumo, de tu familia. Estás a salvo. |
| cap1_a_b | Titila (alegre) | ¡Brillo! ¡Hacía tanto que no brillaba! |
| cap1_a_c | Titila (alegre) | ¡Os espero en el Faro! |
| cap1_a_d | Lumo (orgulloso) | Una ventana encendida. ¡Queda más familia! |
| br_2_a | Búho Bruma (sereno) | Mis luciérnagas vuelven a casa. Gracias, pequeño. |
| br_2_b | Búho Bruma (tierno) | Te presté mi gorra de guía. Quédatela. |
| br_2_c | Lumo (orgulloso) | ¡Ahora soy un explorador de verdad! |
| c1_06_a | Brasa (terco) | ¡Eh, tú! No necesito ayuda para bajar. |
| c1_06_b | Lumo (alegre) | ¡Hola! Soy Lumo. ¿Eres de mi familia? |
| c1_06_c | Brasa (terco) | Soy Brasa. Y puedo sola. ¡Casi siempre! |
| c1_06_d | Lumo (tierno) | Subir juntos es más divertido. Voy ya. |
| c1_03_b | Lumo (ups) | Subir, subir, subir… ¡siempre igual! |
| c1_03_a | Lumo (concentrado) | ¿Y si repetimos este trozo? |
| c1_04_a | Lumo (orgulloso) | Repetir tres veces. ¡Así es más corto! |
| c1_02_a | Bichito (travieso) | ¡Ji, ji! ¿Quién ha movido las tarjetas? |
| c1_02_b | Lumo (sorprendido) | ¡Eh! ¿Quién eres tú? |
| c1_02_c | Lumo (concentrado) | Un fallo con patas. ¡Vamos a arreglarlo! |
| cap1_01_a | Brasa (terco) | Podía bajar sola. Pero… gracias por subir. |
| cap1_01_b | Brasa (orgulloso) | Esto cayó a mi lado. Creo que es tuyo. |
| c1_05_a | Lumo (emocionado) | ¡Una pieza de mi brújula! ¡Brilla más! |
| cap1_01_c | Brasa (emocionado) | Desde aquí se ve el Faro. ¡Mándale un guiño! |
| cap1_01_d | Lumo (emocionado) | ¡El Faro me ha contestado! ¡Está despertando! |
| cap1_01_e | Brasa (alegre) | ¡Pues no lo dejemos dormir! |
| cap1_02_a | Lumo (tierno) | Bichito está solo y tiene frío. |
| cap1_02_b | Bichito (tierno) | ¿Para mí? ¡Ji, ji! |
| cap1_02_c | Lumo (tierno) | Los fallos también necesitan abrigo. |
| cap1_03_a | Tinta (alegre) | ¡Lumo! ¡Tengo un mundo bajo el mar que enseñarte! |
| cap1_03_b | Lumo (emocionado) | ¡Allá vamos! El Faro nos espera. |
| ar_2_a | Lumo (normal) | Antes, en RUMBO: una tormenta apagó el Faro Mayor. |
| ar_2_b | Lumo (normal) | Mi brújula se rompió y mi familia se perdió. |
| ar_2_c | Lumo (orgulloso) | Ya he encontrado a Titila y a Brasa. |
| ar_2_d | Lumo (alegre) | Ahora toca el mar. ¿Me ayudas? |
| c2_01_a | Tinta (alegre) | ¡Bienvenido a mi taller! ¡Todo funciona con instrucciones! |
| c2_01_b | Tinta (emocionado) | Construyo un camino de luz para los peces. |
| c2_01_c | Lumo (alegre) | ¡Qué bien! ¿Has visto a alguien de mi familia? |
| c2_01_d | Tinta (alegre) | Destello juega por aquí. Se esconde muy bien. |
| c2_01_e | Lumo (emocionado) | ¡Pues a buscarlo! Primero, tu camino. |
| gc_2_a | Lumo (concentrado) | Otra vez esa luz. Corto, corto, largo. |
| c2_02_b | Lumo (ups) | Otro nicho, otra vez los mismos pasos… |
| c2_02_a | Tinta (alegre) | Una receta se hace una vez y se usa muchas. |
| c2_02_c | Lumo (orgulloso) | ¡Un frasco de pasos! Me gusta. |
| cap2_a_a | Lumo (alegre) | ¡Eres Destello! Soy Lumo. Tu familia te busca. |
| cap2_a_b | Lumo (orgulloso) | Otra ventana encendida. ¡Ya van tres! |
| tin_2_a | Tinta (emocionado) | ¡Mi camino de luz está listo! ¡Mira cómo brilla! |
| tin_2_b | Tinta (tierno) | Quédate el casco de buceo. Te llevará lejos. |
| tin_2_c | Lumo (alegre) | Gracias, Tinta. ¡Hasta pronto! |
| c2_03_a | Lagarto gigante (sereno) | Despacio, pequeño. Aquí la tierra aún está caliente. |
| c2_03_b | Lumo (sorprendido) | ¡Qué grande eres! ¿Vives aquí? |
| c2_03_c | Lagarto gigante (sereno) | Cuido el corazón del volcán. Pero yo no quepo. |
| c2_03_d | Lagarto gigante (tierno) | Dentro vive Ascua, de tu familia. Gruñe un poco. |
| c2_03_e | Lumo (orgulloso) | ¡Yo sí quepo! Déjamelo a mí. |
| c2_04_a | Lumo (concentrado) | Algo no encaja. ¿Dónde está el fallo? |
| b2_1_a | Lumo (alegre) | ¡Bichito! Nos sigue de lejos. ¡Qué curioso! |
| b2_2_a | Bichito (ups) | ¡Uy! ¡Ji, ji, ji! |
| b2_2_b | Lagarto gigante (divertido) | Vaya. Su tropiezo ha abierto un camino. |
| b2_2_c | Lumo (emocionado) | ¡A veces un fallo enseña algo nuevo! |
| cap2_b_a | Lumo (tierno) | Lo sé. Pero no me iba sin ti. |
| cap2_b_b | Ascua (tierno) | …Gracias. Pero no se lo digas a nadie. |
| cap2_b_c | Ascua (alegre) | ¡Os espero en el Faro! ¡No tardéis! |
| cap2_01_a | Lagarto gigante (sereno) | Toma. Estas gafas protegen del calor del volcán. |
| cap2_01_b | Lumo (alegre) | ¡Me quedan genial! Gracias, Lagarto. |
| cap2_01_c | Lumo (emocionado) | ¡Contesta más fuerte! Casi dice la canción entera. |
| cap2_01_d | Lagarto gigante (sereno) | La luz tarda en llegar. Pero siempre llega. |
| cap2_02_a | Lumo (sorprendido) | ¡Una pieza de mi brújula! ¿Quién la dejó? |
| c2_05_a | Lumo (tierno) | Gracias, Bichito. Cada fallo me ha enseñado algo. |
| cap2_03_a | Bit (literal) | Saludos. Detecto una chispa visitante. ¿Colaboramos? |
| cap2_03_b | Lumo (alegre) | ¡Hola, Bit! ¡Vamos a tu ciudad! |
| ar_3_a | Lumo (normal) | Antes, en RUMBO: una tormenta apagó el Faro Mayor. |
| ar_3_b | Lumo (normal) | Mi brújula se rompió. La voy reparando pieza a pieza. |
| ar_3_c | Lumo (orgulloso) | Cuatro chispas de mi familia ya brillan en el Faro. |
| ar_3_d | Lumo (alegre) | Y un amigo travieso, Bichito, nos sigue de lejos. |
| ar_3_e | Lumo (emocionado) | Ahora toca la ciudad de Bit. ¿Me ayudas? |
| c3_01_b | Bit (literal) | Saludos. Soy Bit. Esta ciudad está sin energía. |
| c3_01_c | Lumo (alegre) | ¡Hola, Bit! Yo busco a mi familia. |
| c3_01_d | Bit (literal) | Mi vecina Píxel se perdió entre los cables. |
| c3_01_e | Bit (literal) | Yo no sé improvisar. ¿Me enseñas? |
| c3_01_f | Lumo (orgulloso) | Tú me enseñas a pensar. Yo, a improvisar. |
| bi_3_a | Bichito (ilusionado) | ¡Yo cuento! ¡Uno, dos, siete, cuatro! |
| bi_3_b | Bit (literal) | Error detectado. ¡Culpable: Bichito! |
| bi_3_c | Lumo (concentrado) | No es culpable. Quería ayudar. |
| bi_3_d | Bit (sorprendido) | Procesando… Acepto. Errar también es aprender. |
| gc_3_a | Lumo (emocionado) | Corto, corto, largo. ¡Quiere decirme algo! |
| c3_01_a | Bit (literal) | Observa, decide, actúa. |
| c3_02_a | Bit (concentrado) | Si no hay muro, avanzo. Si hay muro, giro. |
| c3_02_b | Lumo (alegre) | ¡Es una regla que decide por ti! |
| cap3_a_a | Píxel (curioso) | ¿Y esto? ¿Y eso? ¿Cómo funcionan los cables? |
| cap3_a_b | Bit (literal) | Píxel. Te busqué en 3.482 cables. |
| cap3_a_c | Lumo (alegre) | ¡Es Píxel! Tu familia te echa de menos. |
| cap3_a_d | Píxel (curioso) | ¿Mi familia? ¿Y dónde está? ¿Y cómo vamos? |
| cap3_a_e | Lumo (orgulloso) | Cinco ventanas. ¡Casi está! |
| c3_04_b | Bit (literal) | La señal de Cometa viene de la estación espacial. |
| c3_04_c | Lumo (sorprendido) | ¡Cometa! ¿Otra chispa de mi familia? |
| c3_04_d | Bit (alegre) | Afirmativo. Y la nave tiene poca memoria. |
| c3_03_a | Bichito (sincero) | No quería romper nada. Solo estaba perdido. |
| bi_4a_a | Lumo (sorprendido) | ¡Eres una chispa! La tormenta te apagó. |
| bi_4a_b | Bichito (sincero) | Lo desordeno todo buscando el camino a casa. |
| bi_4a_c | Lumo (tierno) | Tus fallos siempre apuntaban hacia el Faro. |
| c3_04_a | Lumo (tierno) | Los errores también necesitan amigos. |
| bi_4b_a | Lumo (alegre) | Ven con nosotros. ¡Encenderemos el Faro juntos! |
| bi_4b_b | Bit (alegre) | Bichito, bienvenido. Te asigno el asiento de copiloto. |
| cap3_b_a | Cometa (soñador) | Shhh… escucha cómo bailan las estrellas. |
| cap3_b_b | Lumo (tierno) | Cometa, soy Lumo. Es hora de volver a casa. |
| cap3_b_c | Cometa (soñador) | ¿A casa? Yo creía que el cielo era mi casa. |
| cap3_b_d | Bit (literal) | Reactor activo. Aquí tienes la tercera pieza. |
| c3_05_a | Lumo (emocionado) | Ya casi está completa. |
| bit_2_a | Bit (alegre) | Mi ciudad brillará cuando enciendas el Faro. |
| bit_2_b | Bit (literal) | La antena te queda bien. Es tuya, para siempre. |
| bit_2_c | Lumo (alegre) | ¡Gracias, Bit! Has aprendido a improvisar. |
| cf_01_a | Lumo (emocionado) | Tres piezas. Una brújula entera. |
| cf_01_b | Lumo (orgulloso) | Ya sé el camino. Subamos al Faro. |
| cf_01_c | Bichito (ilusionado) | ¡Ji! ¡Yo subo el primero! |
| cf_02_a | Brasa (orgulloso) | ¡Yo seré la primera en brillar! |
| cf_02_b | Lumo (concentrado) | Falta el último paso. ¡Con todo lo que sabemos! |
| fin_01_a | Lumo (concentrado) | ¡Ahora! ¡Que se encienda la luz! |
| fin_01_b | Brasa (emocionado) | ¡Lo hicimos! ¡Juntos! |
| fin_01_c | Bichito (ilusionado) | ¡Ji, ji! ¡Yo también brillo! |
| fin_01_d | Lumo (tierno) | Sigues siendo Bichito. Y brillas. |
| cf_03_a | Abuela Chispa (serena) | Cada noche te enviaba mis guiños. Sabía que los reconocerías. |
| cf_03_b | Lumo (sorprendido) | Eran patrones… ¡los he aprendido! |
| cf_03_c | Abuela Chispa (serena) | Nadie te ha dado el camino. Lo has encontrado tú, con cada error. |
| fin_02_a | Lumo (tierno) | Te he echado mucho de menos, abuela. |
| fin_02_b | Abuela Chispa (tierna) | Esta corona es para quien enciende el Faro. |
| cf_05_a | Lumo (alegre) | Ahora te toca a ti guiar a otros. |
| fin_04_a | Lumo (emocionado) | En el Laboratorio puedes crear tus propios retos. |

Total: 155 frases de escena. Las consignas e introducciones de los niveles (`n_<id>`, `i_<id>`) y las pistas (`h1_…`) usan el mismo sistema.
