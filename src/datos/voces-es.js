/*
 * RUMBO — TODAS las frases de voz del juego, en un único archivo.
 *
 * Cada frase tiene un identificador estable. Los niveles y las cinemáticas solo
 * guardan el identificador, nunca el texto. Si algún día se graban o generan audios,
 * basta con asociarlos a estos mismos identificadores (ver audios en voz.js).
 *
 * Reglas de escritura:
 *   - Frases cortas (menos de 10 palabras), con puntuación que marque el ritmo.
 *   - Nunca se regaña por un error.
 *   - Infantil: la voz es la forma principal de instrucción. Primaria: es opcional.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RumboVoces = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var lineas = {
    // ---- Campaña 0: Infantil (solo voz e imagen) ----
    c0_01_a: { quien: 'Lumo', escena: 'C0-01', texto: '¡Uy! ¿Dónde estoy?' },
    c0_01_b: { quien: 'Lumo', escena: 'C0-01', texto: 'Soy Lumo. ¿Me ayudas a moverme?' },
    gc_0_a: { quien: 'Lumo', escena: 'GC-0', texto: '¡Mira! ¡Una luz que parpadea!' },
    c0_02_a: { quien: 'Lumo', escena: 'C0-02', texto: '¡Lo conseguimos! Gracias, amigo.' },
    c0_02_b: { quien: 'Lumo', escena: 'C0-02', texto: 'Tienes unas orejas muy suaves.' },
    c0_03_b: { quien: 'Lumo', escena: 'C0-03', texto: '¡Uno, dos, tres! ¡Qué buena fila!' },
    c0_03_a: { quien: 'Lumo', escena: 'C0-03', texto: 'Primero uno, luego otro. ¡Así se llega!' },
    c0_04_a: { quien: 'Lumo', escena: 'C0-04', texto: 'Mira, mi casa.' },
    c0_04_b: { quien: 'Lumo', escena: 'C0-04', texto: 'Tengo que llegar allí.' },

    // ---- Mundo 1: bosque y montañas ----
    c1_01_b: { quien: 'Búho Bruma', escena: 'C1-01', texto: 'Hmm. Una chispa nueva en mi bosque.' },
    c1_01_c: { quien: 'Lumo', escena: 'C1-01', texto: 'Me he caído de lejos. ¡Busco a mi familia!' },
    c1_01_a: { quien: 'Búho Bruma', escena: 'C1-01', texto: 'Las luciérnagas hablan en orden. Escucha su luz.' },
    c1_01_d: { quien: 'Búho Bruma', escena: 'C1-01', texto: 'Una lucecita se ha perdido por aquí. Se llama Titila.' },
    c1_01_e: { quien: 'Lumo', escena: 'C1-01', texto: '¡Es de mi familia! Vamos a buscarla.' },
    c1_06_a: { quien: 'Brasa', escena: 'C1-06', texto: '¡Eh, tú! No necesito ayuda para bajar.' },
    c1_06_b: { quien: 'Lumo', escena: 'C1-06', texto: '¡Hola! Soy Lumo. ¿Eres de mi familia?' },
    c1_06_c: { quien: 'Brasa', escena: 'C1-06', texto: 'Soy Brasa. Y puedo sola. ¡Casi siempre!' },
    c1_06_d: { quien: 'Lumo', escena: 'C1-06', texto: 'Subir juntos es más divertido. Voy ya.' },
    c1_03_b: { quien: 'Lumo', escena: 'C1-03', texto: 'Subir, subir, subir… ¡siempre igual!' },
    c1_03_a: { quien: 'Lumo', escena: 'C1-03', texto: '¿Y si repetimos este trozo?' },
    c1_04_a: { quien: 'Lumo', escena: 'C1-03', texto: 'Repetir tres veces. ¡Así es más corto!' },
    c1_02_a: { quien: 'Bichito', escena: 'C1-02', texto: '¡Ji, ji! ¿Quién ha movido las tarjetas?' },
    c1_02_b: { quien: 'Lumo', escena: 'C1-02', texto: '¡Eh! ¿Quién eres tú?' },
    c1_02_c: { quien: 'Lumo', escena: 'C1-02', texto: 'Un fallo con patas. ¡Vamos a arreglarlo!' },
    cap1_a_a: { quien: 'Lumo', escena: 'CAP1-A', texto: 'Soy Lumo, de tu familia. Estás a salvo.' },
    cap1_a_b: { quien: 'Titila', escena: 'CAP1-A', texto: '¡Brillo! ¡Hacía tanto que no brillaba!' },
    cap1_a_c: { quien: 'Titila', escena: 'CAP1-A', texto: '¡Os espero en el Faro!' },
    cap1_a_d: { quien: 'Lumo', escena: 'CAP1-A', texto: 'Una ventana encendida. ¡Queda más familia!' },
    br_2_a: { quien: 'Búho Bruma', escena: 'BR-2', texto: 'Mis luciérnagas vuelven a casa. Gracias, pequeño.' },
    br_2_b: { quien: 'Búho Bruma', escena: 'BR-2', texto: 'Te presté mi gorra de guía. Quédatela.' },
    br_2_c: { quien: 'Lumo', escena: 'BR-2', texto: '¡Ahora soy un explorador de verdad!' },
    cap1_01_a: { quien: 'Brasa', escena: 'CAP1-01', texto: 'Podía bajar sola. Pero… gracias por subir.' },
    cap1_01_b: { quien: 'Brasa', escena: 'CAP1-01', texto: 'Esto cayó a mi lado. Creo que es tuyo.' },
    c1_05_a: { quien: 'Lumo', escena: 'CAP1-01', texto: '¡Una pieza de mi brújula! ¡Brilla más!' },
    cap1_01_c: { quien: 'Brasa', escena: 'CAP1-01', texto: 'Desde aquí se ve el Faro. ¡Mándale un guiño!' },
    cap1_01_d: { quien: 'Lumo', escena: 'CAP1-01', texto: '¡El Faro me ha contestado! ¡Está despertando!' },
    cap1_01_e: { quien: 'Brasa', escena: 'CAP1-01', texto: '¡Pues no lo dejemos dormir!' },
    cap1_02_a: { quien: 'Lumo', escena: 'CAP1-02', texto: 'Bichito está solo y tiene frío.' },
    cap1_02_b: { quien: 'Bichito', escena: 'CAP1-02', texto: '¿Para mí? ¡Ji, ji!' },
    cap1_02_c: { quien: 'Lumo', escena: 'CAP1-02', texto: 'Los fallos también necesitan abrigo.' },
    cap1_03_a: { quien: 'Tinta', escena: 'CAP1-03', texto: '¡Lumo! ¡Tengo un mundo bajo el mar que enseñarte!' },
    cap1_03_b: { quien: 'Lumo', escena: 'CAP1-03', texto: '¡Allá vamos! El Faro nos espera.' },
    gc_1_a: { quien: 'Lumo', escena: 'GC-1', texto: 'Esa luz… parpadea como una canción.' },

    // ---- Mundo 2: mar y volcán ----
    c2_01_a: { quien: 'Tinta', escena: 'C2-01', texto: '¡Bienvenido a mi taller! ¡Todo funciona con instrucciones!' },
    c2_01_b: { quien: 'Tinta', escena: 'C2-01', texto: 'Construyo un camino de luz para los peces.' },
    c2_01_c: { quien: 'Lumo', escena: 'C2-01', texto: '¡Qué bien! ¿Has visto a alguien de mi familia?' },
    c2_01_d: { quien: 'Tinta', escena: 'C2-01', texto: 'Destello juega por aquí. Se esconde muy bien.' },
    c2_01_e: { quien: 'Lumo', escena: 'C2-01', texto: '¡Pues a buscarlo! Primero, tu camino.' },
    c2_02_b: { quien: 'Lumo', escena: 'C2-02', texto: 'Otro nicho, otra vez los mismos pasos…' },
    c2_02_a: { quien: 'Tinta', escena: 'C2-02', texto: 'Una receta se hace una vez y se usa muchas.' },
    c2_02_c: { quien: 'Lumo', escena: 'C2-02', texto: '¡Un frasco de pasos! Me gusta.' },
    cap2_a_a: { quien: 'Lumo', escena: 'CAP2-A', texto: '¡Eres Destello! Soy Lumo. Tu familia te busca.' },
    cap2_a_b: { quien: 'Lumo', escena: 'CAP2-A', texto: 'Otra ventana encendida. ¡Ya van tres!' },
    tin_2_a: { quien: 'Tinta', escena: 'TIN-2', texto: '¡Mi camino de luz está listo! ¡Mira cómo brilla!' },
    tin_2_b: { quien: 'Tinta', escena: 'TIN-2', texto: 'Quédate el casco de buceo. Te llevará lejos.' },
    tin_2_c: { quien: 'Lumo', escena: 'TIN-2', texto: 'Gracias, Tinta. ¡Hasta pronto!' },
    c2_03_a: { quien: 'Lagarto gigante', escena: 'C2-03', texto: 'Despacio, pequeño. Aquí la tierra aún está caliente.' },
    c2_03_b: { quien: 'Lumo', escena: 'C2-03', texto: '¡Qué grande eres! ¿Vives aquí?' },
    c2_03_c: { quien: 'Lagarto gigante', escena: 'C2-03', texto: 'Cuido el corazón del volcán. Pero yo no quepo.' },
    c2_03_d: { quien: 'Lagarto gigante', escena: 'C2-03', texto: 'Dentro vive Ascua, de tu familia. Gruñe un poco.' },
    c2_03_e: { quien: 'Lumo', escena: 'C2-03', texto: '¡Yo sí quepo! Déjamelo a mí.' },
    c2_04_a: { quien: 'Lumo', escena: 'B2-1', texto: 'Algo no encaja. ¿Dónde está el fallo?' },
    b2_1_a: { quien: 'Lumo', escena: 'B2-1', texto: '¡Bichito! Nos sigue de lejos. ¡Qué curioso!' },
    b2_2_a: { quien: 'Bichito', escena: 'B2-2', texto: '¡Uy! ¡Ji, ji, ji!' },
    b2_2_b: { quien: 'Lagarto gigante', escena: 'B2-2', texto: 'Vaya. Su tropiezo ha abierto un camino.' },
    b2_2_c: { quien: 'Lumo', escena: 'B2-2', texto: '¡A veces un fallo enseña algo nuevo!' },
    cap2_b_a: { quien: 'Lumo', escena: 'CAP2-B', texto: 'Lo sé. Pero no me iba sin ti.' },
    cap2_b_b: { quien: 'Ascua', escena: 'CAP2-B', texto: '…Gracias. Pero no se lo digas a nadie.' },
    cap2_b_c: { quien: 'Ascua', escena: 'CAP2-B', texto: '¡Os espero en el Faro! ¡No tardéis!' },
    cap2_01_a: { quien: 'Lagarto gigante', escena: 'CAP2-01', texto: 'Toma. Estas gafas protegen del calor del volcán.' },
    cap2_01_b: { quien: 'Lumo', escena: 'CAP2-01', texto: '¡Me quedan genial! Gracias, Lagarto.' },
    cap2_01_c: { quien: 'Lumo', escena: 'CAP2-01', texto: '¡Contesta más fuerte! Casi dice la canción entera.' },
    cap2_01_d: { quien: 'Lagarto gigante', escena: 'CAP2-01', texto: 'La luz tarda en llegar. Pero siempre llega.' },
    cap2_02_a: { quien: 'Lumo', escena: 'CAP2-02', texto: '¡Una pieza de mi brújula! ¿Quién la dejó?' },
    c2_05_a: { quien: 'Lumo', escena: 'CAP2-02', texto: 'Gracias, Bichito. Cada fallo me ha enseñado algo.' },
    cap2_03_a: { quien: 'Bit', escena: 'CAP2-03', texto: 'Saludos. Detecto una chispa visitante. ¿Colaboramos?' },
    cap2_03_b: { quien: 'Lumo', escena: 'CAP2-03', texto: '¡Hola, Bit! ¡Vamos a tu ciudad!' },
    ar_2_a: { quien: 'Lumo', escena: 'AR-2', texto: 'Antes, en RUMBO: una tormenta apagó el Faro Mayor.' },
    ar_2_b: { quien: 'Lumo', escena: 'AR-2', texto: 'Mi brújula se rompió y mi familia se perdió.' },
    ar_2_c: { quien: 'Lumo', escena: 'AR-2', texto: 'Ya he encontrado a Titila y a Brasa.' },
    ar_2_d: { quien: 'Lumo', escena: 'AR-2', texto: 'Ahora toca el mar. ¿Me ayudas?' },
    gc_2_a: { quien: 'Lumo', escena: 'GC-2', texto: 'Otra vez esa luz. Corto, corto, largo.' },

    // ---- Mundo 3: ciudad y espacio ----
    c3_01_b: { quien: 'Bit', escena: 'C3-01', texto: 'Saludos. Soy Bit. Esta ciudad está sin energía.' },
    c3_01_c: { quien: 'Lumo', escena: 'C3-01', texto: '¡Hola, Bit! Yo busco a mi familia.' },
    c3_01_d: { quien: 'Bit', escena: 'C3-01', texto: 'Mi vecina Píxel se perdió entre los cables.' },
    c3_01_e: { quien: 'Bit', escena: 'C3-01', texto: 'Yo no sé improvisar. ¿Me enseñas?' },
    c3_01_f: { quien: 'Lumo', escena: 'C3-01', texto: 'Tú me enseñas a pensar. Yo, a improvisar.' },
    c3_01_a: { quien: 'Bit', escena: 'C3-02', texto: 'Observa, decide, actúa.' },
    c3_02_a: { quien: 'Bit', escena: 'C3-02', texto: 'Si no hay muro, avanzo. Si hay muro, giro.' },
    c3_02_b: { quien: 'Lumo', escena: 'C3-02', texto: '¡Es una regla que decide por ti!' },
    bi_3_a: { quien: 'Bichito', escena: 'BI-3', texto: '¡Yo cuento! ¡Uno, dos, siete, cuatro!' },
    bi_3_b: { quien: 'Bit', escena: 'BI-3', texto: 'Error detectado. ¡Culpable: Bichito!' },
    bi_3_c: { quien: 'Lumo', escena: 'BI-3', texto: 'No es culpable. Quería ayudar.' },
    bi_3_d: { quien: 'Bit', escena: 'BI-3', texto: 'Procesando… Acepto. Errar también es aprender.' },
    cap3_a_a: { quien: 'Píxel', escena: 'CAP3-A', texto: '¿Y esto? ¿Y eso? ¿Cómo funcionan los cables?' },
    cap3_a_b: { quien: 'Bit', escena: 'CAP3-A', texto: 'Píxel. Te busqué en 3.482 cables.' },
    cap3_a_c: { quien: 'Lumo', escena: 'CAP3-A', texto: '¡Es Píxel! Tu familia te echa de menos.' },
    cap3_a_d: { quien: 'Píxel', escena: 'CAP3-A', texto: '¿Mi familia? ¿Y dónde está? ¿Y cómo vamos?' },
    cap3_a_e: { quien: 'Lumo', escena: 'CAP3-A', texto: 'Cinco ventanas. ¡Casi está!' },
    c3_04_b: { quien: 'Bit', escena: 'C3-04', texto: 'La señal de Cometa viene de la estación espacial.' },
    c3_04_c: { quien: 'Lumo', escena: 'C3-04', texto: '¡Cometa! ¿Otra chispa de mi familia?' },
    c3_04_d: { quien: 'Bit', escena: 'C3-04', texto: 'Afirmativo. Y la nave tiene poca memoria.' },
    c3_03_a: { quien: 'Bichito', escena: 'BI-4a', texto: 'No quería romper nada. Solo estaba perdido.' },
    bi_4a_a: { quien: 'Lumo', escena: 'BI-4a', texto: '¡Eres una chispa! La tormenta te apagó.' },
    bi_4a_b: { quien: 'Bichito', escena: 'BI-4a', texto: 'Lo desordeno todo buscando el camino a casa.' },
    bi_4a_c: { quien: 'Lumo', escena: 'BI-4a', texto: 'Tus fallos siempre apuntaban hacia el Faro.' },
    c3_04_a: { quien: 'Lumo', escena: 'BI-4b', texto: 'Los errores también necesitan amigos.' },
    bi_4b_a: { quien: 'Lumo', escena: 'BI-4b', texto: 'Ven con nosotros. ¡Encenderemos el Faro juntos!' },
    bi_4b_b: { quien: 'Bit', escena: 'BI-4b', texto: 'Bichito, bienvenido. Te asigno el asiento de copiloto.' },
    cap3_b_a: { quien: 'Cometa', escena: 'CAP3-B', texto: 'Shhh… escucha cómo bailan las estrellas.' },
    cap3_b_b: { quien: 'Lumo', escena: 'CAP3-B', texto: 'Cometa, soy Lumo. Es hora de volver a casa.' },
    cap3_b_c: { quien: 'Cometa', escena: 'CAP3-B', texto: '¿A casa? Yo creía que el cielo era mi casa.' },
    cap3_b_d: { quien: 'Bit', escena: 'CAP3-B', texto: 'Reactor activo. Aquí tienes la tercera pieza.' },
    c3_05_a: { quien: 'Lumo', escena: 'CAP3-B', texto: 'Ya casi está completa.' },
    bit_2_a: { quien: 'Bit', escena: 'BIT-2', texto: 'Mi ciudad brillará cuando enciendas el Faro.' },
    bit_2_b: { quien: 'Bit', escena: 'BIT-2', texto: 'La antena te queda bien. Es tuya, para siempre.' },
    bit_2_c: { quien: 'Lumo', escena: 'BIT-2', texto: '¡Gracias, Bit! Has aprendido a improvisar.' },
    ar_3_a: { quien: 'Lumo', escena: 'AR-3', texto: 'Antes, en RUMBO: una tormenta apagó el Faro Mayor.' },
    ar_3_b: { quien: 'Lumo', escena: 'AR-3', texto: 'Mi brújula se rompió. La voy reparando pieza a pieza.' },
    ar_3_c: { quien: 'Lumo', escena: 'AR-3', texto: 'Cuatro chispas de mi familia ya brillan en el Faro.' },
    ar_3_d: { quien: 'Lumo', escena: 'AR-3', texto: 'Y un amigo travieso, Bichito, nos sigue de lejos.' },
    ar_3_e: { quien: 'Lumo', escena: 'AR-3', texto: 'Ahora toca la ciudad de Bit. ¿Me ayudas?' },
    gc_3_a: { quien: 'Lumo', escena: 'GC-3', texto: 'Corto, corto, largo. ¡Quiere decirme algo!' },

    // ---- El Faro Mayor y el gran final ----
    cf_01_a: { quien: 'Lumo', escena: 'CF-01', texto: 'Tres piezas. Una brújula entera.' },
    cf_01_b: { quien: 'Lumo', escena: 'CF-01', texto: 'Ya sé el camino. Subamos al Faro.' },
    cf_01_c: { quien: 'Bichito', escena: 'CF-01', texto: '¡Ji! ¡Yo subo el primero!' },
    cf_02_a: { quien: 'Brasa', escena: 'CF-02', texto: '¡Yo seré la primera en brillar!' },
    cf_02_b: { quien: 'Lumo', escena: 'CF-02', texto: 'Falta el último paso. ¡Con todo lo que sabemos!' },
    fin_01_a: { quien: 'Lumo', escena: 'FIN-01', texto: '¡Ahora! ¡Que se encienda la luz!' },
    fin_01_b: { quien: 'Brasa', escena: 'FIN-01', texto: '¡Lo hicimos! ¡Juntos!' },
    fin_01_c: { quien: 'Bichito', escena: 'FIN-01', texto: '¡Ji, ji! ¡Yo también brillo!' },
    fin_01_d: { quien: 'Lumo', escena: 'FIN-01', texto: 'Sigues siendo Bichito. Y brillas.' },
    cf_03_a: { quien: 'Abuela Chispa', escena: 'FIN-02', texto: 'Cada noche te enviaba mis guiños. Sabía que los reconocerías.' },
    cf_03_b: { quien: 'Lumo', escena: 'FIN-02', texto: 'Eran patrones… ¡los he aprendido!' },
    cf_03_c: { quien: 'Abuela Chispa', escena: 'FIN-02', texto: 'Nadie te ha dado el camino. Lo has encontrado tú, con cada error.' },
    fin_02_a: { quien: 'Lumo', escena: 'FIN-02', texto: 'Te he echado mucho de menos, abuela.' },
    fin_02_b: { quien: 'Abuela Chispa', escena: 'FIN-02', texto: 'Esta corona es para quien enciende el Faro.' },
    cf_05_a: { quien: 'Lumo', escena: 'FIN-04', texto: 'Ahora te toca a ti guiar a otros.' },
    fin_04_a: { quien: 'Lumo', escena: 'FIN-04', texto: 'En el Laboratorio puedes crear tus propios retos.' },

    // ---- Aventura de bienvenida (para Primaria; Infantil usa las escenas C0) ----
    bv_01_a: { quien: 'Lumo', escena: 'BV-01', texto: '¡Hola! Soy Lumo, una chispa curiosa y muy despistada.' },
    bv_01_b: { quien: 'Lumo', escena: 'BV-01', texto: 'Mi brújula se ha roto y me he perdido cerca del Faro Mayor.' },
    bv_01_c: { quien: 'Lumo', escena: 'BV-01', texto: 'Yo solo no sé encontrar el camino. ¡Necesito que me des órdenes!' },
    bv_01_d: { quien: 'Lumo', escena: 'BV-01', texto: 'Cada tarjeta es una orden. Las pones en fila y yo las sigo.' },
    bv_01_e: { quien: 'Lumo', escena: 'BV-01', texto: 'Cuando estén listas, pulsa el botón verde.' },
    bv_01_f: { quien: 'Lumo', escena: 'BV-01', texto: 'Si te atascas, toca la bombilla naranja. ¡Te echaré una mano!' },
    bv_02_a: { quien: 'Lumo', escena: 'BV-02', texto: '¡Muy bien! Ahora hacen falta dos pasos.' },
    bv_02_b: { quien: 'Lumo', escena: 'BV-02', texto: 'Las órdenes se cumplen una tras otra, en el mismo orden.' },
    bv_03_a: { quien: 'Lumo', escena: 'BV-03', texto: 'Mira bajo mis pies: la flecha amarilla indica hacia dónde miro.' },
    bv_03_b: { quien: 'Lumo', escena: 'BV-03', texto: 'Para cambiar de dirección tengo que girar. ¡Prueba la tarjeta de giro!' },
    bv_04_a: { quien: 'Lumo', escena: 'BV-04', texto: '¡Una fruta! Está justo en mi camino.' },
    bv_04_b: { quien: 'Lumo', escena: 'BV-04', texto: 'Primero la recojo y después sigo andando. El orden importa.' },
    bv_05_a: { quien: 'Lumo', escena: 'BV-05', texto: '¡Lo hemos conseguido! Ya sabes mover, girar y recoger.' },
    bv_05_b: { quien: 'Lumo', escena: 'BV-05', texto: 'Con estas tarjetas voy a arreglar mi brújula.' },
    bv_05_c: { quien: 'Lumo', escena: 'BV-05', texto: 'Más allá del bosque me espera el Faro Mayor.' },
    bv_05_d: { quien: 'Lumo', escena: 'BV-05', texto: 'Toda la aventura empieza ahora. ¿Vienes conmigo?' },

    // ---- Instrucciones de Infantil (voz + imagen) ----
    in_tarjeta: { quien: 'Lumo', texto: 'Pulsa una tarjeta.' },
    in_ejecutar: { quien: 'Lumo', texto: 'Ahora pulsa el botón verde.' },
    in_mira: { quien: 'Lumo', texto: 'Mira lo que hago.' },
    in_probar: { quien: 'Lumo', texto: 'Vamos a probar otra vez.' },

    // ---- Respuesta a errores: positiva y con pistas progresivas ----
    fb_casi: { quien: 'Lumo', texto: '¡Casi lo consigues!' },
    fb_orden: { quien: 'Lumo', texto: '¿Has comprobado el orden de las instrucciones?' },
    fb_giro: { quien: 'Lumo', texto: 'Creo que nos hemos equivocado en este giro.' },
    fb_repetir: { quien: 'Lumo', texto: '¿Y si repetimos esta secuencia?' },
    fb_choque: { quien: 'Lumo', texto: '¡Ups! Ahí hay algo. Probemos otro camino.' },
    fb_caida: { quien: 'Lumo', texto: '¡Splash! El agua está fría. ¿Saltamos?' },
    fb_objeto: { quien: 'Lumo', texto: 'Me he dejado algo por el camino.' },
    fb_corto: { quien: 'Lumo', texto: 'Todavía me falta un poquito de camino.' },
    fb_infinito: { quien: 'Lumo', texto: 'Estoy dando vueltas. Revisemos la repetición.' },
    fb_vacio: { quien: 'Lumo', texto: 'Pon alguna tarjeta y pulsa el botón verde.' },
    fb_receta: { quien: 'Lumo', texto: 'Esa receta todavía está vacía.' },
    fb_solucion: { quien: 'Lumo', texto: 'Mira cómo lo haría yo. Luego pruébalo tú.' },
    fb_pista: { quien: 'Lumo', texto: 'Te doy una pista.' },

    // ---- Celebraciones ----
    ok_1: { quien: 'Lumo', texto: '¡Lo conseguimos!' },
    ok_2: { quien: 'Lumo', texto: '¡Qué bien lo has pensado!' },
    ok_3: { quien: 'Lumo', texto: '¡Increíble! Casi no hacían falta tarjetas.' }
  };

  return { version: 1, lineas: lineas };
});
