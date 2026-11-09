/*
 * RUMBO — Lenguaje breve para escribir niveles (puro, sin DOM).
 *
 * Mapa: además de los caracteres del motor (. # ~ b G o s d) se admiten marcas de
 * inicio de Lumo, que se sustituyen por suelo y fijan "inicio":
 *   > < ^ v   Lumo sobre suelo mirando a E, O, N, S
 *   ) (       Lumo sobre un objeto (o) mirando a E, O
 *
 * Programas: A avanzar, B retroceder, D girar-d, I girar-i, S saltar, R recoger,
 * X activar, E esperar, rep(n, ...), si(cond, [..], [..]), mientras(cond, [..]),
 * rec('A'). Condiciones: OB, AG, OA, IN, MA y no(cond).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RumboDSL = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function t(nombre) { return { t: nombre }; }
  var A = t('avanzar'), B = t('retroceder'), D = t('girar-d'), I = t('girar-i');
  var S = t('saltar'), R = t('recoger'), X = t('activar'), E = t('esperar');
  function flat(args) {
    var r = [];
    for (var i = 0; i < args.length; i++) {
      if (Array.isArray(args[i])) r = r.concat(flat(args[i]));
      else r.push(args[i]);
    }
    return r;
  }
  function rep(n) { return { t: 'repetir', n: n, cuerpo: flat([].slice.call(arguments, 1)) }; }
  function si(cond, entonces, sino) {
    var n = { t: 'si', cond: cond, entonces: flat([entonces || []]) };
    if (sino) n.sino = flat([sino]);
    return n;
  }
  function mientras(cond, cuerpo) { return { t: 'mientras', cond: cond, cuerpo: flat([cuerpo]) }; }
  function rec(nombre) { return { t: 'receta', nombre: nombre }; }
  function cond(nombre) { return { t: nombre, no: false }; }
  function no(c) { return { t: c.t, no: true }; }
  var OB = cond('obstaculo-delante'), AG = cond('agua-delante'), OA = cond('objeto-aqui');
  var IN = cond('interruptor-aqui'), MA = cond('meta-aqui');
  function seq() { return flat([].slice.call(arguments)); }
  function P(principal, recetas) { return { principal: flat([principal]), recetas: recetas || {} }; }

  // ---- currículo ----
  var DEA = 'Descubrimiento y Exploración del Entorno';
  function mat(ciclo, n) {
    return { decreto: '211/2022', area: 'Matemáticas · Competencia específica 4 · ' + ciclo + ' ciclo', criterio: n };
  }
  function cm(ciclo, n) {
    return { decreto: '211/2022', area: 'Conocimiento del Medio · Competencia específica 3 · ' + ciclo + ' ciclo', criterio: n };
  }
  var CUR = {
    inf11: { decreto: '196/2022', area: DEA + ' · Competencia específica 1 · 2.º ciclo', criterio: '1.1',
      texto: 'Describe cualidades de objetos y establece relaciones de orden, correspondencia y clasificación.' },
    inf14: { decreto: '196/2022', area: DEA + ' · Competencia específica 1 · 2.º ciclo', criterio: '1.4',
      texto: 'Aplica las nociones espaciales básicas para ubicarse y orientarse.' },
    inf15: { decreto: '196/2022', area: DEA + ' · Competencia específica 1 · 2.º ciclo', criterio: '1.5',
      texto: 'Organiza su actividad ordenando y anticipando secuencias.' },
    m1_41: Object.assign(mat('1.er', '4.1'), { texto: 'Describe rutinas sencillas paso a paso, identifica patrones y reorganiza algoritmos sencillos.' }),
    m1_42: Object.assign(mat('1.er', '4.2'), { texto: 'Resuelve de forma guiada problemas que implican secuencias o patrones, con herramientas también tecnológicas.' }),
    m1_cm: Object.assign(cm('1.er', '3.2'), { texto: 'Participa en la resolución guiada de problemas sencillos de programación.' }),
    m2_41: Object.assign(mat('2.º', '4.1'), { texto: 'Automatiza rutinas identificando patrones, hace predicciones y modifica algoritmos dados.' }),
    m2_42: Object.assign(mat('2.º', '4.2'), { texto: 'Resuelve problemas organizando la información, descomponiendo en partes y modificando o creando algoritmos de forma guiada.' }),
    m2_cm: Object.assign(cm('2.º', '3.2'), { texto: 'Resuelve de forma guiada problemas sencillos de programación modificando algoritmos.' }),
    m3_41: Object.assign(mat('3.er', '4.1'), { texto: 'Modeliza rutinas identificando patrones, hace predicciones razonadas y crea algoritmos sencillos.' }),
    m3_42: Object.assign(mat('3.er', '4.2'), { texto: 'Resuelve problemas y pequeñas investigaciones con herramientas adecuadas, también tecnológicas.' }),
    saber23: { decreto: '211/2022', area: 'Conocimiento del Medio · Saber básico II.2.3 (iniciación a la programación)', criterio: 'Saber básico II.2.3',
      texto: 'Iniciación a la programación con recursos analógicos y digitales.' }
  };

  // ---- pistas por tipo (se pueden sustituir nivel a nivel) ----
  var PISTAS = {
    seq: ['Mira hacia dónde mira Lumo.', 'Cuenta cuántas casillas hay hasta la meta.', 'Pon una tarjeta por cada paso y pulsa Ejecutar.'],
    giro: ['Fíjate en hacia dónde mira Lumo ahora.', 'Para cambiar de dirección necesitas una tarjeta de giro.', 'Gira cuando llegues a la esquina del camino y sigue avanzando.'],
    obj: ['Mira si hay algo por el camino.', 'Lumo tiene que recoger todo antes de llegar a la meta.', 'Cuando Lumo esté encima del objeto, usa la tarjeta de recoger.'],
    obs: ['Lumo no puede atravesar eso.', 'Busca otro camino que lo rodee.', 'Prueba a dar la vuelta por el lado libre.'],
    saltar: ['Mira el hueco que hay en el camino.', 'Saltar mueve a Lumo dos casillas.', 'Avanza hasta el borde y salta.'],
    bucle: ['Busca algo que se repita.', 'Marca el trozo que se repite y cuenta cuántas veces.', 'Mete ese trozo dentro de Repetir y pon el número.'],
    depurar: ['El programa ya está hecho, pero algo falla. Ejecútalo y mira dónde se detiene.', 'La tarjeta que se ilumina cuando Lumo se para es una buena sospechosa.', 'Cambia, mueve, quita o añade una tarjeta y vuelve a probar.'],
    mecanismo: ['Algo bloquea el paso. ¿Cómo se abre?', 'El interruptor abre la puerta cuando Lumo está encima y usa Activar.', 'Primero ve al interruptor, actívalo y después ve a la puerta.'],
    optim: ['Tu programa funciona, pero ¿puede ser más corto?', 'Busca trozos iguales que puedas meter dentro de Repetir.', 'Pon un bucle dentro de otro o usa una receta.'],
    cond: ['Lumo debe decidir según lo que ve.', 'Si hay algo delante, hará una cosa; si no, otra.', 'Mete la decisión dentro de un bucle para que se repita.'],
    receta: ['Hay una secuencia que se usa varias veces.', 'Guárdala en una receta y llámala cuando la necesites.', 'Crea la receta A con ese trozo y úsala dentro del programa.']
  };

  function contar(prog) {
    var n = 0;
    function lista(l) {
      (l || []).forEach(function (x) { n++; lista(x.cuerpo); lista(x.entonces); lista(x.sino); });
    }
    if (Array.isArray(prog)) lista(prog);
    else { lista(prog.principal); Object.keys(prog.recetas || {}).forEach(function (k) { lista(prog.recetas[k]); }); }
    return n;
  }

  var DIRMARCA = { '>': 'E', '<': 'O', '^': 'N', 'v': 'S', ')': 'E', '(': 'O' };

  function procesarMapa(filas) {
    var inicio = null;
    var mapa = filas.map(function (fila, y) {
      var out = '';
      for (var x = 0; x < fila.length; x++) {
        var c = fila.charAt(x);
        if (DIRMARCA[c]) {
          if (inicio) throw new Error('hay más de una marca de inicio');
          inicio = { x: x, y: y, dir: DIRMARCA[c] };
          out += (c === ')' || c === '(') ? 'o' : '.';
        } else out += c;
      }
      return out;
    });
    if (!inicio) throw new Error('falta la marca de inicio de Lumo');
    return { mapa: mapa, inicio: inicio };
  }

  /*
   * def:
   *   id, e (etapa), m (mapa con marcas), c (tarjetas), ref (solución),
   *   o (objetivo), i (intro), tt (título), b (bloque), z (zona visual),
   *   holgura: tarjetas extra permitidas para la 2.ª estrella (0 por defecto)
   *   usa: tarjeta que debe emplearse para la 3.ª estrella (si no, no pasar de la referencia)
   *   p: pistas (o h: clave de PISTAS), lim, rec (recetas disponibles), con (condiciones),
   *   ini (programa inicial a depurar), tipo, cur: [claves CUR], ext: [texto]
   *   huecos (Infantil), skin: {meta, obj}, it (itinerario Infantil), ed (edad)
   */
  function nivel(def) {
    var m = procesarMapa(def.m);
    var n = {
      id: def.id,
      etapa: def.e,
      titulo: def.tt,
      bloque: def.b,
      zona: def.z,
      tipo: def.tipo || (def.ini ? 'depurar' : 'normal'),
      intro: def.i,
      objetivo: def.o,
      mapa: m.mapa,
      inicio: m.inicio,
      cartas: { disponibles: def.c },
      referencia: def.ref
    };
    if (def.lim) n.cartas.limites = def.lim;
    if (def.rec) n.cartas.recetas = def.rec;
    if (def.con) n.cartas.condiciones = def.con;
    if (def.ini) n.programaInicial = def.ini;
    if (def.huecos) n.huecos = def.huecos;
    if (def.skin) n.skin = def.skin;
    if (def.it) n.itinerario = def.it;
    if (def.secreto) n.secreto = def.secreto;
    if (def.e !== 'infantil') {
      // Estrellas: ★★ hasta (tarjetas de la referencia + holgura); ★★★ si no supera la referencia
      // o, si se indica "usa", si emplea esa tarjeta.
      var base = contar(def.ref);
      n.estrellas = {
        s2max: base + (def.holgura || 0),
        s3: def.usa ? { tipo: 'usa', carta: def.usa } : { tipo: 'referencia' }
      };
      n.pistas = def.p || PISTAS[def.h || 'seq'];
    } else if (def.p) {
      n.pistas = def.p;
    }
    n.curriculo = {
      oficial: (def.cur || []).map(function (k) { if (!CUR[k]) throw new Error('curriculo desconocido ' + k); return CUR[k]; }),
      extension: def.ext || []
    };
    return n;
  }

  return {
    A: A, B: B, D: D, I: I, S: S, R: R, X: X, E: E,
    rep: rep, si: si, mientras: mientras, rec: rec, no: no, seq: seq, P: P,
    OB: OB, AG: AG, OA: OA, IN: IN, MA: MA,
    CUR: CUR, PISTAS: PISTAS, nivel: nivel, contar: contar
  };
});
