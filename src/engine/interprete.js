/*
 * RUMBO — Intérprete de programas por tarjetas (puro, sin DOM, sin Phaser).
 *
 * ejecutar(nivel, programa) devuelve una TRAZA de pasos y un resultado. La interfaz
 * solo consume esa traza: resalta la tarjeta activa, anima a Lumo, pausa, etc.
 * Así las reglas del juego se pueden probar sin navegador.
 *
 * PROGRAMA
 *   Una lista de nodos, o { principal: [...], recetas: { A: [...] } }.
 *   Nodo:   { t: 'avanzar' }
 *           { t: 'repetir', n: 3, cuerpo: [...] }
 *           { t: 'si', cond: { t: 'obstaculo-delante', no: false }, entonces: [...], sino: [...] }
 *           { t: 'mientras', cond: {...}, cuerpo: [...] }
 *           { t: 'receta', nombre: 'A' }
 *
 * MAPA (nivel.mapa, lista de cadenas; nivel.inicio = { x, y, dir })
 *   .  suelo          #  pared (también el exterior del mapa)
 *   ~  agua (caída)   b  barrera baja (se salta, no se atraviesa)
 *   G  meta           o  objeto para recoger (sobre suelo)
 *   s  interruptor    d  puerta (cerrada hasta pulsar un interruptor con "activar")
 *
 * REGLAS
 *   - El programa termina con éxito en cuanto Lumo está en la meta con todos los
 *     objetos recogidos.
 *   - Choque (pared, borde, barrera, puerta cerrada) y caída al agua terminan la
 *     ejecución con un motivo claro; no son "fallos" que se penalicen.
 *   - "recoger" y "activar" sin nada que hacer no son error: el paso queda como
 *     'sin-efecto'.
 *   - Límite de pasos para evitar bucles infinitos (500 por defecto).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RumboInterprete = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DIRS = ['N', 'E', 'S', 'O'];
  var DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], O: [-1, 0] };
  var TARJETAS = ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger',
    'activar', 'esperar', 'repetir', 'si', 'mientras', 'receta'];
  var CONDICIONES = ['obstaculo-delante', 'agua-delante', 'objeto-aqui', 'interruptor-aqui', 'meta-aqui'];
  var CELDAS = '.#~bGosd';
  var MAX_PASOS = 500;
  var MAX_PROFUNDIDAD = 10;
  var MAX_REPETIR = 99;

  // ---------- tablero ----------

  function crearTablero(nivel) {
    if (!nivel || !Array.isArray(nivel.mapa) || nivel.mapa.length === 0) {
      throw new TypeError('nivel.mapa debe ser una lista de cadenas');
    }
    var filas = nivel.mapa;
    var celdas = [];
    var objetos = {};
    var total = 0;
    var meta = null;
    for (var y = 0; y < filas.length; y++) {
      var fila = [];
      for (var x = 0; x < filas[y].length; x++) {
        var c = filas[y].charAt(x);
        fila.push(c);
        if (c === 'o') { objetos[x + ',' + y] = true; total++; }
        if (c === 'G') meta = { x: x, y: y };
      }
      celdas.push(fila);
    }
    return {
      alto: filas.length,
      ancho: filas[0].length,
      meta: meta,
      objetos: objetos,
      totalObjetos: total,
      celda: function (x, y) {
        if (y < 0 || y >= celdas.length || x < 0 || x >= celdas[y].length) return '#';
        return celdas[y][x];
      }
    };
  }

  // ---------- recorrido del programa (para contar y comprobar) ----------

  function recorrer(programa, fn) {
    function lista(l) {
      if (!Array.isArray(l)) return;
      for (var i = 0; i < l.length; i++) {
        var n = l[i];
        if (n && typeof n === 'object') {
          fn(n);
          lista(n.cuerpo);
          lista(n.entonces);
          lista(n.sino);
        }
      }
    }
    if (Array.isArray(programa)) {
      lista(programa);
    } else if (programa && typeof programa === 'object') {
      lista(programa.principal);
      var r = programa.recetas || {};
      for (var k in r) if (Object.prototype.hasOwnProperty.call(r, k)) lista(r[k]);
    }
  }

  // Cada tarjeta cuenta 1; un bucle o condición cuenta 1 más su contenido.
  function contarTarjetas(programa) {
    var n = 0;
    recorrer(programa, function () { n++; });
    return n;
  }

  function contarPorTipo(programa) {
    var por = {};
    recorrer(programa, function (nodo) { por[nodo.t] = (por[nodo.t] || 0) + 1; });
    return por;
  }

  function usaTarjeta(programa, tipo) {
    var usa = false;
    recorrer(programa, function (nodo) { if (nodo.t === tipo) usa = true; });
    return usa;
  }

  // ---------- ejecución ----------

  function Fin(resultado) { this.resultado = resultado; }

  function ejecutar(nivel, programa, opciones) {
    opciones = opciones || {};
    var maxPasos = opciones.maxPasos || MAX_PASOS;
    var tab = crearTablero(nivel);

    var principal, recetas;
    if (Array.isArray(programa)) {
      principal = programa;
      recetas = {};
    } else {
      principal = (programa && programa.principal) || [];
      recetas = (programa && programa.recetas) || {};
    }

    var est = {
      x: nivel.inicio.x, y: nivel.inicio.y, dir: nivel.inicio.dir,
      puertas: false, recogidos: {}, nRecogidos: 0
    };
    var traza = [];
    var pasos = 0;

    function snap() { return { x: est.x, y: est.y, dir: est.dir }; }

    function registrar(ruta, nodo, evento, de, extra) {
      var p = { ruta: ruta, t: nodo.t, evento: evento, de: de, a: snap() };
      if (extra) for (var k in extra) p[k] = extra[k];
      traza.push(p);
    }

    function terminar(ok, motivo, ruta) {
      throw new Fin({ ok: ok, motivo: motivo, nodoError: ok ? null : (ruta == null ? null : ruta) });
    }

    function visitar(ruta) {
      pasos++;
      if (pasos > maxPasos) terminar(false, 'limite-pasos', ruta);
    }

    function enMeta() { return !!tab.meta && est.x === tab.meta.x && est.y === tab.meta.y; }
    function todoRecogido() { return est.nRecogidos === tab.totalObjetos; }
    function comprobarVictoria() { if (enMeta() && todoRecogido()) terminar(true, 'meta', null); }

    function entrar(x, y) {
      var c = tab.celda(x, y);
      if (c === '#' || c === 'b' || (c === 'd' && !est.puertas)) return 'choque';
      if (c === '~') return 'caida';
      return 'ok';
    }

    function condicion(c, ruta) {
      if (!c || CONDICIONES.indexOf(c.t) < 0) terminar(false, 'programa-invalido', ruta);
      var d = DELTA[est.dir];
      var fx = est.x + d[0], fy = est.y + d[1];
      var v;
      switch (c.t) {
        case 'obstaculo-delante': {
          var cf = tab.celda(fx, fy);
          v = cf === '#' || cf === 'b' || (cf === 'd' && !est.puertas);
          break;
        }
        case 'agua-delante': v = tab.celda(fx, fy) === '~'; break;
        case 'objeto-aqui': v = !!tab.objetos[est.x + ',' + est.y] && !est.recogidos[est.x + ',' + est.y]; break;
        case 'interruptor-aqui': v = tab.celda(est.x, est.y) === 's'; break;
        case 'meta-aqui': v = enMeta(); break;
      }
      return c.no ? !v : v;
    }

    function desplazar(nodo, ruta, de, direccion) {
      var d = DELTA[direccion];
      var nx = est.x + d[0], ny = est.y + d[1];
      var r = entrar(nx, ny);
      if (r === 'choque') { registrar(ruta, nodo, 'choque', de); terminar(false, 'choque', ruta); }
      est.x = nx; est.y = ny;
      if (r === 'caida') { registrar(ruta, nodo, 'caida', de); terminar(false, 'caida', ruta); }
      registrar(ruta, nodo, 'mover', de);
    }

    function saltar(nodo, ruta, de) {
      var d = DELTA[est.dir];
      var ix = est.x + d[0], iy = est.y + d[1];
      var ci = tab.celda(ix, iy);
      if (ci === '#' || (ci === 'd' && !est.puertas)) {
        registrar(ruta, nodo, 'choque', de); terminar(false, 'choque', ruta);
      }
      var nx = est.x + 2 * d[0], ny = est.y + 2 * d[1];
      var r = entrar(nx, ny);
      if (r === 'choque') { registrar(ruta, nodo, 'choque', de); terminar(false, 'choque', ruta); }
      est.x = nx; est.y = ny;
      if (r === 'caida') { registrar(ruta, nodo, 'caida', de); terminar(false, 'caida', ruta); }
      registrar(ruta, nodo, 'salto', de);
    }

    function hijo(ruta, marca) { return ruta + '.' + marca; }

    function lista(nodos, ruta, prof) {
      if (!Array.isArray(nodos)) return;
      for (var i = 0; i < nodos.length; i++) {
        ejecutarNodo(nodos[i], ruta === '' ? String(i) : ruta + '.' + i, prof);
      }
    }

    function ejecutarNodo(nodo, ruta, prof) {
      if (!nodo || typeof nodo.t !== 'string' || TARJETAS.indexOf(nodo.t) < 0) {
        terminar(false, 'programa-invalido', ruta);
      }
      visitar(ruta);
      var de = snap();
      var accion = true;

      switch (nodo.t) {
        case 'avanzar': desplazar(nodo, ruta, de, est.dir); break;
        case 'retroceder': desplazar(nodo, ruta, de, DIRS[(DIRS.indexOf(est.dir) + 2) % 4]); break;
        case 'saltar': saltar(nodo, ruta, de); break;
        case 'girar-d':
          est.dir = DIRS[(DIRS.indexOf(est.dir) + 1) % 4];
          registrar(ruta, nodo, 'giro', de);
          break;
        case 'girar-i':
          est.dir = DIRS[(DIRS.indexOf(est.dir) + 3) % 4];
          registrar(ruta, nodo, 'giro', de);
          break;
        case 'recoger': {
          var clave = est.x + ',' + est.y;
          if (tab.objetos[clave] && !est.recogidos[clave]) {
            est.recogidos[clave] = true;
            est.nRecogidos++;
            registrar(ruta, nodo, 'recoger', de);
          } else {
            registrar(ruta, nodo, 'sin-efecto', de);
          }
          break;
        }
        case 'activar':
          if (tab.celda(est.x, est.y) === 's') {
            est.puertas = true;
            registrar(ruta, nodo, 'activar', de);
          } else {
            registrar(ruta, nodo, 'sin-efecto', de);
          }
          break;
        case 'esperar': registrar(ruta, nodo, 'espera', de); break;

        case 'repetir': {
          accion = false;
          var n = nodo.n;
          if (typeof n !== 'number' || n !== Math.floor(n) || n < 1 || n > MAX_REPETIR) {
            terminar(false, 'programa-invalido', ruta);
          }
          for (var i = 0; i < n; i++) {
            if (i > 0) visitar(ruta);
            registrar(ruta, nodo, 'control', snap(), { iteracion: i + 1, total: n });
            lista(nodo.cuerpo, hijo(ruta, 'c'), prof);
          }
          break;
        }
        case 'si': {
          accion = false;
          var v = condicion(nodo.cond, ruta);
          registrar(ruta, nodo, 'control', de, { valor: v });
          lista(v ? nodo.entonces : nodo.sino, hijo(ruta, v ? 'e' : 's'), prof);
          break;
        }
        case 'mientras': {
          accion = false;
          var primera = true;
          while (true) {
            if (!primera) visitar(ruta);
            primera = false;
            var vm = condicion(nodo.cond, ruta);
            registrar(ruta, nodo, 'control', snap(), { valor: vm });
            if (!vm) break;
            lista(nodo.cuerpo, hijo(ruta, 'c'), prof);
          }
          break;
        }
        case 'receta': {
          accion = false;
          if (!Object.prototype.hasOwnProperty.call(recetas, nodo.nombre)) {
            terminar(false, 'receta-inexistente', ruta);
          }
          if (prof + 1 > MAX_PROFUNDIDAD) terminar(false, 'profundidad', ruta);
          registrar(ruta, nodo, 'control', de, { nombre: nodo.nombre });
          lista(recetas[nodo.nombre], 'r.' + nodo.nombre, prof + 1);
          break;
        }
      }
      if (accion) comprobarVictoria();
    }

    var resultado;
    try {
      if (principal.length === 0) {
        resultado = { ok: false, motivo: 'programa-vacio', nodoError: null };
      } else {
        lista(principal, '', 0);
        resultado = {
          ok: false,
          motivo: (enMeta() && !todoRecogido()) ? 'objeto-olvidado' : 'objetivo-incompleto',
          nodoError: null
        };
      }
    } catch (e) {
      if (!(e instanceof Fin)) throw e;
      resultado = e.resultado;
    }
    resultado.pasos = pasos;
    resultado.traza = traza;
    resultado.final = { x: est.x, y: est.y, dir: est.dir, puertas: est.puertas, recogidos: est.nRecogidos };
    return resultado;
  }

  return {
    DIRS: DIRS,
    TARJETAS: TARJETAS,
    CONDICIONES: CONDICIONES,
    CELDAS: CELDAS,
    MAX_PASOS: MAX_PASOS,
    crearTablero: crearTablero,
    ejecutar: ejecutar,
    recorrer: recorrer,
    contarTarjetas: contarTarjetas,
    contarPorTipo: contarPorTipo,
    usaTarjeta: usaTarjeta
  };
});
