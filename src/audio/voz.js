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
        u.rate = opciones.velocidad || 0.9;
        u.pitch = opciones.tono || 1.05;
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
    puntuarVoz: puntuarVoz,
    elegirVoz: elegirVoz,
    crearVoz: crearVoz,
    crearDesdeNavegador: crearDesdeNavegador
  };
});
