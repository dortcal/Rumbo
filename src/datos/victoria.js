/*
 * RUMBO — Victoria con historia (fase 6). Funciones puras: no tocan el DOM ni el azar.
 *
 *   avance(zona, hecho)       → línea de avance narrativo de la pantalla de resultados (solo Primaria).
 *   celebracion(nivel, est)   → qué celebración ve el jugador: depende del tipo de reto, de las estrellas y de la
 *                               posición en la zona (rotación fija), así dos jugadores ven lo mismo.
 *   faroPequeno(hecho)        → ventanas encendidas del Faro en miniatura.
 *   paginasDiario(perfil)     → páginas del diario de Lumo (se calculan desde retos superados y escenas vistas).
 * Guion: docs/guion-v2.md §11. Nada de esto cambia estrellas, validación ni reglas.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./catalogo.js'), require('./escenas.js'));
    module.exports = api;
  } else {
    root.RumboVictoria = factory(root.RumboCatalogo, root.RumboEscenas);
  }
})(typeof self !== 'undefined' ? self : this, function (CAT, ES) {
  'use strict';

  // «Faltan {n} retos para …» y el mensaje al llegar (guion §11.1).
  var METAS = {
    bosque: { falta: 'llegar hasta Titila', llega: '¡Has encontrado a Titila!' },
    montanas: { falta: 'llegar hasta Brasa', llega: '¡Has llegado a la cumbre con Brasa!' },
    mar: { falta: 'encontrar a Destello', llega: '¡Has encontrado a Destello!' },
    volcan: { falta: 'llegar hasta Ascua', llega: '¡Has llegado al corazón del volcán!' },
    ciudad: { falta: 'encontrar a Píxel', llega: '¡Has encontrado a Píxel!' },
    espacio: { falta: 'llegar hasta Cometa', llega: '¡Has llegado a Cometa y al reactor!' },
    faro: { falta: 'encender el Faro', llega: '¡El Faro está encendido!' }
  };

  // Retos que cuentan para el avance de una zona: los de su mundo, sin los calentamientos de la ciudad (m3-p1…p5).
  function retosDeZona(zona) {
    var r = [];
    CAT.MUNDOS.forEach(function (m) {
      if (m.id === 0) return;
      m.niveles.forEach(function (n) { if (n.zona === zona && !/^m3-p\d/.test(n.id)) r.push(n.id); });
    });
    return r;
  }

  function avance(zona, hecho) {
    var m = METAS[zona]; if (!m) return null;
    var ids = retosDeZona(zona);
    var faltan = ids.filter(function (id) { return !hecho(id); }).length;
    var texto = faltan === 0 ? m.llega
      : (faltan === 1 ? 'Falta 1 reto' : 'Faltan ' + faltan + ' retos') + ' para ' + m.falta + '.';
    return { zona: zona, faltan: faltan, total: ids.length, llegado: faltan === 0, texto: texto };
  }

  var BAILES = ['voltereta', 'brujula', 'zona', 'abrazo'];

  // Amigo que abraza a Lumo en cada zona.
  function amigoDe(zona) {
    var ch = ES.CHISPAS.filter(function (c) { return c.zona === zona; })[0];
    if (ch) return ch.nombre;
    return zona === 'faro' ? 'Abuela Chispa' : 'Conejo';
  }

  /*
   * nivelId: reto superado; est: estrellas (1–3). Devuelve
   *   { baile, especial, chispa, bichito, zona }
   * especial: 'chispa-al-faro' (último reto de zona con chispa) | 'faro-encendido' (f-03) | null.
   */
  function celebracion(nivelId, est) {
    var n = CAT.POR_ID[nivelId]; if (!n) return { baile: 'voltereta', especial: null, chispa: null, bichito: false, zona: 'jardin' };
    var zona = n.zona, pos = 0, enZona = [];
    var mundo = CAT.MUNDOS[n.mundo];
    if (mundo) { enZona = mundo.niveles.filter(function (x) { return x.zona === zona; }); pos = enZona.indexOf(n); }
    var chispa = ES.CHISPAS.filter(function (c) { return c.meta === nivelId; })[0] || null;
    var especial = nivelId === 'f-03' ? 'faro-encendido' : chispa ? 'chispa-al-faro' : null;
    return {
      baile: BAILES[(Math.max(0, pos) + (est || 1)) % BAILES.length],
      especial: especial,
      chispa: chispa ? chispa.id : null,
      bichito: n.tipo === 'depurar',
      zona: zona
    };
  }

  // Ventanas del Faro encendidas: una por chispa cuyo reto-meta está superado; luz final al superar f-03.
  function faroPequeno(hecho) {
    var enc = ES.CHISPAS.filter(function (c) { return hecho(c.meta); });
    return { encendidas: enc.length, total: ES.CHISPAS.length, nueva: null, luzFinal: !!hecho('f-03') };
  }

  /*
   * Diario de Lumo (guion §11.2). `perfil`: { niveles:{id:{completado}}, vistos:{escenas:{}} }.
   * Cada página: { id, titulo, personaje, texto, abierta, escena } (escena = identificador a repetir, o null).
   * Infantil: solo páginas con `infantil: true` y sin texto.
   */
  var PAGINAS = [
    { id: 'lumo', titulo: 'Lumo y su brújula', pj: 'Lumo', texto: 'Soy Lumo, la chispa más pequeña de mi familia.', siempre: true, infantil: true, escena: null },
    { id: 'conejo', titulo: 'Conejo', pj: 'Conejo', texto: 'Conejo salta mucho. Y le encantan las zanahorias.', nivel: 'i3-02', infantil: true, escena: 'C0-02' },
    { id: 'bruma', titulo: 'Búho Bruma', pj: 'Búho Bruma', texto: 'Bruma habla poco. Pero siempre sabe dónde está el camino.', nivel: 'm1-13', escena: 'BR-2' },
    { id: 'titila', titulo: 'Titila', pj: 'Titila', texto: 'Titila brilla con timidez. Su luz es la más suave.', nivel: 'm1-13', escena: 'CAP1-A' },
    { id: 'brasa', titulo: 'Brasa', pj: 'Brasa', texto: 'Brasa dice que puede sola. Y casi siempre puede.', nivel: 'm1-25', escena: 'CAP1-01' },
    { id: 'tinta', titulo: 'Tinta', pj: 'Tinta', texto: 'Tinta construye de todo. Hasta recetas de pasos.', nivel: 'm2-13', escena: 'TIN-2' },
    { id: 'destello', titulo: 'Destello', pj: 'Destello', texto: 'Destello se esconde muy bien. ¡Pero lo encontré!', nivel: 'm2-13', escena: 'CAP2-A' },
    { id: 'lagarto', titulo: 'Lagarto gigante', pj: 'Lagarto gigante', texto: 'El lagarto gigante es lento y sabio. Cuida el volcán.', nivel: 'm2-25', escena: 'C2-03' },
    { id: 'ascua', titulo: 'Ascua', pj: 'Ascua', texto: 'Ascua gruñe mucho. Pero brilla más que nadie.', nivel: 'm2-25', escena: 'CAP2-B' },
    { id: 'bit', titulo: 'Bit', pj: 'Bit', texto: 'Bit dice las cosas tal cual. Y aprende a improvisar.', nivel: 'm3-25', escena: 'BIT-2' },
    { id: 'pixel', titulo: 'Píxel', pj: 'Píxel', texto: 'Píxel pregunta todo. Así se aprende.', nivel: 'm3-13', escena: 'CAP3-A' },
    { id: 'cometa', titulo: 'Cometa', pj: 'Cometa', texto: 'Cometa mira las estrellas. Dice que bailan.', nivel: 'm3-25', escena: 'CAP3-B' },
    { id: 'bichito1', titulo: 'Bichito (1)', pj: 'Bichito', texto: 'Me desordena las tarjetas. ¡Ji, ji!', escena: 'C1-02' },
    { id: 'bichito2', titulo: 'Bichito (2)', pj: 'Bichito', texto: 'Nos sigue de lejos.', escena: 'B2-1' },
    { id: 'bichito3', titulo: 'Bichito (3)', pj: 'Bichito', texto: 'Quiso ayudar y se equivocó.', escena: 'BI-3' },
    { id: 'bichito4', titulo: 'Bichito (4)', pj: 'Bichito', texto: 'Es una chispa sin luz. Solo busca su casa.', escena: 'BI-4a' },
    { id: 'bichito5', titulo: 'Bichito (5)', pj: 'Bichito', texto: '¡Ya brilla! Sigue siendo Bichito.', escena: 'FIN-01' },
    { id: 'brujula1', titulo: 'La brújula (1)', pj: 'Lumo', texto: 'Tengo una pieza. Faltan dos.', escena: 'CAP1-01' },
    { id: 'brujula2', titulo: 'La brújula (2)', pj: 'Lumo', texto: 'Dos piezas. Falta una.', escena: 'CAP2-02' },
    { id: 'brujula3', titulo: 'La brújula (3)', pj: 'Lumo', texto: '¡Ya está completa!', escena: 'CAP3-B' },
    { id: 'guino', titulo: 'El guiño de luz', pj: 'Lumo', texto: 'Corto, corto, largo. ¿Quién me llama?', infantil: true, nivel: 'i3-01', escena: null, nivelPrim: 'm1-01' },
    { id: 'abuela', titulo: 'Abuela Chispa', pj: 'Abuela Chispa', texto: 'Mi abuela me esperaba. Siempre me guiaba.', nivel: 'f-03', escena: 'FIN-02' }
  ];

  function paginasDiario(perfil, infantil) {
    var vistas = (perfil.vistos && perfil.vistos.escenas) || {};
    var hecho = function (id) { return !!(perfil.niveles[id] && perfil.niveles[id].completado); };
    return PAGINAS.filter(function (p) { return !infantil || p.infantil; }).map(function (p) {
      var nv = !infantil && p.nivelPrim ? p.nivelPrim : p.nivel;
      var abierta = !!p.siempre || (nv && hecho(nv)) || (p.escena && !!vistas[p.escena]);
      return { id: p.id, titulo: p.titulo, personaje: p.pj, texto: infantil ? '' : (p.id === 'guino' && vistas['FIN-02'] ? 'Corto, corto, largo. Era la abuela.' : p.texto), abierta: abierta,
        escena: abierta && p.escena && ES.POR_ID[p.escena] ? p.escena : null };
    });
  }

  return { METAS: METAS, retosDeZona: retosDeZona, avance: avance, celebracion: celebracion, amigoDe: amigoDe, faroPequeno: faroPequeno,
    PAGINAS: PAGINAS, paginasDiario: paginasDiario, BAILES: BAILES };
});
