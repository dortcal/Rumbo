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
    // ---- Campaña 0: Infantil ----
    c0_01_a: { quien: 'Lumo', escena: 'C0-01', texto: '¡Uy! ¿Dónde estoy?' },
    c0_01_b: { quien: 'Lumo', escena: 'C0-01', texto: 'Soy Lumo. ¿Me ayudas a moverme?' },
    c0_02_a: { quien: 'Lumo', escena: 'C0-02', texto: '¡Lo conseguimos! Gracias, amigo.' },
    c0_03_a: { quien: 'Lumo', escena: 'C0-03', texto: 'Primero uno, luego otro. ¡Así se llega!' },
    c0_04_a: { quien: 'Lumo', escena: 'C0-04', texto: 'Mira, mi casa.' },
    c0_04_b: { quien: 'Lumo', escena: 'C0-04', texto: 'Tengo que llegar allí.' },

    // ---- Campaña 1 ----
    c1_01_a: { quien: 'Búho Bruma', escena: 'C1-01', texto: 'Las luciérnagas hablan en orden. Escucha su luz.' },
    c1_02_a: { quien: 'Bichito', escena: 'C1-02', texto: '¡Ji, ji! ¿Quién ha movido las tarjetas?' },
    c1_03_a: { quien: 'Lumo', escena: 'C1-03', texto: '¿Y si repetimos este trozo?' },
    c1_04_a: { quien: 'Lumo', escena: 'C1-04', texto: 'Repetir tres veces. ¡Así es más corto!' },
    c1_05_a: { quien: 'Lumo', escena: 'C1-05', texto: 'La brújula brilla un poquito más.' },

    // ---- Campaña 2 ----
    c2_01_a: { quien: 'Tinta', escena: 'C2-01', texto: '¡Todo funciona con instrucciones!' },
    c2_02_a: { quien: 'Tinta', escena: 'C2-02', texto: 'Una receta se hace una vez y se usa muchas.' },
    c2_03_a: { quien: 'Lagarto gigante', escena: 'C2-03', texto: 'Aquí las piedras se mueven. Piensa antes de empujar.' },
    c2_04_a: { quien: 'Lumo', escena: 'C2-04', texto: 'Algo no encaja. ¿Dónde está el fallo?' },
    c2_05_a: { quien: 'Lumo', escena: 'C2-05', texto: 'Cada fallo me ha enseñado algo.' },

    // ---- Campaña 3 ----
    c3_01_a: { quien: 'Bit', escena: 'C3-01', texto: 'Observa, decide, actúa.' },
    c3_02_a: { quien: 'Bit', escena: 'C3-02', texto: 'Si hay luz, avanza. Si no, espera.' },
    c3_03_a: { quien: 'Bichito', escena: 'C3-03', texto: 'No quería romper nada. Solo estaba perdido.' },
    c3_04_a: { quien: 'Lumo', escena: 'C3-04', texto: 'Los errores también necesitan amigos.' },
    c3_05_a: { quien: 'Lumo', escena: 'C3-05', texto: 'Ya casi está completa.' },

    // ---- Final ----
    cf_03_a: { quien: 'Abuela Chispa', escena: 'CF-03', texto: 'Cada noche te enviaba mis destellos. Sabía que los reconocerías.' },
    cf_03_b: { quien: 'Lumo', escena: 'CF-03', texto: 'Eran patrones… ¡los he aprendido!' },
    cf_03_c: { quien: 'Abuela Chispa', escena: 'CF-03', texto: 'Nadie te ha dado el camino. Lo has encontrado tú, con cada error.' },
    cf_05_a: { quien: 'Lumo', escena: 'CF-05', texto: 'Ahora te toca a ti guiar a otros.' },

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
