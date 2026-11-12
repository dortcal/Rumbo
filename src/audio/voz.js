/*
 * RUMBO — Capa de voz.
 *
 * Orden de preferencia para cada frase (por identificador):
 *   1. Audio grabado, si existe en el mapa `audios` (id → URL).
 *   2. Voz sintética del navegador: se elige AUTOMÁTICAMENTE la mejor voz en español
 *      disponible en el equipo.
 *   3. Sin voz: se devuelve el texto para mostrarlo como subtítulo.
 * El juego nunca depende de la voz para lo esencial.
 *
 * LÍMITES CONOCIDOS (no se pueden resolver desde el código)
 *   - Las voces disponibles dependen del equipo. En Chrome algunas voces "Google" son
 *     de red y no funcionan sin conexión; el selector las descarta si no hay conexión.
 *   - Chrome exige una interacción previa del usuario (un toque o clic) antes de hablar.
 *   - Los navegadores cargan la lista de voces de forma asíncrona.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('../datos/voces-es.js'));
    module.exports = api;
  } else {
    root.RumboVoz = factory(root.RumboVoces);
  }
})(typeof self !== 'undefined' ? self : this, function (VOCES) {
  'use strict';

  function normalizarLang(l) {
    return String(l || '').replace('_', '-').toLowerCase();
  }

  function esEspanol(lang) {
    return lang === 'es' || lang.indexOf('es-') === 0;
  }

  // Puntúa una voz. -Infinity = inutilizable.
  function puntuarVoz(v, ctx) {
    var lang = normalizarLang(v.lang);
    if (!esEspanol(lang)) return -Infinity;
    if (!v.localService && !ctx.enLinea) return -Infinity;

    var p = 0;
    if (lang === 'es-es') p += 60;
    else if (lang === 'es-mx' || lang === 'es-us' || lang === 'es-419') p += 30;
    else p += 20;

    var n = String(v.name || '').toLowerCase();
    if (/natural|neural/.test(n)) p += 50;
    if (/online/.test(n)) p += 20;
    if (/google/.test(n)) p += 25;
    if (/microsoft/.test(n)) p += 10;
    if (/espeak/.test(n)) p -= 60;
    if (/compact/.test(n)) p -= 25;
    if (v.default) p += 5;
    return p;
  }

  // Devuelve la mejor voz de la lista, o null si no hay ninguna en español utilizable.
  function elegirVoz(lista, opciones) {
    opciones = opciones || {};
    var ctx = { enLinea: opciones.enLinea !== false };
    var mejor = null;
    var mejorP = -Infinity;
    for (var i = 0; i < (lista || []).length; i++) {
      var v = lista[i];
      var p = puntuarVoz(v, ctx);
      if (p === -Infinity) continue;
      if (opciones.preferida && v.name === opciones.preferida) return v;
      if (p > mejorP || (p === mejorP && mejor && String(v.name) < String(mejor.name))) {
        mejor = v;
        mejorP = p;
      }
    }
    return mejor;
  }

  // Carácter de cada voz: la voz sintética es la misma, pero cada personaje cambia de tono (pitch) y ritmo (vel).
  // Multiplican al tono base (1.05) y a la velocidad pedida. Con opciones.caracter=true se aplican; la emoción añade un matiz.
  var PERFILES = {
    'Lumo': { tono: 1.2, vel: 1.0 },
    'Abuela Chispa': { tono: 0.8, vel: 0.85 },
    'Búho Bruma': { tono: 0.55, vel: 0.8 },
    'Bichito': { tono: 1.85, vel: 1.2 },
    'Tinta': { tono: 1.3, vel: 1.05 },
    'Lagarto gigante': { tono: 0.5, vel: 0.78 },
    'Bit': { tono: 0.95, vel: 1.1 },
    'Conejo': { tono: 1.6, vel: 1.15 },
    'Titila': { tono: 1.35, vel: 1.0 },
    'Brasa': { tono: 1.0, vel: 1.1 },
    'Destello': { tono: 1.5, vel: 1.1 },
    'Ascua': { tono: 0.85, vel: 1.0 },
    'Píxel': { tono: 1.4, vel: 1.2 },
    'Cometa': { tono: 1.1, vel: 0.95 }
  };
  var MATICES = {
    alegre: [0.08, 1.05], emocionado: [0.12, 1.1], sorprendido: [0.15, 1.05], ups: [0.1, 1.05], orgulloso: [-0.05, 0.95],
    tierno: [-0.05, 0.9], tierna: [-0.05, 0.9], sereno: [-0.08, 0.88], serena: [-0.08, 0.88], concentrado: [-0.05, 0.95], travieso: [0.1, 1.1]
  };
  // Devuelve {tono, vel} para un personaje y una emoción (valores relativos; 1 = sin cambio).
  function perfilDeVoz(quien, emocion) {
    var P = PERFILES[quien] || { tono: 1, vel: 1 }, M = MATICES[emocion] || [0, 1];
    var tono = Math.max(0.1, Math.min(2, P.tono + M[0])), vel = Math.max(0.5, Math.min(1.6, P.vel * M[1]));
    return { tono: Math.round(tono * 100) / 100, vel: Math.round(vel * 100) / 100 };
  }

  // entorno: { synth, Utterance, voces, enLinea: fn, audios: {id: url}, Audio }
  function crearVoz(entorno) {
    entorno = entorno || {};
    var synth = entorno.synth || null;
    var Utterance = entorno.Utterance || null;
    var lineas = (entorno.voces || VOCES || {}).lineas || {};
    var audios = entorno.audios || {};
    var AudioCtor = entorno.Audio || null;
    var estaEnLinea = entorno.enLinea || function () { return true; };

    var elegida = null;
    var preferida = null;
    var audioActual = null;

    function refrescar() {
      var lista = synth && synth.getVoices ? synth.getVoices() : [];
      elegida = elegirVoz(lista, { enLinea: estaEnLinea(), preferida: preferida });
      return elegida;
    }

    if (synth && typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', refrescar);
    }
    refrescar();

    function parar() {
      if (synth && synth.cancel) synth.cancel();
      if (audioActual && audioActual.pause) audioActual.pause();
      audioActual = null;
    }

    // Devuelve { modo: 'audio' | 'voz' | 'subtitulo', texto, voz } o null si el id no existe.
    function decir(id, opciones) {
      opciones = opciones || {};
      var linea = lineas[id];
      if (!linea) return null;
      parar();

      if (audios[id] && AudioCtor) {
        audioActual = new AudioCtor(audios[id]);
        if (opciones.alTerminar) audioActual.onended = opciones.alTerminar;
        if (audioActual.play) audioActual.play();
        return { modo: 'audio', texto: linea.texto, voz: null };
      }

      if (!elegida) refrescar();
      if (synth && Utterance && elegida) {
        var u = new Utterance(linea.texto);
        u.voice = elegida;
        u.lang = elegida.lang;
        var pf = opciones.caracter ? perfilDeVoz(linea.quien, opciones.emocion) : { tono: 1, vel: 1 };
        u.rate = Math.max(0.1, Math.min(2, (opciones.velocidad || 0.9) * pf.vel));
        u.pitch = opciones.tono || Math.min(2, 1.05 * pf.tono);
        u.volume = opciones.volumen == null ? 1 : opciones.volumen;
        if (opciones.alTerminar) u.onend = opciones.alTerminar;
        synth.speak(u);
        return { modo: 'voz', texto: linea.texto, voz: elegida.name };
      }
      return { modo: 'subtitulo', texto: linea.texto, voz: null };
    }

    return {
      decir: decir,
      parar: parar,
      refrescar: refrescar,
      existe: function (id) { return !!lineas[id]; },
      texto: function (id) { return lineas[id] ? lineas[id].texto : null; },
      vozElegida: function () { return elegida; },
      elegirManual: function (nombre) { preferida = nombre || null; return refrescar(); },
      listaDeVoces: function () {
        var l = synth && synth.getVoices ? synth.getVoices() : [];
        return l.filter(function (v) { return esEspanol(normalizarLang(v.lang)); });
      }
    };
  }

  // Atajo para el navegador (no se usa en las pruebas).
  function crearDesdeNavegador(audios) {
    var w = typeof window !== 'undefined' ? window : {};
    return crearVoz({
      synth: w.speechSynthesis || null,
      Utterance: w.SpeechSynthesisUtterance || null,
      Audio: w.Audio || null,
      audios: audios || {},
      enLinea: function () { return w.navigator ? w.navigator.onLine !== false : true; }
    });
  }

  return {
    PERFILES: PERFILES, perfilDeVoz: perfilDeVoz,
    puntuarVoz: puntuarVoz,
    elegirVoz: elegirVoz,
    crearVoz: crearVoz,
    crearDesdeNavegador: crearDesdeNavegador
  };
});
