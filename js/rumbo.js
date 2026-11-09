/* RUMBO — paquete generado por tools/build.js. No editar a mano: edita los archivos de /src. */

/* ===== src/engine/interprete.js ===== */
;/*
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


/* ===== src/engine/estrellas.js ===== */
;/*
 * RUMBO — Cálculo de estrellas (puro).
 *
 * Reglas (acumulativas):
 *   Infantil .......... 1 estrella de celebración si supera el reto. Nada más.
 *   Primaria  ★ ....... superar el reto.
 *             ★★ ...... además, usar como máximo nivel.estrellas.s2max tarjetas.
 *             ★★★ ..... además, cumplir nivel.estrellas.s3:
 *                         { tipo: 'max-tarjetas', valor: N }  → como máximo N tarjetas
 *                         { tipo: 'usa', carta: 'repetir' }    → usar esa tarjeta
 *                         { tipo: 'referencia' }               → no pasar de las tarjetas de la solución de referencia
 *
 * El tiempo y el número de intentos NO intervienen. Se premia el razonamiento.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./interprete.js'));
    module.exports = api;
  } else {
    root.RumboEstrellas = factory(root.RumboInterprete);
  }
})(typeof self !== 'undefined' ? self : this, function (I) {
  'use strict';

  function cumpleTercera(nivel, programa, n) {
    var s3 = nivel.estrellas && nivel.estrellas.s3;
    if (!s3) return false;
    switch (s3.tipo) {
      case 'max-tarjetas': return typeof s3.valor === 'number' && n <= s3.valor;
      case 'usa': return I.usaTarjeta(programa, s3.carta);
      case 'referencia': return !!nivel.referencia && n <= I.contarTarjetas(nivel.referencia);
      default: return false;
    }
  }

  function calcularEstrellas(nivel, programa, resultado) {
    if (!resultado || !resultado.ok) return 0;
    if (nivel.etapa === 'infantil') return 1;
    var n = I.contarTarjetas(programa);
    var e = nivel.estrellas || {};
    if (typeof e.s2max === 'number' && n <= e.s2max) {
      return cumpleTercera(nivel, programa, n) ? 3 : 2;
    }
    return 1;
  }

  return { calcularEstrellas: calcularEstrellas };
});


/* ===== src/progreso/codigo-partida.js ===== */
;/*
 * RUMBO — Módulo de código de partida (puro, sin DOM).
 *
 * Funciona de dos formas:
 *   - En el navegador, como script clásico: define la variable global RumboCodigo.
 *   - En Node (pruebas): module.exports.
 *
 * Tres códigos:
 *   - Corto (Primaria): 11 símbolos. Guarda avance, estrellas totales por mundo,
 *     niveles secretos y disfraz. NO guarda las estrellas de cada nivel.
 *   - Pictográfico (Infantil): 6 dibujos de una colección de 12.
 *   - Largo (docentes): estado completo, con las estrellas de cada nivel.
 *
 * Todos llevan una comprobación (CRC) para detectar errores de tecleo y una
 * máscara para que dos códigos parecidos no se parezcan. NO es una medida de
 * seguridad: quien quiera inventar códigos puede intentarlo.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RumboCodigo = api;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Alfabeto de Crockford: 32 símbolos, sin I, L, O, U.
  var ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var VERSION = 1;

  var LIMITES = {
    nivel: 127,
    estrellasMundo: [127, 127, 127, 31], // M1, M2, M3, Final
    disfraz: 31,
    nivelInfantil: 15,
    disfrazInfantil: 15,
    maxNivelesLargo: 255
  };

  // ---------- utilidades de bits ----------

  function escribir(bits, valor, n) {
    for (var i = n - 1; i >= 0; i--) bits.push((valor >>> i) & 1);
  }

  function leer(bits, pos, n) {
    var v = 0;
    for (var i = 0; i < n; i++) v = (v * 2) + bits[pos + i];
    return v;
  }

  function entero(valor, min, max, nombre) {
    if (typeof valor !== 'number' || valor !== Math.floor(valor) || valor < min || valor > max) {
      throw new RangeError(nombre + ' debe ser un entero entre ' + min + ' y ' + max);
    }
    return valor;
  }

  // CRC bit a bit sobre un array de bits.
  function crc(bits, ancho, poli) {
    var mask = (ancho === 31) ? 0x7fffffff : ((1 << ancho) - 1);
    var top = 1 << (ancho - 1);
    var reg = mask;
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i] ^ ((reg & top) ? 1 : 0);
      reg = (reg << 1) & mask;
      if (b) reg ^= poli;
    }
    return reg;
  }

  // Flujo pseudoaleatorio determinista (xorshift32) sembrado con la comprobación.
  function mascara(semilla, n) {
    var s = ((semilla + 1) * 2654435761 + 40503) >>> 0;
    if (s === 0) s = 1;
    var out = [];
    for (var i = 0; i < n; i++) {
      s = (s ^ (s << 13)) >>> 0;
      s = (s ^ (s >>> 17)) >>> 0;
      s = (s ^ (s << 5)) >>> 0;
      out.push((s >>> 16) & 1);
    }
    return out;
  }

  function xor(a, b) {
    var out = [];
    for (var i = 0; i < a.length; i++) out.push(a[i] ^ b[i]);
    return out;
  }

  // ---------- conversión a texto ----------

  function aSimbolos(bits) {
    var copia = bits.slice();
    while (copia.length % 5 !== 0) copia.push(0);
    var s = '';
    for (var i = 0; i < copia.length; i += 5) {
      s += ALFABETO.charAt(leer(copia, i, 5));
    }
    return s;
  }

  // Devuelve array de bits o null si hay un carácter no válido.
  function desdeSimbolos(txt) {
    var bits = [];
    for (var i = 0; i < txt.length; i++) {
      var v = ALFABETO.indexOf(txt.charAt(i));
      if (v < 0) return null;
      escribir(bits, v, 5);
    }
    return bits;
  }

  function normalizar(texto) {
    return String(texto == null ? '' : texto)
      .toUpperCase()
      .replace(/[\s\-_.]/g, '')
      .replace(/O/g, '0')
      .replace(/[IL]/g, '1');
  }

  function agrupar(s, n) {
    var partes = [];
    for (var i = 0; i < s.length; i += n) partes.push(s.substr(i, n));
    return partes.join('-');
  }

  // ---------- código corto (Primaria) ----------
  // Distribución (44 bits) + 11 de comprobación = 55 bits = 11 símbolos:
  //   versión 2 | nivel 7 | estrellas M1 7 | M2 7 | M3 7 | Final 5 | secretos 4 | disfraz 5

  function codificarCorto(e) {
    e = e || {};
    var em = e.estrellasMundo || [0, 0, 0, 0];
    var sec = e.secretos || [];
    var bits = [];
    escribir(bits, VERSION, 2);
    escribir(bits, entero(e.nivel || 0, 0, LIMITES.nivel, 'nivel'), 7);
    for (var i = 0; i < 4; i++) {
      var max = LIMITES.estrellasMundo[i];
      escribir(bits, entero(em[i] || 0, 0, max, 'estrellasMundo[' + i + ']'), i < 3 ? 7 : 5);
    }
    for (var j = 0; j < 4; j++) bits.push(sec[j] ? 1 : 0);
    escribir(bits, entero(e.disfraz || 0, 0, LIMITES.disfraz, 'disfraz'), 5);

    var comp = crc(bits, 11, 0x385);
    var salida = xor(bits, mascara(comp, bits.length));
    escribir(salida, comp, 11);
    return agrupar(aSimbolos(salida), 4);
  }

  function decodificarCorto(texto) {
    var t = normalizar(texto);
    if (t.length !== 11) return { ok: false, motivo: 'longitud' };
    var bits = desdeSimbolos(t);
    if (!bits) return { ok: false, motivo: 'caracter' };

    var comp = leer(bits, 44, 11);
    var plano = xor(bits.slice(0, 44), mascara(comp, 44));
    if (crc(plano, 11, 0x385) !== comp) return { ok: false, motivo: 'comprobacion' };
    if (leer(plano, 0, 2) !== VERSION) return { ok: false, motivo: 'version' };

    var estado = {
      nivel: leer(plano, 2, 7),
      estrellasMundo: [leer(plano, 9, 7), leer(plano, 16, 7), leer(plano, 23, 7), leer(plano, 30, 5)],
      secretos: [!!plano[35], !!plano[36], !!plano[37], !!plano[38]],
      disfraz: leer(plano, 39, 5)
    };
    return { ok: true, estado: estado };
  }

  // ---------- código pictográfico (Infantil) ----------
  // 8 bits de datos (nivel 4 + disfraz 4) + 13 de comprobación = 21 bits < 12^6.
  // Cada dibujo es un número 0..11 (el interfaz asigna un animal a cada número).

  var POLI_PICTO = 0x1cf5;

  function codificarPictos(e) {
    e = e || {};
    var bits = [];
    escribir(bits, entero(e.nivelInfantil || 0, 0, LIMITES.nivelInfantil, 'nivelInfantil'), 4);
    escribir(bits, entero(e.disfraz || 0, 0, LIMITES.disfrazInfantil, 'disfraz'), 4);
    var comp = crc(bits, 13, POLI_PICTO);
    var salida = xor(bits, mascara(comp, 8));
    escribir(salida, comp, 13);

    var n = leer(salida, 0, 21);
    var dibujos = [];
    for (var i = 0; i < 6; i++) {
      dibujos.unshift(n % 12);
      n = Math.floor(n / 12);
    }
    return dibujos;
  }

  function decodificarPictos(dibujos) {
    if (!Array.isArray(dibujos) || dibujos.length !== 6) return { ok: false, motivo: 'longitud' };
    var n = 0;
    for (var i = 0; i < 6; i++) {
      var d = dibujos[i];
      if (typeof d !== 'number' || d !== Math.floor(d) || d < 0 || d > 11) {
        return { ok: false, motivo: 'caracter' };
      }
      n = n * 12 + d;
    }
    if (n >= 2097152) return { ok: false, motivo: 'formato' };

    var bits = [];
    escribir(bits, n, 21);
    var comp = leer(bits, 8, 13);
    var plano = xor(bits.slice(0, 8), mascara(comp, 8));
    if (crc(plano, 13, POLI_PICTO) !== comp) return { ok: false, motivo: 'comprobacion' };
    return { ok: true, estado: { nivelInfantil: leer(plano, 0, 4), disfraz: leer(plano, 4, 4) } };
  }

  // ---------- código largo (docentes) ----------
  // [comprobación 16][datos enmascarados][relleno]
  // datos: versión 2 | nº niveles 8 | estrellas 2 bits por nivel | disfraz 5 | secretos 4

  function codificarLargo(e) {
    e = e || {};
    var est = e.estrellas || [];
    if (est.length > LIMITES.maxNivelesLargo) {
      throw new RangeError('demasiados niveles (máximo ' + LIMITES.maxNivelesLargo + ')');
    }
    var sec = e.secretos || [];
    var bits = [];
    escribir(bits, VERSION, 2);
    escribir(bits, est.length, 8);
    for (var i = 0; i < est.length; i++) escribir(bits, entero(est[i], 0, 3, 'estrellas[' + i + ']'), 2);
    escribir(bits, entero(e.disfraz || 0, 0, LIMITES.disfraz, 'disfraz'), 5);
    for (var j = 0; j < 4; j++) bits.push(sec[j] ? 1 : 0);

    var comp = crc(bits, 16, 0x1021);
    var salida = [];
    escribir(salida, comp, 16);
    salida = salida.concat(xor(bits, mascara(comp, bits.length)));
    return agrupar(aSimbolos(salida), 5);
  }

  function decodificarLargo(texto) {
    var t = normalizar(texto);
    var bits = desdeSimbolos(t);
    if (!bits) return { ok: false, motivo: 'caracter' };
    if (bits.length < 16 + 2 + 8 + 5 + 4) return { ok: false, motivo: 'longitud' };

    var comp = leer(bits, 0, 16);
    var resto = bits.slice(16);
    var masc = mascara(comp, resto.length);
    var plano = xor(resto, masc);

    var n = leer(plano, 2, 8);
    var largo = 2 + 8 + 2 * n + 5 + 4;
    if (largo > plano.length) return { ok: false, motivo: 'longitud' };
    var datos = plano.slice(0, largo);
    if (crc(datos, 16, 0x1021) !== comp) return { ok: false, motivo: 'comprobacion' };
    if (leer(datos, 0, 2) !== VERSION) return { ok: false, motivo: 'version' };

    var estrellas = [];
    for (var i = 0; i < n; i++) estrellas.push(leer(datos, 10 + 2 * i, 2));
    var p = 10 + 2 * n;
    return {
      ok: true,
      estado: {
        estrellas: estrellas,
        disfraz: leer(datos, p, 5),
        secretos: [!!datos[p + 5], !!datos[p + 6], !!datos[p + 7], !!datos[p + 8]]
      }
    };
  }

  return {
    VERSION: VERSION,
    ALFABETO: ALFABETO,
    LIMITES: LIMITES,
    normalizar: normalizar,
    codificarCorto: codificarCorto,
    decodificarCorto: decodificarCorto,
    codificarPictos: codificarPictos,
    decodificarPictos: decodificarPictos,
    codificarLargo: codificarLargo,
    decodificarLargo: decodificarLargo
  };
});


/* ===== src/datos/voces-es.js ===== */
;/*
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


/* ===== src/datos/dsl.js ===== */
;/*
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


/* ===== src/datos/demos.js ===== */
;/*
 * RUMBO — Mini-demostraciones de cada tarjeta nueva. Son niveles reales ejecutados con el
 * mismo intérprete, no vídeos: lo que se ve es lo que hace la tarjeta de verdad.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) { api = factory(require('./dsl.js')); module.exports = api; } else { root.RumboDemos = factory(root.RumboDSL); }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, G = D.D, Gi = D.I;
  function dm(zona, mapa, x, y, dir, prog, extra) {
    return Object.assign({ zona: zona, mapa: mapa, inicio: { x: x, y: y, dir: dir }, programa: prog, titulo: 'Demostración' }, extra || {});
  }
  var DEMOS = {
    'avanzar': dm('jardin', ['...G'], 0, 0, 'E', [A, A, A]),
    'retroceder': dm('jardin', ['G...'], 3, 0, 'E', [D.B, D.B, D.B]),
    'girar-d': dm('jardin', ['..', '#G'], 0, 0, 'E', [A, G, A]),
    'girar-i': dm('jardin', ['#G', '..'], 0, 1, 'E', [A, Gi, A]),
    'saltar': dm('jardin', ['.~G'], 0, 0, 'E', [D.S]),
    'recoger': dm('jardin', ['.oG'], 0, 0, 'E', [A, D.R, A]),
    'activar': dm('jardin', ['.sdG'], 0, 0, 'E', [A, D.X, A, A]),
    'esperar': dm('jardin', ['..G'], 0, 0, 'E', [A, D.E, A]),
    'repetir': dm('jardin', ['.....G'], 0, 0, 'E', [D.rep(5, A)]),
    'si': dm('jardin', ['.o.G'], 0, 0, 'E', [D.rep(4, D.si(D.OA, [D.R], []), A)]),
    'mientras': dm('jardin', ['....G'], 0, 0, 'E', [D.mientras(D.no(D.MA), [A])]),
    'receta': dm('jardin', ['......G'], 0, 0, 'E', D.P([D.rec('A'), D.rec('A')], { A: [A, A, A] }))
  };
  // Explicaciones por pasos para las tarjetas de control: primero el problema, después la herramienta.
  var R = D.R;
  var PASOS = {
    'repetir': [
      { texto: 'Fíjate: para llegar tengo que dar el mismo paso una y otra vez. ¡Qué pesado!', demo: dm('jardin', ['......G'], 0, 0, 'E', [A, A, A, A, A, A]) },
      { texto: 'Con Repetir lo escribo una sola vez. El número dice cuántas veces; lo que pones dentro de la caja es lo que se repite.', demo: dm('jardin', ['......G'], 0, 0, 'E', [D.rep(6, A)]) },
      { texto: 'Truco: busca qué grupo de tarjetas se repite y cuántas veces. Aquí se repite «avanzar, recoger, avanzar» tres veces.', demo: dm('jardin', ['.o.o.o.G'], 0, 0, 'E', [D.rep(3, A, R, A), A]) }
    ],
    'si': [
      { texto: 'A veces el camino cambia: en unas casillas hay una luz y en otras no. Con Si, Lumo mira y recoge solo si hay luz.', demo: dm('jardin', ['.o.G'], 0, 0, 'E', [D.rep(4, D.si(D.OA, [R], []), A)]) },
      { texto: 'Si tiene dos partes: lo que hace si se cumple y lo que hace si no. Aquí: si hay agua delante, salta; si no, avanza.', demo: dm('jardin', ['..~..G'], 0, 0, 'E', [D.rep(4, D.si(D.AG, [D.S], [A]))]) }
    ],
    'mientras': [
      { texto: 'Repetir necesita un número. Pero ¿y si no sé cuántos pasos hay? Entonces uso Mientras.', demo: dm('jardin', ['....G'], 0, 0, 'E', [D.mientras(D.no(D.MA), [A])]) },
      { texto: 'Mientras mira la condición antes de cada vuelta. Aquí: mientras no haya un muro delante, avanzar. Cuando hay muro, para.', demo: dm('jardin', ['....G#'], 0, 0, 'E', [D.mientras(D.no(D.OB), [A])]) }
    ],
    'receta': [
      { texto: 'Mira: escribo el mismo grupo de tarjetas dos veces. Si el grupo fuera más largo, sería un lío.', demo: dm('jardin', ['......G'], 0, 0, 'E', [A, A, A, A, A, A]) },
      { texto: 'Una receta guarda un grupo de tarjetas con una letra. Cada vez que uso la letra, Lumo hace todo el grupo.', demo: dm('jardin', ['......G'], 0, 0, 'E', D.P([D.rec('A'), D.rec('A')], { A: [A, A, A] })) }
    ]
  };
  var TEXTOS = {
    'avanzar': 'Avanzar: Lumo da un paso hacia donde mira.',
    'retroceder': 'Retroceder: Lumo da un paso hacia atrás sin girarse.',
    'girar-d': 'Girar a la derecha: Lumo gira sin moverse de sitio.',
    'girar-i': 'Girar a la izquierda: Lumo gira sin moverse de sitio.',
    'saltar': 'Saltar: Lumo pasa por encima de lo que tiene delante.',
    'recoger': 'Recoger: Lumo coge lo que hay en su casilla.',
    'activar': 'Activar: Lumo pulsa el interruptor y las puertas se abren.',
    'esperar': 'Esperar: Lumo se queda quieto un momento.',
    'repetir': 'Repetir: hace lo de dentro tantas veces como indiques.',
    'si': 'Si: Lumo mira y elige. Si se cumple, hace una cosa; si no, otra.',
    'mientras': 'Mientras: Lumo repite hasta que la condición deje de cumplirse.',
    'receta': 'Receta: guarda unas tarjetas con un nombre y úsalas cuando quieras.'
  };
  // Frases cortas para Infantil (voz), sin tecnicismos.
  var VOZ_INFANTIL = {
    'avanzar': 'Esta tarjeta me hace andar. ¡Mira!',
    'girar-d': 'Esta tarjeta me hace girar. ¡Mira!',
    'girar-i': 'Esta tarjeta me hace girar. ¡Mira!',
    'saltar': 'Esta tarjeta me hace saltar. ¡Mira!',
    'recoger': 'Esta tarjeta me deja coger cosas. ¡Mira!',
    'esperar': 'Esta tarjeta me hace esperar. ¡Mira!'
  };
  return { DEMOS: DEMOS, PASOS: PASOS, TEXTOS: TEXTOS, VOZ_INFANTIL: VOZ_INFANTIL };
});


/* ===== src/datos/retos.js ===== */
;/*
 * RUMBO — Retos creados en el Laboratorio: formato, validación, código para compartir.
 * Módulo puro (sin DOM): se prueba en Node. Usa el MISMO intérprete que los niveles del juego.
 *
 * Un reto es { id, nombre, autor, ciclo, zona, mapa, inicio, referencia, creado }.
 *   - mapa: lista de cadenas con . # ~ b G o s d   (una sola meta; la salida de Lumo va en `inicio`)
 *   - referencia: el programa con el que su autor comprobó que el reto se puede resolver.
 *   - ciclo: 'inf' | 'c1' | 'c2' | 'c3' (decide las tarjetas disponibles, igual que en los mundos).
 * Un reto sin solución comprobada NO se puede guardar ni importar.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) { api = factory(require('../engine/interprete.js')); module.exports = api; } else { root.RumboRetos = factory(root.RumboInterprete); }
})(typeof self !== 'undefined' ? self : this, function (I) {
  'use strict';

  var CONDS = ['obstaculo-delante', 'agua-delante', 'objeto-aqui', 'interruptor-aqui', 'meta-aqui'];
  var CICLOS = {
    inf: { nombre: 'Infantil', etapa: 'infantil', cartas: ['avanzar', 'girar-d', 'girar-i', 'saltar', 'recoger'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'objeto', 'borrar'], tam: [3, 5], zonas: ['jardin', 'granja', 'playa'] },
    c1: { nombre: 'Primer ciclo', etapa: 'primaria-1c', cartas: ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger', 'activar', 'esperar', 'repetir'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'barrera', 'objeto', 'interruptor', 'puerta', 'borrar'], tam: [3, 7], zonas: ['bosque', 'montanas'] },
    c2: { nombre: 'Segundo ciclo', etapa: 'primaria-2c', cartas: ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger', 'activar', 'esperar', 'repetir', 'si', 'receta'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'barrera', 'objeto', 'interruptor', 'puerta', 'borrar'], tam: [3, 8], zonas: ['mar', 'volcan'], recetas: ['A'], condiciones: CONDS },
    c3: { nombre: 'Tercer ciclo', etapa: 'primaria-3c', cartas: ['avanzar', 'retroceder', 'girar-i', 'girar-d', 'saltar', 'recoger', 'activar', 'esperar', 'repetir', 'si', 'mientras', 'receta'], herramientas: ['inicio', 'meta', 'pared', 'agua', 'barrera', 'objeto', 'interruptor', 'puerta', 'borrar'], tam: [3, 9], zonas: ['ciudad', 'espacio', 'faro'], recetas: ['A', 'B'], condiciones: CONDS }
  };
  var ZONAS = ['jardin', 'granja', 'playa', 'bosque', 'montanas', 'mar', 'volcan', 'ciudad', 'espacio', 'faro'];
  var CELDAS = '.#~bGosd';
  var DIRS = ['N', 'E', 'S', 'O'];

  function cicloDe(curso) {
    if (!curso) return 'c1';
    if (String(curso).indexOf('inf') === 0) return 'inf';
    return { p1: 'c1', p2: 'c1', p3: 'c2', p4: 'c2', p5: 'c3', p6: 'c3' }[curso] || 'c1';
  }

  function limpiarTexto(t, max) {
    return String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function nodos(prog) { return I.contarTarjetas(prog); }
  function cartasUsadas(prog) {
    var u = {}; I.recorrer(prog, function (n) { u[n.t] = true; }); return Object.keys(u);
  }

  function retoANivel(reto) {
    var c = CICLOS[reto.ciclo];
    var n = nodos(reto.referencia);
    var nivel = {
      id: 'lab-' + reto.id, etapa: c.etapa, titulo: reto.nombre, zona: reto.zona, tipo: 'normal',
      objetivo: reto.mapa.join('').indexOf('o') >= 0 ? 'Recoge todo y llega a la meta.' : 'Lleva a Lumo hasta la meta.',
      mapa: reto.mapa, inicio: reto.inicio,
      cartas: { disponibles: c.cartas.slice() },
      referencia: reto.referencia
    };
    if (c.recetas) nivel.cartas.recetas = c.recetas.slice();
    if (c.condiciones) nivel.cartas.condiciones = c.condiciones.slice();
    if (c.etapa === 'infantil') nivel.huecos = Math.min(8, Math.max(4, n + 2));
    else nivel.estrellas = { s2max: n + 2, s3: { tipo: 'referencia' } };
    return nivel;
  }

  // Devuelve { ok:true, reto } o { ok:false, motivo }
  function validar(r) {
    if (!r || typeof r !== 'object') return { ok: false, motivo: 'formato' };
    var ciclo = r.ciclo; if (!CICLOS[ciclo]) return { ok: false, motivo: 'ciclo' };
    var C = CICLOS[ciclo];
    if (ZONAS.indexOf(r.zona) < 0) return { ok: false, motivo: 'zona' };
    if (!Array.isArray(r.mapa) || r.mapa.length < 2 || r.mapa.length > 12) return { ok: false, motivo: 'mapa' };
    var w = r.mapa[0] && r.mapa[0].length, metas = 0;
    for (var y = 0; y < r.mapa.length; y++) {
      if (typeof r.mapa[y] !== 'string' || r.mapa[y].length !== w || w < 2 || w > 12) return { ok: false, motivo: 'mapa' };
      for (var x = 0; x < w; x++) { var ch = r.mapa[y].charAt(x); if (CELDAS.indexOf(ch) < 0) return { ok: false, motivo: 'mapa' }; if (ch === 'G') metas++; }
    }
    if (metas !== 1) return { ok: false, motivo: 'meta' };
    var ini = r.inicio;
    if (!ini || typeof ini.x !== 'number' || typeof ini.y !== 'number' || DIRS.indexOf(ini.dir) < 0 || ini.x < 0 || ini.y < 0 || ini.x >= w || ini.y >= r.mapa.length) return { ok: false, motivo: 'inicio' };
    var ci = r.mapa[ini.y].charAt(ini.x);
    if (ci !== '.' && ci !== 'o') return { ok: false, motivo: 'inicio' };
    var prog = r.referencia;
    var okForma = Array.isArray(prog) || (prog && Array.isArray(prog.principal));
    if (!okForma) return { ok: false, motivo: 'solucion' };
    var total;
    try { total = nodos(prog); } catch (e) { return { ok: false, motivo: 'solucion' }; }
    if (!(total >= 1 && total <= 300)) return { ok: false, motivo: 'solucion' };
    var usadas = cartasUsadas(prog);
    for (var i = 0; i < usadas.length; i++) if (C.cartas.indexOf(usadas[i]) < 0) return { ok: false, motivo: 'tarjetas' };
    var res;
    try { res = I.ejecutar({ mapa: r.mapa, inicio: ini }, prog); } catch (e2) { return { ok: false, motivo: 'solucion' }; }
    if (!res.ok) return { ok: false, motivo: 'sin-solucion' };
    var limpio = {
      id: limpiarTexto(r.id, 24).replace(/[^\w-]/g, '') || ('r' + Date.now().toString(36)),
      nombre: limpiarTexto(r.nombre, 30) || 'Reto sin nombre', autor: limpiarTexto(r.autor, 20) || 'Anónimo',
      ciclo: ciclo, zona: r.zona, mapa: r.mapa.slice(), inicio: { x: ini.x, y: ini.y, dir: ini.dir },
      referencia: JSON.parse(JSON.stringify(prog)), creado: typeof r.creado === 'number' ? r.creado : Date.now()
    };
    return { ok: true, reto: limpio };
  }

  var MENSAJES = {
    formato: 'El código no tiene el formato de un reto.', ciclo: 'El nivel del reto no es válido.', zona: 'El escenario del reto no es válido.',
    mapa: 'El tablero del reto no es válido.', meta: 'El reto debe tener una sola meta.', inicio: 'La posición inicial de Lumo no es válida.',
    solucion: 'La solución guardada en el reto no es válida.', tarjetas: 'La solución usa tarjetas que ese nivel no tiene.',
    'sin-solucion': 'Este reto no se puede resolver: la solución no llega a la meta.', copia: 'El código está incompleto o cambiado. Cópialo de nuevo.'
  };

  // ---------- código para compartir ----------
  var PREFIJO = 'RUMBO1';
  function crc(s) { var a = 0x811c, b = 0x9dc5; for (var i = 0; i < s.length; i++) { a = (a * 31 + s.charCodeAt(i)) & 0xffff; b = (b * 17 + a + s.charCodeAt(i)) & 0xffff; } return ((a << 16 | b) >>> 0).toString(16).padStart(8, '0'); }
  function aB64(txt) {
    var bytes = new TextEncoder().encode(txt), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function deB64(b64) {
    var s = String(b64).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '=';
    var bin = atob(s), bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function codificar(reto) {
    var min = { n: reto.nombre, a: reto.autor, c: reto.ciclo, z: reto.zona, m: reto.mapa, i: [reto.inicio.x, reto.inicio.y, reto.inicio.dir], r: reto.referencia };
    var cuerpo = aB64(JSON.stringify(min));
    return PREFIJO + '.' + cuerpo + '.' + crc(cuerpo);
  }
  function decodificar(texto) {
    var t = String(texto == null ? '' : texto).trim();
    if (t.charAt(0) === '{') { try { var o = JSON.parse(t); if (o && typeof o.codigo === 'string') t = o.codigo.trim(); } catch (e) { return { ok: false, motivo: 'formato' }; } }
    t = t.replace(/\s+/g, '');
    var partes = t.split('.');
    if (partes.length !== 3 || partes[0] !== PREFIJO) return { ok: false, motivo: 'formato' };
    if (crc(partes[1]) !== partes[2]) return { ok: false, motivo: 'copia' };
    var min;
    try { min = JSON.parse(deB64(partes[1])); } catch (e) { return { ok: false, motivo: 'copia' }; }
    if (!min || !Array.isArray(min.i)) return { ok: false, motivo: 'formato' };
    return validar({ nombre: min.n, autor: min.a, ciclo: min.c, zona: min.z, mapa: min.m, inicio: { x: min.i[0], y: min.i[1], dir: min.i[2] }, referencia: min.r });
  }

  return { CICLOS: CICLOS, ZONAS: ZONAS, cicloDe: cicloDe, retoANivel: retoANivel, validar: validar, codificar: codificar, decodificar: decodificar, MENSAJES: MENSAJES, limpiarTexto: limpiarTexto };
});


/* ===== src/datos/niveles-infantil.js ===== */
;/*
 * RUMBO — Mundo 0: Pequeños exploradores (Educación Infantil, 3-5 años).
 * 15 retos en tres itinerarios de 5. Sin lectura: la voz y las imágenes son la instrucción.
 * Aquí NO hay bucles, condiciones ni variables: la repetición se trabaja como patrón visual.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesInfantil = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, G = D.D, I = D.I, R = D.R;
  var L = D.nivel;

  function inf(def) {
    def.e = 'infantil';
    def.huecos = def.huecos || def.ref.length;
    return L(def);
  }

  return [
    // ======== 3 años: Pequeños exploradores (una o dos acciones) ========
    inf({ id: 'i3-01', it: 3, tt: 'La flor', z: 'jardin', skin: { meta: 'flor' },
      m: ['>G'], c: ['avanzar'], ref: [A],
      o: 'Ayuda a Lumo a llegar hasta la flor.', i: 'Lumo quiere oler una flor.',
      cur: ['inf14'], ext: ['Asociar una imagen con una acción', 'Causa y efecto: pulso y Lumo se mueve'] }),
    inf({ id: 'i3-02', it: 3, tt: 'La zanahoria', z: 'jardin', skin: { meta: 'zanahoria' },
      m: ['>.G'], c: ['avanzar'], ref: [A, A],
      o: 'Lleva a Lumo hasta la zanahoria.', i: 'Lumo tiene mucha hambre.',
      cur: ['inf14', 'inf15'], ext: ['Repetir una misma acción dos veces'] }),
    inf({ id: 'i3-03', it: 3, tt: 'Hacia arriba', z: 'jardin', skin: { meta: 'arbol' },
      m: ['G', '^'], c: ['avanzar', 'girar-d'], ref: [A], huecos: 1,
      o: 'Lleva a Lumo hasta el árbol.', i: 'El árbol está arriba.',
      cur: ['inf14', 'inf11'], ext: ['Elegir entre dos tarjetas'] }),
    inf({ id: 'i3-04', it: 3, tt: 'Un giro', z: 'jardin', skin: { meta: 'casa' },
      m: ['>.', 'G.'], c: ['avanzar', 'girar-d'], ref: [G, A],
      o: 'Gira y llega hasta la casa.', i: 'La casa está abajo.',
      cur: ['inf14'], ext: ['Primer giro: la dirección cambia con una tarjeta'] }),
    inf({ id: 'i3-05', it: 3, tt: 'La fruta', z: 'jardin', skin: { meta: 'casa', obj: 'fruta' },
      m: [')G'], c: ['avanzar', 'recoger'], ref: [R, A],
      o: 'Recoge la fruta y ve a la casa.', i: 'Lumo ha encontrado una fruta.',
      cur: ['inf11', 'inf15'], ext: ['Orden: primero recoger, luego avanzar'] }),

    // ======== 4 años: Aventureros del camino (dos a cuatro tarjetas) ========
    inf({ id: 'i4-01', it: 4, tt: 'El camino torcido', z: 'granja', skin: { meta: 'casa' },
      m: ['>.', '#G'], c: ['avanzar', 'girar-d'], ref: [A, G, A],
      o: 'Sigue el camino hasta la casa.', i: 'El camino tiene una curva.',
      cur: ['inf14', 'inf15'], ext: ['Secuencia de tres acciones'] }),
    inf({ id: 'i4-02', it: 4, tt: 'La zanahoria del camino', z: 'granja', skin: { meta: 'casa', obj: 'zanahoria' },
      m: ['>oG'], c: ['avanzar', 'recoger'], ref: [A, R, A],
      o: 'Recoge la zanahoria y llega a la casa.', i: 'Hay una zanahoria en medio.',
      cur: ['inf11', 'inf15'], ext: ['Ordenar acciones: mover, recoger, mover'] }),
    inf({ id: 'i4-03', it: 4, tt: 'Ordena las tarjetas', z: 'granja', skin: { meta: 'casa' }, tipo: 'depurar',
      m: ['>.#', '#.#', '#G#'], c: ['avanzar', 'girar-d'], ref: [A, G, A, A], ini: [A, A, G, A],
      o: 'Las tarjetas están desordenadas. Ponlas bien.', i: 'Alguien ha movido las tarjetas.',
      cur: ['inf15'], ext: ['Detectar un error de orden y corregirlo'] }),
    inf({ id: 'i4-04', it: 4, tt: 'Cuidado con el agua', z: 'granja', skin: { meta: 'casa' },
      m: ['>.~', '#G#'], c: ['avanzar', 'girar-d'], ref: [A, G, A],
      o: 'Evita el agua y llega a la casa.', i: 'El agua está fría.',
      cur: ['inf14', 'inf15'], ext: ['Anticipar el resultado antes de ejecutar'] }),
    inf({ id: 'i4-05', it: 4, tt: 'Recoge y gira', z: 'granja', skin: { meta: 'casa', obj: 'zanahoria' },
      m: ['>o', '#G'], c: ['avanzar', 'recoger', 'girar-d'], ref: [A, R, G, A],
      o: 'Recoge la zanahoria, gira y llega.', i: 'Un camino pequeño con una sorpresa.',
      cur: ['inf11', 'inf14', 'inf15'], ext: ['Secuencia de cuatro acciones con tres tarjetas distintas'] }),

    // ======== 5 años: Guardianes de los patrones (tres a siete tarjetas) ========
    inf({ id: 'i5-01', it: 5, tt: 'Planifica el camino', z: 'playa', skin: { meta: 'cofre' },
      m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d', 'girar-i'], ref: [A, A, G, A, A],
      o: 'Planea el camino hasta el cofre.', i: 'Un cofre en la playa.',
      cur: ['inf14', 'inf15'], ext: ['Planificar antes de actuar', 'Anticipar el resultado de una secuencia'] }),
    inf({ id: 'i5-02', it: 5, tt: '¿Qué movimiento falta?', z: 'playa', skin: { meta: 'cofre' }, tipo: 'depurar',
      m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d', 'girar-i'], ref: [A, A, G, A, A], ini: [A, A, A, A],
      o: 'A la secuencia le falta una tarjeta. Colócala.', i: 'Una tarjeta se ha caído.',
      cur: ['inf15'], ext: ['Completar una secuencia: qué falta'] }),
    inf({ id: 'i5-03', it: 5, tt: 'Encuentra el error', z: 'playa', skin: { meta: 'cofre' }, tipo: 'depurar',
      m: ['#.G', '>.#'], c: ['avanzar', 'girar-d', 'girar-i'], ref: [A, I, A, G, A], ini: [A, G, A, G, A],
      o: 'Una tarjeta está mal. Cámbiala.', i: 'Lumo se ha equivocado de giro.',
      cur: ['inf15'], ext: ['Detectar y corregir un error en una secuencia'] }),
    inf({ id: 'i5-04', it: 5, tt: 'Repite el patrón', z: 'playa', skin: { meta: 'cofre', obj: 'concha' },
      m: ['>oooG'], c: ['avanzar', 'recoger'], ref: [A, R, A, R, A, R, A], ini: [A, R, A, R],
      o: 'Sigue el patrón: avanza, recoge, avanza, recoge…', i: 'Las conchas siguen un patrón.',
      cur: ['inf11', 'inf15'], ext: ['Reconocer y continuar un patrón repetitivo'] }),
    inf({ id: 'i5-05', it: 5, tt: 'El tesoro', z: 'playa', skin: { meta: 'cofre', obj: 'concha' },
      m: ['>.o', '##.', '..G'], c: ['avanzar', 'recoger', 'girar-d', 'girar-i'], ref: [A, A, R, G, A, A],
      o: 'Recoge la concha y llega al tesoro.', i: 'El tesoro está cerca.',
      cur: ['inf11', 'inf14', 'inf15'], ext: ['Planificar un recorrido con un objetivo intermedio'] })
  ];
});


/* ===== src/datos/niveles-m1.js ===== */
;/*
 * RUMBO — Mundo 1: Primeros programadores (1.er ciclo, 1.º y 2.º de Primaria). 25 niveles.
 * Zonas: Bosque encantado (1-13) y Reino de las montañas (14-25).
 * Cada tarjeta nueva aparece por primera vez en el nivel donde se enseña.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesM1 = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X, rep = D.rep;

  function m1(def, n) {
    def.e = 'primaria-1c';
    def.z = n <= 13 ? 'bosque' : 'montanas';
    def.id = 'm1-' + (n < 10 ? '0' : '') + n;
    return D.nivel(def);
  }

  var ALL = ['avanzar', 'girar-d', 'girar-i'];
  var ORI = ['avanzar', 'girar-d', 'girar-i', 'recoger'];

  return [
    // ---- Bloque 1. Primeros movimientos ----
    m1({ tt: 'El primer paso', b: 1, m: ['>..G'], c: ['avanzar'], ref: [A, A, A],
      o: 'Lleva a Lumo hasta la meta.', i: 'Lumo despierta en el bosque. Su brújula brilla poquito.',
      cur: ['m1_41', 'saber23'], ext: ['Una tarjeta = una acción'] }, 1),
    m1({ tt: 'Hacia abajo', b: 1, m: ['v', '.', '.', '.', 'G'], c: ['avanzar'], ref: [A, A, A, A],
      o: 'Lumo mira hacia abajo. Llévalo a la meta.', i: 'Las luciérnagas se han ido por el camino.',
      cur: ['m1_41', 'saber23'], ext: ['La dirección de Lumo importa'] }, 2),
    m1({ tt: 'Marcha atrás', b: 1, m: ['G..>.'], c: ['avanzar', 'retroceder'], ref: [B, B, B],
      o: 'La meta está detrás. Usa una tarjeta nueva.', i: 'Lumo se ha pasado de camino.',
      p: ['La meta está a la espalda de Lumo.', 'Retroceder mueve a Lumo hacia atrás sin girar.', 'Necesitas tres tarjetas de Retroceder.'],
      cur: ['m1_41', 'saber23'], ext: ['Retroceder: una nueva instrucción'] }, 3),

    // ---- Bloque 2. Giros y secuencias ----
    m1({ tt: 'La primera curva', b: 2, m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d'], ref: [A, A, G, A, A], h: 'giro',
      o: 'Gira a la derecha cuando llegues a la esquina.', i: 'El camino del bosque da una curva.',
      cur: ['m1_41', 'saber23'], ext: ['Giro a la derecha', 'Secuencia de cinco instrucciones'] }, 4),
    m1({ tt: 'Curva hacia arriba', b: 2, m: ['##G', '##.', '>..'], c: ALL, ref: [A, A, I, A, A], h: 'giro',
      o: 'Ahora el camino sube. Gira a la izquierda.', i: 'Otra curva, pero hacia el otro lado.',
      cur: ['m1_41', 'saber23'], ext: ['Giro a la izquierda'] }, 5),
    m1({ tt: 'El camino en S', b: 2, m: ['>..', '##.', 'G..'], c: ALL, ref: [A, A, G, A, A, G, A, A], h: 'giro',
      o: 'Sigue el camino en forma de S.', i: 'El sendero zigzaguea entre los árboles.',
      cur: ['m1_41', 'm1_42', 'saber23'], ext: ['Secuencias más largas: ocho instrucciones'] }, 6),

    // ---- Bloque 3. Orientación ----
    m1({ tt: 'Lumo mira hacia abajo', b: 3, m: ['v..G'], c: ALL, ref: [I, A, A, A], h: 'giro',
      o: 'Lumo mira hacia abajo, pero la meta está a su izquierda… ¡de la pantalla!', i: 'Lumo tiene que pensar desde su propio sitio.',
      p: ['Imagina que eres Lumo y mira hacia donde mira él.', 'La meta queda a su izquierda: ¿qué giro necesitas?', 'Gira primero, luego avanza tres veces.'],
      cur: ['m1_41', 'saber23'], ext: ['Orientación: izquierda y derecha desde el punto de vista de Lumo'] }, 7),
    m1({ tt: 'Dar la vuelta', b: 3, m: ['^', '.', '.', 'G'], c: ALL, ref: [I, I, A, A, A], h: 'giro',
      o: 'La meta está detrás. Hazle dar la vuelta.', i: 'Lumo se ha dado la vuelta sin querer.',
      p: ['La meta está justo detrás de Lumo.', 'Para dar la vuelta hacen falta dos giros.', 'Gira dos veces y avanza tres.'],
      cur: ['m1_41', 'saber23'], ext: ['Dos giros seguidos = media vuelta'] }, 8),

    // ---- Bloque 4. Recogida de objetos ----
    m1({ tt: 'La primera luciérnaga', b: 4, m: ['>.o.G'], c: ORI, ref: [A, A, R, A, A], h: 'obj',
      o: 'Recoge la luciérnaga antes de llegar a la meta.', i: 'Una luciérnaga está atrapada.',
      cur: ['m1_41', 'saber23'], ext: ['Recoger: una nueva instrucción'] }, 9),
    m1({ tt: 'Dos seguidas', b: 4, m: ['>oo.G'], c: ORI, ref: [A, R, A, R, A, A], h: 'obj',
      o: 'Hay dos luciérnagas seguidas. Recoge las dos.', i: 'Siguen una detrás de otra.',
      cur: ['m1_41', 'm1_42'], ext: ['Reconocer una pareja de acciones que se repite'] }, 10),
    m1({ tt: 'Recoger y girar', b: 4, m: ['..G', '>o.'], c: ORI, ref: [A, R, A, I, A], h: 'obj',
      o: 'Recoge la luciérnaga y sube hasta la meta.', i: 'La meta está arriba, pero la luz está en el camino.',
      cur: ['m1_41', 'saber23'], ext: ['Combinar recogida y giro'] }, 11),

    // ---- Bloque 5. Obstáculos ----
    m1({ tt: 'Un muro en medio', b: 5, m: ['>#G', '...'], c: ALL, ref: [G, A, I, A, A, I, A], h: 'obs',
      o: 'Hay un muro. Rodéalo por abajo.', i: 'Un muro de piedra bloquea el camino.',
      cur: ['m1_41', 'm1_42'], ext: ['Planificar un rodeo antes de ejecutar'] }, 12),
    m1({ tt: 'Cuidado con el agua', b: 5, m: ['>.~G', '....'], c: ALL, ref: [A, G, A, I, A, A, I, A], h: 'obs',
      o: 'No pises el agua. Busca otro camino.', i: 'Un arroyo cruza el bosque.',
      cur: ['m1_41', 'm1_42'], ext: ['Anticipar el resultado: el agua detiene a Lumo'] }, 13),
    m1({ tt: '¡A saltar!', b: 5, m: ['>.~G'], c: ['avanzar', 'saltar'], ref: [A, S], h: 'saltar',
      o: 'Salta el arroyo con una tarjeta nueva.', i: 'En las montañas, saltar será muy útil.',
      cur: ['m1_41', 'saber23'], ext: ['Saltar: una instrucción que hace en un paso lo que antes costaba ocho'] }, 14),

    // ---- Bloque 6. Patrones y repetición ----
    m1({ tt: 'Escalera repetida', b: 6, m: ['>.##', '#..#', '##..', '###G'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, A, G, A, I)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'La escalera repite un patrón. Usa Repetir.', i: 'La escalera de piedra repite siempre lo mismo.',
      cur: ['m1_41', 'm1_42', 'saber23'], ext: ['Primera repetición visual: repetir un patrón varias veces'] }, 15),
    m1({ tt: 'Luciérnagas en fila', b: 6, m: ['>ooooG'], c: ['avanzar', 'recoger', 'repetir'],
      ref: [rep(4, A, R), A], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Cuatro luciérnagas. ¿Qué se repite?', i: 'Cuatro luces en fila, igual que cuatro notas.',
      cur: ['m1_41', 'm1_42'], ext: ['Bucle con dos acciones'] }, 16),
    m1({ tt: 'Piedras del río', b: 6, m: ['>~.~.~.G'], c: ['avanzar', 'saltar', 'repetir'],
      ref: [rep(3, S), A], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Cruza el río saltando de piedra en piedra.', i: 'Hay piedras para cruzar el río, una sí y otra no.',
      cur: ['m1_41', 'm1_42'], ext: ['Repetir una sola acción'] }, 17),

    // ---- Bloque 7. Depuración ----
    m1({ tt: 'Tarjetas cambiadas', b: 7, m: ['>..', '##.', '##G'], c: ALL, ref: [A, A, G, A, A], ini: [A, G, A, A, A], h: 'depurar',
      o: 'Bichito ha desordenado el programa. Arréglalo.', i: '¡Ji, ji! Bichito ha cambiado las tarjetas de sitio.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar: instrucciones desordenadas'] }, 18),
    m1({ tt: 'Giro equivocado', b: 7, m: ['####G', '####.', '>....'], c: ALL, ref: [A, A, A, A, I, A, A], ini: [A, A, A, A, G, A, A], h: 'depurar',
      o: 'Hay una tarjeta que no es la correcta. Cámbiala.', i: 'Bichito ha cambiado un giro.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar: una instrucción incorrecta'] }, 19),
    m1({ tt: 'Falta una tarjeta', b: 7, m: ['>..', '##.', 'G..'], c: ALL, ref: [A, A, G, A, A, G, A, A], ini: [A, A, G, A, A, G, A], h: 'depurar',
      o: 'Al programa le falta algo para llegar. Complétalo.', i: 'Bichito se ha comido una tarjeta.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar: una instrucción que falta'] }, 20),

    // ---- Bloque 8. Mecanismos ----
    m1({ tt: 'La puerta de piedra', b: 8, m: ['>.s.dG'], c: ['avanzar', 'activar'], ref: [A, A, X, A, A, A], h: 'mecanismo',
      o: 'Pisa el interruptor y actívalo para abrir la puerta.', i: 'Una puerta cierra el paso al faro.',
      cur: ['m1_41', 'saber23'], ext: ['Activar un mecanismo: causa y efecto'] }, 21),
    m1({ tt: 'El interruptor escondido', b: 8, m: ['#s##', '>.dG'], c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'activar'],
      ref: [A, I, A, X, B, G, A, A], holgura: 2, h: 'mecanismo',
      o: 'El interruptor está en un hueco. Actívalo y vuelve.', i: 'El interruptor se esconde en un hueco.',
      cur: ['m1_41', 'm1_42'], ext: ['Planificar el orden: ir, activar, volver'] }, 22),

    // ---- Bloque 10. Grandes desafíos ----
    m1({ tt: 'El gran salto', b: 10, m: ['>o.~o.~G'], c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      ref: [A, rep(2, R, A, S)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'optim',
      o: 'Recoge las dos luces saltando. ¡Busca el patrón!', i: 'En las montañas, las luces están sobre abismos.',
      cur: ['m1_41', 'm1_42'], ext: ['Encontrar un patrón dentro de una secuencia más larga'] }, 23),
    m1({ tt: 'Bucle mal contado', b: 10, m: ['>ooooG'], c: ['avanzar', 'recoger', 'repetir'],
      ref: [rep(4, A, R), A], ini: [rep(3, A, R), A], lim: { repetir: 1 }, holgura: 1, h: 'depurar',
      p: ['El bucle repite poco: ejecútalo y mira dónde se queda Lumo.', 'Hay cuatro luces. ¿Cuántas veces se repite el bucle?', 'Cambia el número de Repetir a 4.'],
      o: 'El bucle no repite las veces justas. Corrígelo.', i: 'La brújula de Lumo cuenta mal.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Depurar un bucle: cambiar el número de repeticiones'] }, 24),
    m1({ tt: 'La escalera de luz', b: 10, m: ['>o###', '#.o##', '##.o#', '###.G'], c: ['avanzar', 'recoger', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, A, R, G, A, I), A], lim: { repetir: 1 }, holgura: 2, usa: 'repetir', h: 'optim',
      o: 'Tres luces en escalera. ¡Encuentra el patrón!', i: 'La última escalera lleva a la cumbre.',
      cur: ['m1_41', 'm1_42', 'm1_cm'], ext: ['Gran desafío: patrón de cinco tarjetas repetido tres veces'] }, 25)
  ];
});


/* ===== src/datos/niveles-m2.js ===== */
;/*
 * RUMBO — Mundo 2: Maestros del código (2.º ciclo, 3.º y 4.º de Primaria). 25 niveles.
 * Zonas: Mundo submarino (1-13) e Isla volcánica (14-25).
 * Aquí aparecen: bucles con cantidades distintas, descomposición, recetas (extensión del juego)
 * y las primeras condiciones (anticipación del tercer ciclo).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesM2 = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X, rep = D.rep, si = D.si, rec = D.rec;
  var OB = D.OB, AG = D.AG, P = D.P;

  function m2(def, n) {
    def.e = 'primaria-2c';
    def.z = n <= 13 ? 'mar' : 'volcan';
    def.id = 'm2-' + (n < 10 ? '0' : '') + n;
    return D.nivel(def);
  }

  var MOV = ['avanzar', 'girar-d', 'girar-i', 'repetir'];
  var BASE = ['avanzar', 'girar-d', 'girar-i', 'recoger', 'repetir'];
  var NICHOS = ['>.......G', '##o#o#o##'];
  var NICHOS_ARR = ['####o####', '>.......G', '##o###o##'];
  var NICHO_REC = [D.D, A, R, B, I];

  return [
    // ---- Bloque 1. Bucles para recorridos largos ----
    m2({ tt: 'El camino largo', b: 1, m: ['>.........G'], c: ['avanzar', 'repetir'],
      ref: [rep(10, A)], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Diez pasos son muchos. ¿Hay una forma más corta?', i: 'Tinta ha construido un túnel submarino larguísimo.',
      cur: ['m2_41', 'm2_42', 'saber23'], ext: ['Repetir con una cantidad grande'] }, 1),
    m2({ tt: 'Dos tramos', b: 1, m: ['>.....', '#####.', '#####.', '#####G'], c: MOV,
      ref: [rep(5, A), G, rep(3, A)], lim: { repetir: 2 }, holgura: 1, h: 'bucle',
      o: 'Cada tramo es una repetición distinta.', i: 'El túnel tiene un codo.',
      cur: ['m2_41', 'm2_42'], ext: ['Dos bucles con cantidades diferentes'] }, 2),
    m2({ tt: 'Escalera grande', b: 1, m: ['>.####', '#..###', '##..##', '###..#', '####..', '#####G'], c: MOV,
      ref: [rep(5, A, G, A, I)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Una escalera enorme. ¡Hay un patrón que se repite!', i: 'Las escaleras de coral nunca se acaban.',
      cur: ['m2_41', 'm2_42'], ext: ['Reconocer un patrón de cuatro tarjetas'] }, 3),

    // ---- Bloque 2. Bucles y patrones ----
    m2({ tt: 'Anillo de coral', b: 2, m: ['>...', '###.', '###.', 'G...'], c: MOV,
      ref: [rep(3, A, A, A, G)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Tres lados iguales. Repite el patrón.', i: 'Un anillo de coral rodea la isla.',
      cur: ['m2_41', 'm2_42'], ext: ['Patrón con avance y giro repetido tres veces'] }, 4),
    m2({ tt: 'Tres tramos', b: 2, m: ['>...##', '###.##', '###.##', '###.##', '###.##', '###..G'], c: MOV,
      ref: [rep(3, A), G, rep(5, A), I, rep(2, A)], lim: { repetir: 3 }, holgura: 1, h: 'bucle',
      o: 'Cada tramo tiene su número de pasos.', i: 'Tinta dibuja el recorrido en la arena.',
      cur: ['m2_41', 'm2_42'], ext: ['Tres bucles con tres cantidades distintas'] }, 5),
    m2({ tt: 'Luces con huecos', b: 2, m: ['>.o.o.oG'], c: BASE,
      ref: [rep(3, A, A, R), A], lim: { repetir: 1 }, holgura: 1, h: 'bucle',
      o: 'Las luces están cada dos casillas.', i: 'Las medusas brillan de dos en dos.',
      cur: ['m2_41', 'm2_42'], ext: ['Patrón de tres acciones'] }, 6),
    m2({ tt: 'Recoge y cruza', b: 2, m: ['>ooo~.~.G'], c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      ref: [rep(3, A, R), rep(2, S), A], lim: { repetir: 2 }, holgura: 1, h: 'bucle',
      o: 'Dos trozos distintos: recoger y saltar.', i: 'Perlas primero, corrientes después.',
      cur: ['m2_41', 'm2_42'], ext: ['Descomponer en dos partes y repetir cada una'] }, 7),
    m2({ tt: 'Dunas de arena', b: 2, m: ['>..####', '##...##', '####...', '######G'], c: MOV,
      ref: [rep(3, A, A, G, A, I)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Un zigzag que se repite. Cuenta los zigzags.', i: 'Las dunas submarinas suben y bajan.',
      cur: ['m2_41', 'm2_42'], ext: ['Patrón de cinco tarjetas'] }, 8),

    // ---- Bloque 3. Descomponer problemas ----
    m2({ tt: 'Tres salas', b: 3, m: ['>.os.d.oG'], c: ['avanzar', 'recoger', 'activar', 'repetir'],
      ref: [A, A, R, A, X, rep(4, A), R, A], lim: { repetir: 1 }, holgura: 2, h: 'mecanismo',
      p: ['Divide el problema: primera luz, interruptor, segunda luz.', 'Resuelve cada parte por separado y luego júntalas.', 'Después de activar, hay un tramo largo: usa Repetir.'],
      o: 'Resuelve cada parte por separado y júntalas.', i: 'Una puerta separa dos salas del barco hundido.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Descomposición: dividir un problema en partes más sencillas'] }, 9),
    m2({ tt: 'Los nichos', b: 3, m: NICHOS, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'],
      ref: [rep(3, A, A, G, A, R, B, I), A, A], lim: { repetir: 1 }, holgura: 2, h: 'bucle',
      o: 'Tres nichos con perlas. Cada visita es igual.', i: 'Cada nicho esconde una perla.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Descomposición: una visita al nicho se repite tres veces'] }, 10),

    // ---- Bloque 4. Recetas (bloques reutilizables) ----
    m2({ tt: 'La receta del nicho', b: 4, m: NICHOS, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'receta'], rec: ['A'],
      ref: P([A, A, rec('A'), A, A, rec('A'), A, A, rec('A'), A, A], { A: NICHO_REC }), holgura: 3, usa: 'receta', h: 'receta',
      o: 'Guarda la visita al nicho en la Receta A.', i: 'Tinta: «Una receta se hace una vez y se usa muchas».',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Receta: un bloque reutilizable (función) con nombre'] }, 11),
    m2({ tt: 'Dos recetas', b: 4, m: NICHOS_ARR, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'receta'], rec: ['A', 'B'],
      ref: P([A, A, rec('A'), A, A, rec('B'), A, A, rec('A'), A, A], { A: [G, A, R, B, I], B: [I, A, R, B, G] }), holgura: 4, usa: 'receta', h: 'receta',
      p: ['Hay nichos arriba y nichos abajo.', 'Una receta sirve para los de abajo y otra para los de arriba.', 'La Receta A gira a la derecha; la B, a la izquierda.'],
      o: 'Nichos arriba y abajo: usa dos recetas.', i: 'Algunos nichos están por encima del camino.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Dos recetas distintas'] }, 12),
    m2({ tt: 'Cinco nichos', b: 4, m: ['>...........G', '##o#o#o#o#o##'],
      c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir', 'receta'], rec: ['A'],
      ref: P([rep(5, A, A, rec('A')), A, A], { A: NICHO_REC }), lim: { repetir: 1 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Cinco nichos. Receta dentro de un bucle.', i: 'La grieta es larga y tiene muchos nichos.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Receta dentro de un bucle'] }, 13),

    // ---- Bloque 5. Mecanismos (isla volcánica) ----
    m2({ tt: 'La puerta de lava', b: 5, m: ['>.s.d.....G'], c: ['avanzar', 'activar', 'repetir'],
      ref: [A, A, X, A, A, rep(6, A)], lim: { repetir: 1 }, holgura: 1, h: 'mecanismo',
      o: 'Abre la puerta y cruza el largo pasillo.', i: 'El lagarto gigante guarda una puerta de roca.',
      cur: ['m2_41', 'm2_42'], ext: ['Mecanismo y bucle en el mismo programa'] }, 14),
    m2({ tt: 'Puerta y barrera', b: 5, m: ['>.s.d.b.G'], c: ['avanzar', 'activar', 'saltar', 'repetir'],
      ref: [A, A, X, rep(3, A), S, A], lim: { repetir: 1 }, holgura: 1, h: 'mecanismo',
      o: 'Una puerta que se abre y una barrera que se salta.', i: 'Dos obstáculos de lava, dos soluciones distintas.',
      cur: ['m2_41', 'm2_42'], ext: ['Elegir la acción adecuada para cada obstáculo'] }, 15),
    m2({ tt: 'Cruzar la lava', b: 5, m: ['>o.s.d.~.G'], c: ['avanzar', 'recoger', 'activar', 'saltar', 'repetir'],
      ref: [A, R, A, A, X, rep(3, A), S, A], lim: { repetir: 1 }, holgura: 2, h: 'mecanismo',
      o: 'Luz, interruptor, puerta y lava. Un paso cada vez.', i: 'El camino del volcán tiene de todo.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Planificar varios objetivos en orden'] }, 16),

    // ---- Bloque 6. Depuración y optimización ----
    m2({ tt: 'Un tramo corto', b: 6, m: ['>...##', '###.##', '###.##', '###.##', '###.##', '###..G'], c: MOV,
      ref: [rep(3, A), G, rep(5, A), I, rep(2, A)], ini: [rep(3, A), G, rep(4, A), I, rep(2, A)], lim: { repetir: 3 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta el programa y mira dónde se detiene Lumo.', 'Uno de los bucles repite menos veces de las necesarias.', 'Cuenta las casillas del segundo tramo: son cinco.'],
      o: 'Un bucle repite menos veces de las necesarias.', i: 'Bichito ha cambiado un número.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar: corregir el número de repeticiones'] }, 17),
    m2({ tt: 'Luces en mal orden', b: 6, m: ['>.o.o.oG'], c: BASE,
      ref: [rep(3, A, A, R), A], ini: [rep(3, A, R, A), A], lim: { repetir: 1 }, holgura: 1, h: 'depurar',
      p: ['Mira por dónde pasa Lumo: ¿recoge las luces?', 'Dentro del bucle, Recoger se ejecuta en el sitio equivocado.', 'Avanza dos veces y después recoge.'],
      o: 'Lumo pasa de largo sin recoger. Arregla el bucle.', i: 'Las medusas se esconden si se las busca tarde.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar: orden de las tarjetas dentro de un bucle'] }, 18),
    m2({ tt: 'Falta recoger', b: 6, m: ['>ooo~.~.G'], c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      ref: [rep(3, A, R), rep(2, S), A], ini: [rep(3, A), rep(2, S), A], lim: { repetir: 2 }, holgura: 1, h: 'depurar',
      p: ['Lumo llega a la meta, pero ¿se deja algo?', 'Faltan perlas por recoger: el primer bucle solo avanza.', 'Añade Recoger dentro del primer bucle.'],
      o: 'Lumo llega, pero deja las perlas. ¿Qué falta?', i: 'Una perla sin recoger es una pista perdida.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar: una instrucción que falta dentro de un bucle'] }, 19),
    m2({ tt: 'Receta rota', b: 6, m: NICHOS, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'receta'], rec: ['A'],
      ref: P([A, A, rec('A'), A, A, rec('A'), A, A, rec('A'), A, A], { A: NICHO_REC }),
      ini: P([A, A, rec('A'), A, A, rec('A'), A, A, rec('A'), A, A], { A: [G, A, R, I, B] }), holgura: 3, usa: 'receta', h: 'depurar',
      p: ['La receta se usa tres veces, así que su error se repite tres veces.', 'Mira la Receta A: Lumo sale del nicho en la dirección equivocada.', 'Después de retroceder se gira a la izquierda; no al revés.'],
      o: 'La receta tiene un fallo. Arréglala una vez.', i: 'Un fallo en una receta se repite cada vez que se usa.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Depurar una receta: corregir en un solo sitio'] }, 20),
    m2({ tt: 'Demasiadas tarjetas', b: 6, m: ['>...', '###.', '###.', 'G...'], c: MOV, tipo: 'optimizar',
      ref: [rep(3, A, A, A, G)], ini: [A, A, A, G, A, A, A, G, A, A, A], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'optim',
      o: 'Funciona, pero tiene demasiadas tarjetas. Acórtalo.', i: 'Tinta: «Un programa corto es un programa elegante».',
      cur: ['m2_41', 'm2_42'], ext: ['Optimizar: reducir tarjetas sin cambiar el resultado'] }, 21),

    // ---- Bloque 7. Condiciones (anticipación) ----
    m2({ tt: 'Gira si hay muro', b: 7, m: ['>....', '####.', 'G....'], c: ['avanzar', 'girar-d', 'repetir', 'si'], con: ['obstaculo-delante'],
      ref: [rep(20, si(OB, [G], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      o: 'Si hay un muro delante, gira. Si no, avanza.', i: 'El lagarto gigante: «Aquí las paredes mandan».',
      cur: ['m2_41', 'm2_42'], ext: ['Primera condición: si ocurre algo, haz una cosa; si no, otra'] }, 22),
    m2({ tt: 'Salta si hay lava', b: 7, m: ['>.~.~.~.G'], c: ['avanzar', 'saltar', 'repetir', 'si'], con: ['agua-delante'],
      ref: [rep(8, si(AG, [S], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      o: 'Si hay lava delante, salta. Si no, avanza.', i: 'Los ríos de lava aparecen cada dos casillas.',
      cur: ['m2_41', 'm2_42'], ext: ['Condición para decidir entre dos acciones'] }, 23),

    // ---- Bloque 10. Grandes desafíos ----
    m2({ tt: 'Los túneles del volcán', b: 10, m: ['>.o..', '####.', '..G#o', 'o###.', '..o..'], c: ['avanzar', 'girar-d', 'recoger', 'repetir', 'si'], con: ['obstaculo-delante'],
      ref: [rep(30, si(OB, [G], [A]), R)], lim: { repetir: 1, si: 1 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['El camino es una espiral y todos los giros son a la derecha.', 'Usa una condición: si hay muro, gira; si no, avanza. Y recoge siempre.', 'Mete la condición y Recoger dentro de un bucle largo.'],
      o: 'Una espiral con cuatro luces. Un programa que decide.', i: 'Los túneles forman una espiral hacia el corazón del volcán.',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Condición y bucle juntos: un algoritmo que decide por sí mismo'] }, 24),
    m2({ tt: 'El corazón del volcán', b: 10, m: ['>o.~o.~s.d.G'], c: ['avanzar', 'saltar', 'recoger', 'activar', 'repetir', 'si'], con: ['agua-delante'],
      ref: [rep(15, si(AG, [S], [A]), R, X)], lim: { repetir: 1, si: 1 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['Hay lava, luces, un interruptor y una puerta.', 'Un único bucle puede encargarse de todo: salta si hay lava, y recoge y activa siempre.', 'Dentro del bucle: Si lava, saltar; si no, avanzar. Después Recoger y Activar.'],
      o: 'Un solo bucle que lo haga todo.', i: 'El corazón del volcán late. ¡Último reto del mundo!',
      cur: ['m2_41', 'm2_42', 'm2_cm'], ext: ['Gran desafío: descomponer, generalizar y automatizar'] }, 25)
  ];
});


/* ===== src/datos/niveles-m3.js ===== */
;/*
 * RUMBO — Mundo 3: Expertos en algoritmos (3.er ciclo, 5.º y 6.º de Primaria). 25 niveles.
 * Zonas: Ciudad tecnológica (1-13) y Mundo espacial (14-25).
 * Bloques: anidados · condiciones y sensores · funciones (recetas) · optimización con límites ·
 * depuración avanzada · grandes desafíos.
 *
 * NO incluye variables, contadores ni parámetros: el motor actual no los tiene (ver README).
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesM3 = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X;
  var rep = D.rep, si = D.si, mientras = D.mientras, rec = D.rec, no = D.no, P = D.P;
  var OB = D.OB, AG = D.AG, OA = D.OA, IN = D.IN, MA = D.MA;

  function m3(def, n) {
    def.e = 'primaria-3c';
    def.z = n <= 13 ? 'ciudad' : 'espacio';
    def.id = 'm3-' + (n < 10 ? '0' : '') + n;
    return D.nivel(def);
  }

  var MOV = ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'repetir'];
  var ESCALERA = ['>...######', '###....###', '######....', '#########G'];
  var PLAZA = ['>....', '####.', '####.', '####.', 'G....'];
  var CURVAS = ['>.....', '#####.', '##G...'];
  var ESPIRAL = ['>.o..', '####.', '..G#o', 'o###.', '..o..'];
  var FILAS3 = ['>oo', '.oo', '.oo', 'G..'];
  var ARCA = ['avanzar', 'girar-d', 'girar-i', 'recoger', 'repetir', 'receta'];

  // Calentamiento: repaso suave para quien llega al Mundo 3 sin haber pasado por los anteriores.
  function cal(def, n) {
    def.e = 'primaria-3c';
    def.z = 'ciudad';
    def.b = 0;
    def.id = 'm3-p' + n;
    return D.nivel(def);
  }

  return [
    // ---- Bloque 0. Calentamiento (repaso de secuencias, giros, recoger y primer bucle) ----
    cal({ tt: 'Primeros pasos en la ciudad', m: ['>...G'], c: ['avanzar', 'girar-d', 'girar-i'],
      ref: [A, A, A, A], holgura: 1, h: 'seq',
      o: 'Lleva a Lumo hasta la meta.', i: 'Bit enseña a Lumo las calles de la ciudad tecnológica.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: secuencia corta'] }, 1),
    cal({ tt: 'Doblar la esquina', m: ['>..', '##.', '##G'], c: ['avanzar', 'girar-d', 'girar-i'],
      ref: [A, A, G, A, A], holgura: 1, h: 'giro',
      o: 'Gira en la esquina para llegar a la meta.', i: 'Las calles tienen esquinas.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: giros'] }, 2),
    cal({ tt: 'Paneles en la acera', m: ['>.o.o.G'], c: ['avanzar', 'girar-d', 'girar-i', 'recoger'],
      ref: [A, A, R, A, A, R, A, A], holgura: 2, h: 'obj',
      o: 'Recoge los dos paneles solares y llega a la meta.', i: 'Hay paneles solares por recoger.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: recoger objetos'] }, 3),
    cal({ tt: 'Repite el paso', m: ['>......G'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(7, A)], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Usa Repetir en lugar de muchas tarjetas.', i: 'Una calle recta y muy larga.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: un bucle sencillo'] }, 4),
    cal({ tt: 'Calle con vueltas', m: ['>...', '###.', 'G...'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, A), G, rep(2, A), G, rep(3, A)], lim: { repetir: 3 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Tres tramos: usa Repetir en cada uno.', i: 'La calle hace una S.',
      cur: ['m3_41', 'm3_42'], ext: ['Calentamiento: varios bucles seguidos'] }, 5),

    // ---- Bloque 1. Bucles anidados ----
    m3({ tt: 'La escalera larga', b: 1, m: ESCALERA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(3, A), G, A, I)], lim: { repetir: 2 }, holgura: 1, usa: 'repetir', h: 'bucle',
      p: ['Cada escalón es igual: tres pasos, giro, un paso, giro.', 'Ahora los tres pasos también se repiten: un bucle dentro de otro.', 'Repite tres veces: [Repetir 3 veces Avanzar], girar, avanzar, girar.'],
      o: 'Un bucle dentro de otro bucle.', i: 'Bit, el robot de la ciudad, ha construido una escalera con escalones largos.',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Bucles anidados: un bucle dentro de otro'] }, 1),
    m3({ tt: 'Filas de paneles', b: 1, m: ['>oo', '.oo', 'G..'], c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'],
      ref: [rep(2, rep(2, A, R), rep(2, B), G, A, I)], lim: { repetir: 3 }, holgura: 2, usa: 'repetir', h: 'bucle',
      p: ['Cada fila se recorre igual: ir recogiendo y volver.', 'Ir y recoger se repite dos veces; volver, también.', 'Mete eso dentro de otro bucle que baje una fila.'],
      o: 'Recoge cada fila y vuelve. Dos bucles dentro de uno.', i: 'Los paneles solares están en filas. Hay que recogerlos todos.',
      cur: ['m3_41', 'm3_42'], ext: ['Descomponer: una fila se repite para cada fila'] }, 2),
    m3({ tt: 'La plaza grande', b: 1, m: PLAZA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(4, A), G)], lim: { repetir: 2 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Tres lados iguales. Cada lado, cuatro pasos.', i: 'La plaza central es un cuadrado enorme.',
      cur: ['m3_41', 'm3_42'], ext: ['Bucle anidado: lados y pasos'] }, 3),
    m3({ tt: 'La cuenta falla', b: 1, m: PLAZA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(4, A), G)], ini: [rep(3, rep(3, A), G)], lim: { repetir: 2 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta y fíjate dónde se queda Lumo.', 'Los lados miden cuatro pasos, no tres.', 'Cambia el número del bucle interior.'],
      o: 'El bucle de dentro cuenta mal. Corrígelo.', i: 'Bit se ha equivocado al contar.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar un bucle anidado'] }, 4),
    m3({ tt: 'La fábrica larga', b: 1, m: FILAS3, c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'], tipo: 'optimizar',
      ref: [rep(3, rep(2, A, R), rep(2, B), G, A, I)],
      ini: [rep(2, A, R), rep(2, B), G, A, I, rep(2, A, R), rep(2, B), G, A, I, rep(2, A, R), rep(2, B), G, A],
      lim: { repetir: 3 }, holgura: 2, usa: 'repetir', h: 'optim',
      o: 'Funciona, pero se repite tres veces lo mismo. Acórtalo.', i: 'Bit: «Si lo repites, ponlo en un bucle».',
      cur: ['m3_41', 'm3_42'], ext: ['Optimizar: detectar una secuencia que se repite y automatizarla'] }, 5),

    // ---- Bloque 2. Condiciones y sensores ----
    m3({ tt: 'Hasta el muro', b: 2, m: ['>.......G'], c: ['avanzar', 'mientras'], con: ['obstaculo-delante'],
      ref: [mientras(no(OB), [A])], lim: { mientras: 1 }, holgura: 1, h: 'cond',
      o: 'Avanza mientras no haya un muro delante.', i: 'Bit: «Observa, decide, actúa».',
      p: ['No hace falta contar los pasos.', 'Mientras no haya un muro delante, Lumo avanza.', 'Elige Mientras, pon la condición «no hay obstáculo» y dentro Avanzar.'],
      cur: ['m3_41', 'm3_42'], ext: ['Bucle «mientras» con un sensor: se repite hasta que algo ocurre'] }, 6),
    m3({ tt: 'Camino con curvas', b: 2, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], lim: { mientras: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      p: ['Todas las curvas son a la derecha y siempre acaban en un muro.', 'Si hay un muro delante, gira; si no, avanza.', 'Mientras no estés en la meta: Si obstáculo, girar; si no, avanzar.'],
      o: 'Si hay muro, gira; si no, avanza. Hasta llegar a la meta.', i: 'La ciudad tiene un laberinto de calles.',
      cur: ['m3_41', 'm3_42'], ext: ['Condicional si / si no dentro de un bucle'] }, 7),
    m3({ tt: 'Recoge o avanza', b: 2, m: ['>.o..oo.o.G'], c: ['avanzar', 'recoger', 'repetir', 'si'], con: ['objeto-aqui'],
      ref: [rep(30, si(OA, [R], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      p: ['Hay luces en sitios distintos y no hace falta contarlos.', 'Si hay una luz aquí, recógela; si no, avanza.', 'Dentro de un bucle largo: Si objeto aquí, recoger; si no, avanzar.'],
      o: 'Si hay una luz, recógela. Si no, avanza.', i: 'Hay baterías esparcidas por la calle.',
      cur: ['m3_41', 'm3_42'], ext: ['Un algoritmo que funciona sin saber dónde están los objetos'] }, 8),
    m3({ tt: 'Interruptor automático', b: 2, m: ['>..s..d..G'], c: ['avanzar', 'activar', 'repetir', 'si'], con: ['interruptor-aqui'],
      ref: [rep(12, si(IN, [X, A], [A]))], lim: { repetir: 1, si: 1 }, holgura: 1, usa: 'si', h: 'cond',
      o: 'Activa el interruptor si estás encima. Si no, avanza.', i: 'La puerta del taller se abre con un interruptor.',
      cur: ['m3_41', 'm3_42'], ext: ['Sensor de interruptor'] }, 9),
    m3({ tt: 'Lava o muro', b: 2, m: ['>.~..', '####.', 'G.~..'], c: ['avanzar', 'girar-d', 'saltar', 'repetir', 'si'], con: ['agua-delante', 'obstaculo-delante'],
      ref: [rep(20, si(AG, [S], [si(OB, [G], [A])]))], lim: { repetir: 1, si: 2 }, holgura: 1, usa: 'si', h: 'cond',
      p: ['Hay dos cosas que mirar: agua y muro.', 'Primero pregunta por el agua; si no hay, pregunta por el muro.', 'Si agua: saltar; si no: (si muro: girar; si no: avanzar).'],
      o: 'Si hay vacío, salta; si hay muro, gira; si no, avanza.', i: 'Unos huecos de energía cortan las calles.',
      cur: ['m3_41', 'm3_42'], ext: ['Condicionales combinados (una condición dentro de otra)'] }, 10),

    // ---- Bloque 3. Funciones (recetas) ----
    m3({ tt: 'Receta de fila', b: 3, m: ['>ooo', '.ooo', '.ooo', 'G...'], c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir', 'receta'], rec: ['A'],
      ref: P([rep(3, rec('A'), rep(3, B), G, A, I)], { A: [rep(3, A, R)] }), lim: { repetir: 3 }, holgura: 3, usa: 'receta', h: 'receta',
      o: 'Guarda «recoger una fila» en la Receta A.', i: 'Bit: «Una función se escribe una vez».',
      cur: ['m3_41', 'm3_42'], ext: ['Función (receta) que contiene un bucle'] }, 11),
    m3({ tt: 'La serpiente', b: 3, m: ['>ooo', 'ooo.', 'G...'], c: ARCA, rec: ['A'],
      ref: P([rec('A'), G, A, G, rec('A'), I, A], { A: [rep(3, A, R)] }), lim: { repetir: 1 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Dos filas iguales, una en cada sentido.', i: 'Los cables forman una serpiente.',
      cur: ['m3_41', 'm3_42'], ext: ['Reutilizar una receta en dos sitios distintos'] }, 12),
    m3({ tt: 'La gran serpiente', b: 3, m: ['>ooo', 'ooo.', '.ooo', 'Goo.'], c: ARCA, rec: ['A'],
      ref: P([rep(2, rec('A'), G, A, G, rec('A'), I, A, I)], { A: [rep(3, A, R)] }), lim: { repetir: 2 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Cuatro filas: receta y bucle trabajando juntos.', i: 'La serpiente de cables se ha enrollado.',
      cur: ['m3_41', 'm3_42'], ext: ['Receta dentro de un bucle anidado'] }, 13),

    // ---- Bloque 4. Optimización con límites (mundo espacial) ----
    m3({ tt: 'Pocas tarjetas', b: 4, m: ['>.....', '#####.', '#####.', '#####.', '#####.', 'G.....'], c: ['avanzar', 'girar-d', 'repetir'],
      ref: [rep(3, rep(5, A), G)], lim: { avanzar: 1, 'girar-d': 1, repetir: 2 }, holgura: 0, usa: 'repetir', h: 'optim',
      o: 'Solo puedes usar una tarjeta Avanzar. ¡Piensa!', i: 'La nave tiene poca memoria: solo caben unas pocas tarjetas.',
      cur: ['m3_41', 'm3_42'], ext: ['Retos con límite de instrucciones'] }, 14),
    m3({ tt: 'La torre escalonada', b: 4, m: ['>..######', '##...####', '####...##', '######...', '########G'], c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(4, rep(2, A), G, A, I)], lim: { avanzar: 2, 'girar-d': 1, 'girar-i': 1, repetir: 2 }, holgura: 0, h: 'optim',
      o: 'Cuatro escalones. Memoria limitada.', i: 'La torre de la estación espacial tiene escalones de dos pasos.',
      cur: ['m3_41', 'm3_42'], ext: ['Optimizar bajo restricciones'] }, 15),
    m3({ tt: 'Espiral de sensores', b: 4, m: ESPIRAL, c: ['avanzar', 'girar-d', 'recoger', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), [si(OB, [G], [A]), R])], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'cond',
      p: ['Es una espiral hacia el centro y siempre se gira a la derecha.', 'Un único bucle puede decidir y recoger en cada paso.', 'Mientras no estés en la meta: Si obstáculo, girar; si no, avanzar. Después, Recoger.'],
      o: 'Una espiral con cuatro luces y un solo bucle.', i: 'Los anillos de la estación giran en espiral.',
      cur: ['m3_41', 'm3_42'], ext: ['Sensores y objetivos en un solo algoritmo'] }, 16),

    // ---- Bloque 5. Depuración avanzada ----
    m3({ tt: 'El sensor equivocado', b: 5, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'agua-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], ini: [mientras(no(MA), si(AG, [G], [A]))], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta: Lumo choca contra el muro.', 'La condición pregunta por el agua, pero aquí no hay agua.', 'Cambia la condición «agua delante» por «obstáculo delante».'],
      o: 'El programa pregunta por lo que no debe. Cambia la condición.', i: 'Bit tiene el sensor mal conectado.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar una condición incorrecta'] }, 17),
    m3({ tt: 'La receta que olvida', b: 5, m: ['>ooo', 'ooo.', 'G...'], c: ARCA, rec: ['A'],
      ref: P([rec('A'), G, A, G, rec('A'), I, A], { A: [rep(3, A, R)] }),
      ini: P([rec('A'), G, A, G, rec('A'), I, A], { A: [rep(3, R, A)] }), lim: { repetir: 1 }, holgura: 2, h: 'depurar',
      p: ['Lumo llega a la meta, pero se deja luces.', 'Dentro de la receta, Recoger y Avanzar están en el orden equivocado.', 'Primero avanza hasta la luz; después recoge.'],
      o: 'Lumo llega, pero se olvida luces. Revisa la receta.', i: 'Un fallo escondido en una receta afecta a todo.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar una función: el orden dentro del bucle'] }, 18),
    m3({ tt: 'Ramas cambiadas', b: 5, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], ini: [mientras(no(MA), si(OB, [A], [G]))], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'depurar',
      p: ['Ejecuta: Lumo gira donde debería avanzar.', 'Las dos ramas del «si» están al revés.', 'Si hay muro: girar. Si no: avanzar.'],
      o: 'Lo que hace «si» y «si no» está al revés.', i: 'Bit ha cruzado dos cables.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar: ramas de un condicional intercambiadas'] }, 19),
    m3({ tt: 'Falta el «si no»', b: 5, m: CURVAS, c: ['avanzar', 'girar-d', 'mientras', 'si'], con: ['obstaculo-delante', 'meta-aqui'],
      ref: [mientras(no(MA), si(OB, [G], [A]))], ini: [mientras(no(MA), si(OB, [G]))], lim: { mientras: 1, si: 1 }, holgura: 1, h: 'depurar',
      p: ['Lumo se queda parado dando vueltas.', 'Cuando no hay muro, el programa no hace nada.', 'Rellena la parte «si no» con Avanzar.'],
      o: 'Cuando no hay muro, Lumo no hace nada. ¿Qué falta?', i: 'Bit se ha quedado esperando.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar un bucle que no avanza: falta una rama'] }, 20),
    m3({ tt: 'Anidados desordenados', b: 5, m: ESCALERA, c: ['avanzar', 'girar-d', 'girar-i', 'repetir'],
      ref: [rep(3, rep(3, A), G, A, I)], ini: [rep(3, rep(3, A), A, G, I)], lim: { repetir: 2 }, holgura: 1, h: 'depurar',
      p: ['Lumo choca en el primer escalón.', 'Después de los tres pasos hay que girar antes de dar el paso corto.', 'Cambia de sitio Avanzar y Girar derecha.'],
      o: 'El orden dentro del bucle grande no es el correcto.', i: 'La escalera tiene un escalón torcido.',
      cur: ['m3_41', 'm3_42'], ext: ['Depurar el orden dentro de un bucle anidado'] }, 21),

    // ---- Bloque 6. Grandes desafíos ----
    m3({ tt: 'Ciudad de cristal', b: 6, m: ['>.~.o', '####.', 'G.~.o'],
      c: ['avanzar', 'girar-d', 'saltar', 'recoger', 'repetir', 'si'], con: ['agua-delante', 'obstaculo-delante'],
      ref: [rep(25, si(AG, [S], [si(OB, [G], [A])]), R)], lim: { repetir: 1, si: 2 }, holgura: 2, usa: 'si', h: 'cond',
      o: 'Observa, decide y recoge, todo en un bucle.', i: 'La ciudad de cristal brilla con baterías en las esquinas.',
      cur: ['m3_41', 'm3_42'], ext: ['Un algoritmo general para un entorno con huecos, muros y objetos'] }, 22),
    m3({ tt: 'El interruptor tras el vacío', b: 6, m: ['>.~..s.d..G'], c: ['avanzar', 'saltar', 'activar', 'repetir', 'si'], con: ['agua-delante', 'interruptor-aqui'],
      ref: [rep(30, si(AG, [S], [si(IN, [X, A], [A])]))], lim: { repetir: 1, si: 2 }, holgura: 2, usa: 'si', h: 'cond',
      o: 'Un vacío, un interruptor y una puerta. Una sola solución general.', i: 'Para activar el reactor hay que cruzar el vacío.',
      cur: ['m3_41', 'm3_42'], ext: ['Combinar sensores distintos'] }, 23),
    m3({ tt: 'Espiral con puerta', b: 6, m: ['>.s..', '####d', '..G#o', 'o###.', '..o..'], c: ['avanzar', 'girar-d', 'recoger', 'activar', 'repetir', 'si'], con: ['obstaculo-delante', 'interruptor-aqui'],
      ref: [rep(30, si(OB, [G], [A]), R, si(IN, [X]))], lim: { repetir: 1, si: 2 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['Es la espiral de antes, pero ahora hay un interruptor y una puerta.', 'Un bucle puede avanzar, recoger y activar «si hay interruptor aquí».', 'Dentro del bucle: Si obstáculo girar / si no avanzar; Recoger; Si interruptor aquí: Activar.'],
      o: 'La espiral tiene ahora un interruptor y una puerta.', i: 'Los anillos del reactor están sellados.',
      cur: ['m3_41', 'm3_42'], ext: ['Algoritmo general con varios sensores'] }, 24),
    m3({ tt: 'El Faro de Bit', b: 6, m: ['>.~.s..', '######d', 'Go.~o..'], c: ['avanzar', 'girar-d', 'saltar', 'recoger', 'activar', 'repetir', 'si'], con: ['agua-delante', 'obstaculo-delante', 'interruptor-aqui'],
      ref: [rep(40, si(AG, [S], [si(OB, [G], [A])]), R, si(IN, [X]))], lim: { repetir: 1, si: 3 }, holgura: 2, usa: 'si', h: 'cond',
      p: ['Hay vacío, muros, luces, un interruptor y una puerta.', 'Un único bucle que mire el entorno puede con todo.', 'Dentro del bucle: Si vacío, saltar; si no, (si muro, girar; si no, avanzar). Recoger. Si interruptor, activar.'],
      o: 'El último reto del mundo: un algoritmo que lo hace todo.', i: 'Bit: «El faro me enseñó a pensar. Ahora te toca a ti».',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Gran desafío del 3.er ciclo: generalizar un algoritmo para varios obstáculos'] }, 25)
  ];
});


/* ===== src/datos/niveles-final.js ===== */
;/*
 * RUMBO — El Faro (campaña final, 3 retos) y los 4 niveles secretos.
 * Los secretos se desbloquean con estrellas (ver catalogo.js) y nunca bloquean la historia.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboNivelesFinal = factory(root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';
  var A = D.A, B = D.B, G = D.D, I = D.I, S = D.S, R = D.R, X = D.X;
  var rep = D.rep, si = D.si, mientras = D.mientras, rec = D.rec, no = D.no, P = D.P;
  var OB = D.OB, AG = D.AG, IN = D.IN, MA = D.MA;

  var CORE = ['avanzar', 'girar-d', 'saltar', 'recoger', 'mientras', 'si'];
  var CUERPO = function (extra) { return [si(AG, [S], [si(OB, [G], [A])]), R].concat(extra || []); };
  var ARCA = ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'activar', 'repetir', 'receta'];

  function f(def, n) {
    def.e = 'primaria-3c';
    def.z = 'faro';
    def.id = 'f-0' + n;
    def.b = 11;
    return D.nivel(def);
  }
  function sec(def, n, etapa, zona) {
    def.e = etapa;
    def.z = zona;
    def.id = 'sec-' + n;
    def.b = 12;
    def.secreto = n;
    return D.nivel(def);
  }

  var finales = [
    f({ tt: 'La linterna rota', c: CORE, con: ['agua-delante', 'obstaculo-delante', 'meta-aqui'],
      m: ['>..~.o.', '######.', '...G##o', 'o#####.', '...~...'],
      ref: [mientras(no(MA), CUERPO())], lim: { mientras: 1, si: 2 }, holgura: 1, h: 'cond',
      p: ['Es una espiral con vacíos y luces.', 'Un solo bucle: si vacío saltar; si no, si muro girar; si no avanzar. Y recoger.', 'Mientras no estés en la meta, repite esa decisión y recoge siempre.'],
      o: 'Sube al Faro: una espiral con vacíos y luces.', i: 'El Faro Mayor está dentro de una gran espiral. Su luz se apagó.',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Final: un algoritmo general para recorrer cualquier espiral'] }, 1),
    f({ tt: 'El mecanismo del Faro', c: ARCA, rec: ['A'],
      m: ['>oos', 'oood', '.ooo', 'Goo.'],
      ref: P([rep(2, rec('A'), G, A, G, rec('A'), I, A, I)], { A: [rep(3, A, R), X] }), lim: { repetir: 2, receta: 3 }, holgura: 2, usa: 'receta', h: 'receta',
      o: 'Cuatro filas, un interruptor y una puerta. Receta y bucles.', i: 'Las lentes del Faro se mueven con un gran mecanismo.',
      cur: ['m3_41', 'm3_42'], ext: ['Final: recetas con varias acciones y bucles anidados'] }, 2),
    f({ tt: 'La luz de Lumo', c: ['avanzar', 'girar-d', 'saltar', 'recoger', 'activar', 'mientras', 'si'], con: ['agua-delante', 'obstaculo-delante', 'interruptor-aqui', 'meta-aqui'],
      m: ['>s.~.o.', '######d', '...G##o', 'o#####.', '...~...'],
      ref: [mientras(no(MA), CUERPO([si(IN, [X])]))], lim: { mientras: 1, si: 3 }, holgura: 2, h: 'cond',
      p: ['Es la espiral del primer piso, pero con interruptor y puerta.', 'Añade al bucle: si hay un interruptor aquí, activar.', 'Mientras no estés en la meta: decidir, recoger y, si interruptor, activar.'],
      o: 'El último reto: enciende la luz del Faro.', i: 'Lumo está a punto de encender la luz.',
      cur: ['m3_41', 'm3_42', 'saber23'], ext: ['Final: un algoritmo que resume todo lo aprendido'] }, 3)
  ];

  var secretos = [
    sec({ tt: 'El claro secreto', c: ['avanzar', 'recoger', 'repetir'],
      m: ['>o.o.o.o.G'], ref: [rep(4, A, R, A), A], lim: { repetir: 1 }, holgura: 1, usa: 'repetir', h: 'bucle',
      o: 'Un patrón de tres tarjetas se repite cuatro veces.', i: 'Un claro secreto del bosque.',
      cur: ['m1_41', 'm1_42'], ext: ['Secreto: patrón de tres acciones'] }, 1, 'primaria-1c', 'bosque'),
    sec({ tt: 'La caverna secreta', c: ['avanzar', 'recoger', 'saltar', 'repetir'],
      m: ['>o.~o.~o.~G'], ref: [A, R, A, rep(2, S, R, A), S], lim: { repetir: 1 }, holgura: 2, usa: 'repetir', h: 'bucle',
      o: 'Salta, recoge y avanza. ¿Qué parte se repite?', i: 'Una caverna escondida bajo el mar.',
      cur: ['m2_41', 'm2_42'], ext: ['Secreto: buscar el patrón dentro de una secuencia irregular'] }, 2, 'primaria-2c', 'mar'),
    sec({ tt: 'Memoria mínima', c: ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'recoger', 'repetir'],
      m: ['>oo', '.oo', '.oo', 'G..'], ref: [rep(3, rep(2, A, R), rep(2, B), G, A, I)],
      lim: { avanzar: 2, retroceder: 1, recoger: 1, 'girar-d': 1, 'girar-i': 1, repetir: 3 }, holgura: 0, h: 'optim',
      o: 'La misma fábrica, con muy poca memoria.', i: 'Una galaxia secreta con memoria escasa.',
      cur: ['m3_41', 'm3_42'], ext: ['Secreto: optimizar con límites estrictos'] }, 3, 'primaria-3c', 'espacio'),
    sec({ tt: 'El mecanismo oculto', c: ARCA, rec: ['A'],
      m: ['>oos', 'oood', '.ooo', 'Goo.'],
      ref: P([rep(2, rec('A'), G, A, G, rec('A'), I, A, I)], { A: [rep(3, A, R), X] }), lim: { repetir: 2, receta: 3, activar: 1 }, holgura: 0, usa: 'receta', h: 'receta',
      o: 'Un mecanismo escondido. ¡Solo un Activar!', i: 'Detrás del Faro hay una sala que nadie conoce.',
      cur: ['m3_41', 'm3_42'], ext: ['Secreto: una sola instrucción Activar'] }, 4, 'primaria-3c', 'faro')
  ];

  return { finales: finales, secretos: secretos };
});


/* ===== src/datos/logros.js ===== */
;/*
 * RUMBO — Insignias (por habilidad, no por velocidad) y disfraces desbloqueables.
 * Cada condición recibe un ayudante P (ver progreso.js) y devuelve true/false.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) { module.exports = api; } else { root.RumboLogros = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function rango(prefijo, a, b) {
    var r = [];
    for (var i = a; i <= b; i++) r.push(prefijo + (i < 10 ? '0' : '') + i);
    return r;
  }

  var INSIGNIAS = [
    { id: 'primer-paso', nombre: 'Primer paso', icono: 'huella', desc: 'Supera tu primer reto.', ok: function (P) { return P.completados() >= 1; } },
    { id: 'giros', nombre: 'Maestro de giros', icono: 'giro', desc: 'Domina los giros a izquierda y derecha.', ok: function (P) { return P.todos(rango('m1-', 4, 8)); } },
    { id: 'recolector', nombre: 'Recolector', icono: 'luz', desc: 'Recoge todos los objetos del camino.', ok: function (P) { return P.todos(rango('m1-', 9, 11)); } },
    { id: 'saltarin', nombre: 'Saltarín', icono: 'salto', desc: 'Salta obstáculos con la tarjeta de saltar.', ok: function (P) { return P.todos(['m1-14']); } },
    { id: 'repetidor', nombre: 'Rey de los patrones', icono: 'bucle', desc: 'Usa Repetir para encontrar patrones.', ok: function (P) { return P.todos(rango('m1-', 15, 17)); } },
    { id: 'detective', nombre: 'Detective de errores', icono: 'lupa', desc: 'Repara tres programas con fallos.', ok: function (P) { return P.todos(rango('m1-', 18, 20)); } },
    { id: 'dueno-bucles', nombre: 'Dueño de los bucles', icono: 'bucle', desc: 'Resuelve todos los retos de bucles del segundo ciclo.', ok: function (P) { return P.todos(rango('m2-', 1, 8)); } },
    { id: 'cocinero', nombre: 'Cocinero de recetas', icono: 'receta', desc: 'Crea y reutiliza recetas.', ok: function (P) { return P.todos(rango('m2-', 11, 13)); } },
    { id: 'depurador', nombre: 'Gran depurador', icono: 'lupa', desc: 'Repara los programas del segundo ciclo.', ok: function (P) { return P.todos(rango('m2-', 17, 21)); } },
    { id: 'decisor', nombre: 'Toma decisiones', icono: 'si', desc: 'Programa decisiones con «si».', ok: function (P) { return P.todos(['m2-22', 'm2-23']); } },
    { id: 'anidador', nombre: 'Bucles dentro de bucles', icono: 'bucle', desc: 'Domina los bucles anidados.', ok: function (P) { return P.todos(rango('m3-', 1, 3)); } },
    { id: 'sensores', nombre: 'Experto en sensores', icono: 'si', desc: 'Programa con condiciones y sensores.', ok: function (P) { return P.todos(rango('m3-', 6, 10)); } },
    { id: 'funciones', nombre: 'Maestro de funciones', icono: 'receta', desc: 'Domina las recetas en el tercer ciclo.', ok: function (P) { return P.todos(rango('m3-', 11, 13)); } },
    { id: 'optimizador', nombre: 'Optimizador', icono: 'estrella', desc: 'Consigue tres estrellas en diez retos.', ok: function (P) { return P.tresEstrellas() >= 10; } },
    { id: 'perseverante', nombre: 'No me rindo', icono: 'corazon', desc: 'Supera un reto después de intentarlo muchas veces.', ok: function (P) { return P.perseverancia(); } },
    { id: 'estrellas-30', nombre: '30 estrellas', icono: 'estrella', desc: 'Reúne 30 estrellas.', ok: function (P) { return P.estrellas() >= 30; } },
    { id: 'estrellas-100', nombre: '100 estrellas', icono: 'estrella', desc: 'Reúne 100 estrellas.', ok: function (P) { return P.estrellas() >= 100; } },
    { id: 'estrellas-200', nombre: '200 estrellas', icono: 'estrella', desc: 'Reúne 200 estrellas.', ok: function (P) { return P.estrellas() >= 200; } },
    { id: 'infantil-3', nombre: 'Pequeño explorador', icono: 'flor', desc: 'Completa el camino de los 3 años.', ok: function (P) { return P.itinerario(3); }, infantil: true },
    { id: 'infantil-4', nombre: 'Aventurero del camino', icono: 'zanahoria', desc: 'Completa el camino de los 4 años.', ok: function (P) { return P.itinerario(4); }, infantil: true },
    { id: 'infantil-5', nombre: 'Guardián de los patrones', icono: 'concha', desc: 'Completa el camino de los 5 años.', ok: function (P) { return P.itinerario(5); }, infantil: true },
    { id: 'mundo-1', nombre: 'Primer programador', icono: 'brujula', desc: 'Termina el Mundo 1.', ok: function (P) { return P.mundoCompleto(1); } },
    { id: 'mundo-2', nombre: 'Maestro del código', icono: 'brujula', desc: 'Termina el Mundo 2.', ok: function (P) { return P.mundoCompleto(2); } },
    { id: 'mundo-3', nombre: 'Experto en algoritmos', icono: 'brujula', desc: 'Termina el Mundo 3.', ok: function (P) { return P.mundoCompleto(3); } },
    { id: 'final', nombre: 'Final de la aventura', icono: 'faro', desc: 'Termina la aventura de tu curso y vuelve a casa con Lumo.', ok: function (P) { return P.finalHecho(); } },
    { id: 'faro', nombre: 'La luz de Lumo', icono: 'faro', desc: 'Enciende el Faro Mayor.', ok: function (P) { return P.todos(['f-03']); } },
    { id: 'secretos', nombre: 'Explorador de secretos', icono: 'llave', desc: 'Resuelve los cuatro retos secretos.', ok: function (P) { return P.todos(['sec-1', 'sec-2', 'sec-3', 'sec-4']); } },
    { id: 'creador', nombre: 'Creador de retos', icono: 'lab', desc: 'Crea y comprueba tu primer reto en el Laboratorio.', ok: function (P) { return P.retosCreados() >= 1; } }
  ];

  var DISFRACES = [
    { id: 0, nombre: 'Lumo clásico', desc: 'Siempre disponible.', ok: function () { return true; } },
    { id: 1, nombre: 'Gorra de explorador', desc: 'Supera 3 retos.', ok: function (P) { return P.completados() >= 3; } },
    { id: 2, nombre: 'Gafas de inventora', desc: 'Reúne 15 estrellas o completa el camino de los 3 años.', ok: function (P) { return P.estrellas() >= 15 || P.itinerario(3); } },
    { id: 3, nombre: 'Capa de aventurero', desc: 'Termina el Mundo 1 o todos los retos de Infantil.', ok: function (P) { return P.mundoCompleto(1) || P.itinerario(5); } },
    { id: 4, nombre: 'Casco de buceo', desc: 'Supera 10 retos del Mundo 2.', ok: function (P) { return P.completadosMundo(2) >= 10; } },
    { id: 5, nombre: 'Gafas de soldador', desc: 'Termina el Mundo 2.', ok: function (P) { return P.mundoCompleto(2); } },
    { id: 6, nombre: 'Antena de Bit', desc: 'Supera 10 retos del Mundo 3.', ok: function (P) { return P.completadosMundo(3) >= 10; } },
    { id: 7, nombre: 'Corona del Faro', desc: 'Termina la aventura de tu curso.', ok: function (P) { return P.finalHecho(); } }
  ];

  return { INSIGNIAS: INSIGNIAS, DISFRACES: DISFRACES };
});


/* ===== src/datos/catalogo.js ===== */
;/*
 * RUMBO — Catálogo: ordena los niveles, define los mundos y las reglas de desbloqueo.
 * Todo son datos y funciones puras; no toca el DOM.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./niveles-infantil.js'), require('./niveles-m1.js'), require('./niveles-m2.js'),
      require('./niveles-m3.js'), require('./niveles-final.js'), require('./voces-es.js'), require('./dsl.js'));
    module.exports = api;
  } else {
    root.RumboCatalogo = factory(root.RumboNivelesInfantil, root.RumboNivelesM1, root.RumboNivelesM2,
      root.RumboNivelesM3, root.RumboNivelesFinal, root.RumboVoces, root.RumboDSL);
  }
})(typeof self !== 'undefined' ? self : this, function (INF, M1, M2, M3, FIN, VOCES, DSL) {
  'use strict';

  var MUNDOS = [
    { id: 0, clave: 'm0', nombre: 'Pequeños exploradores', etapa: 'infantil', edades: '3-5 años', color: '#7ad36b', zonas: ['jardin', 'granja', 'playa'], niveles: INF,
      descripcion: 'Jardín, granja y playa. Sin leer: voz, imágenes y mucha calma.' },
    { id: 1, clave: 'm1', nombre: 'Primeros programadores', etapa: 'primaria-1c', edades: '1.º y 2.º', color: '#3fae6a', zonas: ['bosque', 'montanas'], niveles: M1,
      descripcion: 'Bosque encantado y Reino de las montañas.' },
    { id: 2, clave: 'm2', nombre: 'Maestros del código', etapa: 'primaria-2c', edades: '3.º y 4.º', color: '#2f8fd6', zonas: ['mar', 'volcan'], niveles: M2,
      descripcion: 'Mundo submarino e Isla volcánica.' },
    { id: 3, clave: 'm3', nombre: 'Expertos en algoritmos', etapa: 'primaria-3c', edades: '5.º y 6.º', color: '#8a5cd6', zonas: ['ciudad', 'espacio'], niveles: M3,
      descripcion: 'Ciudad tecnológica y Mundo espacial.' },
    { id: 4, clave: 'f', nombre: 'El Faro Mayor', etapa: 'primaria-3c', edades: 'Final', color: '#f2a93b', zonas: ['faro'], niveles: FIN.finales,
      descripcion: 'La luz de Lumo.' }
  ];

  var SECRETOS = FIN.secretos;
  var TODOS = [];
  MUNDOS.forEach(function (m) { m.niveles.forEach(function (n) { n.mundo = m.id; TODOS.push(n); }); });
  SECRETOS.forEach(function (n) { n.mundo = 'sec'; TODOS.push(n); });

  var POR_ID = {};
  TODOS.forEach(function (n) { POR_ID[n.id] = n; });

  var SEC_INFANTIL = INF.map(function (n) { return n.id; });
  var SEC_PRIMARIA = [];
  [1, 2, 3, 4].forEach(function (m) { MUNDOS[m].niveles.forEach(function (n) { SEC_PRIMARIA.push(n.id); }); });

  var ITINERARIOS = { 3: [], 4: [], 5: [] };
  INF.forEach(function (n) { ITINERARIOS[n.itinerario].push(n.id); });

  var CURSOS = [
    { id: 'inf3', nombre: '3 años', mundos: [0], itinerarios: [3] },
    { id: 'inf4', nombre: '4 años', mundos: [0], itinerarios: [3, 4] },
    { id: 'inf5', nombre: '5 años', mundos: [0], itinerarios: [3, 4, 5] },
    { id: 'p1', nombre: '1.º', mundos: [1] }, { id: 'p2', nombre: '2.º', mundos: [1] },
    { id: 'p3', nombre: '3.º', mundos: [1, 2] }, { id: 'p4', nombre: '4.º', mundos: [1, 2] },
    { id: 'p5', nombre: '5.º', mundos: [1, 2, 3] }, { id: 'p6', nombre: '6.º', mundos: [1, 2, 3] }
  ];

  // Estrellas necesarias para abrir cada secreto (las del mundo correspondiente; el 4.º, las del Faro).
  var REQUISITO_SECRETO = [
    { mundo: 1, estrellas: 50 }, { mundo: 2, estrellas: 50 }, { mundo: 3, estrellas: 50 }, { mundo: 4, estrellas: 8 }
  ];

  // Último reto de la aventura de cada curso: al superarlo, el alumnado ve el final de la historia a su nivel.
  var FINAL_CURSO = {
    inf3: ITINERARIOS[3][ITINERARIOS[3].length - 1], inf4: ITINERARIOS[4][ITINERARIOS[4].length - 1], inf5: ITINERARIOS[5][ITINERARIOS[5].length - 1],
    p1: 'm1-25', p2: 'm1-25', p3: 'm2-25', p4: 'm2-25', p5: 'f-03', p6: 'f-03'
  };
  function finalDe(cursoId) { return FINAL_CURSO[cursoId] || 'f-03'; }

  function cursoDe(id) {
    for (var i = 0; i < CURSOS.length; i++) if (CURSOS[i].id === id) return CURSOS[i];
    return null;
  }

  function mundoDe(nivel) {
    return typeof nivel === 'string' ? MUNDOS[POR_ID[nivel] ? POR_ID[nivel].mundo : -1] : MUNDOS[nivel.mundo];
  }

  // Posición del nivel dentro de su mundo (0..n-1)
  function posicion(id) {
    var n = POR_ID[id];
    if (!n || n.mundo === 'sec') return -1;
    return MUNDOS[n.mundo].niveles.indexOf(n);
  }

  function siguiente(id) {
    var n = POR_ID[id];
    if (!n) return null;
    if (n.mundo === 0) {
      var i = SEC_INFANTIL.indexOf(id);
      return i >= 0 && i < SEC_INFANTIL.length - 1 ? SEC_INFANTIL[i + 1] : null;
    }
    if (n.mundo === 'sec') return null;
    var j = SEC_PRIMARIA.indexOf(id);
    return j >= 0 && j < SEC_PRIMARIA.length - 1 ? SEC_PRIMARIA[j + 1] : null;
  }

  // Tarjetas que aparecen por primera vez en este nivel (según el orden del currículo).
  var PRIMERA_VEZ = {};
  (function () {
    var vistas = {};
    SEC_INFANTIL.concat(SEC_PRIMARIA).forEach(function (id, idx) {
      if (id === SEC_PRIMARIA[0]) vistas = {};   // Primaria empieza de nuevo: se retoman las tarjetas
      var nuevas = [];
      POR_ID[id].cartas.disponibles.forEach(function (c) { if (!vistas[c]) { vistas[c] = true; nuevas.push(c); } });
      PRIMERA_VEZ[id] = nuevas;
    });
  })();

  function cartasNuevas(id) { return PRIMERA_VEZ[id] || []; }

  // Añade al archivo único de voces la consigna de cada nivel.
  function registrarVoces() {
    TODOS.forEach(function (n) {
      if (n.objetivo) VOCES.lineas['n_' + n.id] = { quien: 'Lumo', texto: n.objetivo };
      if (n.intro) VOCES.lineas['i_' + n.id] = { quien: 'Lumo', texto: n.intro };
      (n.pistas || []).forEach(function (p, k) { VOCES.lineas['h' + (k + 1) + '_' + n.id] = { quien: 'Lumo', texto: p }; });
    });
    return VOCES;
  }

  function total(mundo) { return MUNDOS[mundo].niveles.length; }

  return {
    MUNDOS: MUNDOS, TODOS: TODOS, SECRETOS: SECRETOS, POR_ID: POR_ID,
    SEC_INFANTIL: SEC_INFANTIL, SEC_PRIMARIA: SEC_PRIMARIA, ITINERARIOS: ITINERARIOS,
    CURSOS: CURSOS, REQUISITO_SECRETO: REQUISITO_SECRETO,
    cursoDe: cursoDe, finalDe: finalDe, FINAL_CURSO: FINAL_CURSO, mundoDe: mundoDe, posicion: posicion, siguiente: siguiente,
    cartasNuevas: cartasNuevas, registrarVoces: registrarVoces, total: total, DSL: DSL
  };
});


/* ===== src/progreso/progreso.js ===== */
;/*
 * RUMBO — Progreso del jugador (puro, sin DOM, sin almacenamiento).
 *
 * Un perfil es un objeto JSON sencillo. Este módulo lo crea, lo actualiza, decide qué
 * está desbloqueado y calcula insignias, disfraces, resúmenes y códigos de partida.
 * El almacenamiento (localStorage) vive en guardado.js.
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('../datos/catalogo.js'), require('../datos/logros.js'), require('./codigo-partida.js'));
    module.exports = api;
  } else {
    root.RumboProgreso = factory(root.RumboCatalogo, root.RumboLogros, root.RumboCodigo);
  }
})(typeof self !== 'undefined' ? self : this, function (CAT, LOG, COD) {
  'use strict';

  function ahora() { return Date.now(); }

  function crearPerfil(datos) {
    datos = datos || {};
    var curso = CAT.cursoDe(datos.curso) ? datos.curso : 'p1';
    return {
      id: datos.id || ('p' + ahora().toString(36) + Math.floor(Math.random() * 1e4).toString(36)),
      nombre: String(datos.nombre || 'Jugador').slice(0, 20),
      curso: curso,
      disfraz: 0,
      creado: ahora(),
      niveles: {},
      vistos: { cartas: {}, escenas: {} },
      logros: {},
      desbloqueo: { niveles: {}, mundos: {} },
      retos: []
    };
  }

  function esInfantil(perfil) { return perfil.curso.indexOf('inf') === 0; }

  function datosNivel(perfil, id) {
    return perfil.niveles[id] || null;
  }
  function hecho(perfil, id) { var d = perfil.niveles[id]; return !!(d && d.completado); }
  function estrellasNivel(perfil, id) { var d = perfil.niveles[id]; return d && d.completado ? d.est : 0; }

  function completadosMundo(perfil, m) {
    var n = 0;
    CAT.MUNDOS[m].niveles.forEach(function (x) { if (hecho(perfil, x.id)) n++; });
    return n;
  }
  function mundoCompleto(perfil, m) { return completadosMundo(perfil, m) === CAT.MUNDOS[m].niveles.length; }
  function estrellasMundo(perfil, m) {
    var s = 0;
    CAT.MUNDOS[m].niveles.forEach(function (x) { s += estrellasNivel(perfil, x.id); });
    return s;
  }
  function estrellasTotales(perfil) {
    var s = 0;
    [1, 2, 3, 4].forEach(function (m) { s += estrellasMundo(perfil, m); });
    CAT.SECRETOS.forEach(function (x) { s += estrellasNivel(perfil, x.id); });
    return s;
  }
  function itinerarioCompleto(perfil, k) {
    return CAT.ITINERARIOS[k].every(function (id) { return hecho(perfil, id); });
  }

  // ---------- desbloqueos ----------

  function mundoAbierto(perfil, m, opciones) {
    if (opciones && opciones.todo) return true;
    if (perfil.desbloqueo.mundos[m]) return true;
    if (m === 0) return true;
    var curso = CAT.cursoDe(perfil.curso);
    if (curso.mundos.indexOf(m) >= 0) return true;
    if (m === 4) return mundoCompleto(perfil, 3);
    return mundoCompleto(perfil, m - 1) || completadosMundo(perfil, m) > 0;
  }

  function itinerarioAbierto(perfil, k, opciones) {
    if (opciones && opciones.todo) return true;
    var curso = CAT.cursoDe(perfil.curso);
    if (k === 3) return true;
    if (curso.itinerarios && curso.itinerarios.indexOf(k) >= 0) return true;
    return itinerarioCompleto(perfil, k - 1) || CAT.ITINERARIOS[k].some(function (id) { return hecho(perfil, id); });
  }

  function secretoAbierto(perfil, n) {
    var req = CAT.REQUISITO_SECRETO[n - 1];
    return estrellasMundo(perfil, req.mundo) >= req.estrellas;
  }

  function estaDesbloqueado(perfil, id, opciones) {
    var nivel = CAT.POR_ID[id];
    if (!nivel) return false;
    if (opciones && opciones.todo) return true;
    if (perfil.desbloqueo.niveles[id]) return true;
    if (nivel.mundo === 'sec') return secretoAbierto(perfil, nivel.secreto);
    if (!mundoAbierto(perfil, nivel.mundo, opciones)) return false;
    if (nivel.mundo === 0) {
      if (!itinerarioAbierto(perfil, nivel.itinerario, opciones)) return false;
      var lista = CAT.ITINERARIOS[nivel.itinerario];
      var i = lista.indexOf(id);
      return i === 0 || hecho(perfil, lista[i - 1]);
    }
    var pos = CAT.posicion(id), previo = pos > 0 ? CAT.MUNDOS[nivel.mundo].niveles[pos - 1] : null;
    if (!previo) return true;
    // El calentamiento (bloque 0) es un repaso: no bloquea el primer reto «de verdad» del mundo.
    if (previo.bloque === 0 && nivel.bloque !== 0) return true;
    return hecho(perfil, previo.id);
  }

  // Primer nivel pendiente y abierto (para el botón «Continuar»)
  function siguientePendiente(perfil) {
    var lista = esInfantil(perfil) ? CAT.SEC_INFANTIL : CAT.SEC_PRIMARIA;
    var curso = CAT.cursoDe(perfil.curso);
    var candidatos = lista.filter(function (id) {
      var n = CAT.POR_ID[id];
      if (esInfantil(perfil)) return true;
      return curso.mundos.indexOf(n.mundo) >= 0 || n.mundo === 4 || completadosMundo(perfil, n.mundo) > 0;
    });
    for (var i = 0; i < candidatos.length; i++) {
      if (!hecho(perfil, candidatos[i]) && estaDesbloqueado(perfil, candidatos[i])) return candidatos[i];
    }
    for (var j = 0; j < lista.length; j++) {
      if (!hecho(perfil, lista[j]) && estaDesbloqueado(perfil, lista[j])) return lista[j];
    }
    return null;
  }

  // ---------- registro de intentos ----------

  function asegurarNivel(perfil, id) {
    if (!perfil.niveles[id]) {
      perfil.niveles[id] = { completado: false, est: 0, intentos: 0, fallos: 0, pistas: 0, mejor: 0, razones: {}, estrategias: {}, ultimo: 0, tras: 0 };
    }
    return perfil.niveles[id];
  }

  function estrategiasDe(programa, I) {
    var e = {};
    I.recorrer(programa, function (n) {
      if (n.t === 'repetir') e.repetir = true;
      if (n.t === 'si') e.si = true;
      if (n.t === 'mientras') e.mientras = true;
      if (n.t === 'receta') e.receta = true;
      if (n.t === 'saltar') e.saltar = true;
    });
    return e;
  }

  /*
   * info = { ok, motivo, estrellas, tarjetas, programa, pistas }
   * Devuelve { primeraVez, mejoro, estrellasAntes }
   */
  function registrar(perfil, id, info, I) {
    var d = asegurarNivel(perfil, id);
    var antes = d.completado ? d.est : 0;
    var primera = !d.completado && info.ok;
    d.intentos++;
    d.ultimo = ahora();
    if (info.pistas) d.pistas = Math.max(d.pistas, info.pistas);
    if (!info.ok) {
      d.fallos++;
      if (info.motivo) d.razones[info.motivo] = (d.razones[info.motivo] || 0) + 1;
    } else {
      if (!d.completado) d.tras = d.intentos;
      d.completado = true;
      d.est = Math.max(d.est, info.estrellas || 1);
      if (!d.mejor || info.tarjetas < d.mejor) d.mejor = info.tarjetas;
      if (I && info.programa) {
        var e = estrategiasDe(info.programa, I);
        Object.keys(e).forEach(function (k) { d.estrategias[k] = true; });
      }
    }
    return { primeraVez: primera, mejoro: info.ok && d.est > antes, estrellasAntes: antes };
  }

  // Anota que se pidió una pista (sin contar como intento), para que el docente la vea al momento.
  function anotarPistas(perfil, id, n) {
    var d = asegurarNivel(perfil, id);
    d.pistas = Math.max(d.pistas, n);
  }

  function marcarCartaVista(perfil, c) { perfil.vistos.cartas[c] = true; }
  function marcarEscenaVista(perfil, e) { perfil.vistos.escenas[e] = true; }

  // ---------- logros y disfraces ----------

  function ayudante(perfil) {
    return {
      completados: function () {
        var n = 0;
        Object.keys(perfil.niveles).forEach(function (k) { if (perfil.niveles[k].completado) n++; });
        return n;
      },
      completadosMundo: function (m) { return completadosMundo(perfil, m); },
      mundoCompleto: function (m) { return mundoCompleto(perfil, m); },
      todos: function (ids) { return ids.every(function (id) { return hecho(perfil, id); }); },
      estrellas: function () { return estrellasTotales(perfil); },
      tresEstrellas: function () {
        var n = 0;
        Object.keys(perfil.niveles).forEach(function (k) {
          var d = perfil.niveles[k];
          var niv = CAT.POR_ID[k];
          if (d.completado && d.est >= 3 && niv && niv.etapa !== 'infantil') n++;
        });
        return n;
      },
      perseverancia: function () {
        return Object.keys(perfil.niveles).some(function (k) { var d = perfil.niveles[k]; return d.completado && d.tras >= 4; });
      },
      finalHecho: function () { return hecho(perfil, CAT.finalDe(perfil.curso)); },
      itinerario: function (k) { return itinerarioCompleto(perfil, k); },
      retosCreados: function () { return (perfil.retos || []).length; }
    };
  }

  function evaluarLogros(perfil) {
    var P = ayudante(perfil);
    var nuevos = [];
    LOG.INSIGNIAS.forEach(function (ins) {
      if (!perfil.logros[ins.id] && ins.ok(P)) {
        perfil.logros[ins.id] = ahora();
        nuevos.push(ins.id);
      }
    });
    return nuevos;
  }

  function disfracesDesbloqueados(perfil) {
    var P = ayudante(perfil);
    return LOG.DISFRACES.filter(function (d) { return d.ok(P); }).map(function (d) { return d.id; });
  }

  // ---------- resumen para el docente ----------

  function resumen(perfil) {
    var mundos = CAT.MUNDOS.map(function (m) {
      var max = m.etapa === 'infantil' ? 0 : m.niveles.length * 3;
      return { id: m.id, nombre: m.nombre, completados: completadosMundo(perfil, m.id), total: m.niveles.length,
        estrellas: m.id === 0 ? 0 : estrellasMundo(perfil, m.id), maxEstrellas: max };
    });
    var errores = {}, intentos = 0, fallos = 0, pistas = 0;
    Object.keys(perfil.niveles).forEach(function (k) {
      var d = perfil.niveles[k];
      intentos += d.intentos; fallos += d.fallos; pistas += d.pistas;
      Object.keys(d.razones).forEach(function (r) { errores[r] = (errores[r] || 0) + d.razones[r]; });
    });
    return { mundos: mundos, errores: errores, intentos: intentos, fallos: fallos, pistas: pistas,
      estrellas: estrellasTotales(perfil), insignias: Object.keys(perfil.logros).length };
  }

  // ---------- códigos de partida ----------

  var ORDEN_LARGO = CAT.SEC_INFANTIL.concat(CAT.SEC_PRIMARIA).concat(CAT.SECRETOS.map(function (n) { return n.id; }));

  function aCodigo(perfil) {
    if (esInfantil(perfil)) {
      var n = 0;
      CAT.SEC_INFANTIL.forEach(function (id) { if (hecho(perfil, id)) n++; });
      return { tipo: 'pictos', codigo: COD.codificarPictos({ nivelInfantil: Math.min(n, 15), disfraz: Math.min(perfil.disfraz || 0, 15) }) };
    }
    var comp = 0;
    CAT.SEC_PRIMARIA.forEach(function (id) { if (hecho(perfil, id)) comp++; });
    var est = [1, 2, 3, 4].map(function (m) { return estrellasMundo(perfil, m); });
    est[3] = Math.min(est[3], 31);
    return { tipo: 'corto', codigo: COD.codificarCorto({
      nivel: comp, estrellasMundo: est,
      secretos: CAT.SECRETOS.map(function (s) { return hecho(perfil, s.id); }),
      disfraz: perfil.disfraz || 0 }) };
  }

  function aCodigoLargo(perfil) {
    return COD.codificarLargo({
      estrellas: ORDEN_LARGO.map(function (id) { return estrellasNivel(perfil, id) || (hecho(perfil, id) ? 1 : 0); }),
      secretos: CAT.SECRETOS.map(function (s) { return hecho(perfil, s.id); }),
      disfraz: perfil.disfraz || 0 });
  }

  function marcar(perfil, id, est) {
    var d = asegurarNivel(perfil, id);
    d.completado = true;
    d.est = Math.max(d.est, est);
    if (!d.intentos) d.intentos = 1;
  }

  // Reparte las estrellas de un mundo entre los niveles completados (≥1 cada uno, ≤3).
  function repartir(perfil, mundo, completados, total) {
    var ids = CAT.MUNDOS[mundo].niveles.slice(0, completados).map(function (n) { return n.id; });
    var k = ids.length;
    var t = Math.max(k, Math.min(3 * k, total));
    var extra = t - k;
    ids.forEach(function (id) {
      var s = 1 + Math.min(2, extra);
      extra -= s - 1;
      marcar(perfil, id, s);
    });
  }

  /*
   * Aplica un código sobre un perfil nuevo. Devuelve { ok, perfil, tipo } o { ok:false, motivo }.
   * El código corto guarda totales por mundo: se restauran los desbloqueos y el total de estrellas,
   * no las estrellas exactas de cada nivel (para eso está el código largo del docente).
   */
  function desdeCodigo(texto, nombre) {
    var perfil, r;
    var t = Array.isArray(texto) ? '' : COD.normalizar(texto);
    if (t.length === 11) {
      r = COD.decodificarCorto(texto);
      if (!r.ok) return { ok: false, motivo: r.motivo };
      var e = r.estado;
      perfil = crearPerfil({ nombre: nombre, curso: e.nivel > 50 ? 'p5' : e.nivel > 25 ? 'p3' : 'p1' });
      var resto = Math.min(e.nivel, CAT.SEC_PRIMARIA.length);
      [1, 2, 3, 4].forEach(function (m) {
        var tam = CAT.MUNDOS[m].niveles.length;
        var comp = Math.min(tam, resto);
        resto -= comp;
        if (comp > 0) repartir(perfil, m, comp, e.estrellasMundo[m - 1]);
      });
      CAT.SECRETOS.forEach(function (s, i) { if (e.secretos[i]) marcar(perfil, s.id, 1); });
      perfil.disfraz = e.disfraz;
      return { ok: true, perfil: perfil, tipo: 'corto' };
    }
    r = COD.decodificarPictos(texto);   // el código pictográfico es una lista de 6 números 0..11
    if (r.ok) {
      perfil = crearPerfil({ nombre: nombre, curso: 'inf5' });
      for (var i = 0; i < Math.min(r.estado.nivelInfantil, CAT.SEC_INFANTIL.length); i++) marcar(perfil, CAT.SEC_INFANTIL[i], 1);
      perfil.disfraz = r.estado.disfraz;
      return { ok: true, perfil: perfil, tipo: 'pictos' };
    }
    r = COD.decodificarLargo(texto);
    if (!r.ok) return { ok: false, motivo: r.motivo };
    perfil = crearPerfil({ nombre: nombre, curso: 'p3' });
    r.estado.estrellas.forEach(function (s, i) { if (s > 0 && ORDEN_LARGO[i]) marcar(perfil, ORDEN_LARGO[i], s); });
    perfil.disfraz = r.estado.disfraz;
    var inf = CAT.SEC_INFANTIL.some(function (id) { return hecho(perfil, id); });
    var pri = CAT.SEC_PRIMARIA.some(function (id) { return hecho(perfil, id); });
    if (inf && !pri) perfil.curso = 'inf5';
    else if (pri) perfil.curso = mundoCompleto(perfil, 2) ? 'p5' : mundoCompleto(perfil, 1) ? 'p3' : 'p1';
    return { ok: true, perfil: perfil, tipo: 'largo' };
  }

  return {
    crearPerfil: crearPerfil, esInfantil: esInfantil, datosNivel: datosNivel, hecho: hecho,
    estrellasNivel: estrellasNivel, completadosMundo: completadosMundo, mundoCompleto: mundoCompleto,
    estrellasMundo: estrellasMundo, estrellasTotales: estrellasTotales, itinerarioCompleto: itinerarioCompleto,
    mundoAbierto: mundoAbierto, itinerarioAbierto: itinerarioAbierto, secretoAbierto: secretoAbierto,
    finalHecho: function (perfil) { return hecho(perfil, CAT.finalDe(perfil.curso)); }, estaDesbloqueado: estaDesbloqueado, siguientePendiente: siguientePendiente,
    registrar: registrar, anotarPistas: anotarPistas, marcarCartaVista: marcarCartaVista, marcarEscenaVista: marcarEscenaVista,
    evaluarLogros: evaluarLogros, disfracesDesbloqueados: disfracesDesbloqueados, resumen: resumen,
    aCodigo: aCodigo, aCodigoLargo: aCodigoLargo, desdeCodigo: desdeCodigo, ORDEN_LARGO: ORDEN_LARGO
  };
});


/* ===== src/audio/voz.js ===== */
;/*
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


/* ===== src/ui/util.js ===== */
;/*
 * RUMBO — Utilidades de interfaz (DOM mínimo, sin dependencias).
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};

  // h('div.clase#id', {atributo: valor, on: {click: fn}}, hijos...)
  function h(sel, props) {
    var m = /^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i.exec(sel) || [];
    var el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, function (_, t, n) {
      if (t === '.') el.classList.add(n); else el.id = n;
    });
    var i = 1;
    if (props && typeof props === 'object' && !Array.isArray(props) && !(props.nodeType)) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'on') Object.keys(v).forEach(function (e) { el.addEventListener(e, v[e]); });
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) { el.style.setProperty(s, v[s]); });
        else if (k === 'data') Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
        else if (k === 'texto') el.textContent = v;
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      });
      i = 2;
    } else { i = 1; }
    for (; i < arguments.length; i++) anadir(el, arguments[i]);
    return el;
  }
  function anadir(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { anadir(el, x); }); return; }
    if (typeof c === 'string' || typeof c === 'number') el.appendChild(document.createTextNode(String(c)));
    else el.appendChild(c);
  }
  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clon(o) { return JSON.parse(JSON.stringify(o)); }
  function svgEl(html, clase) { var d = document.createElement('span'); d.className = 'svg ' + (clase || ''); d.innerHTML = html; return d; }

  UI.h = h; UI.vaciar = vaciar; UI.esperar = esperar; UI.clamp = clamp; UI.esc = esc; UI.clon = clon; UI.svgEl = svgEl;
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/arte.js ===== */
;/*
 * RUMBO — Arte vectorial propio (SVG generado por código).
 * Todo el arte del juego es original: Lumo, sus amigos, las casillas de cada mundo,
 * los iconos de las tarjetas y las insignias.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};

  // ---------------------------------------------------------------- temas
  var TEMAS = {
    jardin:   { c1: '#bfe99a', c2: '#b2e08b', muro: 'arbusto',    agua: 'estanque', barrera: 'valla',   obj: 'flor',       meta: 'flor',   cielo: ['#9fdcff', '#e6f8d4'], deco: '#98d172' },
    granja:   { c1: '#ecd894', c2: '#e3cd87', muro: 'pajar',      agua: 'estanque', barrera: 'valla',   obj: 'zanahoria',  meta: 'casa',   cielo: ['#a8dcff', '#fff0c4'], deco: '#d4bb6c' },
    playa:    { c1: '#f8e5ab', c2: '#f2da98', muro: 'roca',       agua: 'mar',      barrera: 'tronco',  obj: 'concha',     meta: 'cofre',  cielo: ['#8fdcff', '#fff4d6'], deco: '#e3c677' },
    bosque:   { c1: '#7fcb6c', c2: '#74c062', muro: 'arbol',      agua: 'arroyo',   barrera: 'tronco',  obj: 'luciernaga', meta: 'portal', cielo: ['#17413f', '#3d7d57'], deco: '#5fae52' },
    montanas: { c1: '#c9c3dc', c2: '#bdb6d3', muro: 'roca-nieve', agua: 'abismo',   barrera: 'hielo',   obj: 'cristal',    meta: 'portal', cielo: ['#5b6ab0', '#c9d4f2'], deco: '#a79fc2' },
    mar:      { c1: '#f1dba3', c2: '#e9d095', muro: 'coral',      agua: 'remolino', barrera: 'alga',    obj: 'perla',      meta: 'portal', cielo: ['#0b4f7f', '#2aa4c9'], deco: '#d9bd7d' },
    volcan:   { c1: '#7a6560', c2: '#6e5954', muro: 'roca-negra', agua: 'lava',     barrera: 'columna', obj: 'gema',       meta: 'portal', cielo: ['#2f101a', '#a3402b'], deco: '#5a4743' },
    ciudad:   { c1: '#ccd6e8', c2: '#c0cce1', muro: 'edificio',   agua: 'vacio',    barrera: 'laser',   obj: 'bateria',    meta: 'portal', cielo: ['#222c57', '#5a78c9'], deco: '#a9b8d4' },
    espacio:  { c1: '#625f8d', c2: '#585584', muro: 'asteroide',  agua: 'agujero',  barrera: 'energia', obj: 'estrella',   meta: 'portal', cielo: ['#07071d', '#2b2468'], deco: '#7a76a8' },
    faro:     { c1: '#f5e7c6', c2: '#eedcb8', muro: 'piedra',     agua: 'oscuro',   barrera: 'valla',   obj: 'chispa',     meta: 'faro',   cielo: ['#18204a', '#e9a64c'], deco: '#dcc597' }
  };
  var NOMBRES_ZONA = {
    jardin: 'Jardín de colores', granja: 'Granja de los movimientos', playa: 'Playa de las formas',
    bosque: 'Bosque encantado', montanas: 'Reino de las montañas', mar: 'Mundo submarino',
    volcan: 'Isla volcánica', ciudad: 'Ciudad tecnológica', espacio: 'Mundo espacial', faro: 'El Faro Mayor'
  };

  function hash(x, y) { var n = (x * 73856093) ^ (y * 19349663); n = (n ^ (n >>> 13)) >>> 0; return n % 1000; }

  // ---------------------------------------------------------------- casillas (64×64)
  function suelo(tema, x, y) {
    var T = TEMAS[tema], par = (x + y) % 2 === 0;
    var h = hash(x, y), dx = 10 + (h % 40), dy = 12 + ((h >> 3) % 36);
    var deco = '';
    if (tema === 'jardin' || tema === 'bosque') deco = '<path d="M' + dx + ' ' + (dy + 6) + 'l2-8 2 8m3 0l2-6 2 6" stroke="' + T.deco + '" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    else if (tema === 'granja') deco = '<circle cx="' + dx + '" cy="' + dy + '" r="2" fill="' + T.deco + '"/><circle cx="' + (dx + 9) + '" cy="' + (dy + 5) + '" r="1.6" fill="' + T.deco + '"/>';
    else if (tema === 'playa') deco = '<path d="M' + dx + ' ' + dy + 'q4-4 8 0" stroke="' + T.deco + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
    else if (tema === 'mar') deco = '<circle cx="' + dx + '" cy="' + dy + '" r="2.2" fill="#fff" opacity=".55"/><circle cx="' + (dx + 8) + '" cy="' + (dy - 6) + '" r="1.4" fill="#fff" opacity=".55"/>';
    else if (tema === 'volcan') deco = '<path d="M' + dx + ' ' + dy + 'l6 3-3 5" stroke="#e3703a" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>';
    else if (tema === 'ciudad') deco = '<path d="M8 32h48M32 8v48" stroke="' + T.deco + '" stroke-width="1.5" opacity=".6"/><circle cx="32" cy="32" r="3" fill="#5fe0ff" opacity=".7"/>';
    else if (tema === 'espacio') deco = '<circle cx="' + dx + '" cy="' + dy + '" r="1.5" fill="#fff" opacity=".7"/><circle cx="' + (dx + 14) + '" cy="' + (dy + 9) + '" r="1" fill="#cfd0ff" opacity=".7"/>';
    else if (tema === 'faro') deco = '<path d="M0 32h64M32 0v64" stroke="' + T.deco + '" stroke-width="1.6" opacity=".7"/>';
    else if (tema === 'montanas') deco = '<path d="M' + dx + ' ' + dy + 'l5-5 5 5z" fill="#fff" opacity=".6"/>';
    return '<rect x="1" y="1" width="62" height="62" rx="8" fill="' + (par ? T.c1 : T.c2) + '"/>' +
      '<rect x="1" y="1" width="62" height="10" rx="8" fill="#fff" opacity=".10"/>' + deco;
  }

  var MUROS = {
    arbusto: function () { return '<ellipse cx="32" cy="52" rx="22" ry="6" fill="#000" opacity=".15"/><circle cx="20" cy="38" r="15" fill="#4fb64c"/><circle cx="42" cy="38" r="15" fill="#5ac857"/><circle cx="31" cy="26" r="16" fill="#6bd864"/><circle cx="26" cy="22" r="3" fill="#ff6f91"/><circle cx="40" cy="30" r="3" fill="#ffd166"/>'; },
    arbol: function () { return '<ellipse cx="32" cy="56" rx="20" ry="5" fill="#000" opacity=".2"/><rect x="27" y="36" width="10" height="20" rx="3" fill="#8a5a33"/><circle cx="32" cy="24" r="19" fill="#2f8a4a"/><circle cx="21" cy="30" r="12" fill="#3aa55a"/><circle cx="43" cy="30" r="12" fill="#3aa55a"/><circle cx="32" cy="16" r="9" fill="#52c372"/><circle cx="26" cy="22" r="2.2" fill="#ffe27a"/><circle cx="40" cy="28" r="2" fill="#ffe27a"/>'; },
    pajar: function () { return '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#000" opacity=".15"/><rect x="8" y="22" width="48" height="32" rx="10" fill="#e8b94a"/><path d="M12 32h40M12 42h40" stroke="#c99125" stroke-width="3"/><path d="M14 22c4-8 10-8 14 0m6 0c4-8 10-8 14 0" stroke="#c99125" stroke-width="2.5" fill="none"/>'; },
    roca: function () { return '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#000" opacity=".15"/><path d="M8 50l6-24 14-10 16 4 12 16 0 14z" fill="#9aa3ad"/><path d="M14 26l14-10 8 16-20 6z" fill="#b8c0c9"/><path d="M36 20l8 14 12 16-24 0z" fill="#808a95"/>'; },
    'roca-nieve': function () { return '<ellipse cx="32" cy="54" rx="24" ry="5" fill="#000" opacity=".15"/><path d="M6 52L24 12l12 18 8-10 14 32z" fill="#7d7a96"/><path d="M24 12l-8 18 8-4 6 6 6-6z" fill="#fff"/><path d="M44 20l-5 9 5-3 4 4z" fill="#eef"/>'; },
    coral: function () { return '<ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" opacity=".15"/><path d="M32 56V30M32 40l-12-14M32 36l12-16M20 26V14M44 20V10M32 30V12" stroke="#ff6f91" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="20" cy="14" r="5" fill="#ff9aa9"/><circle cx="44" cy="10" r="5" fill="#ff9aa9"/><circle cx="32" cy="12" r="5" fill="#ff9aa9"/>'; },
    'roca-negra': function () { return '<ellipse cx="32" cy="55" rx="24" ry="5" fill="#000" opacity=".25"/><path d="M6 54l8-28 14-12 18 6 12 16 0 18z" fill="#3a2f33"/><path d="M14 26l14-12 8 14-16 8z" fill="#524449"/><path d="M26 30l4 8-4 8m14-18l-3 8" stroke="#ff7a2f" stroke-width="3" fill="none" stroke-linecap="round"/>'; },
    edificio: function () { return '<ellipse cx="32" cy="57" rx="22" ry="4" fill="#000" opacity=".2"/><rect x="14" y="8" width="36" height="50" rx="5" fill="#4d5f8f"/><rect x="14" y="8" width="36" height="8" rx="4" fill="#6c82b8"/><g fill="#ffe27a"><rect x="20" y="22" width="7" height="7" rx="1"/><rect x="37" y="22" width="7" height="7" rx="1"/><rect x="20" y="36" width="7" height="7" rx="1"/></g><g fill="#5fe0ff"><rect x="37" y="36" width="7" height="7" rx="1"/><rect x="20" y="49" width="7" height="6" rx="1"/><rect x="37" y="49" width="7" height="6" rx="1"/></g>'; },
    asteroide: function () { return '<ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" opacity=".25"/><path d="M12 36l4-16 14-10 16 6 8 16-6 16-18 6-14-6z" fill="#8b86b8"/><circle cx="26" cy="28" r="5" fill="#6d68a0"/><circle cx="42" cy="40" r="4" fill="#6d68a0"/><circle cx="30" cy="46" r="3" fill="#6d68a0"/>'; },
    piedra: function () { return '<ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" opacity=".2"/><rect x="8" y="12" width="48" height="42" rx="6" fill="#b9a98e"/><path d="M8 26h48M8 40h48M24 12v14M42 26v14M20 40v14" stroke="#8e7f66" stroke-width="2.5"/>'; }
  };

  var PELIGROS = {
    estanque: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#43a9ff"/><g class="ola" stroke="#cfeaff" stroke-width="3" fill="none" stroke-linecap="round"><path d="M10 24q6-6 12 0t12 0 12 0"/><path d="M6 42q6-6 12 0t12 0 12 0 10 0"/></g>'; },
    arroyo: function () { return PELIGROS.estanque(); },
    mar: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#1e88e5"/><g class="ola" stroke="#bfe6ff" stroke-width="3" fill="none" stroke-linecap="round"><path d="M8 22q6-6 12 0t12 0 12 0"/><path d="M12 40q6-6 12 0t12 0 12 0"/></g>'; },
    abismo: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#2c2a4a"/><rect x="8" y="8" width="48" height="48" rx="8" fill="#1a1933"/><path d="M14 18l36 0M18 30l28 0M22 42l20 0" stroke="#5b5a8c" stroke-width="2.5" stroke-linecap="round"/>'; },
    remolino: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#0d3f66"/><g class="gira"><path d="M32 32m0-4a4 4 0 1 1-4 4M32 32m0-10a10 10 0 1 1-10 10M32 32m0-16a16 16 0 1 1-16 16" stroke="#7ad7ff" stroke-width="3" fill="none" stroke-linecap="round"/></g>'; },
    lava: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#e8452c"/><g class="ola"><path d="M0 26q10-8 20 0t20 0 24 0" stroke="#ffb02e" stroke-width="5" fill="none"/><path d="M0 46q10-8 20 0t20 0 24 0" stroke="#ff8a2a" stroke-width="5" fill="none"/></g><circle cx="20" cy="36" r="4" fill="#ffd166"/><circle cx="44" cy="20" r="3" fill="#ffd166"/>'; },
    vacio: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#101a3a"/><path d="M8 8l48 48M56 8L8 56" stroke="#2fd6ff" stroke-width="2" opacity=".5"/><rect x="6" y="6" width="52" height="52" rx="7" fill="none" stroke="#2fd6ff" stroke-width="2.5"/><circle cx="32" cy="32" r="6" fill="#2fd6ff" opacity=".5"/>'; },
    agujero: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#0a0820"/><g class="gira"><ellipse cx="32" cy="32" rx="24" ry="10" fill="none" stroke="#a86bff" stroke-width="4" opacity=".8"/><ellipse cx="32" cy="32" rx="14" ry="5" fill="none" stroke="#ff8ad8" stroke-width="3" opacity=".8"/></g><circle cx="32" cy="32" r="7" fill="#000"/>'; },
    oscuro: function () { return '<rect x="1" y="1" width="62" height="62" rx="8" fill="#0f1a3d"/><g class="ola" stroke="#4c6bd1" stroke-width="3" fill="none" stroke-linecap="round"><path d="M8 24q6-6 12 0t12 0 12 0"/><path d="M12 42q6-6 12 0t12 0 12 0"/></g>'; }
  };

  var BARRERAS = {
    valla: function () { return '<rect x="6" y="26" width="52" height="7" rx="3" fill="#b9793f"/><rect x="6" y="40" width="52" height="7" rx="3" fill="#b9793f"/><rect x="10" y="18" width="8" height="38" rx="3" fill="#d4934f"/><rect x="28" y="18" width="8" height="38" rx="3" fill="#d4934f"/><rect x="46" y="18" width="8" height="38" rx="3" fill="#d4934f"/>'; },
    tronco: function () { return '<rect x="6" y="26" width="52" height="22" rx="11" fill="#9a6232"/><ellipse cx="12" cy="37" rx="6" ry="11" fill="#c78e55"/><circle cx="12" cy="37" r="3" fill="#9a6232"/><path d="M26 32h20M30 42h18" stroke="#7a4a22" stroke-width="2.5" stroke-linecap="round"/>'; },
    hielo: function () { return '<path d="M8 50l6-26 18-8 18 8 6 26z" fill="#bfe9ff" stroke="#fff" stroke-width="2"/><path d="M18 26l8 22M34 22l-4 26" stroke="#fff" stroke-width="2.5" opacity=".8"/>'; },
    alga: function () { return '<g stroke="#2fbf71" stroke-width="7" stroke-linecap="round" fill="none"><path class="ola" d="M14 56q-8-14 0-26t0-18"/><path class="ola" d="M32 56q-8-14 0-26t0-20"/><path class="ola" d="M50 56q-8-14 0-26t0-18"/></g>'; },
    columna: function () { return '<rect x="14" y="14" width="36" height="42" rx="6" fill="#8d7b74"/><rect x="10" y="10" width="44" height="10" rx="4" fill="#a99690"/><rect x="10" y="50" width="44" height="8" rx="4" fill="#a99690"/><path d="M26 22v26M38 22v26" stroke="#6e5d57" stroke-width="3"/>'; },
    laser: function () { return '<rect x="8" y="14" width="8" height="42" rx="3" fill="#3b476e"/><rect x="48" y="14" width="8" height="42" rx="3" fill="#3b476e"/><path d="M16 24h32M16 36h32M16 48h32" stroke="#ff3d6e" stroke-width="3.5" opacity=".9"/><circle cx="12" cy="18" r="4" fill="#ff3d6e"/><circle cx="52" cy="18" r="4" fill="#ff3d6e"/>'; },
    energia: function () { return '<path d="M32 6l16 14v26L32 60 16 46V20z" fill="#7be0ff" opacity=".85" stroke="#fff" stroke-width="2.5"/><path d="M32 6v54M16 20l32 26M48 20L16 46" stroke="#fff" stroke-width="1.5" opacity=".7"/>'; }
  };

  var OBJETOS = {
    flor: function () { return '<g><path d="M32 54V34" stroke="#3aa55a" stroke-width="4" stroke-linecap="round"/><g fill="#ff6f91"><circle cx="32" cy="18" r="8"/><circle cx="43" cy="26" r="8"/><circle cx="39" cy="38" r="8"/><circle cx="25" cy="38" r="8"/><circle cx="21" cy="26" r="8"/></g><circle cx="32" cy="29" r="8" fill="#ffd166"/></g>'; },
    zanahoria: function () { return '<g><path d="M26 14l6 8 6-8" stroke="#3aa55a" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M20 22h24l-12 36z" fill="#ff8a2a"/><path d="M26 30h8M28 40h6" stroke="#e66a10" stroke-width="2.5" stroke-linecap="round"/></g>'; },
    fruta: function () { return '<g><circle cx="32" cy="36" r="17" fill="#ff5a5f"/><path d="M32 20q2-8 8-9" stroke="#6b4a2a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M33 20q10-8 14 0-8 4-14 0z" fill="#3aa55a"/><circle cx="26" cy="30" r="4" fill="#fff" opacity=".5"/></g>'; },
    concha: function () { return '<g><path d="M10 46q0-28 22-30 22 2 22 30z" fill="#ffb3c7"/><path d="M32 16v30M22 20l6 26M42 20l-6 26M15 30l12 16M49 30L37 46" stroke="#ff7fa1" stroke-width="2.5" fill="none"/><rect x="12" y="46" width="40" height="6" rx="3" fill="#ff93b0"/></g>'; },
    luciernaga: function () { return '<g><circle cx="32" cy="32" r="22" fill="#fff6a6" opacity=".35" class="brillo"/><ellipse cx="32" cy="38" rx="10" ry="12" fill="#2d3a2f"/><ellipse cx="32" cy="42" rx="8" ry="8" fill="#ffe55a"/><circle cx="28" cy="28" r="2" fill="#fff"/><circle cx="36" cy="28" r="2" fill="#fff"/><path d="M24 30q-10-8-12 2 8 4 12-2zM40 30q10-8 12 2-8 4-12-2z" fill="#cfe9ff" opacity=".8"/></g>'; },
    cristal: function () { return '<g><path d="M32 8l14 14-6 30H24l-6-30z" fill="#7be0ff"/><path d="M32 8l-5 14 5 30 5-30z" fill="#bff3ff"/><path d="M18 22h28" stroke="#fff" stroke-width="2.5"/></g>'; },
    perla: function () { return '<g><path d="M8 40q0-14 12-14h24q12 0 12 14l-6 10H14z" fill="#e0e8f5"/><circle cx="32" cy="30" r="12" fill="#fff" stroke="#c9d6ee" stroke-width="3"/><circle cx="28" cy="26" r="4" fill="#fff"/><circle cx="28" cy="26" r="2" fill="#dff1ff"/></g>'; },
    gema: function () { return '<g><path d="M32 8l18 14-18 34L14 22z" fill="#ffb02e"/><path d="M14 22h36M32 8l-7 14 7 34 7-34z" fill="none" stroke="#ff7a1a" stroke-width="2.5"/><path d="M32 8l-7 14h14z" fill="#ffe3a0"/></g>'; },
    bateria: function () { return '<g><rect x="16" y="14" width="32" height="40" rx="7" fill="#2fd6ff"/><rect x="26" y="8" width="12" height="8" rx="2" fill="#8d9bb8"/><path d="M34 22l-8 14h8l-4 14 12-18h-8z" fill="#fff"/></g>'; },
    estrella: function () { return '<g><path d="M32 6l7.5 17 18.5 1.6-14 12.2 4.3 18.2L32 45.5 15.7 55l4.3-18.2L6 24.6 24.5 23z" fill="#ffd93d" stroke="#ffb800" stroke-width="2.5" stroke-linejoin="round"/></g>'; },
    chispa: function () { return '<g><circle cx="32" cy="32" r="22" fill="#ffe27a" opacity=".3" class="brillo"/><path d="M32 8l5 19 19 5-19 5-5 19-5-19-19-5 19-5z" fill="#ffd166" stroke="#ff9d2e" stroke-width="2.5" stroke-linejoin="round"/></g>'; }
  };

  var METAS = {
    flor: function () { return '<g transform="scale(1.1) translate(-3 -4)">' + OBJETOS.flor() + '</g><ellipse cx="32" cy="56" rx="20" ry="4" fill="#000" opacity=".12"/>'; },
    zanahoria: function () { return '<ellipse cx="32" cy="56" rx="22" ry="4" fill="#000" opacity=".12"/><g transform="translate(-4 -4) scale(1.15)">' + OBJETOS.zanahoria() + '</g>'; },
    casa: function () { return '<ellipse cx="32" cy="57" rx="24" ry="4" fill="#000" opacity=".15"/><rect x="12" y="28" width="40" height="28" rx="4" fill="#ffd9a0"/><path d="M6 32L32 8l26 24z" fill="#e8553f"/><rect x="26" y="38" width="12" height="18" rx="3" fill="#8a5a33"/><rect x="16" y="34" width="8" height="8" rx="2" fill="#9be0ff"/><rect x="40" y="34" width="8" height="8" rx="2" fill="#9be0ff"/><rect x="40" y="12" width="7" height="12" fill="#b5442f"/>'; },
    arbol: function () { return MUROS.arbol(); },
    cofre: function () { return '<ellipse cx="32" cy="56" rx="24" ry="4" fill="#000" opacity=".15"/><rect x="8" y="28" width="48" height="26" rx="5" fill="#a8672d"/><path d="M8 34q0-20 24-20t24 20z" fill="#c98441"/><rect x="8" y="34" width="48" height="5" fill="#ffd166"/><rect x="27" y="34" width="10" height="14" rx="2" fill="#ffd166"/><circle cx="32" cy="42" r="2.5" fill="#7a4a1f"/><path d="M44 10l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#fff6a6" class="brillo"/>'; },
    portal: function () { return '<g class="gira"><circle cx="32" cy="32" r="24" fill="none" stroke="#ffd166" stroke-width="5" stroke-dasharray="10 6"/></g><circle cx="32" cy="32" r="17" fill="#fff6c9" opacity=".55" class="brillo"/><circle cx="32" cy="32" r="10" fill="#fff"/><path d="M32 18l3 11 11 3-11 3-3 11-3-11-11-3 11-3z" fill="#ffb02e"/>'; },
    faro: function () { return '<ellipse cx="32" cy="58" rx="20" ry="4" fill="#000" opacity=".2"/><path d="M20 56l5-34h14l5 34z" fill="#f4f1ea"/><path d="M23 40h18l1.6 10H21.4z M25 26h14l1 6H24z" fill="#e8553f"/><rect x="22" y="14" width="20" height="10" rx="2" fill="#ffd166" class="brillo"/><path d="M20 14h24l-12-9z" fill="#e8553f"/><path d="M12 19l8 3M52 19l-8 3" stroke="#ffd166" stroke-width="3" stroke-linecap="round"/>'; }
  };

  function interruptor(activo) {
    return '<rect x="10" y="10" width="44" height="44" rx="12" fill="#00000022"/><circle cx="32" cy="32" r="17" fill="' + (activo ? '#3ddc84' : '#ff5a5f') + '"/><circle cx="32" cy="' + (activo ? 36 : 30) + '" r="11" fill="' + (activo ? '#7af0ac' : '#ff8a8e') + '"/>';
  }
  function puerta(abierta, tema) {
    if (abierta) return '<rect x="6" y="48" width="52" height="8" rx="4" fill="#00000030"/><rect x="8" y="52" width="48" height="5" rx="2" fill="#8a96b3"/>';
    return '<rect x="6" y="8" width="52" height="50" rx="8" fill="#5b6b92"/><rect x="12" y="14" width="40" height="38" rx="5" fill="#3e4a6e"/><g fill="#b9c4e0"><rect x="19" y="14" width="5" height="38"/><rect x="30" y="14" width="5" height="38"/><rect x="41" y="14" width="5" height="38"/></g><circle cx="32" cy="32" r="6" fill="#ffd166"/><rect x="30" y="30" width="4" height="9" rx="1" fill="#a8672d"/>';
  }

  function celda(tipo, tema, x, y, skin) {
    var T = TEMAS[tema] || TEMAS.jardin;
    skin = skin || {};
    if (tipo === '~') return PELIGROS[T.agua]();
    var base = suelo(tema, x, y);
    switch (tipo) {
      case '#': return base + MUROS[T.muro]();
      case 'b': return base + BARRERAS[T.barrera]();
      case 'G': return base + METAS[skin.meta || T.meta]();
      case 's': return base + '<g class="interruptor" data-x="' + x + '" data-y="' + y + '">' + interruptor(false) + '</g>';
      case 'd': return base + '<g class="puerta" data-x="' + x + '" data-y="' + y + '">' + puerta(false, tema) + '</g>';
      default: return base;
    }
  }
  function objeto(tema, skin) { var T = TEMAS[tema] || TEMAS.jardin; skin = skin || {}; return OBJETOS[skin.obj || T.obj](); }

  // ---------------------------------------------------------------- Lumo
  var OJO = { E: [3, 0], O: [-3, 0], N: [0, -2.5], S: [0, 2.5] };
  function boca(expr) {
    switch (expr) {
      case 'feliz': return '<path d="M36 61q14 14 28 0z" fill="#7a2a1a" stroke="#7a2a1a" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 65q8 6 16 0" stroke="#ff7f8a" stroke-width="3" fill="none"/>';
      case 'triste': return '<path d="M39 69q11-9 22 0" stroke="#7a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      case 'sorpresa': return '<ellipse cx="50" cy="66" rx="6" ry="7.5" fill="#7a2a1a"/>';
      case 'pensando': return '<path d="M42 66q8 3 16-2" stroke="#7a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
      default: return '<path d="M40 63q10 9 20 0" stroke="#7a2a1a" stroke-width="3.5" fill="none" stroke-linecap="round"/>';
    }
  }
  var DISFRACES_SVG = {
    1: '<path d="M26 34q24-26 48 0z" fill="#3aa55a" stroke="#2c8745" stroke-width="2.5" stroke-linejoin="round"/><path d="M62 34h22q-2 6-12 6H62z" fill="#2c8745"/><circle cx="50" cy="20" r="4" fill="#ffd166"/>',
    2: '<g fill="#fff" fill-opacity=".35" stroke="#2b3a67" stroke-width="3.5"><circle cx="39" cy="50" r="11"/><circle cx="61" cy="50" r="11"/></g><path d="M50 50h0M28 48l-6-3M72 48l6-3" stroke="#2b3a67" stroke-width="3.5" stroke-linecap="round"/>',
    4: '<path d="M22 52Q22 14 50 14t28 38z" fill="#9fb0c8" stroke="#5c6f8f" stroke-width="3" opacity=".6"/><path d="M22 52Q22 14 50 14t28 38" fill="none" stroke="#5c6f8f" stroke-width="4"/><circle cx="50" cy="14" r="4" fill="#ff5a5f"/>',
    5: '<path d="M24 36q26-14 52 0v8H24z" fill="#4a4a5c"/><g fill="#7be0ff" stroke="#2b2b3a" stroke-width="3"><circle cx="38" cy="38" r="8"/><circle cx="62" cy="38" r="8"/></g>',
    6: '<path d="M50 24V6" stroke="#8d9bb8" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="6" r="6" fill="#ff5a5f"/><circle cx="48" cy="4" r="2" fill="#fff"/>',
    7: '<path d="M28 28l6-16 8 10 8-14 8 14 8-10 6 16z" fill="#ffd166" stroke="#ff9d2e" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="20" r="3" fill="#ff5a5f"/>'
  };
  var CAPA = '<path d="M26 52Q10 78 18 92l32-6 32 6q8-14-8-40z" fill="#e8553f"/><path d="M26 52Q20 70 26 84" stroke="#b83a28" stroke-width="3" fill="none"/>';

  // Lumo: viewBox 0 0 100 100. dir: E/O/N/S (hacia dónde mira)
  function lumo(op) {
    op = op || {};
    var o = OJO[op.dir || 'S'] || OJO.S, expr = op.expr || 'normal', d = op.disfraz | 0;
    var cerrados = expr === 'triste' || expr === 'feliz';
    var ojos = [38, 62].map(function (cx) {
      return '<ellipse cx="' + cx + '" cy="52" rx="9" ry="' + (cerrados && expr === 'feliz' ? 7 : 10) + '" fill="#fff"/>' +
        '<circle cx="' + (cx + o[0]) + '" cy="' + (53 + o[1]) + '" r="5" fill="#2b2140"/><circle cx="' + (cx + o[0] + 1.6) + '" cy="' + (51 + o[1]) + '" r="1.8" fill="#fff"/>';
    }).join('');
    var cejas = expr === 'triste' ? '<path d="M27 43l15-6M73 43l-15-6" stroke="#7a2a1a" stroke-width="3.5" stroke-linecap="round"/>' :
      expr === 'sorpresa' ? '<path d="M28 36q10-6 18-1M72 36q-10-6-18-1" stroke="#7a2a1a" stroke-width="3.2" fill="none" stroke-linecap="round"/>' :
      expr === 'pensando' ? '<path d="M28 38q10-5 18 0M56 36l16-4" stroke="#7a2a1a" stroke-width="3.2" fill="none" stroke-linecap="round"/>' : '';
    return '<svg viewBox="0 0 100 100" class="lumo-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      (d === 3 ? CAPA : '') +
      '<circle cx="50" cy="56" r="46" fill="url(#gLumoGlow)"/>' +
      '<g class="llama"><path d="M50 4q14 14 10 26-3 7-10 7t-10-7Q36 18 50 4z" fill="url(#gLlama)"/><path d="M50 14q6 8 3 15-3 4-3 4t-3-4q-3-7 3-15z" fill="#fff3a8" opacity=".85"/></g>' +
      '<ellipse cx="50" cy="60" rx="35" ry="32" fill="url(#gLumo)"/>' +
      '<ellipse cx="38" cy="40" rx="13" ry="7" fill="#fff" opacity=".28" transform="rotate(-20 38 40)"/>' +
      '<ellipse cx="34" cy="91" rx="10" ry="5" fill="#e0731a"/><ellipse cx="66" cy="91" rx="10" ry="5" fill="#e0731a"/>' +
      '<circle cx="26" cy="64" r="6" fill="#ff7f8a" opacity=".55"/><circle cx="74" cy="64" r="6" fill="#ff7f8a" opacity=".55"/>' +
      ojos + cejas + boca(expr) +
      '<g transform="translate(50 84)"><circle r="8" fill="#fff" stroke="#c9741a" stroke-width="2.5"/><path d="M0-6l3 6-3 6-3-6z" fill="#e8553f"/><path d="M0 6l-3-6h6z" fill="#7a8aa8"/></g>' +
      (DISFRACES_SVG[d] || '') + '</svg>';
  }

  // ---------------------------------------------------------------- personajes secundarios
  var PERSONAJES = {
    'Abuela Chispa': '<circle cx="50" cy="56" r="46" fill="#c9a0ff" opacity=".3"/><path d="M50 2q16 16 11 30-3 7-11 7t-11-7Q34 18 50 2z" fill="#d9a8ff"/><ellipse cx="50" cy="62" rx="36" ry="32" fill="#b784f0"/><ellipse cx="50" cy="62" rx="36" ry="32" fill="url(#gLumoGlow)" opacity=".4"/><g fill="#fff" fill-opacity=".4" stroke="#6a3fa8" stroke-width="3"><circle cx="37" cy="54" r="10"/><circle cx="63" cy="54" r="10"/></g><path d="M47 54h6" stroke="#6a3fa8" stroke-width="3"/><circle cx="37" cy="55" r="4" fill="#2b2140"/><circle cx="63" cy="55" r="4" fill="#2b2140"/><path d="M40 72q10 9 20 0" stroke="#5a2a7a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="26" cy="68" r="5" fill="#ff9ac8" opacity=".6"/><circle cx="74" cy="68" r="5" fill="#ff9ac8" opacity=".6"/><ellipse cx="36" cy="93" rx="10" ry="5" fill="#8b57c9"/><ellipse cx="64" cy="93" rx="10" ry="5" fill="#8b57c9"/><path d="M30 28q20-12 40 0" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>',
    'Búho Bruma': '<ellipse cx="50" cy="94" rx="30" ry="5" fill="#000" opacity=".15"/><path d="M20 38l-4-22 18 12q16-6 32 0l18-12-4 22q8 22-6 40-12 14-24 14T26 78q-14-18-6-40z" fill="#8b6bd1"/><ellipse cx="50" cy="70" rx="20" ry="20" fill="#d7c8f5"/><g fill="#fff" stroke="#4a3a8a" stroke-width="3"><circle cx="37" cy="48" r="13"/><circle cx="63" cy="48" r="13"/></g><circle cx="38" cy="49" r="6" fill="#2b2140"/><circle cx="62" cy="49" r="6" fill="#2b2140"/><circle cx="40" cy="47" r="2" fill="#fff"/><circle cx="64" cy="47" r="2" fill="#fff"/><path d="M50 54l-5 8h10z" fill="#ffb02e"/><path d="M38 78l6 6M50 82l0 6M62 78l-6 6" stroke="#8b6bd1" stroke-width="3" stroke-linecap="round"/>',
    'Bichito': '<ellipse cx="50" cy="90" rx="22" ry="4" fill="#000" opacity=".15"/><path d="M36 34q-6-14-16-14M64 34q6-14 16-14" stroke="#2d6a3e" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="20" cy="20" r="4" fill="#ff6f91"/><circle cx="80" cy="20" r="4" fill="#ff6f91"/><ellipse cx="50" cy="62" rx="30" ry="28" fill="#6fcf6f"/><path d="M50 36v52" stroke="#3aa55a" stroke-width="3"/><circle cx="38" cy="66" r="5" fill="#2d6a3e"/><circle cx="62" cy="74" r="5" fill="#2d6a3e"/><circle cx="50" cy="52" r="16" fill="#8be08b"/><circle cx="43" cy="50" r="5" fill="#fff"/><circle cx="57" cy="50" r="5" fill="#fff"/><circle cx="44" cy="51" r="2.4" fill="#2b2140"/><circle cx="58" cy="51" r="2.4" fill="#2b2140"/><path d="M43 60q7 6 14 0" stroke="#2d6a3e" stroke-width="3" fill="none" stroke-linecap="round"/>',
    'Tinta': '<ellipse cx="50" cy="94" rx="30" ry="4" fill="#000" opacity=".15"/><g stroke="#ff7fb0" stroke-width="9" stroke-linecap="round" fill="none"><path d="M28 70q-10 12-4 22"/><path d="M40 76q-4 12 2 18"/><path d="M60 76q4 12-2 18"/><path d="M72 70q10 12 4 22"/></g><ellipse cx="50" cy="44" rx="30" ry="34" fill="#ff7fb0"/><ellipse cx="50" cy="44" rx="30" ry="34" fill="url(#gLumoGlow)" opacity=".25"/><g fill="#fff" stroke="#c43b78" stroke-width="3"><circle cx="38" cy="52" r="9"/><circle cx="62" cy="52" r="9"/></g><circle cx="39" cy="53" r="4" fill="#2b2140"/><circle cx="63" cy="53" r="4" fill="#2b2140"/><path d="M42 68q8 7 16 0" stroke="#8c1f52" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 22q18-14 36 0" stroke="#ffc0da" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="76" cy="20" r="7" fill="#ffd166"/><path d="M72 20h8M76 16v8" stroke="#a8672d" stroke-width="2.5"/>',
    'Lagarto gigante': '<ellipse cx="50" cy="94" rx="36" ry="4" fill="#000" opacity=".2"/><path d="M8 78q14-24 40-24h20q22 0 26 16l-12 6q-6-6-16-4-24 4-58 6z" fill="#4faf5a"/><path d="M68 54q10-16 22-8-2 12-14 14z" fill="#4faf5a"/><circle cx="82" cy="52" r="5" fill="#fff"/><circle cx="83" cy="53" r="2.4" fill="#2b2140"/><path d="M20 70l6-10 6 10M36 66l6-10 6 10M52 62l6-10 6 10" fill="#ffb02e"/><rect x="26" y="76" width="9" height="14" rx="4" fill="#3d9148"/><rect x="62" y="76" width="9" height="14" rx="4" fill="#3d9148"/>',
    'Bit': '<ellipse cx="50" cy="94" rx="26" ry="4" fill="#000" opacity=".15"/><rect x="40" y="2" width="4" height="12" fill="#8d9bb8"/><circle cx="42" cy="4" r="5" fill="#ff5a5f"/><rect x="22" y="14" width="56" height="40" rx="12" fill="#c9d4ea"/><rect x="28" y="22" width="44" height="24" rx="8" fill="#26335e"/><circle cx="40" cy="34" r="6" fill="#5fe0ff"/><circle cx="60" cy="34" r="6" fill="#5fe0ff"/><path d="M42 42q8 4 16 0" stroke="#5fe0ff" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="28" y="56" width="44" height="30" rx="8" fill="#9fb0cf"/><circle cx="50" cy="70" r="7" fill="#ffd166"/><rect x="14" y="58" width="12" height="22" rx="6" fill="#c9d4ea"/><rect x="74" y="58" width="12" height="22" rx="6" fill="#c9d4ea"/><rect x="32" y="86" width="12" height="8" rx="3" fill="#7b8bb0"/><rect x="56" y="86" width="12" height="8" rx="3" fill="#7b8bb0"/>'
  };
  function personaje(nombre) {
    if (nombre === 'Lumo') return lumo({ expr: 'feliz', dir: 'S' });
    return '<svg viewBox="0 0 100 100" class="pers-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + (PERSONAJES[nombre] || '') + '</svg>';
  }

  // ---------------------------------------------------------------- iconos de tarjetas (48×48, trazo blanco)
  var S = 'stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  var ICONOS = {
    'avanzar': '<path d="M24 40V10M11 22l13-13 13 13" ' + S + '/>',
    'retroceder': '<path d="M24 8v30M11 26l13 13 13-13" ' + S + '/>',
    'girar-d': '<path d="M12 40V26q0-12 12-12h14M30 5l9 9-9 9" ' + S + '/>',
    'girar-i': '<path d="M36 40V26q0-12-12-12H10M18 5l-9 9 9 9" ' + S + '/>',
    'saltar': '<path d="M6 36Q24-4 42 36" ' + S + '/><path d="M36 28l7 8-10 2" ' + S + ' stroke-width="5"/>',
    'recoger': '<path d="M24 6l14 12-14 24L10 18z" fill="#fff"/><path d="M10 18h28" stroke="#0003" stroke-width="2.5"/>',
    'activar': '<rect x="6" y="32" width="36" height="10" rx="4" fill="#fff"/><circle cx="24" cy="24" r="11" fill="#fff"/><path d="M24 4v6M8 10l4 4M40 10l-4 4" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    'esperar': '<path d="M13 7h22M13 41h22M15 7c0 10 18 10 18 17S15 31 15 41M33 7c0 10-18 10-18 17s18 7 18 17" ' + S + ' stroke-width="4"/>',
    'repetir': '<path d="M9 22a15 15 0 0 1 27-8M39 26a15 15 0 0 1-27 8" ' + S + ' stroke-width="5"/><path d="M36 5v10H26M12 43V33h10" ' + S + ' stroke-width="5"/>',
    'si': '<path d="M24 42V26M24 26L11 10M24 26l13-16" ' + S + ' stroke-width="5"/><circle cx="11" cy="9" r="4.5" fill="#fff"/><circle cx="37" cy="9" r="4.5" fill="#fff"/><circle cx="24" cy="42" r="4.5" fill="#fff"/>',
    'mientras': '<path d="M3 24c8-13 34-13 42 0-8 13-34 13-42 0z" ' + S + ' stroke-width="4"/><circle cx="24" cy="24" r="6.5" fill="#fff"/>',
    'receta': '<path d="M9 22h30v12a8 8 0 0 1-8 8H17a8 8 0 0 1-8-8z" fill="#fff"/><path d="M9 26H4M39 26h5" ' + S + ' stroke-width="4"/><path d="M17 16q-3-4 0-8M25 16q-3-4 0-8M33 16q-3-4 0-8" ' + S + ' stroke-width="3.5"/>'
  };
  var CARTA_COLOR = {
    'avanzar': '#2f80ed', 'retroceder': '#2f80ed', 'girar-d': '#7c4dff', 'girar-i': '#7c4dff', 'saltar': '#0fa37f',
    'recoger': '#e07b00', 'activar': '#d6453d', 'esperar': '#6f7d8f',
    'repetir': '#ab47bc', 'si': '#d81b7a', 'mientras': '#8e44ad', 'receta': '#1f9d55'
  };
  var CARTA_NOMBRE = {
    'avanzar': 'Avanzar', 'retroceder': 'Retroceder', 'girar-d': 'Girar derecha', 'girar-i': 'Girar izquierda', 'saltar': 'Saltar',
    'recoger': 'Recoger', 'activar': 'Activar', 'esperar': 'Esperar', 'repetir': 'Repetir', 'si': 'Si', 'mientras': 'Mientras', 'receta': 'Receta'
  };
  function iconoCarta(t, tam) {
    return '<svg viewBox="0 0 48 48" width="' + (tam || 48) + '" height="' + (tam || 48) + '" aria-hidden="true">' + (ICONOS[t] || '') + '</svg>';
  }

  // Condiciones (32×32)
  var COND_ICONOS = {
    'obstaculo-delante': '<rect x="4" y="9" width="24" height="16" rx="2" fill="#b0673a"/><path d="M4 17h24M12 9v8M20 17v8" stroke="#6d3c1b" stroke-width="2"/>',
    'agua-delante': '<rect x="3" y="6" width="26" height="20" rx="5" fill="#3aa0ff"/><path d="M6 13q3.5-3.5 7 0t7 0 6 0M6 20q3.5-3.5 7 0t7 0 6 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    'objeto-aqui': '<path d="M16 3l9 8-9 18-9-18z" fill="#ffb02e" stroke="#e07b00" stroke-width="2" stroke-linejoin="round"/>',
    'interruptor-aqui': '<circle cx="16" cy="16" r="12" fill="#eee" stroke="#555" stroke-width="2"/><circle cx="16" cy="16" r="6" fill="#ff5a5f"/>',
    'meta-aqui': '<path d="M9 28V4" stroke="#444" stroke-width="3" stroke-linecap="round"/><path d="M10 5h16l-4 6 4 6H10z" fill="#e8553f"/>'
  };
  var COND_NOMBRE = {
    'obstaculo-delante': 'obstáculo delante', 'agua-delante': 'vacío delante', 'objeto-aqui': 'objeto aquí',
    'interruptor-aqui': 'interruptor aquí', 'meta-aqui': 'meta aquí'
  };
  function iconoCond(c, no, tam) {
    tam = tam || 32;
    return '<svg viewBox="0 0 32 32" width="' + tam + '" height="' + tam + '" aria-hidden="true">' + (COND_ICONOS[c] || '') +
      (no ? '<circle cx="16" cy="16" r="14" fill="none" stroke="#d6232d" stroke-width="3"/><path d="M6 26L26 6" stroke="#d6232d" stroke-width="3.5" stroke-linecap="round"/>' : '') + '</svg>';
  }

  // ---------------------------------------------------------------- insignias (64×64)
  var INS = {
    huella: '<path d="M22 44c-4-6-1-14 5-14s9 8 5 14-6 6-10 0zM14 28a4 5 0 1 1 8 0 4 5 0 1 1-8 0zM30 22a4 5 0 1 1 8 0 4 5 0 1 1-8 0z" fill="#fff"/>',
    giro: '<path d="M18 46V32q0-12 12-12h14M38 12l8 8-8 8" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    luz: '<path d="M32 8l5 17 17 5-17 5-5 17-5-17-17-5 17-5z" fill="#fff"/>',
    salto: '<path d="M8 46Q32-6 56 46" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="56" cy="46" r="4" fill="#fff"/>',
    bucle: '<path d="M14 30a18 18 0 0 1 32-10M50 34a18 18 0 0 1-32 10" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M48 8v14H34M16 56V42h14" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
    lupa: '<circle cx="28" cy="28" r="13" stroke="#fff" stroke-width="6" fill="none"/><path d="M38 38l14 14" stroke="#fff" stroke-width="7" stroke-linecap="round"/>',
    receta: '<path d="M12 28h40v14a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="#fff"/><path d="M22 20q-4-5 0-10M32 20q-4-5 0-10M42 20q-4-5 0-10" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/>',
    si: '<path d="M32 54V34M32 34L16 14M32 34l16-20" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="16" cy="12" r="6" fill="#fff"/><circle cx="48" cy="12" r="6" fill="#fff"/>',
    estrella: '<path d="M32 6l8.5 19.5 21 2-16 14 5 21L32 50 13.5 62.5l5-21-16-14 21-2z" fill="#fff"/>',
    corazon: '<path d="M32 54C10 38 8 22 18 16c7-4 12 0 14 6 2-6 7-10 14-6 10 6 8 22-14 38z" fill="#fff"/>',
    flor: '<g fill="#fff"><circle cx="32" cy="18" r="9"/><circle cx="44" cy="28" r="9"/><circle cx="40" cy="42" r="9"/><circle cx="24" cy="42" r="9"/><circle cx="20" cy="28" r="9"/></g><circle cx="32" cy="32" r="8" fill="#ffd166"/>',
    zanahoria: '<path d="M26 12l6 8 6-8" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M18 20h28L32 58z" fill="#fff"/>',
    concha: '<path d="M8 48q0-32 24-34 24 2 24 34z" fill="#fff"/><path d="M32 14v34M20 20l7 28M44 20l-7 28" stroke="#0003" stroke-width="3" fill="none"/>',
    brujula: '<circle cx="32" cy="32" r="22" stroke="#fff" stroke-width="5" fill="none"/><path d="M32 14l7 18-7 18-7-18z" fill="#fff"/>',
    faro: '<path d="M20 56l5-34h14l5 34z" fill="#fff"/><rect x="22" y="12" width="20" height="10" rx="2" fill="#fff"/><path d="M12 17l8 3M52 17l-8 3" stroke="#fff" stroke-width="4" stroke-linecap="round"/>',
    llave: '<circle cx="22" cy="24" r="12" stroke="#fff" stroke-width="6" fill="none"/><path d="M30 32l22 22M44 46l6-6M38 40l6-6" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
    lab: '<path d="M24 8h16M28 8v18L12 54h40L36 26V8" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="30" cy="42" r="4" fill="#fff"/><circle cx="40" cy="46" r="3" fill="#fff"/>'
  };
  var INS_COLOR = ['#ef6c57', '#f59e0b', '#22a06b', '#2f80ed', '#7c4dff', '#d81b7a', '#0ea5a4'];
  function insignia(icono, idx, bloqueada) {
    var c = bloqueada ? '#c3c9d4' : INS_COLOR[(idx | 0) % INS_COLOR.length];
    return '<svg viewBox="0 0 64 64" class="ins-svg" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="' + c + '"/><circle cx="32" cy="32" r="30" fill="none" stroke="#fff" stroke-width="3" opacity=".6"/>' +
      '<g opacity="' + (bloqueada ? .45 : 1) + '">' + (INS[icono] || INS.estrella) + '</g></svg>';
  }

  // ---------------------------------------------------------------- varios
  function estrella(llena, tam) {
    return '<svg viewBox="0 0 64 64" class="estrella ' + (llena ? 'llena' : 'vacia') + '" width="' + (tam || 40) + '" height="' + (tam || 40) + '" aria-hidden="true">' +
      '<path d="M32 5l8.7 19.2 21 2.2-15.7 14 4.6 20.6L32 50.3 13.4 61l4.6-20.6L2.3 26.4l21-2.2z" fill="' + (llena ? '#ffd93d' : '#e6e9f2') + '" stroke="' + (llena ? '#ffb800' : '#c8cede') + '" stroke-width="4" stroke-linejoin="round"/></svg>';
  }
  function candado() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="14" width="20" height="14" rx="3" fill="#8a94a8"/><path d="M10 14v-3a6 6 0 0 1 12 0v3" stroke="#8a94a8" stroke-width="3.5" fill="none"/><circle cx="16" cy="21" r="2.5" fill="#fff"/></svg>';
  }
  function brujulaPieza(n, llena) {
    return '<svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="' + (llena ? '#ffe9a8' : '#e3e7f0') + '" stroke="' + (llena ? '#e0a21b' : '#b7bfd0') + '" stroke-width="4"/>' +
      (llena ? '<path d="M32 10l7 22-7 22-7-22z" fill="#e8553f"/><path d="M32 54l-7-22h14z" fill="#7a8aa8"/>' : '<text x="32" y="40" text-anchor="middle" font-size="24" font-family="Baloo 2,sans-serif" fill="#b7bfd0">' + n + '</text>') + '</svg>';
  }

  // 12 pictogramas para el código de partida de Infantil (valores 0..11)
  var PICTOS = ['flor', 'zanahoria', 'fruta', 'concha', 'luciernaga', 'cristal', 'perla', 'gema', 'bateria', 'estrella', 'chispa', 'casa'];
  var PICTO_NOMBRE = ['Flor', 'Zanahoria', 'Fruta', 'Concha', 'Luciérnaga', 'Cristal', 'Perla', 'Gema', 'Batería', 'Estrella', 'Chispa', 'Casa'];
  function picto(i) {
    var n = PICTOS[i];
    return '<svg viewBox="0 0 64 64" class="picto-svg" aria-hidden="true">' + (n === 'casa' ? METAS.casa() : OBJETOS[n]()) + '</svg>';
  }

  // Defs globales (degradados reutilizables por todos los SVG en línea)
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<radialGradient id="gLumoGlow"><stop offset="55%" stop-color="#ffe27a" stop-opacity=".45"/><stop offset="100%" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="gLumo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe066"/><stop offset="1" stop-color="#ff9d2e"/></linearGradient>' +
      '<linearGradient id="gLlama" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd166"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient>' +
      '</defs></svg>';
  }

  function logo() {
    return '<svg viewBox="0 0 560 180" class="logo-svg" role="img" aria-label="RUMBO"><defs><linearGradient id="gLogo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffb02e"/></linearGradient></defs>' +
      '<g font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="128" text-anchor="middle">' +
      '<text x="280" y="136" fill="#5b2a86" stroke="#5b2a86" stroke-width="18" stroke-linejoin="round">RUMBO</text>' +
      '<text x="280" y="136" fill="url(#gLogo)" stroke="#fff" stroke-width="3" stroke-linejoin="round" paint-order="stroke">RUMBO</text></g></svg>';
  }

  UI.Arte = {
    TEMAS: TEMAS, NOMBRES_ZONA: NOMBRES_ZONA, celda: celda, objeto: objeto, interruptor: interruptor, puerta: puerta,
    lumo: lumo, personaje: personaje, PERSONAJES: Object.keys(PERSONAJES).concat(['Lumo']),
    iconoCarta: iconoCarta, CARTA_COLOR: CARTA_COLOR, CARTA_NOMBRE: CARTA_NOMBRE,
    iconoCond: iconoCond, COND_NOMBRE: COND_NOMBRE, insignia: insignia,
    picto: picto, PICTOS: PICTOS, PICTO_NOMBRE: PICTO_NOMBRE,
    estrella: estrella, candado: candado, brujulaPieza: brujulaPieza, defs: defs, logo: logo
  };
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/sonido.js ===== */
;/*
 * RUMBO — Sonido procedural con Web Audio (sin archivos de audio):
 * efectos de interacción y una música ambiental suave distinta por mundo.
 * Chrome solo permite sonar tras un gesto del usuario: se activa en el primer toque.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var ctx = null, maestro = null, musicaGain = null, sfxOn = true, musOn = true, timer = null, zonaActual = null, paso = 0;

  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
      maestro = ctx.createGain(); maestro.gain.value = 0.8; maestro.connect(ctx.destination);
      musicaGain = ctx.createGain(); musicaGain.gain.value = 0.10; musicaGain.connect(maestro);
    } catch (e) { ctx = null; }
  }
  function nota(f, t0, dur, tipo, vol, destino, glide) {
    if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(destino || maestro); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  var F = { do4: 261.63, re4: 293.66, mi4: 329.63, sol4: 392, la4: 440, do5: 523.25, re5: 587.33, mi5: 659.25, sol5: 783.99, do6: 1046.5 };

  var EFECTOS = {
    toque: function (t) { nota(660, t, .08, 'triangle', .15); },
    poner: function (t) { nota(520, t, .09, 'triangle', .18); nota(780, t + .05, .09, 'triangle', .12); },
    quitar: function (t) { nota(520, t, .12, 'triangle', .14, null, 260); },
    paso: function (t) { nota(300, t, .07, 'square', .06); },
    giro: function (t) { nota(440, t, .12, 'triangle', .12, null, 660); },
    salto: function (t) { nota(330, t, .22, 'sine', .2, null, 880); },
    recoger: function (t) { nota(F.mi5, t, .1, 'triangle', .2); nota(F.sol5, t + .08, .16, 'triangle', .2); },
    activar: function (t) { nota(200, t, .15, 'square', .12); nota(400, t + .1, .25, 'triangle', .16); },
    choque: function (t) { nota(160, t, .18, 'sawtooth', .13, null, 90); },
    caida: function (t) { nota(600, t, .5, 'sine', .18, null, 90); },
    pista: function (t) { nota(F.sol5, t, .1, 'sine', .15); nota(F.do6, t + .09, .2, 'sine', .15); },
    estrella: function (t) { [F.do5, F.mi5, F.sol5, F.do6].forEach(function (f, i) { nota(f, t + i * .1, .25, 'triangle', .2); }); },
    victoria: function (t) { [F.do5, F.mi5, F.sol5, F.do6, F.sol5, F.do6].forEach(function (f, i) { nota(f, t + i * .11, .3, 'triangle', .22); }); },
    desbloqueo: function (t) { [F.sol4, F.do5, F.mi5, F.sol5, F.do6].forEach(function (f, i) { nota(f, t + i * .08, .3, 'sine', .2); }); },
    animo: function (t) { nota(F.mi4, t, .18, 'sine', .16); nota(F.sol4, t + .16, .24, 'sine', .16); }
  };
  function sfx(n) {
    if (!sfxOn) return; iniciar(); if (!ctx || !EFECTOS[n]) return;
    EFECTOS[n](ctx.currentTime + 0.01);
  }

  // Escalas y compases propios de cada zona (acordes lentos y un arpegio suave).
  var MUSICA = {
    jardin: { bpm: 84, esc: [0, 2, 4, 7, 9], base: 60, onda: 'triangle' },
    granja: { bpm: 90, esc: [0, 2, 4, 7, 9], base: 62, onda: 'triangle' },
    playa: { bpm: 80, esc: [0, 2, 4, 7, 9], base: 64, onda: 'sine' },
    bosque: { bpm: 72, esc: [0, 3, 5, 7, 10], base: 57, onda: 'sine' },
    montanas: { bpm: 66, esc: [0, 2, 5, 7, 9], base: 55, onda: 'triangle' },
    mar: { bpm: 70, esc: [0, 2, 4, 7, 11], base: 59, onda: 'sine' },
    volcan: { bpm: 96, esc: [0, 3, 5, 6, 7], base: 52, onda: 'sawtooth' },
    ciudad: { bpm: 100, esc: [0, 2, 4, 7, 9], base: 60, onda: 'square' },
    espacio: { bpm: 64, esc: [0, 2, 7, 9, 14], base: 58, onda: 'sine' },
    faro: { bpm: 68, esc: [0, 4, 7, 9, 12], base: 60, onda: 'triangle' },
    mapa: { bpm: 78, esc: [0, 2, 4, 7, 9], base: 60, onda: 'triangle' }
  };
  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }
  function tic() {
    var m = MUSICA[zonaActual]; if (!m || !ctx || !musOn) return;
    var t = ctx.currentTime + 0.05, dur = 60 / m.bpm;
    var g = (paso * 7 + (paso >> 2)) % m.esc.length;
    var n1 = m.base + m.esc[g] + (paso % 8 === 0 ? -12 : 0);
    nota(midi(n1), t, dur * 1.6, m.onda, m.onda === 'square' || m.onda === 'sawtooth' ? .35 : .9, musicaGain);
    if (paso % 2 === 1) nota(midi(m.base + 12 + m.esc[(g + 2) % m.esc.length]), t + dur / 2, dur, 'sine', .5, musicaGain);
    paso++;
  }
  function musica(zona) {
    if (zona === zonaActual) return;
    detener(); zonaActual = zona;
    if (!zona || !musOn) return;
    iniciar(); if (!ctx) return;
    var m = MUSICA[zona] || MUSICA.mapa;
    tic(); timer = setInterval(tic, 60000 / m.bpm);
  }
  function detener() { if (timer) clearInterval(timer); timer = null; }
  function ajustar(o) {
    sfxOn = o.sonido !== false;
    var antes = musOn; musOn = o.musica !== false;
    if (!musOn) { detener(); }
    else if (!antes && zonaActual) { var z = zonaActual; zonaActual = null; musica(z); }
  }

  UI.Sonido = { iniciar: iniciar, sfx: sfx, musica: musica, detener: detener, ajustar: ajustar };
  // Un primer gesto desbloquea el audio del navegador.
  ['pointerdown', 'keydown'].forEach(function (e) { root.addEventListener && root.addEventListener(e, iniciar, { once: true, passive: true }); });
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/guardado.js ===== */
;/*
 * RUMBO — Guardado local (localStorage con respaldo en memoria).
 * Nada sale del equipo. Se puede exportar/importar una copia JSON completa
 * (útil para llevar a una clase los perfiles de otra).
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var CLAVE = 'rumbo.v1';
  var memoria = null, almacen = null;

  try { almacen = root.localStorage; var t = '__rumbo'; almacen.setItem(t, '1'); almacen.removeItem(t); } catch (e) { almacen = null; }

  function porDefecto() {
    return { version: 1, perfiles: [], activo: null, retos: [],
      ajustes: { sonido: true, musica: true, voz: true, reducir: false, fuente: 1, contraste: false, velocidad: 1 } };
  }
  function cargar() {
    if (memoria) return memoria;
    var d = null;
    try { if (almacen) d = JSON.parse(almacen.getItem(CLAVE) || 'null'); } catch (e) { d = null; }
    if (!d || typeof d !== 'object' || !Array.isArray(d.perfiles)) d = porDefecto();
    var def = porDefecto();
    d.ajustes = Object.assign(def.ajustes, d.ajustes || {});
    d.retos = Array.isArray(d.retos) ? d.retos : [];
    memoria = d;
    return d;
  }
  function guardar() {
    if (!memoria) return true;
    try { if (almacen) almacen.setItem(CLAVE, JSON.stringify(memoria)); return !!almacen; } catch (e) { return false; }
  }
  function persistente() { return !!almacen; }
  function exportar() { return JSON.stringify(cargar(), null, 1); }
  function importar(texto) {
    var d = JSON.parse(texto);
    if (!d || !Array.isArray(d.perfiles)) throw new Error('Archivo no válido');
    d.perfiles = d.perfiles.filter(function (p) { return p && typeof p.id === 'string' && p.niveles && typeof p.niveles === 'object'; });
    var def = porDefecto();
    d.ajustes = Object.assign(def.ajustes, d.ajustes || {});
    d.retos = Array.isArray(d.retos) ? d.retos : [];
    memoria = Object.assign(def, d);
    guardar();
    return memoria;
  }
  function reiniciarTodo() { memoria = porDefecto(); guardar(); return memoria; }

  UI.Guardado = { cargar: cargar, guardar: guardar, persistente: persistente, exportar: exportar, importar: importar, reiniciarTodo: reiniciarTodo };
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/escenario.js ===== */
;/*
 * RUMBO — Escenario: dibuja el tablero en SVG y reproduce la TRAZA del intérprete
 * con animaciones (Lumo se mueve, gira, salta, recoge, activa mecanismos…).
 * No decide nada del juego: solo muestra lo que la traza dice.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var A = function () { return UI.Arte; };
  var CELDA = 64;
  var DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], O: [-1, 0] };
  var OPUESTA = { N: 'S', S: 'N', E: 'O', O: 'E' };
  var ANGULO = { N: -90, E: 0, S: 90, O: 180 };

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function crear(contenedor, nivel, op) {
    op = op || {};
    var ancho = nivel.mapa[0].length, alto = nivel.mapa.length;
    var zona = nivel.zona || 'jardin';
    var skin = nivel.skin || {};
    var disfraz = op.disfraz | 0;
    var vel = op.velocidad || 1;
    var cancelado = false, pausado = false, reanudar = null, corriendo = false;
    var pos = { x: nivel.inicio.x, y: nivel.inicio.y, dir: nivel.inicio.dir };
    var expr = 'normal';

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + (ancho * CELDA) + ' ' + (alto * CELDA));
    svg.setAttribute('class', 'tablero zona-' + zona);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Tablero del nivel: ' + (nivel.titulo || ''));
    svg.dataset.ancho = ancho; svg.dataset.alto = alto;

    var capaSuelo = '', capaObj = '';
    var T = A().TEMAS[zona];
    for (var y = 0; y < alto; y++) {
      for (var x = 0; x < ancho; x++) {
        var c = nivel.mapa[y].charAt(x);
        var tipo = c === 'o' ? '.' : c;
        capaSuelo += '<g transform="translate(' + (x * CELDA) + ' ' + (y * CELDA) + ')" data-celda="' + x + ',' + y + '">' + A().celda(tipo, zona, x, y, skin) + '</g>';
        if (c === 'o') capaObj += '<g class="obj" data-x="' + x + '" data-y="' + y + '" style="transform:translate(' + (x * CELDA) + 'px,' + (y * CELDA) + 'px)"><g class="obj-in">' + A().objeto(zona, skin) + '</g></g>';
      }
    }
    svg.innerHTML = '<g class="suelo">' + capaSuelo + '</g><g class="objetos">' + capaObj + '</g>' +
      '<g class="lumo" style="transform:translate(' + (pos.x * CELDA) + 'px,' + (pos.y * CELDA) + 'px)"><g class="lumo-in"><g class="lumo-cara"></g></g></g><g class="efectos"></g>';
    contenedor.innerHTML = '';
    contenedor.appendChild(svg);

    var gLumo = svg.querySelector('.lumo'), gIn = svg.querySelector('.lumo-in'), gCara = svg.querySelector('.lumo-cara'), gEf = svg.querySelector('.efectos');

    function dibujarLumo() {
      var s = A().lumo({ dir: pos.dir, expr: expr, disfraz: disfraz });
      gCara.innerHTML = s.replace('class="lumo-svg"', 'class="lumo-svg" x="2" y="-4" width="60" height="60"');
    }
    function colocar(x, y, ms) {
      gLumo.style.transitionDuration = ms + 'ms';
      gLumo.style.transform = 'translate(' + (x * CELDA) + 'px,' + (y * CELDA) + 'px)';
    }
    function anim(clase, ms) {
      gIn.classList.remove('hop', 'bump', 'caer', 'giro-w', 'alegre');
      void gIn.getBoundingClientRect();
      gIn.style.setProperty('--ms', ms + 'ms');
      gIn.classList.add(clase);
    }
    function efecto(x, y, html, ms) {
      var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'fx');
      g.style.transform = 'translate(' + (x * CELDA) + 'px,' + (y * CELDA) + 'px)';
      g.innerHTML = html;
      gEf.appendChild(g);
      setTimeout(function () { if (g.parentNode) g.parentNode.removeChild(g); }, ms || 900);
    }
    function chispas(x, y) {
      var h = '';
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        h += '<circle class="chispa" cx="32" cy="32" r="4" fill="#ffd93d" style="--dx:' + Math.round(Math.cos(a) * 30) + 'px;--dy:' + Math.round(Math.sin(a) * 30) + 'px"/>';
      }
      efecto(x, y, h, 800);
    }

    function reiniciar() {
      cancelado = true; pausado = false; if (reanudar) { reanudar(); reanudar = null; }
      pos = { x: nivel.inicio.x, y: nivel.inicio.y, dir: nivel.inicio.dir };
      expr = 'normal';
      gIn.classList.remove('hop', 'bump', 'caer', 'giro-w', 'alegre');
      gIn.style.opacity = '';
      colocar(pos.x, pos.y, 0);
      dibujarLumo();
      svg.querySelectorAll('.obj').forEach(function (o) { o.classList.remove('recogido'); });
      svg.querySelectorAll('.puerta').forEach(function (p) { p.innerHTML = A().puerta(false, zona); });
      svg.querySelectorAll('.interruptor').forEach(function (p) { p.innerHTML = A().interruptor(false); });
      gEf.innerHTML = '';
      svg.dataset.x = pos.x; svg.dataset.y = pos.y; svg.dataset.dir = pos.dir; svg.dataset.recogidos = 0; svg.dataset.estado = 'listo';
    }

    function dur(f) { return Math.max(60, Math.round(560 * (f || 1) / vel)); }
    async function espera(ms) {
      await esperar(ms);
      while (pausado && !cancelado) await new Promise(function (r) { reanudar = r; });
    }

    var recogidos = 0;
    async function reproducir(resultado, cb) {
      cb = cb || {};
      reiniciar();
      cancelado = false; corriendo = true; recogidos = 0;
      svg.dataset.estado = 'ejecutando';
      var S = UI.Sonido;
      await espera(120);
      for (var i = 0; i < resultado.traza.length && !cancelado; i++) {
        var p = resultado.traza[i];
        if (cb.alPaso) cb.alPaso(p, i);
        var d = dur(1);
        if (p.evento === 'control') { await espera(Math.round(d * .45)); continue; }
        expr = 'normal';
        switch (p.evento) {
          case 'mover':
            S && S.sfx('paso'); colocar(p.a.x, p.a.y, d); pos = { x: p.a.x, y: p.a.y, dir: p.a.dir };
            await espera(d + 40); break;
          case 'salto':
            S && S.sfx('salto'); anim('hop', d * 1.3); colocar(p.a.x, p.a.y, d * 1.3); pos = { x: p.a.x, y: p.a.y, dir: p.a.dir };
            await espera(d * 1.3 + 40); break;
          case 'giro':
            S && S.sfx('giro'); pos.dir = p.a.dir; dibujarLumo(); anim('giro-w', d);
            await espera(d); break;
          case 'recoger': {
            S && S.sfx('recoger');
            var o = svg.querySelector('.obj[data-x="' + p.de.x + '"][data-y="' + p.de.y + '"]');
            if (o) o.classList.add('recogido');
            recogidos++; svg.dataset.recogidos = recogidos;
            chispas(p.de.x, p.de.y); expr = 'feliz'; dibujarLumo(); anim('hop', d);
            if (cb.alRecoger) cb.alRecoger(recogidos);
            await espera(d); break;
          }
          case 'activar':
            S && S.sfx('activar');
            svg.querySelectorAll('.interruptor').forEach(function (e) { e.innerHTML = A().interruptor(true); });
            svg.querySelectorAll('.puerta').forEach(function (e) { e.innerHTML = A().puerta(true, zona); });
            svg.dataset.puertas = 'abiertas';
            chispas(p.de.x, p.de.y); anim('hop', d);
            await espera(d); break;
          case 'espera':
            expr = 'pensando'; dibujarLumo(); await espera(d); break;
          case 'sin-efecto':
            expr = 'pensando'; dibujarLumo(); S && S.sfx('animo'); anim('giro-w', d);
            await espera(d); break;
          case 'choque': {
            S && S.sfx('choque');
            var dirM = p.t === 'retroceder' ? OPUESTA[p.de.dir] : p.de.dir, dd = DELTA[dirM];
            expr = 'sorpresa'; dibujarLumo();
            colocar(p.de.x + dd[0] * .35, p.de.y + dd[1] * .35, d * .3);
            await espera(d * .3);
            colocar(p.de.x, p.de.y, d * .4); anim('bump', d * .5);
            await espera(d * .5); break;
          }
          case 'caida':
            S && S.sfx('caida'); expr = 'sorpresa'; dibujarLumo();
            colocar(p.a.x, p.a.y, d); pos = { x: p.a.x, y: p.a.y, dir: p.a.dir };
            await espera(d * .6); anim('caer', d * 1.2);
            efecto(p.a.x, p.a.y, '<circle class="onda" cx="32" cy="32" r="8" fill="none" stroke="#fff" stroke-width="4"/>', 900);
            await espera(d * 1.3); break;
        }
        svg.dataset.x = pos.x; svg.dataset.y = pos.y; svg.dataset.dir = pos.dir;
      }
      corriendo = false;
      if (cancelado) { return { cancelado: true }; }
      if (resultado.ok) {
        S && S.sfx('victoria');
        expr = 'feliz'; dibujarLumo(); anim('alegre', 900); chispas(pos.x, pos.y);
        svg.dataset.estado = 'victoria';
        await espera(900);
      } else {
        svg.dataset.estado = 'fin-' + resultado.motivo;
        if (resultado.motivo !== 'caida') { expr = 'pensando'; dibujarLumo(); }
        await espera(350);
      }
      return { cancelado: false };
    }

    reiniciar();
    return {
      el: svg, reproducir: reproducir, reiniciar: reiniciar,
      pausar: function () { pausado = true; svg.dataset.estado = 'pausa'; },
      continuar: function () { pausado = false; svg.dataset.estado = 'ejecutando'; if (reanudar) { var r = reanudar; reanudar = null; r(); } },
      cancelar: function () { cancelado = true; pausado = false; if (reanudar) { var r = reanudar; reanudar = null; r(); } },
      estaPausado: function () { return pausado; },
      estaCorriendo: function () { return corriendo; },
      velocidad: function (v) { vel = v; },
      disfraz: function (d) { disfraz = d | 0; dibujarLumo(); },
      expresion: function (e) { expr = e; dibujarLumo(); },
      posicion: function () { return { x: pos.x, y: pos.y, dir: pos.dir }; }
    };
  }

  UI.Escenario = { crear: crear, CELDA: CELDA };
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/editor.js ===== */
;/*
 * RUMBO — Editor de programas por tarjetas.
 *   - Paleta con las tarjetas desbloqueadas del nivel.
 *   - Zona de programación: lista principal, listas anidadas (repetir / si / mientras) y recetas.
 *   - Arrastrar y soltar con Pointer Events (ratón, táctil y lápiz) + alternativa de tocar.
 *   - Infantil: huecos fijos y grandes, sin texto, tocar una tarjeta de la secuencia la quita.
 * El modelo es exactamente el del intérprete: { principal: [...], recetas: { A: [...] } }.
 * Las direcciones de lista y de nodo (“ruta”) coinciden con las de la traza del intérprete.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var CLAVE_HIJOS = { c: 'cuerpo', e: 'entonces', s: 'sino' };

  function crear(contenedor, nivel, op) {
    op = op || {};
    var Ar = UI.Arte, I = root.RumboInterprete;
    var infantil = nivel.etapa === 'infantil';
    var disp = nivel.cartas.disponibles.slice();
    var limites = nivel.cartas.limites || {};
    var recetasDisp = nivel.cartas.recetas || [];
    var conds = nivel.cartas.condiciones || [];
    var huecos = infantil ? (nivel.huecos || Math.max(3, (nivel.referencia || []).length + 1)) : 0;
    var prog = { principal: [], recetas: {} };
    recetasDisp.forEach(function (r) { prog.recetas[r] = []; });
    var historial = [], seleccion = null, activa = '', bloqueado = false;

    var el = h('div.editor' + (infantil ? '.infantil' : ''));
    var paleta = h('div.paleta', { 'aria-label': 'Tarjetas' });
    var area = h('div.area-prog', { 'aria-label': 'Tu programa' });
    var barra = h('div.barra-sel', { hidden: true });
    el.appendChild(area); el.appendChild(barra); el.appendChild(paleta);
    contenedor.innerHTML = ''; contenedor.appendChild(el);

    // ------------------------------------------------ modelo
    function listaPorDir(dir) {
      var tok = dir === '' ? [] : String(dir).split('.');
      var l;
      if (tok[0] === 'r') { l = prog.recetas[tok[1]]; tok = tok.slice(2); } else l = prog.principal;
      for (var i = 0; i < tok.length; i += 2) {
        var nodo = l && l[+tok[i]];
        if (!nodo) return null;
        l = nodo[CLAVE_HIJOS[tok[i + 1]]];
      }
      return l || null;
    }
    function nodoPorRuta(ruta) {
      var p = String(ruta).split('.'), idx = +p.pop(), dir = p.join('.');
      var l = listaPorDir(dir);
      return l ? { lista: l, idx: idx, nodo: l[idx], dir: dir } : null;
    }
    function recorrerTodo(fn) {
      function lista(l) { (l || []).forEach(function (n) { fn(n); lista(n.cuerpo); lista(n.entonces); lista(n.sino); }); }
      lista(prog.principal); Object.keys(prog.recetas).forEach(function (k) { lista(prog.recetas[k]); });
    }
    function contar() { var n = 0; recorrerTodo(function () { n++; }); return n; }
    function usados(tipo) { var n = 0; recorrerTodo(function (x) { if (x.t === tipo) n++; }); return n; }
    function nuevoNodo(t) {
      switch (t) {
        case 'repetir': return { t: t, n: 2, cuerpo: [] };
        case 'si': return { t: t, cond: { t: conds[0] || 'obstaculo-delante', no: false }, entonces: [], sino: [] };
        case 'mientras': return { t: t, cond: { t: conds[0] || 'obstaculo-delante', no: true }, cuerpo: [] };
        case 'receta': return { t: t, nombre: recetasDisp[0] || 'A' };
        default: return { t: t };
      }
    }
    function guardarHistorial() { historial.push(JSON.stringify(prog)); if (historial.length > 60) historial.shift(); }
    function cambio(sonido) {
      if (sonido && UI.Sonido) UI.Sonido.sfx(sonido);
      render();
      if (op.alCambiar) op.alCambiar();
    }
    function aviso(t) { if (op.aviso) op.aviso(t); }
    function puedeAnadir(tipo) {
      if (limites[tipo] != null && usados(tipo) >= limites[tipo]) { aviso('Ya has usado todas las tarjetas «' + Ar.CARTA_NOMBRE[tipo] + '».'); if (UI.Sonido) UI.Sonido.sfx('choque'); return false; }
      if (infantil && contar() >= huecos) { if (UI.Sonido) UI.Sonido.sfx('choque'); return false; }
      return true;
    }

    // ------------------------------------------------ vista
    function carta(tipo, grande) {
      return h('span.carta.c-' + tipo + (grande ? '.grande' : ''), { data: { tipo: tipo }, style: { '--c': Ar.CARTA_COLOR[tipo] } },
        UI.svgEl(Ar.iconoCarta(tipo, 48), 'ic'), infantil ? null : h('span.carta-nombre', Ar.CARTA_NOMBRE[tipo]));
    }
    function pildoraCond(nodo, ruta) {
      var c = nodo.cond;
      var no = h('button.btn-no' + (c.no ? '.on' : ''), { type: 'button', 'data-accion': 'no', 'aria-pressed': String(!!c.no), title: 'No', on: {
        click: function (e) { e.stopPropagation(); if (bloqueado) return; guardarHistorial(); c.no = !c.no; cambio('toque'); } } }, 'no');
      var pil = h('button.pil-cond', { type: 'button', 'data-accion': 'cond', title: 'Cambiar condición', on: {
        click: function (e) {
          e.stopPropagation(); if (bloqueado || conds.length < 2) return;
          guardarHistorial(); c.t = conds[(conds.indexOf(c.t) + 1) % conds.length]; cambio('toque');
        } } }, UI.svgEl(Ar.iconoCond(c.t, false, 30), 'ic'), h('span', Ar.COND_NOMBRE[c.t] || c.t));
      return h('span.cond', no, pil);
    }
    function stepper(nodo) {
      function mover(d) { return function (e) { e.stopPropagation(); if (bloqueado) return; var v = UI.clamp(nodo.n + d, 1, 30); if (v === nodo.n) return; guardarHistorial(); nodo.n = v; cambio('toque'); }; }
      return h('span.stepper', h('button', { type: 'button', 'data-accion': 'menos', 'aria-label': 'Menos', on: { click: mover(-1) } }, '−'),
        h('b.n', String(nodo.n)), h('button', { type: 'button', 'data-accion': 'mas', 'aria-label': 'Más', on: { click: mover(1) } }, '+'));
    }
    function lista(dir, nodos, opciones) {
      opciones = opciones || {};
      var l = h('div.lista' + (dir === activa ? '.activa-lista' : ''), { data: { dir: dir }, 'aria-label': opciones.etiqueta || 'Lista de tarjetas' });
      nodos.forEach(function (n, i) { l.appendChild(nodoVista(n, dir === '' ? String(i) : dir + '.' + i)); });
      if (infantil && dir === '') {
        for (var k = nodos.length; k < huecos; k++) l.appendChild(h('span.slot-vacio', { 'aria-hidden': 'true' }, String(k + 1)));
      } else if (!nodos.length) l.appendChild(h('span.lista-vacia', opciones.vacia || 'Suelta aquí'));
      return l;
    }
    function nodoVista(n, ruta) {
      var cls = 'carta-prog.c-' + n.t + (ruta === seleccion ? '.sel' : '');
      var base = { data: { ruta: ruta, tipo: n.t }, style: { '--c': Ar.CARTA_COLOR[n.t] } };
      if (n.t === 'repetir') {
        if (!n.cuerpo) n.cuerpo = [];
        return h('div.' + cls.replace(/\./g, '.') + '.ctrl', base,
          h('div.ctrl-cab', UI.svgEl(Ar.iconoCarta('repetir', 36), 'ic'), infantil ? null : h('span.carta-nombre', 'Repetir'), stepper(n)),
          lista(ruta + '.c', n.cuerpo, { etiqueta: 'Lo que se repite', vacia: 'Lo que se repite' }));
      }
      if (n.t === 'mientras') {
        if (!n.cuerpo) n.cuerpo = [];
        return h('div.' + cls + '.ctrl', base,
          h('div.ctrl-cab', UI.svgEl(Ar.iconoCarta('mientras', 36), 'ic'), h('span.carta-nombre', 'Mientras'), pildoraCond(n, ruta)),
          lista(ruta + '.c', n.cuerpo, { etiqueta: 'Mientras se cumpla', vacia: 'Lo que se repite' }));
      }
      if (n.t === 'si') {
        if (!n.entonces) n.entonces = []; if (!n.sino) n.sino = [];
        return h('div.' + cls + '.ctrl', base,
          h('div.ctrl-cab', UI.svgEl(Ar.iconoCarta('si', 36), 'ic'), h('span.carta-nombre', 'Si'), pildoraCond(n, ruta)),
          h('div.rama', h('span.rama-t', 'entonces'), lista(ruta + '.e', n.entonces, { etiqueta: 'Entonces', vacia: 'Entonces…' })),
          h('div.rama', h('span.rama-t', 'si no'), lista(ruta + '.s', n.sino, { etiqueta: 'Si no', vacia: 'Si no…' })));
      }
      if (n.t === 'receta') {
        var ins = h('div.' + cls + '.receta-uso', base, UI.svgEl(Ar.iconoCarta('receta', 40), 'ic'),
          h('button.letra', { type: 'button', 'data-accion': 'receta', title: 'Cambiar receta', on: { click: function (e) {
            e.stopPropagation(); if (bloqueado || recetasDisp.length < 2) return;
            guardarHistorial(); n.nombre = recetasDisp[(recetasDisp.indexOf(n.nombre) + 1) % recetasDisp.length]; cambio('toque'); } } }, n.nombre));
        return ins;
      }
      return h('div.' + cls + '.simple' + (infantil ? '.grande' : ''), base,
        UI.svgEl(Ar.iconoCarta(n.t, infantil ? 72 : 44), 'ic'), infantil ? null : h('span.carta-nombre', Ar.CARTA_NOMBRE[n.t]));
    }

    function render() {
      area.innerHTML = '';
      var hayAnid = false;
      recorrerTodo(function (n) { if (n.cuerpo || n.entonces) hayAnid = true; });
      var multi = hayAnid || recetasDisp.length > 0;
      if (!multi) activa = '';
      if (activa !== '' && !listaPorDir(activa)) activa = '';
      var principal = h('div.bloque-prog.principal',
        multi && !infantil ? h('div.bloque-t', recetasDisp.length ? 'Programa principal' : 'Tu programa') : null,
        lista('', prog.principal, { etiqueta: 'Programa principal', vacia: infantil ? '' : 'Arrastra o toca las tarjetas' }));
      area.appendChild(principal);
      recetasDisp.forEach(function (r) {
        area.appendChild(h('div.bloque-prog.receta', h('div.bloque-t', UI.svgEl(Ar.iconoCarta('receta', 22), 'ic'), 'Receta ' + r),
          lista('r.' + r, prog.recetas[r], { etiqueta: 'Receta ' + r, vacia: 'Guarda aquí un trozo para reutilizarlo' })));
      });
      area.classList.toggle('multi', multi);
      // paleta
      paleta.innerHTML = '';
      disp.forEach(function (t) {
        var restante = limites[t] != null ? limites[t] - usados(t) : null;
        var b = h('button.paleta-carta' + (restante === 0 ? '.agotada' : '') + (infantil ? '.grande' : ''), { type: 'button', data: { tipo: t }, 'aria-label': Ar.CARTA_NOMBRE[t],
          style: { '--c': Ar.CARTA_COLOR[t] } },
          UI.svgEl(Ar.iconoCarta(t, infantil ? 72 : 44), 'ic'), infantil ? null : h('span.carta-nombre', Ar.CARTA_NOMBRE[t]),
          restante != null ? h('span.insignia-lim', String(restante)) : null);
        paleta.appendChild(b);
      });
      // barra de selección (solo Primaria)
      var sel = seleccion != null && !infantil ? nodoPorRuta(seleccion) : null;
      if (!sel || !sel.nodo) { seleccion = null; barra.hidden = true; barra.innerHTML = ''; }
      else {
        barra.hidden = false; barra.innerHTML = '';
        [['dup', 'Duplicar', '⧉'], ['izq', 'Mover antes', '◀'], ['der', 'Mover después', '▶'], ['borrar', 'Borrar', '🗑']].forEach(function (a) {
          barra.appendChild(h('button.btn-sel.s-' + a[0], { type: 'button', 'data-sel': a[0], on: { click: function () { accionSeleccion(a[0]); } } }, h('span.ic', a[2]), h('span', a[1])));
        });
      }
      marcar();
    }

    function accionSeleccion(a) {
      if (bloqueado || seleccion == null) return;
      var s = nodoPorRuta(seleccion); if (!s || !s.nodo) return;
      if (a === 'borrar') { guardarHistorial(); s.lista.splice(s.idx, 1); seleccion = null; cambio('quitar'); return; }
      if (a === 'dup') {
        var copia = UI.clon(s.nodo), cnt = {};
        // Respetar los límites de tarjetas al duplicar
        var ok = true; (function rec(n) { cnt[n.t] = (cnt[n.t] || 0) + 1; (n.cuerpo || []).concat(n.entonces || [], n.sino || []).forEach(rec); })(copia);
        Object.keys(cnt).forEach(function (t) { if (limites[t] != null && usados(t) + cnt[t] > limites[t]) ok = false; });
        if (infantil && contar() + 1 > huecos) ok = false;
        if (!ok) { aviso('No quedan tarjetas suficientes para duplicar.'); if (UI.Sonido) UI.Sonido.sfx('choque'); return; }
        guardarHistorial(); s.lista.splice(s.idx + 1, 0, copia);
        seleccion = (s.dir === '' ? '' : s.dir + '.') + (s.idx + 1); cambio('poner'); return;
      }
      var j = a === 'izq' ? s.idx - 1 : s.idx + 1;
      if (j < 0 || j >= s.lista.length) return;
      guardarHistorial();
      var t = s.lista[s.idx]; s.lista[s.idx] = s.lista[j]; s.lista[j] = t;
      seleccion = (s.dir === '' ? '' : s.dir + '.') + j; cambio('toque');
    }

    // ------------------------------------------------ interacción: arrastrar y soltar
    var arr = null;   // estado del arrastre
    function dirDeLista(elm) { return elm.dataset.dir; }
    function listaBajo(x, y) {
      var els = document.elementsFromPoint(x, y);
      for (var i = 0; i < els.length; i++) { if (els[i].classList && els[i].classList.contains('lista') && area.contains(els[i])) return els[i]; }
      for (var k = 0; k < els.length; k++) { if (els[k] === area || els[k].classList.contains('bloque-prog')) { return area.querySelector('.bloque-prog.principal .lista'); } }
      return null;
    }
    function indiceEn(listaEl, x, y) {
      var hijos = Array.prototype.filter.call(listaEl.children, function (c) { return c.classList.contains('carta-prog'); });
      for (var i = 0; i < hijos.length; i++) {
        if (arr && arr.origenEl && hijos[i] === arr.origenEl) continue;
        var r = hijos[i].getBoundingClientRect();
        if (y < r.top || (y <= r.bottom && x < r.left + r.width / 2)) return { i: i, ref: hijos[i] };
      }
      return { i: hijos.length, ref: null };
    }
    function limpiarIndicador() {
      el.querySelectorAll('.drop-antes,.drop-fin,.sobre').forEach(function (e) { e.classList.remove('drop-antes', 'drop-fin', 'sobre'); });
    }
    function iniciarArrastre(e, desdePaleta, tipo, ruta, origenEl) {
      if (bloqueado || e.button > 0) return;
      arr = { desdePaleta: desdePaleta, tipo: tipo, ruta: ruta, origenEl: origenEl, x0: e.clientX, y0: e.clientY, activo: false, id: e.pointerId, fantasma: null };
      window.addEventListener('pointermove', mover);
      window.addEventListener('pointerup', soltar);
      window.addEventListener('pointercancel', cancelar);
    }
    function mover(e) {
      if (!arr || e.pointerId !== arr.id) return;
      if (!arr.activo) {
        if (Math.hypot(e.clientX - arr.x0, e.clientY - arr.y0) < 8) return;
        arr.activo = true;
        arr.fantasma = h('div.fantasma', { style: { '--c': Ar.CARTA_COLOR[arr.tipo] } }, carta(arr.tipo, true));
        document.body.appendChild(arr.fantasma);
        if (arr.origenEl) arr.origenEl.classList.add('arrastrando');
        el.classList.add('arrastre');
        if (UI.Sonido) UI.Sonido.sfx('toque');
      }
      e.preventDefault();
      arr.fantasma.style.transform = 'translate(' + (e.clientX - 40) + 'px,' + (e.clientY - 40) + 'px)';
      limpiarIndicador();
      var pal = document.elementsFromPoint(e.clientX, e.clientY).indexOf(paleta) >= 0;
      if (pal && !arr.desdePaleta) { paleta.classList.add('sobre'); return; }
      var l = listaBajo(e.clientX, e.clientY);
      if (l) {
        var pos = indiceEn(l, e.clientX, e.clientY);
        l.classList.add('sobre');
        if (pos.ref) pos.ref.classList.add('drop-antes'); else l.classList.add('drop-fin');
      }
    }
    function terminarArrastre() {
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', soltar); window.removeEventListener('pointercancel', cancelar);
      if (arr && arr.fantasma && arr.fantasma.parentNode) arr.fantasma.parentNode.removeChild(arr.fantasma);
      if (arr && arr.origenEl) arr.origenEl.classList.remove('arrastrando');
      limpiarIndicador(); el.classList.remove('arrastre');
    }
    function cancelar() { terminarArrastre(); arr = null; }
    function soltar(e) {
      if (!arr || e.pointerId !== arr.id) return;
      var a = arr; arr = null;
      var estabaActivo = a.activo;
      var destinoPal = estabaActivo && document.elementsFromPoint(e.clientX, e.clientY).indexOf(paleta) >= 0;
      var l = estabaActivo ? listaBajo(e.clientX, e.clientY) : null;
      var pos = l ? indiceEn(l, e.clientX, e.clientY) : null;
      arr = a; terminarArrastre(); arr = null;
      if (!estabaActivo) {
        // simple toque
        if (a.desdePaleta) anadirPorToque(a.tipo); else tocarCarta(a.ruta);
        return;
      }
      if (a.desdePaleta) {
        if (!l) return;
        if (!puedeAnadir(a.tipo)) return;
        guardarHistorial();
        var destino = listaPorDir(dirDeLista(l)); if (!destino) return;
        destino.splice(pos.i, 0, nuevoNodo(a.tipo));
        seleccion = null; cambio('poner');
        return;
      }
      var s = nodoPorRuta(a.ruta); if (!s || !s.nodo) return;
      if (destinoPal) { guardarHistorial(); s.lista.splice(s.idx, 1); seleccion = null; cambio('quitar'); return; }
      if (!l) return;
      var dd = dirDeLista(l);
      if (dd === a.ruta || dd.indexOf(a.ruta + '.') === 0) return;      // no meter un bloque dentro de sí mismo
      var dest = listaPorDir(dd); if (!dest) return;
      guardarHistorial();
      var nodo = s.lista.splice(s.idx, 1)[0];
      var i = pos.i;
      if (dest === s.lista && s.idx < i) i--;
      // pos.i se calculó ignorando el propio elemento, así que ya cuenta sin él
      if (dest === s.lista) i = pos.i;
      dest.splice(Math.min(i, dest.length), 0, nodo);
      seleccion = null; cambio('poner');
    }
    function anadirPorToque(tipo) {
      if (bloqueado || !puedeAnadir(tipo)) return;
      var destino = listaPorDir(activa) || prog.principal;
      guardarHistorial();
      var n = nuevoNodo(tipo); destino.push(n);
      if (!infantil && (tipo === 'repetir' || tipo === 'mientras' || tipo === 'si')) {
        var ruta = (activa === '' ? '' : activa + '.') + (destino.length - 1);
        activa = ruta + (tipo === 'si' ? '.e' : '.c');
      }
      seleccion = null; cambio('poner');
    }
    function tocarCarta(ruta) {
      if (bloqueado) return;
      if (infantil) {
        var s = nodoPorRuta(ruta); if (!s || !s.nodo) return;
        guardarHistorial(); s.lista.splice(s.idx, 1); cambio('quitar'); return;
      }
      seleccion = seleccion === ruta ? null : ruta;
      if (UI.Sonido) UI.Sonido.sfx('toque');
      render();
    }

    paleta.addEventListener('pointerdown', function (e) {
      var b = e.target.closest('.paleta-carta'); if (!b || b.classList.contains('agotada')) {
        if (b && b.classList.contains('agotada')) { aviso('Ya has usado todas las tarjetas «' + Ar.CARTA_NOMBRE[b.dataset.tipo] + '».'); if (UI.Sonido) UI.Sonido.sfx('choque'); }
        return;
      }
      iniciarArrastre(e, true, b.dataset.tipo, null, null);
    });
    area.addEventListener('pointerdown', function (e) {
      if (e.target.closest('[data-accion]')) return;
      var c = e.target.closest('.carta-prog');
      if (c) { iniciarArrastre(e, false, c.dataset.tipo, c.dataset.ruta, c); e.stopPropagation(); return; }
      var l = e.target.closest('.lista');
      if (l && !bloqueado) { var d = l.dataset.dir; if (activa !== d) { activa = d; render(); } }
    });
    // Teclado: Enter/Espacio sobre una carta de la paleta la añade.
    paleta.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.paleta-carta')) { e.preventDefault(); anadirPorToque(e.target.closest('.paleta-carta').dataset.tipo); }
    });

    // ------------------------------------------------ API
    function marcar() {
      el.querySelectorAll('.error').forEach(function (e) { e.classList.remove('error'); });
    }
    function programa() {
      var recetas = {}, hay = false;
      Object.keys(prog.recetas).forEach(function (k) { recetas[k] = UI.clon(prog.recetas[k]); hay = true; });
      return hay ? { principal: UI.clon(prog.principal), recetas: recetas } : UI.clon(prog.principal);
    }
    function cargar(p) {
      guardarHistorial();
      if (Array.isArray(p)) { prog.principal = UI.clon(p); }
      else { prog.principal = UI.clon(p.principal || []); Object.keys(prog.recetas).forEach(function (k) { prog.recetas[k] = UI.clon((p.recetas || {})[k] || []); }); }
      seleccion = null; activa = ''; render();
    }
    function limpiar() { if (!contar()) return; guardarHistorial(); prog.principal = []; Object.keys(prog.recetas).forEach(function (k) { prog.recetas[k] = []; }); seleccion = null; activa = ''; cambio('quitar'); }
    function deshacer() {
      if (bloqueado || !historial.length) return false;
      prog = JSON.parse(historial.pop()); seleccion = null; render(); if (op.alCambiar) op.alCambiar(); if (UI.Sonido) UI.Sonido.sfx('quitar'); return true;
    }
    function resaltar(ruta) {
      el.querySelectorAll('.carta-prog.activa').forEach(function (e) { e.classList.remove('activa'); });
      if (ruta == null) return;
      var c = el.querySelector('.carta-prog[data-ruta="' + ruta + '"]');
      if (c) { c.classList.add('activa'); if (c.scrollIntoView) c.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
    }
    function marcarError(ruta) {
      marcar();
      if (ruta == null) return;
      var c = el.querySelector('.carta-prog[data-ruta="' + ruta + '"]'); if (c) c.classList.add('error');
    }
    function bloquear(b) { bloqueado = !!b; el.classList.toggle('bloqueado', bloqueado); }

    render();
    return {
      el: el, obtener: programa, cargar: cargar, limpiar: limpiar, deshacer: deshacer, resaltar: resaltar, marcarError: marcarError,
      bloquear: bloquear, vacio: function () { return contar() === 0; }, contar: contar, puedeDeshacer: function () { return historial.length > 0; },
      anadir: anadirPorToque, huecos: huecos
    };
  }

  UI.Editor = { crear: crear };
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/juego.js ===== */
;/*
 * RUMBO — Pantalla de juego de un nivel: escenario + editor + ejecución + ayudas + resultados.
 * Se usa igual para los niveles del juego, las vistas previas del docente y los retos del Laboratorio.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };

  var ICON = {
    play: '<svg viewBox="0 0 32 32"><path d="M9 5l18 11L9 27z" fill="#fff"/></svg>',
    pausa: '<svg viewBox="0 0 32 32"><rect x="7" y="5" width="7" height="22" rx="2" fill="#fff"/><rect x="18" y="5" width="7" height="22" rx="2" fill="#fff"/></svg>',
    reiniciar: '<svg viewBox="0 0 32 32"><path d="M7 16a9 9 0 1 0 3-7" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M5 4v8h8" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    deshacer: '<svg viewBox="0 0 32 32"><path d="M10 12h10a6 6 0 0 1 0 12h-6" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M14 6l-6 6 6 6" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    borrar: '<svg viewBox="0 0 32 32"><path d="M7 9h18M13 9V5h6v4M9 9l1 18h12l1-18" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
    pista: '<svg viewBox="0 0 32 32"><path d="M16 3a9 9 0 0 0-5 16.5V23h10v-3.5A9 9 0 0 0 16 3z" fill="#fff"/><rect x="11" y="25" width="10" height="3.5" rx="1.5" fill="#fff"/></svg>',
    mapa: '<svg viewBox="0 0 32 32"><path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3z" stroke="#fff" stroke-width="3" stroke-linejoin="round" fill="none"/><path d="M12 5v19M20 8v19" stroke="#fff" stroke-width="3"/></svg>',
    voz: '<svg viewBox="0 0 32 32"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#fff"/><path d="M21 11a7 7 0 0 1 0 10M24 7a12 12 0 0 1 0 18" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none"/></svg>',
    ojo: '<svg viewBox="0 0 32 32"><path d="M2 16c6-9 22-9 28 0-6 9-22 9-28 0z" stroke="#fff" stroke-width="3" fill="none"/><circle cx="16" cy="16" r="4.5" fill="#fff"/></svg>',
    velocidad: '<svg viewBox="0 0 32 32"><path d="M4 22a12 12 0 0 1 24 0" stroke="#fff" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M16 22l6-9" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>',
    sig: '<svg viewBox="0 0 32 32"><path d="M8 5l17 11L8 27z" fill="#fff"/></svg>'
  };
  UI.ICON = ICON;
  function ic(n) { return UI.svgEl(ICON[n], 'ic'); }

  function confeti(cont, n) {
    var cols = ['#ffd93d', '#ff6f91', '#4dd0e1', '#7ad36b', '#b388ff', '#ff9d2e'];
    for (var i = 0; i < (n || 40); i++) {
      var p = h('i.confeti', { style: { left: Math.round(Math.random() * 100) + '%', background: cols[i % cols.length], '--d': (1.6 + Math.random() * 1.6).toFixed(2) + 's', '--r': Math.round(Math.random() * 720 - 360) + 'deg', 'animation-delay': (Math.random() * .6).toFixed(2) + 's' } });
      cont.appendChild(p);
    }
  }
  UI.confeti = confeti;

  function abrir(contenedor, nivel, ctx) {
    var CAT = root.RumboCatalogo, I = root.RumboInterprete, E = root.RumboEstrellas, PR = root.RumboProgreso, VOCES = root.RumboVoces;
    var DEM = root.RumboDemos;
    var perfil = ctx.perfil, aj = ctx.ajustes || {};
    var infantil = nivel.etapa === 'infantil';
    var zona = nivel.zona || 'jardin';
    var disfraz = perfil ? (perfil.disfraz | 0) : 0;
    var fallos = 0, pistaN = 0, solucionMostrada = false, corriendo = false, ejecutado = false, vivo = true, intentoBase = 0;
    var hablaTimer = null;

    var raiz = h('div.juego.zona-' + zona + (infantil ? '.infantil' : '.primaria'), { data: { nivel: nivel.id } });
    contenedor.innerHTML = ''; contenedor.appendChild(raiz);

    // ----------------------------- cabecera y burbuja
    var btnMapa = h('button.btn-ic.b-mapa', { type: 'button', 'aria-label': 'Volver al mapa', title: 'Mapa', on: { click: function () { salir(); } } }, ic('mapa'));
    var titulo = h('div.j-titulo', h('span.t', nivel.titulo || ''), nivel.bloque && !infantil ? h('span.chip', 'Bloque ' + nivel.bloque) : null,
      nivel.tipo === 'depurar' ? h('span.chip.dep', 'Depurar') : null, nivel.tipo === 'optimizar' ? h('span.chip.opt', 'Optimizar') : null);
    var btnVoz = h('button.btn-ic.b-voz', { type: 'button', 'aria-label': 'Escuchar de nuevo', title: 'Escuchar', on: { click: function () { hablar('n_' + nivel.id, true); } } }, ic('voz'));
    var cab = h('header.j-cab', btnMapa, titulo, btnVoz);

    var burbujaAvatar = h('div.avatar'), burbujaTxt = h('div.txt');
    var burbuja = h('div.j-burbuja', burbujaAvatar, burbujaTxt);
    function avatarDe(nombre) { burbujaAvatar.innerHTML = UI.Arte.personaje(nombre || 'Lumo'); }
    function quienIntro() {
      var m = /^([^:«]{2,24}):/.exec(nivel.intro || '');
      if (m) { var n = m[1].replace(/^El |^La /, ''); var hallado = UI.Arte.PERSONAJES.filter(function (p) { return p.toLowerCase() === m[1].toLowerCase() || p.toLowerCase().indexOf(n.toLowerCase()) >= 0; })[0]; return hallado || 'Lumo'; }
      return 'Lumo';
    }
    function mostrarTexto(texto, quien, forzar) {
      avatarDe(quien);
      var ver = !infantil || forzar;
      burbujaTxt.textContent = ver ? texto : '';
      burbuja.classList.toggle('sin-texto', !ver);
      burbuja.classList.add('habla');
      clearTimeout(hablaTimer); hablaTimer = setTimeout(function () { burbuja.classList.remove('habla'); }, 2200);
    }
    function hablar(id, repetir) {
      var linea = VOCES && VOCES.lineas[id]; if (!linea) return;
      var r = null;
      if (aj.voz !== false && ctx.voz) r = ctx.voz.decir(id, { velocidad: infantil ? 0.85 : 0.95 });
      var sinVoz = !r || r.modo === 'subtitulo';
      var texto = linea.texto;
      if (id.indexOf('n_') === 0 && !infantil && nivel.intro && !repetir) texto = nivel.intro.replace(/^[^:]*:\s*[«"]?/, '').replace(/[»"]$/, '') + '\n' + linea.texto;
      mostrarTexto(texto, id.indexOf('n_') === 0 && !repetir ? quienIntro() : 'Lumo', sinVoz);
    }

    // ----------------------------- escena y editor
    var escenaEl = h('div.j-escena');
    var contObjetos = h('div.j-objetos', { hidden: true });
    var escenaCaja = h('div.j-escena-caja', escenaEl, contObjetos);
    var progEl = h('div.j-prog');
    var cuenta = h('span.cuenta');
    var aviso = h('div.aviso', { role: 'status', 'aria-live': 'polite' });
    var progCaja = h('div.j-prog-caja', progEl, aviso);
    var cuerpo = h('div.j-cuerpo', escenaCaja, progCaja);
    function mostrarAviso(t) { aviso.textContent = t; aviso.classList.add('v'); clearTimeout(mostrarAviso.t); mostrarAviso.t = setTimeout(function () { aviso.classList.remove('v'); }, 2600); }

    var esc = UI.Escenario.crear(escenaEl, nivel, { disfraz: disfraz, velocidad: aj.velocidad || 1 });
    var totalObj = nivel.mapa.join('').split('o').length - 1;
    if (totalObj > 0) { contObjetos.hidden = false; }
    function pintarObjetos(n) {
      contObjetos.innerHTML = '';
      for (var i = 0; i < totalObj; i++) contObjetos.appendChild(h('span.objeto' + (i < n ? '.ya' : ''), UI.svgEl('<svg viewBox="0 0 64 64">' + UI.Arte.objeto(zona, nivel.skin) + '</svg>', '')));
    }
    pintarObjetos(0);

    var ed = UI.Editor.crear(progEl, nivel, {
      aviso: mostrarAviso,
      alCambiar: function () {
        if (ejecutado && !corriendo) { esc.reiniciar(); pintarObjetos(0); ejecutado = false; }
        actualizarCuenta();
        pistaVisual(null); armarOcio();
      }
    });
    if (nivel.programaInicial) { ed.cargar(nivel.programaInicial); }

    function actualizarCuenta() {
      if (infantil) return;
      var n = ed.contar(), s2 = nivel.estrellas ? nivel.estrellas.s2max : null;
      cuenta.textContent = 'Tarjetas: ' + n + (s2 ? ' · ★★ con ' + s2 + ' o menos' : '');
    }

    // ----------------------------- pie de botones
    var bPlay = h('button.btn-grande.b-play', { type: 'button', 'aria-label': 'Ejecutar el programa', on: { click: ejecutar } }, ic('play'), infantil ? null : h('span', 'Ejecutar'));
    var bPausa = h('button.btn-ic.b-pausa', { type: 'button', 'aria-label': 'Pausar', disabled: true, on: { click: pausar } }, ic('pausa'));
    var bReset = h('button.btn-ic.b-reset', { type: 'button', 'aria-label': 'Reiniciar el nivel', title: 'Reiniciar', on: { click: reiniciar } }, ic('reiniciar'));
    var bUndo = h('button.btn-ic.b-undo', { type: 'button', 'aria-label': 'Deshacer', title: 'Deshacer', on: { click: function () { if (!corriendo) ed.deshacer(); } } }, ic('deshacer'));
    var bClear = h('button.btn-ic.b-clear', { type: 'button', 'aria-label': 'Borrar el programa', title: 'Borrar todo', on: { click: function () { if (!corriendo) ed.limpiar(); } } }, ic('borrar'));
    var bPista = h('button.btn-pista.b-pista', { type: 'button', 'aria-label': 'Pedir una pista', title: 'Pista', on: { click: pista } }, ic('pista'), h('span', 'Pista'));
    var bVel = h('button.btn-ic.b-vel', { type: 'button', 'aria-label': 'Velocidad', title: 'Velocidad', on: { click: velocidad } }, ic('velocidad'));
    var bSol = h('button.btn-txt.b-sol', { type: 'button', hidden: true, on: { click: ensenar } }, 'Lumo te lo enseña');
    var pie = h('footer.j-pie', infantil ? [bUndo, bReset, bPlay, bPista] : [bUndo, bClear, cuenta, bVel, bReset, bPausa, bPlay, bPista, bSol]);
    if (infantil) pie.appendChild(bSol);

    if (nivel.sinSolucion) bPista.hidden = true;
    // La pista se ofrece sola (sin presionar) cuando el alumnado parece perdido: tras fallar dos veces o tras un rato sin tocar nada.
    var ociosoT = null;
    function ofrecerPista(razon) {
      if (!vivo || nivel.sinSolucion || corriendo) return;
      bPista.classList.add('llama');
      if (razon === 'ocio' && !infantil) mostrarAviso('¿Necesitas una pista? Pulsa la bombilla.');
    }
    function armarOcio() {
      clearTimeout(ociosoT);
      if (nivel.sinSolucion) return;
      ociosoT = setTimeout(function () { ofrecerPista('ocio'); }, infantil ? 25000 : 45000);
    }
    raiz.appendChild(cab); raiz.appendChild(burbuja); raiz.appendChild(cuerpo); raiz.appendChild(pie);
    actualizarCuenta();

    function velocidad() {
      var orden = [0.6, 1, 1.7], i = orden.indexOf(aj.velocidad || 1);
      aj.velocidad = orden[(i + 1) % orden.length]; esc.velocidad(aj.velocidad);
      bVel.dataset.v = aj.velocidad; mostrarAviso(aj.velocidad < 1 ? 'Velocidad lenta' : aj.velocidad > 1 ? 'Velocidad rápida' : 'Velocidad normal');
      if (ctx.guardar) ctx.guardar();
    }

    // ----------------------------- ejecución
    function botones(ejec) {
      bPlay.disabled = ejec; bPausa.disabled = !ejec; bUndo.disabled = ejec; bClear.disabled = ejec; bPista.disabled = ejec;
      if (!ejec) { bPausa.innerHTML = ''; bPausa.appendChild(ic('pausa')); }
    }
    function pausar() {
      if (!corriendo) return;
      if (esc.estaPausado()) { esc.continuar(); bPausa.innerHTML = ''; bPausa.appendChild(ic('pausa')); bPausa.setAttribute('aria-label', 'Pausar'); }
      else { esc.pausar(); bPausa.innerHTML = ''; bPausa.appendChild(ic('play')); bPausa.setAttribute('aria-label', 'Continuar'); }
    }
    function reiniciar() {
      esc.cancelar(); corriendo = false; esc.reiniciar(); pintarObjetos(0); ed.resaltar(null); ed.bloquear(false); botones(false); ejecutado = false;
      if (ctx.voz) ctx.voz.parar();
      if (UI.Sonido) UI.Sonido.sfx('toque');
    }
    async function ejecutar() {
      if (corriendo || !vivo) return;
      if (UI.Sonido) UI.Sonido.iniciar();
      if (ed.vacio()) { hablar('fb_vacio'); progCaja.classList.remove('sacude'); void progCaja.offsetWidth; progCaja.classList.add('sacude'); return; }
      var prog = ed.obtener();
      var resultado = I.ejecutar(nivel, prog);
      corriendo = true; ejecutado = true; ed.bloquear(true); botones(true); pintarObjetos(0);
      if (ctx.voz) ctx.voz.parar();
      var fin = await esc.reproducir(resultado, {
        alPaso: function (p) { ed.resaltar(p.ruta); },
        alRecoger: function (n) { pintarObjetos(n); }
      });
      if (!vivo) return;
      corriendo = false; ed.resaltar(null); ed.bloquear(false); botones(false);
      if (fin.cancelado) return;
      if (resultado.ok) victoria(prog, resultado); else fallo(prog, resultado);
    }

    var FB = { choque: 'fb_choque', caida: 'fb_caida', 'objeto-olvidado': 'fb_objeto', 'objetivo-incompleto': 'fb_corto', 'limite-pasos': 'fb_infinito', profundidad: 'fb_infinito', 'programa-vacio': 'fb_vacio', 'receta-inexistente': 'fb_receta', 'programa-invalido': 'fb_casi' };
    function fallo(prog, resultado) {
      fallos++;
      if (!ctx.sinRegistro && perfil) { PR.registrar(perfil, nivel.id, { ok: false, motivo: resultado.motivo, tarjetas: I.contarTarjetas(prog), programa: prog, pistas: pistaN }, I); ctx.guardar && ctx.guardar(); }
      ed.marcarError(resultado.nodoError);
      var id = FB[resultado.motivo] || 'fb_casi';
      if (fallos % 3 === 0 && (resultado.motivo === 'objetivo-incompleto' || resultado.motivo === 'choque')) id = 'fb_orden';
      else if (fallos % 3 === 2 && I.usaTarjeta(nivel.referencia, 'repetir') && !I.usaTarjeta(prog, 'repetir') && !infantil) id = 'fb_repetir';
      if (UI.Sonido) UI.Sonido.sfx('animo');
      hablar(id);
      if (!nivel.sinSolucion && fallos >= (infantil ? 2 : 3)) bSol.hidden = false;
      if (fallos >= 2) ofrecerPista('fallos'); armarOcio();
      raiz.dataset.ultimo = 'fallo:' + resultado.motivo;
    }

    function pistaVisual(tipo) {
      paletaPulso(tipo);
    }
    function paletaPulso(tipo) {
      raiz.querySelectorAll('.paleta-carta.pulso').forEach(function (e) { e.classList.remove('pulso'); });
      if (!tipo) return;
      var b = raiz.querySelector('.paleta-carta[data-tipo="' + tipo + '"]'); if (b) b.classList.add('pulso');
    }
    function pista() {
      if (corriendo) return;
      bPista.classList.remove('llama'); armarOcio();
      if (UI.Sonido) UI.Sonido.sfx('pista');
      pistaN++;
      if (!ctx.sinRegistro && perfil) { PR.anotarPistas(perfil, nivel.id, pistaN); ctx.guardar && ctx.guardar(); }
      if (infantil || !nivel.pistas || !nivel.pistas.length) {
        // Pista visual: la siguiente tarjeta de la solución que todavía no está bien colocada.
        var ref = Array.isArray(nivel.referencia) ? nivel.referencia : (nivel.referencia.principal || []);
        var act = ed.obtener(); act = Array.isArray(act) ? act : act.principal;
        var k = 0; while (k < act.length && k < ref.length && act[k].t === ref[k].t) k++;
        hablar('fb_pista');
        if (k < ref.length) paletaPulso(ref[k].t);
        else mostrarAviso('¡Parece que ya está todo! Pulsa el botón verde.');
        return;
      }
      var k2 = Math.min(pistaN, nivel.pistas.length);
      hablar('h' + k2 + '_' + nivel.id);
      mostrarAviso('Pista ' + k2 + ' de ' + nivel.pistas.length);
    }
    function ensenar() {
      if (corriendo) return;
      solucionMostrada = true; bSol.hidden = true;
      hablar('fb_solucion');
      ed.cargar(nivel.referencia);
      if (UI.Sonido) UI.Sonido.sfx('pista');
      mostrarAviso('Esta es la solución de Lumo. Si la usas, ganas 1 estrella.');
    }

    // ----------------------------- victoria
    function victoria(prog, resultado) {
      var tarjetas = I.contarTarjetas(prog);
      var est = E.calcularEstrellas(nivel, prog, resultado);
      if (solucionMostrada) est = Math.min(est, 1);
      var antesDisf = perfil && !ctx.sinRegistro ? PR.disfracesDesbloqueados(perfil) : [];
      var info = null, nuevos = [], nuevosDisf = [];
      if (!ctx.sinRegistro && perfil) {
        info = PR.registrar(perfil, nivel.id, { ok: true, motivo: 'meta', estrellas: est, tarjetas: tarjetas, programa: prog, pistas: pistaN }, I);
        nuevos = PR.evaluarLogros(perfil);
        nuevosDisf = PR.disfracesDesbloqueados(perfil).filter(function (d) { return antesDisf.indexOf(d) < 0; });
        ctx.guardar && ctx.guardar();
      }
      raiz.dataset.ultimo = 'victoria:' + est;
      var okId = est >= 3 ? 'ok_3' : est === 2 ? 'ok_2' : 'ok_1';
      hablar(infantil ? 'ok_1' : okId);
      setTimeout(function () { if (vivo) resultados(est, tarjetas, info, nuevos, nuevosDisf); }, 500);
    }
    function textoEstrellas() {
      if (!nivel.estrellas) return [];
      var s3 = nivel.estrellas.s3, t3;
      if (s3.tipo === 'usa') t3 = 'Resuélvelo usando la tarjeta «' + UI.Arte.CARTA_NOMBRE[s3.carta] + '»';
      else t3 = 'Resuélvelo con ' + I.contarTarjetas(nivel.referencia) + ' tarjetas o menos';
      return ['Superar el reto', 'Usar ' + nivel.estrellas.s2max + ' tarjetas o menos', t3];
    }
    function resultados(est, tarjetas, info, nuevos, nuevosDisf) {
      var ov = h('div.resultado' + (infantil ? '.infantil' : ''), { role: 'dialog', 'aria-label': 'Reto superado' });
      var tarj = h('div.res-tarjeta');
      tarj.appendChild(h('div.res-lumo', { html: UI.Arte.lumo({ expr: 'feliz', dir: 'S', disfraz: disfraz }) }));
      tarj.appendChild(h('h2', ctx.sinRegistro ? '¡Resuelto!' : infantil ? '¡Muy bien!' : '¡Reto superado!'));
      var fila = h('div.res-estrellas');
      var n = infantil ? 1 : 3;
      for (var i = 0; i < n; i++) fila.appendChild(h('span.est' + (i < est ? '.ganada' : '') , { style: { 'animation-delay': (0.3 + i * 0.35) + 's' } }, UI.svgEl(UI.Arte.estrella(i < est, infantil ? 96 : 64), '')));
      tarj.appendChild(fila);
      if (!infantil) {
        var t = textoEstrellas();
        tarj.appendChild(h('div.res-info', 'Has usado ' + tarjetas + (tarjetas === 1 ? ' tarjeta.' : ' tarjetas.')));
        if (est < 3 && t.length) tarj.appendChild(h('div.res-pista', est < 2 ? '★★: ' + t[1] : '★★★: ' + t[2]));
        if (solucionMostrada) tarj.appendChild(h('div.res-pista', 'Usaste la ayuda de Lumo: inténtalo sin ella para conseguir más estrellas.'));
      }
      if (nuevos && nuevos.length) {
        var fi = h('div.res-ins');
        nuevos.forEach(function (idn) {
          var d = root.RumboLogros.INSIGNIAS.filter(function (x) { return x.id === idn; })[0]; if (!d) return;
          fi.appendChild(h('div.ins-nueva', UI.svgEl(UI.Arte.insignia(d.icono, root.RumboLogros.INSIGNIAS.indexOf(d), false), ''), h('span', '¡Insignia! ' + d.nombre)));
        });
        tarj.appendChild(fi);
      }
      if (nuevosDisf && nuevosDisf.length) {
        nuevosDisf.forEach(function (d) {
          var dd = root.RumboLogros.DISFRACES.filter(function (x) { return x.id === d; })[0];
          tarj.appendChild(h('div.res-disfraz', UI.svgEl(UI.Arte.lumo({ expr: 'feliz', dir: 'S', disfraz: d }), ''), h('span', '¡Nuevo disfraz! ' + (dd ? dd.nombre : ''))));
        });
        if (UI.Sonido) setTimeout(function () { UI.Sonido.sfx('desbloqueo'); }, 900);
      }
      var sig = ctx.sinRegistro ? null : CAT.siguiente(nivel.id);
      var sigOk = sig && perfil && PR.estaDesbloqueado(perfil, sig, {});
      var acciones = h('div.res-acciones');
      acciones.appendChild(h('button.btn-grande.sec.b-repetir', { type: 'button', 'aria-label': 'Jugar otra vez', on: { click: function () { cerrar(); reiniciar(); } } }, ic('reiniciar'), infantil ? null : h('span', 'Repetir')));
      if (ctx.sinRegistro) {
        acciones.appendChild(h('button.btn-grande.b-cont', { type: 'button', on: { click: function () { cerrar(); if (ctx.alResolver) ctx.alResolver({ estrellas: est, tarjetas: tarjetas, programa: ed.obtener() }); } } }, h('span', 'Continuar'), ic('sig')));
      } else {
        acciones.appendChild(h('button.btn-grande.sec.b-mapa2', { type: 'button', 'aria-label': 'Volver al mapa', on: { click: function () { cerrar(); salir({ completado: true }); } } }, ic('mapa'), infantil ? null : h('span', 'Mapa')));
        if (sigOk) acciones.appendChild(h('button.btn-grande.b-sig', { type: 'button', 'aria-label': 'Siguiente nivel', on: { click: function () { cerrar(); if (ctx.alNivel) ctx.alNivel(sig, { desde: nivel.id }); } } }, infantil ? null : h('span', 'Siguiente'), ic('sig')));
      }
      tarj.appendChild(acciones);
      ov.appendChild(tarj);
      var cf = h('div.confeti-caja'); ov.appendChild(cf); confeti(cf, infantil ? 70 : 45);
      raiz.appendChild(ov);
      if (UI.Sonido) setTimeout(function () { UI.Sonido.sfx('estrella'); }, 300);
      function cerrar() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    }

    function salir(extra) { destruir(); if (ctx.alSalir) ctx.alSalir(extra || {}); }

    // ----------------------------- presentación de tarjetas nuevas
    function presentarNuevas(cartas, fin) {
      if (!cartas.length) { fin(); return; }
      var c = cartas[0], d = DEM && DEM.DEMOS[c];
      if (perfil && !ctx.sinRegistro) { PR.marcarCartaVista(perfil, c); ctx.guardar && ctx.guardar(); }
      // En Primaria, las tarjetas de control se explican por pasos (problema → herramienta). En Infantil, una sola demostración.
      var pasos = !infantil && DEM && DEM.PASOS && DEM.PASOS[c] ? DEM.PASOS[c] : [{ texto: DEM && DEM.TEXTOS[c], demo: d }];
      var paso = 0, vivoDemo = true, gen = 0;
      var ov = h('div.nueva-carta' + (infantil ? '.infantil' : ''), { role: 'dialog', 'aria-label': 'Tarjeta nueva' });
      var caja = h('div.nc-caja');
      var demoEl = h('div.nc-demo'), txt = h('p.nc-texto'), puntos = h('div.nc-puntos', { 'aria-hidden': 'true' });
      caja.appendChild(h('div.nc-titulo', h('span.etq', infantil ? '¡Nueva!' : 'Tarjeta nueva'), h('span.carta.grande', { style: { '--c': UI.Arte.CARTA_COLOR[c] } }, UI.svgEl(UI.Arte.iconoCarta(c, 56), 'ic'), infantil ? null : h('span.carta-nombre', UI.Arte.CARTA_NOMBRE[c]))));
      if (d) caja.appendChild(demoEl);
      if (!infantil) { caja.appendChild(txt); if (pasos.length > 1) caja.appendChild(puntos); }
      var ok = h('button.btn-grande.b-entendido', { type: 'button', on: { click: siguiente } });
      caja.appendChild(ok); ov.appendChild(caja); raiz.appendChild(ov);
      if (UI.Sonido) UI.Sonido.sfx('desbloqueo');
      function cerrar() { vivoDemo = false; gen++; if (ctx.voz) ctx.voz.parar(); if (ov.parentNode) ov.parentNode.removeChild(ov); presentarNuevas(cartas.slice(1), fin); }
      function siguiente() { if (paso < pasos.length - 1) { paso++; mostrar(); } else cerrar(); }
      function mostrar() {
        var p = pasos[paso], mi = ++gen;
        txt.textContent = p.texto || '';
        puntos.innerHTML = ''; pasos.forEach(function (_, i) { puntos.appendChild(h('i' + (i === paso ? '.on' : ''))); });
        ok.innerHTML = '';
        if (infantil) ok.appendChild(ic('play')); else ok.appendChild(h('span', paso < pasos.length - 1 ? 'Siguiente' : '¡Entendido!'));
        var idv = paso === 0 ? (infantil ? 'nci_' : 'nc_') + c : null;
        if (ctx.voz && aj.voz !== false) { ctx.voz.parar(); if (!infantil && pasos.length > 1) { var lid = 'ncp_' + c + '_' + paso; if (VOCES.lineas[lid]) ctx.voz.decir(lid); } else if (idv && VOCES.lineas[idv]) ctx.voz.decir(idv); }
        if (p.demo) {
          demoEl.innerHTML = '';
          var demo = UI.Escenario.crear(demoEl, p.demo, { disfraz: disfraz, velocidad: 0.9 });
          (async function bucle() {
            await UI.esperar(700);
            while (vivoDemo && vivo && gen === mi) {
              var r = I.ejecutar(p.demo, p.demo.programa);
              await demo.reproducir(r, {});
              await UI.esperar(900);
              if (!vivoDemo || gen !== mi) break;
              demo.reiniciar(); await UI.esperar(500);
            }
          })();
        }
      }
      mostrar();
    }

    function destruir() {
      vivo = false; clearTimeout(ociosoT); esc.cancelar(); if (ctx.voz) ctx.voz.parar(); clearTimeout(hablaTimer);
    }

    // ----------------------------- arranque
    avatarDe('Lumo');
    // Se explican las tarjetas que este jugador aún no ha visto (también si empieza a mitad de la aventura, p. ej. en 5.º).
    // A partir de 3.º se da por sabido el movimiento básico para no repetir lo trivial.
    var BASICAS = ['avanzar', 'retroceder', 'girar-d', 'girar-i', 'esperar'];
    var saltaBasicas = !infantil && perfil && /^p[3-6]$/.test(perfil.curso || '');
    var nuevas = ctx.sinRegistro || !perfil ? [] : (infantil ? CAT.cartasNuevas(nivel.id) : nivel.cartas.disponibles).filter(function (c) {
      if (perfil.vistos.cartas[c] || !(DEM && DEM.DEMOS[c]) || nivel.cartas.disponibles.indexOf(c) < 0) return false;
      if (saltaBasicas && BASICAS.indexOf(c) >= 0) { PR.marcarCartaVista(perfil, c); return false; }
      return true;
    });
    if (ctx.mostrarTarjetasNuevas) nuevas = CAT.cartasNuevas(nivel.id).filter(function (c) { return DEM && DEM.DEMOS[c]; });
    presentarNuevas(nuevas, function () { hablar('n_' + nivel.id); armarOcio(); });
    if (!nuevas.length) hablar('n_' + nivel.id);

    return { destruir: destruir, editor: ed, escenario: esc, ejecutar: ejecutar, reiniciar: reiniciar, el: raiz,
      estado: function () { return { fallos: fallos, pistas: pistaN, corriendo: corriendo }; } };
  }

  UI.Juego = { abrir: abrir };
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/app.js ===== */
;/*
 * RUMBO — Aplicación: router de pantallas, perfiles, mapa de mundos, historia, colección y ajustes.
 * Las pantallas del docente y del Laboratorio se registran desde docente.js y laboratorio.js.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var CAT, PR, I, VOCES, LOG, DEM, G, Ar;
  var App = UI.App = { pantallas: {}, estado: {}, nivelActual: null };

  var ZONA_MUNDO = { 0: 'jardin', 1: 'bosque', 2: 'mar', 3: 'ciudad', 4: 'faro' };
  var ESCENA_ZONA = { 'C0': 'jardin', 'C1': 'bosque', 'C2': 'mar', 'C3': 'ciudad', 'CF': 'faro' };

  function perfil() { return App.estado.perfil; }
  function datos() { return App.estado.datos; }
  function guardar() { G.guardar(); }
  function infantil() { return perfil() && PR.esInfantil(perfil()); }
  function opcionesDocente() { return App.estado.docente ? { todo: !!App.estado.docente.todo } : {}; }

  // ---------------------------------------------------------------- arranque
  function iniciar(raiz) {
    CAT = root.RumboCatalogo; PR = root.RumboProgreso; I = root.RumboInterprete; VOCES = root.RumboVoces; LOG = root.RumboLogros; DEM = root.RumboDemos; Ar = UI.Arte; G = UI.Guardado;
    CAT.registrarVoces();
    Object.keys(DEM.TEXTOS).forEach(function (c) {
      VOCES.lineas['nc_' + c] = { quien: 'Lumo', texto: DEM.TEXTOS[c].replace(/^[^:]+:\s*/, '') };
    });
    Object.keys(DEM.PASOS || {}).forEach(function (c) { DEM.PASOS[c].forEach(function (p, i) { VOCES.lineas['ncp_' + c + '_' + i] = { quien: 'Lumo', texto: p.texto }; }); });
    Object.keys(DEM.VOZ_INFANTIL).forEach(function (c) { VOCES.lineas['nci_' + c] = { quien: 'Lumo', texto: DEM.VOZ_INFANTIL[c] }; });
    App.raiz = raiz;
    raiz.innerHTML = Ar.defs();
    App.pantalla = h('div.pantalla'); raiz.appendChild(App.pantalla);
    App.avisos = h('div.toasts', { 'aria-live': 'polite' }); raiz.appendChild(App.avisos);
    App.estado.datos = G.cargar();
    App.estado.voz = root.RumboVoz.crearDesdeNavegador({});
    if (datos().ajustes.vozNombre) App.estado.voz.elegirManual(datos().ajustes.vozNombre);
    var act = datos().perfiles.filter(function (p) { return p.id === datos().activo; })[0];
    App.estado.perfil = act || null;
    aplicarAjustes();
    construirDisparos();
    if (!G.persistente()) setTimeout(function () { toast('Este navegador no deja guardar datos: el progreso se perderá al cerrar. Usa «Mi código».', 6000); }, 800);
    ir('portada');
  }

  function aplicarAjustes() {
    var a = datos().ajustes, b = document.body;
    b.classList.toggle('reducir', !!a.reducir);
    b.classList.toggle('contraste', !!a.contraste);
    b.dataset.fuente = String(a.fuente);
    document.documentElement.style.fontSize = [16, 19, 22][(a.fuente | 0) - 1 || 0] + 'px';
    UI.Sonido.ajustar(a);
    G.guardar();
  }

  function toast(texto, ms) {
    var t = h('div.toast', texto); App.avisos.appendChild(t);
    setTimeout(function () { t.classList.add('fuera'); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 400); }, ms || 3000);
  }

  var limpiezas = [];
  function ir(nombre, params) {
    limpiezas.forEach(function (f) { try { f(); } catch (e) {} }); limpiezas = [];
    if (App.estado.voz) App.estado.voz.parar();
    var f = App.pantallas[nombre];
    if (!f) throw new Error('pantalla desconocida: ' + nombre);
    App.pantalla.className = 'pantalla p-' + nombre;
    App.pantalla.innerHTML = '';
    document.body.dataset.pantalla = nombre;
    App.estado.pantalla = nombre;
    f(App.pantalla, params || {});
  }
  function alSalirDePantalla(f) { limpiezas.push(f); }

  function registrar(nombre, f) { App.pantallas[nombre] = f; }

  // ---------------------------------------------------------------- piezas comunes
  function boton(texto, clase, fn, icono) {
    return h('button.btn-grande' + (clase ? '.' + clase : ''), { type: 'button', on: { click: function (e) { UI.Sonido.sfx('toque'); fn(e); } } }, icono ? UI.svgEl(icono, 'ic') : null, texto ? h('span', texto) : null);
  }
  function lumoAvatar(clase, expr, d) { return h('div.lumo-av' + (clase ? '.' + clase : ''), { html: Ar.lumo({ expr: expr || 'feliz', dir: 'S', disfraz: d == null ? (perfil() ? perfil().disfraz : 0) : d }) }); }
  function nubes(cont) {
    cont.appendChild(h('div.fondo-capas', h('i.nube.n1'), h('i.nube.n2'), h('i.nube.n3'), h('i.estrellita.e1'), h('i.estrellita.e2'), h('i.estrellita.e3')));
  }
  function cabecera(titulo, opciones) {
    opciones = opciones || {};
    var p = perfil();
    var izq = h('div.cab-izq');
    if (opciones.atras) izq.appendChild(h('button.btn-ic', { type: 'button', 'aria-label': 'Volver', on: { click: function () { UI.Sonido.sfx('toque'); opciones.atras(); } } }, UI.svgEl('<svg viewBox="0 0 32 32"><path d="M20 5L9 16l11 11" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>', 'ic')));
    izq.appendChild(h('h1.cab-titulo', titulo));
    var der = h('div.cab-der');
    if (p && opciones.perfil !== false) {
      var tot = PR.estrellasTotales(p);
      der.appendChild(h('div.chip-perfil', lumoAvatar('mini', 'feliz'), dibujoJugador(p), h('span.nom', p.nombre), PR.esInfantil(p) ? null : h('span.est', UI.svgEl(Ar.estrella(true, 18), ''), String(tot))));
    }
    (opciones.extra || []).forEach(function (e) { der.appendChild(e); });
    return h('header.cabecera', izq, der);
  }
  function btnIcono(svg, etiqueta, fn) {
    return h('button.btn-ic', { type: 'button', 'aria-label': etiqueta, title: etiqueta, on: { click: function () { UI.Sonido.sfx('toque'); fn(); } } }, UI.svgEl(svg, 'ic'));
  }
  var SVG_AJ = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="5" stroke="#fff" stroke-width="3.5" fill="none"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>';
  var SVG_COL = '<svg viewBox="0 0 32 32"><path d="M16 3l3.5 8 8.5.8-6.5 5.7 2 8.5L16 21.5 8.5 26l2-8.5L4 11.8l8.5-.8z" fill="#fff"/></svg>';
  var SVG_COD = '<svg viewBox="0 0 32 32"><rect x="5" y="9" width="22" height="14" rx="3" stroke="#fff" stroke-width="3" fill="none"/><path d="M10 16h2M15 16h2M20 16h2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>';
  var SVG_PROF = '<svg viewBox="0 0 32 32"><path d="M4 12l12-6 12 6-12 6z" fill="#fff"/><path d="M9 15v6c0 2 3 4 7 4s7-2 7-4v-6" stroke="#fff" stroke-width="3" fill="none"/></svg>';

  // ---------------------------------------------------------------- portada
  registrar('portada', function (cont) {
    nubes(cont);
    var p = perfil();
    var centro = h('div.portada-centro');
    centro.appendChild(h('div.logo', { html: Ar.logo() }));
    centro.appendChild(h('p.eslogan', 'Programa el camino. Aprende a pensar.'));
    centro.appendChild(h('div.portada-lumo', lumoAvatar('gigante', 'feliz', p ? p.disfraz : 0)));
    var bs = h('div.portada-botones');
    if (p) {
      bs.appendChild(boton('Jugar como ' + p.nombre, 'principal', function () { ir('mapa'); }, '<svg viewBox="0 0 32 32"><path d="M8 5l18 11L8 27z" fill="#fff"/></svg>'));
      bs.appendChild(boton('Cambiar de jugador', 'sec', function () { ir('jugadores'); }));
    } else {
      bs.appendChild(boton('Jugar', 'principal', function () { ir('jugadores'); }, '<svg viewBox="0 0 32 32"><path d="M8 5l18 11L8 27z" fill="#fff"/></svg>'));
    }
    centro.appendChild(bs);
    cont.appendChild(centro);
    cont.appendChild(h('div.portada-pie',
      h('button.btn-txt', { type: 'button', on: { click: function () { ir('codigo'); } } }, 'Continuar con un código'),
      h('button.btn-txt', { type: 'button', on: { click: function () { ir('ajustes'); } } }, 'Ajustes'),
      h('button.btn-txt', { type: 'button', on: { click: function () { ir('docente'); } } }, 'Docentes')));
    UI.Sonido.musica('mapa');
  });

  // Protección de datos: no se pide ningún nombre. Cada jugador es «Jugador N» y se distingue por un dibujo.
  function perfilAnonimo(curso) {
    var ps = datos().perfiles, mayor = 0, usados = {};
    ps.forEach(function (q) { var m = /^Jugador (\d+)$/.exec(q.nombre || ''); if (m) mayor = Math.max(mayor, +m[1]); if (q.picto != null) usados[q.picto] = true; });
    var picto = 0; for (var k = 0; k < 12; k++) if (!usados[k]) { picto = k; break; }
    if (ps.length >= 12) picto = ps.length % 12;
    var p = PR.crearPerfil({ nombre: 'Jugador ' + (mayor + 1), curso: curso });
    p.picto = picto; return p;
  }
  function dibujoJugador(p, tam) { return p && p.picto != null ? h('span.picto-jug', { 'aria-hidden': 'true' }, UI.svgEl(Ar.picto(p.picto), '')) : null; }

  // ---------------------------------------------------------------- jugadores
  registrar('jugadores', function (cont) {
    nubes(cont);
    cont.appendChild(cabecera('¿Quién juega?', { atras: function () { ir('portada'); }, perfil: false }));
    var lista = h('div.jugadores');
    datos().perfiles.forEach(function (p) {
      var curso = CAT.cursoDe(p.curso);
      lista.appendChild(h('button.tarjeta-jugador', { type: 'button', on: { click: function () {
        UI.Sonido.sfx('toque'); App.estado.perfil = p; datos().activo = p.id; guardar(); ir('mapa'); } } },
        lumoAvatar('med', 'feliz', p.disfraz), dibujoJugador(p), h('span.nom', p.nombre), h('span.cur', curso ? curso.nombre : ''),
        PR.esInfantil(p) ? null : h('span.est', UI.svgEl(Ar.estrella(true, 16), ''), String(PR.estrellasTotales(p)))));
    });
    lista.appendChild(h('button.tarjeta-jugador.nuevo', { type: 'button', on: { click: function () { UI.Sonido.sfx('toque'); ir('nuevo-jugador'); } } },
      h('span.mas', '+'), h('span.nom', 'Nuevo jugador')));
    cont.appendChild(lista);
    cont.appendChild(h('div.portada-pie', h('button.btn-txt', { type: 'button', on: { click: function () { ir('codigo'); } } }, 'Tengo un código de partida')));
  });

  registrar('nuevo-jugador', function (cont) {
    nubes(cont);
    cont.appendChild(cabecera('Nuevo jugador', { atras: function () { ir('jugadores'); }, perfil: false }));
    var cursoSel = 'p1';
    var chips = h('div.cursos');
    function pintar() {
      chips.innerHTML = '';
      [['Educación Infantil', ['inf3', 'inf4', 'inf5']], ['Primaria', ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']]].forEach(function (g) {
        var fila = h('div.fila-cursos', h('div.etq', g[0]));
        g[1].forEach(function (c) {
          var cu = CAT.cursoDe(c);
          fila.appendChild(h('button.chip-curso' + (c === cursoSel ? '.sel' : ''), { type: 'button', 'aria-pressed': String(c === cursoSel), on: { click: function () { cursoSel = c; UI.Sonido.sfx('toque'); pintar(); } } }, cu.nombre));
        });
        chips.appendChild(fila);
      });
    }
    pintar();
    var form = h('div.formulario', h('p.aviso-datos', 'No hace falta escribir ningún nombre: tu partida se guarda solo en este navegador.'), h('div.etq.grande', '¿En qué curso estás?'), chips,
      boton('¡Vamos!', 'principal', function () {
        var p = perfilAnonimo(cursoSel);
        datos().perfiles.push(p); datos().activo = p.id; App.estado.perfil = p; guardar();
        if (UI.Sonido) UI.Sonido.sfx('desbloqueo');
        ir('mapa');
      }));
    cont.appendChild(form);
  });

  // ---------------------------------------------------------------- continuar con un código
  registrar('codigo', function (cont) {
    nubes(cont);
    cont.appendChild(cabecera('Continuar con un código', { atras: function () { ir(perfil() ? 'jugadores' : 'portada'); }, perfil: false }));
    var modo = 'texto', picks = [];
    var cuerpo = h('div.formulario.codigo');
    function pintar() {
      cuerpo.innerHTML = '';
      var msg = h('div.msg-error', { role: 'alert' });
      cuerpo.appendChild(h('div.tabs',
        h('button.tab' + (modo === 'texto' ? '.sel' : ''), { type: 'button', on: { click: function () { modo = 'texto'; pintar(); } } }, 'Con letras y números'),
        h('button.tab' + (modo === 'dibujos' ? '.sel' : ''), { type: 'button', on: { click: function () { modo = 'dibujos'; pintar(); } } }, 'Con dibujos')));
      var recoger;
      if (modo === 'texto') {
        var cod = h('textarea.campo.codigo-texto', { rows: '2', placeholder: 'Pega o escribe el código', 'aria-label': 'Código', spellcheck: 'false', autocapitalize: 'characters' });
        cuerpo.appendChild(h('label', h('span.etq', 'Código de partida'), cod));
        recoger = function () { return cod.value; };
      } else {
        var ranuras = h('div.ranuras'), rejilla = h('div.rejilla-pictos');
        var pintarR = function () {
          ranuras.innerHTML = '';
          for (var i = 0; i < 6; i++) ranuras.appendChild(h('span.ranura' + (picks[i] != null ? '.llena' : ''), picks[i] != null ? UI.svgEl(Ar.picto(picks[i]), '') : String(i + 1)));
        };
        for (var k = 0; k < 12; k++) (function (k) {
          rejilla.appendChild(h('button.picto', { type: 'button', 'aria-label': Ar.PICTO_NOMBRE[k], on: { click: function () { if (picks.length < 6) { picks.push(k); UI.Sonido.sfx('poner'); pintarR(); } } } }, UI.svgEl(Ar.picto(k), '')));
        })(k);
        pintarR();
        cuerpo.appendChild(h('div.etq', 'Toca los 6 dibujos en orden'));
        cuerpo.appendChild(ranuras); cuerpo.appendChild(rejilla);
        cuerpo.appendChild(h('button.btn-txt', { type: 'button', on: { click: function () { picks.pop(); pintarR(); } } }, 'Borrar el último'));
        recoger = function () { return picks.slice(); };
      }
      cuerpo.appendChild(msg);
      cuerpo.appendChild(boton('Recuperar mi partida', 'principal', function () {
        var r = PR.desdeCodigo(recoger(), 'Jugador');
        if (!r.ok) { msg.textContent = 'Ese código no es válido. Revisa que no falte ni sobre ningún símbolo.'; UI.Sonido.sfx('choque'); return; }
        var an = perfilAnonimo(r.perfil.curso); r.perfil.nombre = an.nombre; r.perfil.picto = an.picto;
        datos().perfiles.push(r.perfil); datos().activo = r.perfil.id; App.estado.perfil = r.perfil; guardar();
        UI.Sonido.sfx('desbloqueo'); toast('¡Partida recuperada!'); ir('mapa');
      }));
    }
    pintar(); cont.appendChild(cuerpo);
  });

  // ---------------------------------------------------------------- mapa de mundos
  function pestanaMundos() {
    var p = perfil();
    if (PR.esInfantil(p)) return [0];
    return [1, 2, 3, 4];
  }
  function miniaturaMundo(m) {
    var zona = CAT.MUNDOS[m].zonas[0], T = Ar.TEMAS[zona];
    var cs = '';
    for (var y = 0; y < 2; y++) for (var x = 0; x < 4; x++) cs += '<g transform="translate(' + (x * 64) + ' ' + (y * 64) + ')">' + Ar.celda(x === 2 && y === 0 ? '#' : x === 1 && y === 1 ? '~' : '.', zona, x, y, {}) + '</g>';
    return '<svg viewBox="0 0 256 128" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + cs + '</svg>';
  }
  function labDisponible() {
    var p = perfil();
    if (App.estado.docente && App.estado.docente.todo) return true;
    if (p.desbloqueo && p.desbloqueo.lab) return true;
    if (PR.esInfantil(p)) { var k = p.curso === 'inf3' ? 3 : p.curso === 'inf4' ? 4 : 5; return PR.itinerarioCompleto(p, k); }
    return PR.finalHecho(p);
  }
  registrar('mapa', function (cont) {
    var p = perfil(); if (!p) { ir('jugadores'); return; }
    nubes(cont);
    UI.Sonido.musica('mapa');
    cont.appendChild(cabecera('Mapa de mundos', { atras: function () { ir('portada'); }, extra: [
      btnIcono(SVG_COL, 'Colección', function () { ir('coleccion'); }),
      btnIcono(SVG_COD, 'Mi código', function () { mostrarMiCodigo(); }),
      btnIcono(SVG_AJ, 'Ajustes', function () { ir('ajustes'); })] }));
    var grid = h('div.mundos' + (infantil() ? '.uno' : ''));
    var opc = opcionesDocente();
    pestanaMundos().forEach(function (m) {
      var M = CAT.MUNDOS[m], abierto = PR.mundoAbierto(p, m, opc);
      var comp = PR.completadosMundo(p, m), tot = M.niveles.length;
      var est = m === 0 ? null : PR.estrellasMundo(p, m);
      var cls = 'mundo-tarjeta' + (abierto ? '' : '.cerrado') + (comp === tot ? '.completo' : '');
      var tarj = h('button.' + cls, { type: 'button', style: { '--col': M.color }, 'aria-disabled': String(!abierto), on: { click: function () {
        if (!abierto) { UI.Sonido.sfx('choque'); toast(m === 4 ? 'El Faro se abre al terminar el Mundo 3.' : 'Termina el mundo anterior para abrir este.'); return; }
        UI.Sonido.sfx('toque'); ir('mundo', { mundo: m }); } } },
        h('div.mt-arte', { html: miniaturaMundo(m) }),
        h('div.mt-info', h('div.mt-nombre', M.nombre), h('div.mt-edad', M.edades), h('p.mt-desc', M.descripcion),
          h('div.barra', h('i', { style: { width: Math.round(comp / tot * 100) + '%' } })),
          h('div.mt-prog', comp + ' de ' + tot + (est != null ? ' · ★ ' + est + '/' + (tot * 3) : ''))),
        abierto ? null : h('div.mt-candado', UI.svgEl(Ar.candado(), '')));
      grid.appendChild(tarj);
    });
    cont.appendChild(grid);
    // Laboratorio
    var lab = labDisponible();
    cont.appendChild(h('div.mapa-lab', h('button.btn-grande.lab' + (lab ? '' : '.cerrado'), { type: 'button', on: { click: function () {
      if (!lab) { UI.Sonido.sfx('choque'); toast(infantil() ? 'El Laboratorio se abre al terminar tu camino.' : 'El Laboratorio se abre al encender el Faro Mayor.'); return; }
      UI.Sonido.sfx('toque'); ir('laboratorio'); } } }, UI.svgEl(Ar.insignia('lab', 5, !lab), 'lab-ic'), h('span', 'Laboratorio de programación'), lab ? null : UI.svgEl(Ar.candado(), 'cand'))));
    // Botón continuar
    var sig = PR.siguientePendiente(p);
    if (sig) cont.appendChild(h('div.mapa-cont', boton(infantil() ? '' : 'Continuar', 'principal', function () { jugarNivel(sig); }, '<svg viewBox="0 0 32 32"><path d="M8 5l18 11L8 27z" fill="#fff"/></svg>')));
  });

  function mostrarMiCodigo() {
    var p = perfil(), r = PR.aCodigo(p);
    var ov = h('div.modal', { role: 'dialog', 'aria-label': 'Mi código' });
    var c = h('div.modal-caja', h('h2', 'Mi código de partida'));
    if (r.tipo === 'pictos') {
      c.appendChild(h('p', 'Apunta estos dibujos en orden. Te servirán para continuar en otro equipo.'));
      var fila = h('div.ranuras.grande');
      r.codigo.forEach(function (n) { fila.appendChild(h('span.ranura.llena', UI.svgEl(Ar.picto(n), ''))); });
      c.appendChild(fila);
    } else {
      c.appendChild(h('p', 'Apunta este código. Te servirá para continuar en otro equipo.'));
      c.appendChild(h('div.codigo-grande', String(r.codigo)));
      if (!PR.esInfantil(p)) c.appendChild(h('p.nota', 'Recupera tus mundos desbloqueados y tus estrellas por mundo (no el detalle de cada nivel).'));
    }
    c.appendChild(h('button.btn-grande.principal', { type: 'button', on: { click: function () { document.body.removeChild(ov); } } }, h('span', 'Cerrar')));
    ov.appendChild(c); document.body.appendChild(ov);
  }

  // ---------------------------------------------------------------- niveles de un mundo
  registrar('mundo', function (cont, params) {
    var p = perfil(), m = params.mundo, M = CAT.MUNDOS[m];
    var opc = opcionesDocente();
    cont.style.setProperty('--col', M.color);
    cont.classList.add('zona-' + M.zonas[0]);
    nubes(cont);
    UI.Sonido.musica(M.zonas[0]);
    cont.appendChild(cabecera(M.nombre, { atras: function () { ir('mapa'); } }));
    var cuerpo = h('div.niveles-cuerpo');
    function nodo(n, idx, grande) {
      var ok = PR.estaDesbloqueado(p, n.id, opc), hecho = PR.hecho(p, n.id), est = PR.estrellasNivel(p, n.id);
      var tipo = n.tipo === 'depurar' ? '.dep' : n.tipo === 'optimizar' ? '.opt' : '';
      var b = h('button.nodo' + (hecho ? '.hecho' : ok ? '.abierto' : '.cerrado') + tipo + (grande ? '.grande' : ''), { type: 'button', data: { nivel: n.id },
        'aria-label': 'Nivel ' + (idx + 1) + ': ' + n.titulo + (hecho ? ', superado' : ok ? '' : ', bloqueado'), on: { click: function () {
          if (!ok) { UI.Sonido.sfx('choque'); toast('Supera el reto anterior para abrir este.'); return; }
          UI.Sonido.sfx('toque'); jugarNivel(n.id); } } },
        h('span.num', String(idx + 1)),
        !ok ? UI.svgEl(Ar.candado(), 'cand') : null,
        (hecho && n.etapa !== 'infantil') ? h('span.nodo-est', [1, 2, 3].map(function (k) { return UI.svgEl(Ar.estrella(k <= est, 14), ''); })) : null,
        (hecho && n.etapa === 'infantil') ? h('span.nodo-est', UI.svgEl(Ar.estrella(true, 22), '')) : null,
        (!infantil() && n.etapa !== 'infantil') ? h('span.nodo-t', n.titulo) : null);
      return b;
    }
    if (m === 0) {
      [3, 4, 5].forEach(function (k) {
        var ab = PR.itinerarioAbierto(p, k, opc);
        if (!ab) return;
        var icono = k === 3 ? 'flor' : k === 4 ? 'zanahoria' : 'concha';
        var nombre = k === 3 ? 'Pequeños exploradores' : k === 4 ? 'Aventureros del camino' : 'Guardianes de los patrones';
        var fila = h('section.itinerario', h('div.it-cab', UI.svgEl(Ar.insignia(icono, k, false), 'it-ic'), h('div', h('div.it-nombre', nombre), h('div.it-edad', k + ' años'))));
        var ruta = h('div.ruta');
        CAT.ITINERARIOS[k].forEach(function (id, i) { ruta.appendChild(nodo(CAT.POR_ID[id], i, true)); });
        fila.appendChild(ruta); cuerpo.appendChild(fila);
      });
    } else {
      var zonas = M.zonas;
      var porZona = {};
      M.niveles.forEach(function (n, i) { (porZona[n.zona] = porZona[n.zona] || []).push([n, i]); });
      zonas.forEach(function (z) {
        var sec = h('section.itinerario.zona-' + z, h('div.it-cab', h('div.it-nombre', Ar.NOMBRES_ZONA[z])));
        var ruta = h('div.ruta');
        (porZona[z] || []).forEach(function (par) { ruta.appendChild(nodo(par[0], par[1], false)); });
        sec.appendChild(ruta); cuerpo.appendChild(sec);
      });
      // secreto asociado a este mundo
      var sec = CAT.SECRETOS.filter(function (s) { return s.secreto === m; })[0];
      if (sec) {
        var req = CAT.REQUISITO_SECRETO[m - 1], tengo = PR.estrellasMundo(p, req.mundo), abierto = PR.estaDesbloqueado(p, sec.id, opc);
        var s = h('section.itinerario.secreto', h('div.it-cab', UI.svgEl(Ar.insignia('llave', 6, !abierto), 'it-ic'), h('div', h('div.it-nombre', 'Reto secreto'), h('div.it-edad', abierto ? sec.titulo : 'Reúne ' + req.estrellas + ' estrellas en este mundo (' + Math.min(tengo, req.estrellas) + '/' + req.estrellas + ')'))));
        var ruta2 = h('div.ruta'); var nn = nodo(sec, 0, false); nn.querySelector('.num').textContent = '?'; ruta2.appendChild(nn); s.appendChild(ruta2); cuerpo.appendChild(s);
      }
    }
    cont.appendChild(cuerpo);
  });

  // ---------------------------------------------------------------- jugar un nivel
  function jugarNivel(id, opciones) {
    var n = CAT.POR_ID[id]; if (!n) return;
    antesDe(id, function () {
      App.nivelActual = id;
      limpiezas.forEach(function (f) { try { f(); } catch (e) {} }); limpiezas = [];
      App.pantalla.className = 'pantalla p-juego'; App.pantalla.innerHTML = ''; document.body.dataset.pantalla = 'juego';
      App.estado.pantalla = 'juego';
      UI.Sonido.musica(n.zona || 'jardin');
      var ctl = UI.Juego.abrir(App.pantalla, n, {
        perfil: perfil(), ajustes: datos().ajustes, voz: App.estado.voz, guardar: guardar, sinRegistro: !!(opciones && opciones.sinRegistro) || !!(App.estado.docente && App.estado.docente.vista),
        alSalir: function (extra) {
          if (App.estado.docente && App.estado.docente.vista) { App.estado.docente.vista = false; ir('docente'); return; }
          volverTras(n, extra && extra.completado);
        },
        alNivel: function (sig) { despuesDe(n.id, function () { jugarNivel(sig); }); },
        alResolver: function () { if (App.estado.docente && App.estado.docente.vista) { App.estado.docente.vista = false; ir('docente'); } }
      });
      App.estado.controlJuego = ctl;
      alSalirDePantalla(function () { ctl.destruir(); });
    });
  }
  // Juega un nivel que no está en el catálogo (retos del Laboratorio). No registra estrellas.
  function jugarObjeto(n, o) {
    o = o || {};
    limpiezas.forEach(function (f) { try { f(); } catch (e) {} }); limpiezas = [];
    root.RumboVoces.lineas['n_' + n.id] = { quien: 'Lumo', texto: n.objetivo || 'Lleva a Lumo hasta la meta.' };
    App.pantalla.className = 'pantalla p-juego'; App.pantalla.innerHTML = ''; document.body.dataset.pantalla = 'juego'; App.estado.pantalla = 'juego';
    UI.Sonido.musica(n.zona || 'jardin');
    var ctl = UI.Juego.abrir(App.pantalla, n, { perfil: perfil(), ajustes: datos().ajustes, voz: App.estado.voz, guardar: guardar, sinRegistro: true,
      alSalir: o.alSalir || function () { ir('laboratorio'); }, alResolver: o.alResolver || function () { ir('laboratorio'); } });
    App.estado.controlJuego = ctl;
    alSalirDePantalla(function () { ctl.destruir(); });
    return ctl;
  }
  function volverTras(n, completado) {
    var mundo = n.mundo === 'sec' ? (n.secreto || 1) : n.mundo;
    var vuelta = function () { ir('mundo', { mundo: mundo }); };
    if (completado) despuesDe(n.id, vuelta); else vuelta();
  }

  // ---------------------------------------------------------------- historia: disparadores y escenas
  var DISPARO = { antes: {}, despues: {} };
  function construirDisparos() {
    DISPARO = { antes: {}, despues: {} };
    function antes(id, e) { (DISPARO.antes[id] = DISPARO.antes[id] || []).push(e); }
    function despues(id, e) { (DISPARO.despues[id] = DISPARO.despues[id] || []).push(e); }
    function primero(niv, fn) { return niv.filter(fn)[0]; }
    var it = CAT.ITINERARIOS;
    antes(it[3][0], 'C0-01'); despues(it[3][it[3].length - 1], 'C0-02'); despues(it[4][it[4].length - 1], 'C0-03'); despues(it[5][it[5].length - 1], 'C0-04');
    var M = CAT.MUNDOS, x;
    antes(M[1].niveles[0].id, 'C1-01');
    if ((x = primero(M[1].niveles, function (n) { return n.tipo === 'depurar'; }))) antes(x.id, 'C1-02');
    if ((x = primero(M[1].niveles, function (n) { return n.cartas.disponibles.indexOf('repetir') >= 0; }))) antes(x.id, 'C1-03');
    if ((x = primero(M[1].niveles, function (n) { return n.zona === 'montanas'; }))) antes(x.id, 'C1-04');
    despues(M[1].niveles[M[1].niveles.length - 1].id, 'C1-05');
    antes(M[2].niveles[0].id, 'C2-01');
    if ((x = primero(M[2].niveles, function (n) { return n.cartas.disponibles.indexOf('receta') >= 0; }))) antes(x.id, 'C2-02');
    if ((x = primero(M[2].niveles, function (n) { return n.zona === 'volcan'; }))) antes(x.id, 'C2-03');
    if ((x = primero(M[2].niveles, function (n) { return n.tipo === 'depurar'; }))) antes(x.id, 'C2-04');
    despues(M[2].niveles[M[2].niveles.length - 1].id, 'C2-05');
    antes(M[3].niveles[0].id, 'C3-01');
    if ((x = primero(M[3].niveles, function (n) { return n.cartas.disponibles.indexOf('si') >= 0; }))) antes(x.id, 'C3-02');
    if ((x = primero(M[3].niveles, function (n) { return n.zona === 'espacio'; }))) { antes(x.id, 'C3-03'); antes(x.id, 'C3-04'); }
    despues(M[3].niveles[M[3].niveles.length - 1].id, 'C3-05');
    antes(M[4].niveles[0].id, 'CF-01');
    // El final se ve al terminar el último reto del propio curso (ver escenasPendientes).
    Object.keys(CAT.FINAL_CURSO).forEach(function (c) { var id = CAT.FINAL_CURSO[c]; ['CF-03', 'CF-04', 'CF-05'].forEach(function (e) { if ((DISPARO.despues[id] || []).indexOf(e) < 0) despues(id, e); }); });
  }
  App.disparos = function () { return DISPARO; };

  function escenasPendientes(lista, idNivel) {
    var p = perfil(); if (!p || (App.estado.docente && App.estado.docente.vista)) return [];
    return (lista || []).filter(function (e) {
      if (/^CF-0[345]$/.test(e) && idNivel && CAT.finalDe(p.curso) !== idNivel) return false;   // el final es el del curso del jugador
      return !p.vistos.escenas[e];
    });
  }
  function antesDe(id, fn) { reproducirEscenas(escenasPendientes(DISPARO.antes[id], id), fn); }
  function despuesDe(id, fn) { reproducirEscenas(escenasPendientes(DISPARO.despues[id], id), fn); }

  function lineasDeEscena(e) {
    return Object.keys(VOCES.lineas).filter(function (k) { return VOCES.lineas[k].escena === e; });
  }
  function reproducirEscenas(lista, fin) {
    if (!lista.length) { fin(); return; }
    var e = lista[0], resto = lista.slice(1);
    var sigue = function () { reproducirEscenas(resto, fin); };
    PR.marcarEscenaVista(perfil(), e); guardar();
    if (e === 'CF-04') { creditos(sigue); return; }
    var lineas = lineasDeEscena(e);
    if (!lineas.length) { sigue(); return; }
    escena(e, lineas, sigue);
  }
  UI.reproducirEscena = function (id, fin) { var l = lineasDeEscena(id); if (id === 'CF-04') creditos(fin || function () {}); else if (l.length) escena(id, l, fin || function () {}); else if (fin) fin(); };

  function escena(id, lineas, fin) {
    var zona = id === 'C2-03' ? 'volcan' : id === 'C3-03' || id === 'C3-04' ? 'espacio' : ESCENA_ZONA[id.slice(0, 2)] || 'jardin';
    var T = Ar.TEMAS[zona];
    var inf = infantil() || id.indexOf('C0') === 0;
    var ov = h('div.escena.zona-' + zona, { role: 'dialog', 'aria-label': 'Escena de la historia', style: { '--c1': T.cielo[0], '--c2': T.cielo[1] } });
    var suelo = h('div.escena-suelo', { style: { background: T.c1 } });
    var izq = h('div.act.izq'), der = h('div.act.der');
    var burbuja = h('div.escena-burbuja'), nombre = h('div.escena-nombre'), txt = h('div.escena-texto');
    burbuja.appendChild(nombre); burbuja.appendChild(txt);
    var cerrado = false, i = 0;
    var sig = h('button.btn-grande.principal.b-sig-esc', { type: 'button', 'aria-label': 'Siguiente', on: { click: avanzar } }, UI.svgEl(UI.ICON.sig, 'ic'));
    var saltar = h('button.btn-txt.b-saltar', { type: 'button', on: { click: cerrar } }, 'Saltar escena');
    ov.appendChild(h('i.nube.n1')); ov.appendChild(h('i.nube.n2'));
    ov.appendChild(suelo); ov.appendChild(izq); ov.appendChild(der); ov.appendChild(burbuja); ov.appendChild(sig); ov.appendChild(saltar);
    document.body.appendChild(ov);
    UI.Sonido.musica(zona);
    function cerrar() {
      if (cerrado) return; cerrado = true; App.estado.voz.parar();
      if (ov.parentNode) ov.parentNode.removeChild(ov); fin();
    }
    function mostrar() {
      var id_ = lineas[i], l = VOCES.lineas[id_];
      var quien = l.quien;
      var avatarL = Ar.personaje('Lumo'), otro = quien !== 'Lumo' ? Ar.personaje(quien) : null;
      izq.innerHTML = avatarL; der.innerHTML = otro || '';
      izq.classList.toggle('habla', quien === 'Lumo'); der.classList.toggle('habla', quien !== 'Lumo');
      nombre.textContent = quien;
      var r = datos().ajustes.voz !== false ? App.estado.voz.decir(id_, { velocidad: inf ? 0.85 : 0.95 }) : null;
      var sinVoz = !r || r.modo === 'subtitulo';
      txt.textContent = (!inf || sinVoz) ? l.texto : '';
      burbuja.classList.toggle('sin-texto', inf && !sinVoz);
      UI.Sonido.sfx('toque');
    }
    function avanzar() { i++; if (i >= lineas.length) cerrar(); else mostrar(); }
    mostrar();
  }

  function creditos(fin) {
    var ov = h('div.escena.creditos.zona-faro');
    var lista = h('div.cred-lista', h('h2', 'Gracias por encender el Faro'));
    [['Lumo', 'La chispa que aprendió a pensar'], ['Abuela Chispa', 'La guardiana del Faro'], ['Búho Bruma', 'Bosque encantado'], ['Bichito', 'El error que se hizo amigo'], ['Tinta', 'Mundo submarino'], ['Lagarto gigante', 'Isla volcánica'], ['Bit', 'Ciudad tecnológica']].forEach(function (c) {
      lista.appendChild(h('div.cred', h('div.cred-av', { html: Ar.personaje(c[0]) }), h('div', h('b', c[0]), h('span', c[1]))));
    });
    ov.appendChild(lista);
    ov.appendChild(h('button.btn-grande.principal.b-sig-esc', { type: 'button', on: { click: function () { if (ov.parentNode) ov.parentNode.removeChild(ov); fin(); } } }, h('span', 'Continuar')));
    document.body.appendChild(ov);
    UI.Sonido.sfx('victoria');
  }

  // ---------------------------------------------------------------- colección
  registrar('coleccion', function (cont) {
    var p = perfil(); nubes(cont);
    cont.appendChild(cabecera('Mi colección', { atras: function () { ir('mapa'); } }));
    var cuerpo = h('div.coleccion');
    // Disfraces
    var disp = PR.disfracesDesbloqueados(p);
    var sec1 = h('section', h('h2', 'Disfraces de Lumo'));
    var fila = h('div.disfraces');
    LOG.DISFRACES.forEach(function (d) {
      var abierto = disp.indexOf(d.id) >= 0 || (App.estado.docente && App.estado.docente.todo);
      fila.appendChild(h('button.disfraz' + (abierto ? '' : '.cerrado') + (p.disfraz === d.id ? '.sel' : ''), { type: 'button', 'aria-pressed': String(p.disfraz === d.id), on: { click: function () {
        if (!abierto) { UI.Sonido.sfx('choque'); toast(d.desc); return; }
        p.disfraz = d.id; guardar(); UI.Sonido.sfx('desbloqueo'); ir('coleccion'); } } },
        h('div.d-av', { html: Ar.lumo({ expr: abierto ? 'feliz' : 'normal', dir: 'S', disfraz: d.id }) }), h('span.d-nom', abierto ? d.nombre : '???'),
        abierto ? null : h('span.d-desc', d.desc)));
    });
    sec1.appendChild(fila); cuerpo.appendChild(sec1);
    // Insignias
    var sec2 = h('section', h('h2', 'Insignias'));
    var gr = h('div.insignias');
    LOG.INSIGNIAS.filter(function (x) { return PR.esInfantil(p) ? true : !x.infantil; }).forEach(function (x) {
      var ok = !!p.logros[x.id];
      gr.appendChild(h('div.insignia' + (ok ? '' : '.cerrada'), { title: x.desc }, UI.svgEl(Ar.insignia(x.icono, LOG.INSIGNIAS.indexOf(x), !ok), ''), h('span.i-nom', ok ? x.nombre : '???'), h('span.i-desc', x.desc)));
    });
    sec2.appendChild(gr); cuerpo.appendChild(sec2);
    // Brújula
    var piezas = [PR.mundoCompleto(p, 1), PR.mundoCompleto(p, 2), PR.mundoCompleto(p, 3), PR.hecho(p, 'f-03')];
    var sec3 = h('section', h('h2', 'La brújula de Lumo'), h('div.brujula', piezas.map(function (v, i) { return UI.svgEl(Ar.brujulaPieza(i + 1, v), ''); })));
    cuerpo.appendChild(sec3);
    // Álbum de recuerdos
    var vistas = Object.keys(p.vistos.escenas);
    var sec4 = h('section', h('h2', 'Álbum de recuerdos'));
    var al = h('div.album');
    vistas.sort().forEach(function (e) {
      al.appendChild(h('button.recuerdo', { type: 'button', on: { click: function () { UI.reproducirEscena(e, function () {}); } } }, h('span', e)));
    });
    if (!vistas.length) al.appendChild(h('p.nota', 'Aquí aparecerán las escenas de la historia que vayas viendo.'));
    sec4.appendChild(al); cuerpo.appendChild(sec4);
    cont.appendChild(cuerpo);
  });

  // ---------------------------------------------------------------- ajustes
  registrar('ajustes', function (cont) {
    nubes(cont);
    var a = datos().ajustes;
    cont.appendChild(cabecera('Ajustes', { atras: function () { ir(perfil() ? 'mapa' : 'portada'); }, perfil: false }));
    var f = h('div.formulario.ajustes');
    function interruptor(clave, texto, desc) {
      var b = h('button.interruptor' + (a[clave] ? '.on' : ''), { type: 'button', role: 'switch', 'aria-checked': String(!!a[clave]), on: { click: function () {
        a[clave] = !a[clave]; aplicarAjustes(); b.classList.toggle('on', a[clave]); b.setAttribute('aria-checked', String(a[clave])); UI.Sonido.sfx('toque'); if (clave === 'voz' && !a[clave]) App.estado.voz.parar(); } } }, h('i'));
      return h('div.ajuste', h('div.aj-txt', h('b', texto), desc ? h('span', desc) : null), b);
    }
    f.appendChild(interruptor('sonido', 'Efectos de sonido'));
    f.appendChild(interruptor('musica', 'Música'));
    f.appendChild(interruptor('voz', 'Voz de Lumo', 'Lee las instrucciones en voz alta.'));
    f.appendChild(interruptor('reducir', 'Reducir animaciones', 'Menos movimiento en pantalla.'));
    f.appendChild(interruptor('contraste', 'Alto contraste'));
    var tam = h('div.ajuste', h('div.aj-txt', h('b', 'Tamaño de letra')), h('div.seg', [[1, 'A'], [2, 'A+'], [3, 'A++']].map(function (o) {
      return h('button.seg-b' + (a.fuente === o[0] ? '.sel' : ''), { type: 'button', 'aria-pressed': String(a.fuente === o[0]), on: { click: function () { a.fuente = o[0]; aplicarAjustes(); ir('ajustes'); } } }, o[1]);
    })));
    f.appendChild(tam);
    // voz concreta
    var vozInfo = h('div.ajuste.col', h('div.aj-txt', h('b', 'Voz'), h('span', 'Se elige automáticamente la mejor voz en español de este equipo.')));
    var sel = h('select.campo', { 'aria-label': 'Elegir voz' });
    function llenarVoces() {
      sel.innerHTML = '';
      sel.appendChild(h('option', { value: '' }, 'Automática'));
      App.estado.voz.listaDeVoces().forEach(function (v) { sel.appendChild(h('option', { value: v.name, selected: a.vozNombre === v.name ? true : null }, v.name + ' (' + v.lang + ')')); });
      var el = App.estado.voz.vozElegida();
      info.textContent = el ? 'Ahora suena: ' + el.name : 'Este equipo no tiene voz en español: se mostrarán subtítulos.';
    }
    var info = h('span.nota');
    sel.addEventListener('change', function () { a.vozNombre = sel.value || null; App.estado.voz.elegirManual(a.vozNombre); G.guardar(); llenarVoces(); });
    var probar = h('button.btn-txt', { type: 'button', on: { click: function () { UI.Sonido.iniciar(); App.estado.voz.decir('ok_1'); } } }, 'Probar la voz');
    vozInfo.appendChild(sel); vozInfo.appendChild(info); vozInfo.appendChild(probar);
    f.appendChild(vozInfo); llenarVoces();
    if (root.speechSynthesis && root.speechSynthesis.addEventListener) root.speechSynthesis.addEventListener('voiceschanged', llenarVoces);
    f.appendChild(h('p.nota', 'Los datos se guardan solo en este navegador. Nada se envía a Internet.'));
    cont.appendChild(f);
  });

  App.ir = ir; App.iniciar = iniciar; App.toast = toast; App.boton = boton; App.cabecera = cabecera; App.nubes = nubes; App.registrar = registrar;
  App.jugarNivel = jugarNivel; App.jugarObjeto = jugarObjeto; App.perfil = perfil; App.datos = datos; App.guardar = guardar; App.alSalirDePantalla = alSalirDePantalla; App.lumoAvatar = lumoAvatar;
  App.btnIcono = btnIcono; App.labDisponible = labDisponible; App.aplicarAjustes = aplicarAjustes;
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/docente.js ===== */
;/*
 * RUMBO — Modo docente: seguimiento por jugador, currículo por nivel, desbloqueos, copias de seguridad.
 * Todo se calcula con los datos guardados en este navegador. No hay cuentas ni servidor.
 * En Infantil el seguimiento describe participación y comprensión de secuencias, no califica.
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var App = UI.App;

  var RAZONES = {
    choque: 'Choques con obstáculos o paredes', caida: 'Caídas al vacío o al agua', 'objeto-olvidado': 'Meta alcanzada sin recoger todo',
    'objetivo-incompleto': 'Programa que se queda corto', 'limite-pasos': 'Bucles que no terminan', 'programa-vacio': 'Ejecutar sin tarjetas',
    'receta-inexistente': 'Receta llamada pero vacía', 'programa-invalido': 'Programa no válido', profundidad: 'Recetas que se llaman a sí mismas'
  };
  var ESTRATEGIAS = { repetir: 'Bucles (repetir)', si: 'Condiciones (si / si no)', mientras: 'Bucles con condición (mientras)', receta: 'Recetas (bloques reutilizables)', saltar: 'Saltos' };

  function descargar(nombre, texto, mime) {
    var b = new Blob([texto], { type: mime || 'text/plain;charset=utf-8' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  UI.descargar = descargar;
  function csv(v) { v = String(v == null ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function fecha(t) { return t ? new Date(t).toLocaleDateString('es-ES') : '—'; }

  // ---------- puerta de entrada: mantener pulsado ----------
  App.registrar('docente', function (cont, params) {
    App.nubes(cont);
    if (!App.estado.docente || !App.estado.docente.abierto) return puerta(cont);
    panel(cont, params);
  });

  function puerta(cont) {
    cont.appendChild(App.cabecera('Zona docente', { atras: function () { App.ir('portada'); }, perfil: false }));
    var barra = h('i'), estado = h('p.nota', 'Para evitar entradas por error, mantén pulsado el botón durante dos segundos.');
    var btn = h('button.btn-grande.puerta-docente', { type: 'button', 'aria-label': 'Mantén pulsado para entrar' }, h('span', 'Mantén pulsado para entrar'), h('div.puerta-barra', barra));
    var t0 = 0, raf = 0, abierta = false;
    function tick() {
      var f = Math.min(1, (performance.now() - t0) / 2000);
      barra.style.width = (f * 100) + '%';
      if (f >= 1 && !abierta) { abierta = true; App.estado.docente = { abierto: true, todo: false, vista: false, perfilId: null, pestana: 'alumnado' }; App.ir('docente'); return; }
      raf = requestAnimationFrame(tick);
    }
    function ini(e) { if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return; if (t0) return; t0 = performance.now(); tick(); }
    function fin() { t0 = 0; cancelAnimationFrame(raf); barra.style.width = '0'; }
    btn.addEventListener('pointerdown', ini); btn.addEventListener('keydown', ini); ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur'].forEach(function (e) { btn.addEventListener(e, fin); });
    cont.appendChild(h('div.formulario.centro', estado, btn));
    App.alSalirDePantalla(function () { cancelAnimationFrame(raf); });
  }

  // ---------- panel ----------
  function panel(cont, params) {
    var D = App.estado.docente, datos = App.datos(), PR = root.RumboProgreso, CAT = root.RumboCatalogo;
    if (params && params.pestana) D.pestana = params.pestana;
    cont.appendChild(App.cabecera('Modo docente', { atras: function () { D.abierto = false; D.todo = false; App.ir('portada'); }, perfil: false, extra: [
      h('button.btn-txt', { type: 'button', on: { click: function () { D.abierto = false; D.todo = false; App.toast('Has salido del modo docente.'); App.ir('portada'); } } }, 'Salir')] }));
    var tabs = h('div.tabs.docente-tabs');
    [['alumnado', 'Alumnado'], ['niveles', 'Niveles y currículo'], ['matriz', 'Matriz curricular'], ['ajustes', 'Copias y opciones']].forEach(function (t) {
      tabs.appendChild(h('button.tab' + (D.pestana === t[0] ? '.sel' : ''), { type: 'button', on: { click: function () { D.pestana = t[0]; App.ir('docente'); } } }, t[1]));
    });
    cont.appendChild(tabs);
    var cuerpo = h('div.doc-cuerpo'); cont.appendChild(cuerpo);
    ({ alumnado: pAlumnado, niveles: pNiveles, matriz: pMatriz, ajustes: pAjustes })[D.pestana](cuerpo, D, datos, PR, CAT);
  }

  function perfilSel(D, datos) {
    var p = datos.perfiles.filter(function (x) { return x.id === D.perfilId; })[0];
    return p || datos.perfiles[0] || null;
  }

  function selector(D, datos) {
    var sel = h('select.campo.sel-perfil', { 'aria-label': 'Jugador' });
    datos.perfiles.forEach(function (p) { sel.appendChild(h('option', { value: p.id, selected: (perfilSel(D, datos) === p) ? true : null }, p.nombre + ' (' + root.RumboCatalogo.cursoDe(p.curso).nombre + ')')); });
    sel.addEventListener('change', function () { D.perfilId = sel.value; App.ir('docente'); });
    return sel;
  }

  // ---------- pestaña: alumnado ----------
  function pAlumnado(c, D, datos, PR, CAT) {
    if (!datos.perfiles.length) { c.appendChild(h('div.formulario', h('p', 'Todavía no hay jugadores en este equipo. Crea uno desde «Jugar» o importa una copia en «Copias y opciones».'))); return; }
    var p = perfilSel(D, datos), inf = PR.esInfantil(p), r = PR.resumen(p);
    c.appendChild(h('div.doc-fila', selector(D, datos),
      h('button.btn-txt', { type: 'button', on: { click: function () { descargar('rumbo-' + p.nombre.replace(/\W+/g, '_') + '.csv', informeCSV(p), 'text/csv;charset=utf-8'); } } }, 'Descargar informe (CSV)')));
    // resumen
    var res = h('section.doc-caja', h('h2', 'Resumen de ' + p.nombre));
    var stats = h('div.doc-stats');
    function stat(n, t) { return h('div.stat', h('b', String(n)), h('span', t)); }
    stats.appendChild(stat(Object.keys(p.niveles).filter(function (k) { return p.niveles[k].completado; }).length, 'retos superados'));
    stats.appendChild(stat(r.intentos, 'intentos'));
    stats.appendChild(stat(r.pistas, 'ayudas pedidas'));
    if (!inf) stats.appendChild(stat(r.estrellas, 'estrellas'));
    stats.appendChild(stat(r.insignias, 'insignias'));
    res.appendChild(stats);
    if (inf) res.appendChild(h('p.nota', 'En Infantil se describe la participación y la comprensión de secuencias; no se califica. Las estrellas no se usan.'));
    r.mundos.forEach(function (m) {
      if (inf !== (m.id === 0)) { if (!(m.completados > 0)) return; }
      res.appendChild(h('div.doc-mundo', h('span', m.nombre), h('div.barra', h('i', { style: { width: Math.round(m.completados / m.total * 100) + '%', background: CAT.MUNDOS[m.id].color } })), h('span', m.completados + '/' + m.total + (m.maxEstrellas ? ' · ★ ' + m.estrellas + '/' + m.maxEstrellas : ''))));
    });
    c.appendChild(res);
    // errores frecuentes y estrategias
    var er = h('section.doc-caja', h('h2', 'Errores más frecuentes'));
    var lista = Object.keys(r.errores).sort(function (a, b) { return r.errores[b] - r.errores[a]; });
    if (!lista.length) er.appendChild(h('p.nota', 'Sin fallos registrados todavía.'));
    lista.forEach(function (k) { er.appendChild(h('div.doc-barra', h('span', RAZONES[k] || k), h('div.barra', h('i', { style: { width: Math.round(r.errores[k] / r.intentos * 100 || 1) + '%', background: '#e8553f' } })), h('b', String(r.errores[k])))); });
    er.appendChild(h('p.nota', 'Son pistas de qué conceptos reforzar, no una calificación: equivocarse forma parte de programar.'));
    c.appendChild(er);
    var es = {}; Object.keys(p.niveles).forEach(function (k) { Object.keys(p.niveles[k].estrategias || {}).forEach(function (e) { es[e] = (es[e] || 0) + 1; }); });
    var est = h('section.doc-caja', h('h2', 'Estrategias que ha utilizado'));
    var ke = Object.keys(es);
    if (!ke.length) est.appendChild(h('p.nota', 'Aún no ha usado bucles, condiciones ni recetas en retos superados.'));
    ke.forEach(function (k) { est.appendChild(h('div.doc-barra', h('span', ESTRATEGIAS[k] || k), h('b', es[k] + ' retos'))); });
    c.appendChild(est);
    // tabla de niveles
    var tab = h('section.doc-caja', h('h2', 'Detalle por reto'));
    var t = h('table.doc-tabla', h('thead', h('tr', ['Reto', 'Estado', inf ? '' : 'Estrellas', 'Intentos', 'Fallos', 'Ayudas', 'Tarjetas', 'Estrategias'].map(function (x) { return h('th', x); }))));
    var tb = h('tbody');
    (inf ? CAT.SEC_INFANTIL : CAT.SEC_PRIMARIA.concat(CAT.SECRETOS.map(function (n) { return n.id; }))).forEach(function (id) {
      var d = p.niveles[id]; if (!d) return;
      var n = CAT.POR_ID[id];
      tb.appendChild(h('tr', h('td', id + ' · ' + n.titulo), h('td', d.completado ? 'Superado' : 'En curso'), h('td', inf ? '' : d.completado ? '★'.repeat(d.est) : '—'),
        h('td', String(d.intentos)), h('td', String(d.fallos)), h('td', String(d.pistas)), h('td', d.mejor ? String(d.mejor) : '—'),
        h('td', Object.keys(d.estrategias || {}).map(function (e) { return ESTRATEGIAS[e] ? ESTRATEGIAS[e].replace(/ \(.*/, '') : e; }).join(', '))));
    });
    t.appendChild(tb); tab.appendChild(h('div.tabla-caja', t)); c.appendChild(tab);
    // cod
    var cod = PR.aCodigoLargo(p);
    c.appendChild(h('section.doc-caja', h('h2', 'Códigos de partida'), h('p.nota', 'Código corto (el alumnado lo usa solo):'), h('div.codigo-grande', String(PR.aCodigo(p).tipo === 'pictos' ? 'Se muestra con dibujos en el juego' : PR.aCodigo(p).codigo)),
      h('p.nota', 'Código largo (conserva las estrellas de cada reto; para docentes):'), h('textarea.campo.codigo-texto', { readonly: true, rows: '3' }, String(cod))));
  }

  function informeCSV(p) {
    var CAT = root.RumboCatalogo, filas = [['id', 'titulo', 'estado', 'estrellas', 'intentos', 'fallos', 'ayudas', 'mejor_tarjetas', 'estrategias', 'ultimo_intento']];
    CAT.TODOS.forEach(function (n) { var d = p.niveles[n.id]; if (!d) return;
      filas.push([n.id, n.titulo, d.completado ? 'superado' : 'en curso', n.etapa === 'infantil' ? '' : d.est, d.intentos, d.fallos, d.pistas, d.mejor || '', Object.keys(d.estrategias || {}).join('+'), fecha(d.ultimo)]); });
    return '﻿' + filas.map(function (f) { return f.map(csv).join(';'); }).join('\n');
  }

  // ---------- pestaña: niveles ----------
  function pNiveles(c, D, datos, PR, CAT) {
    var p = perfilSel(D, datos);
    c.appendChild(h('div.doc-fila', datos.perfiles.length ? selector(D, datos) : null,
      h('label.chk', h('input', { type: 'checkbox', checked: D.todo ? true : null, on: { change: function (e) { D.todo = e.target.checked; App.toast(D.todo ? 'Todos los niveles abiertos en el mapa (solo esta sesión).' : 'Mapa con desbloqueo normal.'); } } }), h('span', 'Abrir todos los niveles en el mapa (esta sesión)')),
      h('button.btn-txt', { type: 'button', on: { click: function () { if (!p) return; CAT.TODOS.forEach(function (n) { p.desbloqueo.niveles[n.id] = true; }); p.desbloqueo.lab = true; App.guardar(); App.toast('Niveles y Laboratorio desbloqueados para ' + p.nombre + '.'); } } }, 'Desbloquear todo para este jugador'),
      h('button.btn-txt', { type: 'button', on: { click: function () { App.ir('laboratorio'); } } }, 'Abrir Laboratorio')));
    var grupos = [['Educación Infantil', CAT.SEC_INFANTIL], ['Mundo 1', CAT.MUNDOS[1].niveles.map(function (n) { return n.id; })], ['Mundo 2', CAT.MUNDOS[2].niveles.map(function (n) { return n.id; })],
      ['Mundo 3', CAT.MUNDOS[3].niveles.map(function (n) { return n.id; })], ['Faro y retos secretos', CAT.MUNDOS[4].niveles.map(function (n) { return n.id; }).concat(CAT.SECRETOS.map(function (n) { return n.id; }))]];
    grupos.forEach(function (g) {
      var det = h('details.doc-caja', h('summary', g[0] + ' (' + g[1].length + ')'));
      g[1].forEach(function (id) {
        var n = CAT.POR_ID[id];
        var curr = h('div.doc-curr');
        (n.curriculo.oficial || []).forEach(function (o) { curr.appendChild(h('div.curr-of', h('b', 'Decreto ' + o.decreto + ' · ' + o.area + (o.criterio ? ' · criterio ' + o.criterio : '')), h('span', ' ' + (o.texto || '')))); });
        (n.curriculo.extension || []).forEach(function (e) { curr.appendChild(h('div.curr-ext', h('b', 'Propuesta didáctica del juego: '), h('span', e))); });
        var abierto = p ? !!(p.desbloqueo.niveles[id]) : false;
        det.appendChild(h('div.doc-nivel', h('div.dn-cab', h('b', id), h('span', n.titulo), n.tipo !== 'normal' ? h('span.chip', n.tipo) : null,
          h('div.dn-acc',
            h('button.btn-txt', { type: 'button', on: { click: function () { D.vista = true; App.jugarNivel(id, { sinRegistro: true }); } } }, 'Probar'),
            p ? h('button.btn-txt', { type: 'button', on: { click: function () { p.desbloqueo.niveles[id] = true; App.guardar(); App.toast('Nivel ' + id + ' desbloqueado para ' + p.nombre + '.'); } } }, abierto ? 'Desbloqueado' : 'Desbloquear') : null)),
          h('div.dn-obj', n.objetivo), curr));
      });
      c.appendChild(det);
    });
  }

  // ---------- pestaña: matriz curricular ----------
  function pMatriz(c, D, datos, PR, CAT) {
    c.appendChild(h('section.doc-caja', h('h2', 'Matriz curricular: qué retos trabajan cada criterio'),
      h('p.nota', 'Referencias a los Decretos 196/2022 (Infantil) y 211/2022 (Primaria) de Canarias. Las referencias están redactadas a partir de los decretos y deben contrastarse con el BOC antes de usarlas en documentos oficiales. Las propuestas de programación (variables, funciones, eventos…) se señalan aparte como extensión del juego.')));
    var mapa = {}, ext = {};
    CAT.TODOS.forEach(function (n) {
      (n.curriculo.oficial || []).forEach(function (o) { var k = o.decreto + '|' + o.area + '|' + (o.criterio || ''); (mapa[k] = mapa[k] || { o: o, niveles: [] }).niveles.push(n.id); });
      (n.curriculo.extension || []).forEach(function (e) { (ext[e] = ext[e] || []).push(n.id); });
    });
    var t = h('table.doc-tabla', h('thead', h('tr', ['Decreto', 'Área / competencia', 'Criterio', 'Descripción', 'Retos'].map(function (x) { return h('th', x); }))));
    var tb = h('tbody');
    Object.keys(mapa).sort().forEach(function (k) { var m = mapa[k]; tb.appendChild(h('tr', h('td', m.o.decreto), h('td', m.o.area), h('td', m.o.criterio || ''), h('td', m.o.texto || ''), h('td', m.niveles.length + ' retos (' + m.niveles.slice(0, 4).join(', ') + (m.niveles.length > 4 ? '…' : '') + ')'))); });
    t.appendChild(tb); c.appendChild(h('section.doc-caja', h('h2', 'Contenido oficial'), h('div.tabla-caja', t)));
    var ul = h('section.doc-caja', h('h2', 'Propuestas didácticas propias del juego (no son contenido oficial)'));
    Object.keys(ext).sort().forEach(function (e) { ul.appendChild(h('div.doc-barra', h('span', e), h('b', ext[e].length + ' retos'))); });
    c.appendChild(ul);
  }

  // ---------- pestaña: copias y opciones ----------
  function pAjustes(c, D, datos, PR, CAT) {
    var G = UI.Guardado, p = perfilSel(D, datos);
    var cp = h('section.doc-caja', h('h2', 'Copia de seguridad'), h('p.nota', 'Guarda todos los jugadores en un archivo para llevarlos a otro equipo o recuperarlos.'));
    var fi = h('input', { type: 'file', accept: '.json,application/json', hidden: true, on: { change: function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { G.importar(String(rd.result)); App.estado.datos = G.cargar(); App.estado.perfil = null; App.aplicarAjustes(); App.toast('Copia importada: ' + App.estado.datos.perfiles.length + ' jugadores.'); App.ir('docente'); } catch (err) { App.toast('Ese archivo no es una copia válida de RUMBO.'); } };
      rd.readAsText(f); } } });
    cp.appendChild(h('div.doc-fila',
      h('button.btn-txt', { type: 'button', on: { click: function () { descargar('rumbo-copia-' + new Date().toISOString().slice(0, 10) + '.json', G.exportar(), 'application/json'); } } }, 'Descargar copia'),
      h('button.btn-txt', { type: 'button', on: { click: function () { fi.click(); } } }, 'Importar copia (sustituye lo actual)'), fi));
    c.appendChild(cp);
    var gj = h('section.doc-caja', h('h2', 'Jugadores'));
    if (!datos.perfiles.length) gj.appendChild(h('p.nota', 'Sin jugadores.'));
    datos.perfiles.forEach(function (pp) {
      var curs = h('select.campo.chico', { 'aria-label': 'Curso de ' + pp.nombre, on: { change: function (e) { pp.curso = e.target.value; App.guardar(); App.toast('Curso actualizado.'); } } });
      CAT.CURSOS.forEach(function (cu) { curs.appendChild(h('option', { value: cu.id, selected: pp.curso === cu.id ? true : null }, cu.nombre + (cu.id.indexOf('inf') === 0 ? ' (Infantil)' : ' Primaria'))); });
      gj.appendChild(h('div.doc-fila.jug', h('b', pp.nombre), curs,
        h('button.btn-txt', { type: 'button', on: { click: function () { if (!confirm('¿Reiniciar toda la partida de ' + pp.nombre + '? Se borrarán retos, estrellas e insignias.')) return; var n = PR.crearPerfil({ id: pp.id, nombre: pp.nombre, curso: pp.curso }); datos.perfiles[datos.perfiles.indexOf(pp)] = n; if (App.estado.perfil === pp) App.estado.perfil = n; App.guardar(); App.toast('Partida reiniciada.'); App.ir('docente'); } } }, 'Reiniciar partida'),
        h('button.btn-txt.peligro', { type: 'button', on: { click: function () { if (!confirm('¿Eliminar a ' + pp.nombre + ' del equipo?')) return; datos.perfiles.splice(datos.perfiles.indexOf(pp), 1); if (datos.activo === pp.id) { datos.activo = null; App.estado.perfil = null; } App.guardar(); App.ir('docente'); } } }, 'Eliminar')));
    });
    c.appendChild(gj);
    c.appendChild(h('section.doc-caja', h('h2', 'Privacidad'), h('p', 'RUMBO no envía datos a ningún servidor ni usa cuentas. El juego no pide ningún nombre: cada jugador aparece como «Jugador N» con un dibujo, y el progreso se guarda solo en este navegador. Si anotas quién es cada número, hazlo fuera del juego. Los retos del Laboratorio tampoco deben llevar nombres de personas.'),
      h('div.doc-fila', h('button.btn-txt.peligro', { type: 'button', on: { click: function () { if (!confirm('¿Borrar TODOS los datos de RUMBO de este navegador?')) return; G.reiniciarTodo(); App.estado.datos = G.cargar(); App.estado.perfil = null; D.abierto = false; App.ir('portada'); } } }, 'Borrar todos los datos de este navegador'))));
  }
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/laboratorio.js ===== */
;/*
 * RUMBO — Laboratorio de programación (modo creador).
 * Usa el MISMO motor y las mismas tarjetas que los mundos: el reto se prueba en la pantalla de juego
 * y solo se puede guardar cuando su autor lo ha resuelto (así sabemos que tiene solución).
 */
(function (root) {
  'use strict';
  var UI = root.RumboUI = root.RumboUI || {};
  var h = function () { return UI.h.apply(null, arguments); };
  var App = UI.App, R = function () { return root.RumboRetos; };
  var borrador = null;     // reto en edición (se conserva al ir a probarlo y volver)

  var HERR = {
    inicio: { n: 'Lumo', c: '.' }, meta: { n: 'Meta', c: 'G' }, pared: { n: 'Pared', c: '#' }, agua: { n: 'Agua', c: '~' }, barrera: { n: 'Barrera', c: 'b' },
    objeto: { n: 'Objeto', c: 'o' }, interruptor: { n: 'Interruptor', c: 's' }, puerta: { n: 'Puerta', c: 'd' }, borrar: { n: 'Borrar', c: '.' }
  };
  var SIGUIENTE_DIR = { E: 'S', S: 'O', O: 'N', N: 'E' };

  function ciclo() { return R().cicloDe(App.perfil().curso); }
  function nuevoBorrador() {
    var c = R().CICLOS[ciclo()], w = c.tam[0] + 1, hh = c.tam[0] + 1;
    var m = []; for (var y = 0; y < hh; y++) { m.push(new Array(w + 1).join('.')); }
    m[hh - 1] = m[hh - 1].slice(0, w - 1) + 'G';
    return { id: 'r' + Date.now().toString(36), nombre: '', autor: App.perfil().nombre, ciclo: ciclo(), zona: c.zonas[0], mapa: m, inicio: { x: 0, y: 0, dir: 'E' }, referencia: null, creado: Date.now() };
  }
  function celdas(reto) { return reto.mapa.map(function (f) { return f.split(''); }); }
  function aMapa(g) { return g.map(function (f) { return f.join(''); }); }

  // ------------------------------------------------------------- hub
  App.registrar('laboratorio', function (cont) {
    var p = App.perfil(); if (!p) { App.ir('jugadores'); return; }
    App.nubes(cont); UI.Sonido.musica('mapa');
    var D = App.estado.docente;
    cont.appendChild(App.cabecera('Laboratorio de programación', { atras: function () { App.ir(D && D.abierto ? 'docente' : 'mapa'); } }));
    var inf = root.RumboProgreso.esInfantil(p);
    var intro = h('div.formulario.lab-intro', h('div.lab-lumo', { html: UI.Arte.lumo({ expr: 'pensando', dir: 'S', disfraz: p.disfraz }) }),
      h('div', h('h2', 'Ahora te toca a ti guiar a otros'), h('p', inf ? 'Construye un camino con piezas grandes y comprueba que Lumo puede llegar.' : 'Diseña un tablero, resuélvelo tú y comparte el reto con tus compañeros.')));
    cont.appendChild(intro);
    var acc = h('div.lab-acciones',
      App.boton('Crear un reto', 'principal', function () { borrador = nuevoBorrador(); App.ir('lab-editor'); }, '<svg viewBox="0 0 32 32"><path d="M16 5v22M5 16h22" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>'),
      App.boton('Importar un reto', 'sec', function () { modalImportar(); }));
    cont.appendChild(acc);
    // mis retos
    var mios = h('section.doc-caja.lab-lista', h('h2', 'Mis retos'));
    if (!p.retos.length) mios.appendChild(h('p.nota', 'Todavía no has creado ni importado ningún reto.'));
    p.retos.forEach(function (r) { mios.appendChild(fila(r, true)); });
    cont.appendChild(mios);
    // retos de otros jugadores de este equipo (retos por parejas)
    var otros = [];
    App.datos().perfiles.forEach(function (q) { if (q !== p) (q.retos || []).forEach(function (r) { if (!r.ajeno) otros.push(r); }); });
    if (otros.length) {
      var s = h('section.doc-caja.lab-lista', h('h2', 'Retos de otros jugadores de este equipo'));
      otros.forEach(function (r) { s.appendChild(fila(r, false)); });
      cont.appendChild(s);
    }
  });

  function miniatura(r) {
    var w = r.mapa[0].length, hh = r.mapa.length, s = '';
    for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) {
      var ch = r.mapa[y].charAt(x);
      s += '<g transform="translate(' + (x * 64) + ' ' + (y * 64) + ')">' + UI.Arte.celda(ch === 'o' ? '.' : ch, r.zona, x, y, {}) + (ch === 'o' ? UI.Arte.objeto(r.zona, {}) : '') + '</g>';
    }
    return '<svg viewBox="0 0 ' + (w * 64) + ' ' + (hh * 64) + '" aria-hidden="true">' + s + '</svg>';
  }

  function fila(r, editable) {
    var n = R().retoANivel(r);
    var f = h('div.reto-fila', h('div.reto-mini', { html: miniatura(r) }),
      h('div.reto-info', h('b', r.nombre), h('span', 'de ' + r.autor + ' · ' + R().CICLOS[r.ciclo].nombre + ' · ' + r.mapa[0].length + '×' + r.mapa.length)),
      h('div.reto-acc',
        h('button.btn-txt', { type: 'button', on: { click: function () { jugarReto(r); } } }, 'Jugar'),
        editable && !r.ajeno ? h('button.btn-txt', { type: 'button', on: { click: function () { borrador = JSON.parse(JSON.stringify(r)); App.ir('lab-editor'); } } }, 'Editar') : null,
        h('button.btn-txt', { type: 'button', on: { click: function () { modalCompartir(r); } } }, 'Compartir'),
        editable ? h('button.btn-txt.peligro', { type: 'button', on: { click: function () {
          if (!confirm('¿Borrar el reto «' + r.nombre + '»?')) return;
          var p = App.perfil(); p.retos.splice(p.retos.indexOf(r), 1); App.guardar(); App.ir('laboratorio'); } } }, 'Borrar') : null));
    void n;
    return f;
  }

  function jugarReto(r) {
    var nivel = R().retoANivel(r);
    App.jugarObjeto(nivel, { alSalir: function () { App.ir('laboratorio'); }, alResolver: function () { App.toast('¡Reto resuelto!'); App.ir('laboratorio'); } });
  }

  // ------------------------------------------------------------- compartir / importar
  function modal(titulo, cuerpo) {
    var ov = h('div.modal', { role: 'dialog', 'aria-label': titulo });
    var caja = h('div.modal-caja', h('h2', titulo), cuerpo);
    ov.appendChild(caja); document.body.appendChild(ov);
    return { cerrar: function () { if (ov.parentNode) ov.parentNode.removeChild(ov); }, caja: caja };
  }
  function modalCompartir(r) {
    var cod = R().codificar(r);
    var ta = h('textarea.campo.codigo-texto', { readonly: true, rows: '5', 'aria-label': 'Código del reto' }, cod);
    var m = modal('Compartir «' + r.nombre + '»', h('div', { style: { display: 'contents' } },
      h('p', 'Copia este código y envíaselo a tu compañero, o descarga el archivo.'), ta,
      h('div.doc-fila',
        h('button.btn-txt', { type: 'button', on: { click: function () { ta.select(); var ok = false; try { ok = navigator.clipboard ? (navigator.clipboard.writeText(cod), true) : document.execCommand('copy'); } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) {} } App.toast(ok ? 'Código copiado.' : 'Selecciona el texto y cópialo.'); } } }, 'Copiar código'),
        h('button.btn-txt', { type: 'button', on: { click: function () { UI.descargar('reto-' + r.nombre.replace(/[^\w]+/g, '_') + '.rumbo.json', JSON.stringify({ formato: 'rumbo-reto', version: 1, nombre: r.nombre, autor: r.autor, codigo: cod }, null, 1), 'application/json'); } } }, 'Descargar archivo'))));
    m.caja.appendChild(h('button.btn-grande.principal', { type: 'button', on: { click: m.cerrar } }, h('span', 'Cerrar')));
    setTimeout(function () { ta.focus(); ta.select(); }, 50);
  }
  function modalImportar() {
    var ta = h('textarea.campo.codigo-texto', { rows: '5', placeholder: 'Pega aquí el código del reto (empieza por RUMBO1.)', 'aria-label': 'Código del reto' });
    var msg = h('div.msg-error', { role: 'alert' });
    var fi = h('input', { type: 'file', accept: '.json,application/json,text/plain', hidden: true, on: { change: function (e) { var f = e.target.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { ta.value = String(rd.result).slice(0, 200000); }; rd.readAsText(f); } } });
    var m = modal('Importar un reto', h('div', { style: { display: 'contents' } }, ta, msg, h('button.btn-txt', { type: 'button', on: { click: function () { fi.click(); } } }, 'Elegir un archivo…'), fi));
    m.caja.appendChild(h('div.res-acciones',
      h('button.btn-grande.sec', { type: 'button', on: { click: m.cerrar } }, h('span', 'Cancelar')),
      h('button.btn-grande.principal', { type: 'button', on: { click: function () {
        var d = R().decodificar(ta.value);
        if (!d.ok) { msg.textContent = R().MENSAJES[d.motivo] || 'No se ha podido importar.'; UI.Sonido.sfx('choque'); return; }
        var p = App.perfil(); d.reto.ajeno = true; d.reto.id = 'i' + Date.now().toString(36);
        p.retos.push(d.reto); App.guardar(); m.cerrar(); UI.Sonido.sfx('desbloqueo'); App.toast('Reto importado: ' + d.reto.nombre); App.ir('laboratorio');
      } } }, h('span', 'Importar'))));
  }

  // ------------------------------------------------------------- editor del tablero
  App.registrar('lab-editor', function (cont) {
    var p = App.perfil(); if (!p) { App.ir('jugadores'); return; }
    if (!borrador) borrador = nuevoBorrador();
    var C = R().CICLOS[borrador.ciclo], reto = borrador, herr = 'pared';
    App.nubes(cont); UI.Sonido.musica(reto.zona);
    cont.appendChild(App.cabecera(root.RumboProgreso.esInfantil(p) ? 'Crea tu camino' : 'Crear un reto', { atras: function () { borrador = null; App.ir('laboratorio'); } }));
    var cuerpo = h('div.lab-cuerpo'), lienzo = h('div.lab-lienzo'), panel = h('div.lab-panel');
    cuerpo.appendChild(lienzo); cuerpo.appendChild(panel); cont.appendChild(cuerpo);

    function render() {
      var w = reto.mapa[0].length, hh = reto.mapa.length, s = '';
      for (var y = 0; y < hh; y++) for (var x = 0; x < w; x++) {
        var ch = reto.mapa[y].charAt(x);
        s += '<g transform="translate(' + (x * 64) + ' ' + (y * 64) + ')" data-celda="' + x + ',' + y + '">' + UI.Arte.celda(ch === 'o' ? '.' : ch, reto.zona, x, y, {}) + (ch === 'o' ? UI.Arte.objeto(reto.zona, {}) : '') + '</g>';
      }
      var l = UI.Arte.lumo({ dir: reto.inicio.dir, expr: 'feliz', disfraz: p.disfraz }).replace('class="lumo-svg"', 'class="lumo-svg" x="2" y="-4" width="60" height="60"');
      s += '<g transform="translate(' + (reto.inicio.x * 64) + ' ' + (reto.inicio.y * 64) + ')" pointer-events="none">' + l + '</g>';
      lienzo.innerHTML = '<svg class="tablero lab-tablero" viewBox="0 0 ' + (w * 64) + ' ' + (hh * 64) + '" role="img" aria-label="Tablero que estás creando">' + s + '</svg>';
      var svg = lienzo.firstChild;
      var down = false, ultima = '';
      function celdaDe(e) {
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        var q = pt.matrixTransform(svg.getScreenCTM().inverse()), x = Math.floor(q.x / 64), y = Math.floor(q.y / 64);
        return (x >= 0 && y >= 0 && x < w && y < hh) ? { x: x, y: y } : null;
      }
      function aplicar(c, inicial) {
        if (!c) return;
        var clave = c.x + ',' + c.y; if (clave === ultima && !inicial) return; ultima = clave;
        var g = celdas(reto), esInicio = c.x === reto.inicio.x && c.y === reto.inicio.y;
        if (herr === 'inicio') {
          if (esInicio && inicial) reto.inicio.dir = SIGUIENTE_DIR[reto.inicio.dir];
          else { if ('.o'.indexOf(g[c.y][c.x]) < 0) g[c.y][c.x] = '.'; reto.inicio.x = c.x; reto.inicio.y = c.y; }
        } else if (esInicio) { if (inicial) App.toast('Aquí está Lumo. Usa la herramienta «Lumo» para moverlo.'); return; }
        else if (herr === 'meta') {
          for (var y = 0; y < g.length; y++) for (var x = 0; x < g[y].length; x++) if (g[y][x] === 'G') g[y][x] = '.';
          g[c.y][c.x] = 'G';
        } else { if (g[c.y][c.x] === 'G' && herr !== 'borrar' && inicial) { /* sustituir la meta está permitido */ } g[c.y][c.x] = HERR[herr].c; }
        // nunca dejar la meta borrada
        reto.mapa = aMapa(g); reto.referencia = null;
        if (!reto.mapa.join('').includes('G')) { var g2 = celdas(reto); var ex = reto.mapa[hh - 1].length - 1; g2[hh - 1][ex] = 'G'; if (hh - 1 === reto.inicio.y && ex === reto.inicio.x) g2[0][ex] = 'G'; reto.mapa = aMapa(g2); App.toast('El reto necesita una meta: la he vuelto a poner.'); }
        UI.Sonido.sfx('poner'); render(); panelRender();
      }
      svg.addEventListener('pointerdown', function (e) { down = true; ultima = ''; svg.setPointerCapture && svg.setPointerCapture(e.pointerId); aplicar(celdaDe(e), true); });
      svg.addEventListener('pointermove', function (e) { if (down && herr !== 'inicio' && herr !== 'meta') aplicar(celdaDe(e), false); });
      ['pointerup', 'pointercancel'].forEach(function (ev) { svg.addEventListener(ev, function () { down = false; }); });
    }

    function redimensionar(dw, dh) {
      var w = reto.mapa[0].length + dw, hh = reto.mapa.length + dh;
      if (w < C.tam[0] || hh < C.tam[0] || w > C.tam[1] || hh > C.tam[1]) return;
      var g = celdas(reto), nuevo = [];
      for (var y = 0; y < hh; y++) { var fila = []; for (var x = 0; x < w; x++) fila.push(g[y] && g[y][x] ? g[y][x] : '.'); nuevo.push(fila); }
      reto.mapa = aMapa(nuevo);
      if (reto.inicio.x >= w) reto.inicio.x = w - 1; if (reto.inicio.y >= hh) reto.inicio.y = hh - 1;
      if ('.o'.indexOf(reto.mapa[reto.inicio.y].charAt(reto.inicio.x)) < 0) { var g3 = celdas(reto); g3[reto.inicio.y][reto.inicio.x] = '.'; reto.mapa = aMapa(g3); }
      if (!reto.mapa.join('').includes('G')) { var g4 = celdas(reto); var yy = hh - 1, xx = w - 1; if (reto.inicio.x === xx && reto.inicio.y === yy) { xx = 0; } g4[yy][xx] = 'G'; reto.mapa = aMapa(g4); }
      reto.referencia = null; render(); panelRender();
    }

    function panelRender() {
      panel.innerHTML = '';
      panel.appendChild(h('div.lab-herr', C.herramientas.map(function (k) {
        var icono = k === 'inicio' ? UI.Arte.lumo({ dir: reto.inicio.dir, expr: 'feliz', disfraz: p.disfraz }) :
          k === 'borrar' ? '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="#fff" stroke="#c9bde6" stroke-width="5"/><path d="M20 44L44 20" stroke="#e8553f" stroke-width="6" stroke-linecap="round"/></svg>' :
          '<svg viewBox="0 0 64 64">' + UI.Arte.celda(k === 'objeto' ? '.' : HERR[k].c, reto.zona, 0, 0, {}) + (k === 'objeto' ? UI.Arte.objeto(reto.zona, {}) : '') + '</svg>';
        return h('button.herr' + (herr === k ? '.sel' : ''), { type: 'button', 'aria-pressed': String(herr === k), 'aria-label': HERR[k].n, on: { click: function () { herr = k; UI.Sonido.sfx('toque'); panelRender(); } } }, UI.svgEl(icono, 'herr-ic'), h('span', HERR[k].n));
      })));
      if (herr === 'inicio') panel.appendChild(h('p.nota', 'Toca a Lumo otra vez para que mire a otro lado.'));
      panel.appendChild(h('div.lab-tam', h('span.etq', 'Tamaño'),
        h('div.stepper.suelto', h('button', { type: 'button', 'aria-label': 'Menos ancho', on: { click: function () { redimensionar(-1, 0); } } }, '−'), h('b.n', reto.mapa[0].length + ' ancho'), h('button', { type: 'button', 'aria-label': 'Más ancho', on: { click: function () { redimensionar(1, 0); } } }, '+')),
        h('div.stepper.suelto', h('button', { type: 'button', 'aria-label': 'Menos alto', on: { click: function () { redimensionar(0, -1); } } }, '−'), h('b.n', reto.mapa.length + ' alto'), h('button', { type: 'button', 'aria-label': 'Más alto', on: { click: function () { redimensionar(0, 1); } } }, '+'))));
      panel.appendChild(h('div.lab-zonas', h('span.etq', 'Escenario'), C.zonas.map(function (z) {
        return h('button.chip-curso' + (reto.zona === z ? '.sel' : ''), { type: 'button', on: { click: function () { reto.zona = z; UI.Sonido.musica(z); render(); panelRender(); } } }, UI.Arte.NOMBRES_ZONA[z].replace(/^(El|La) /, ''));
      })));
      panel.appendChild(h('div.lab-botones',
        App.boton('Probar y guardar', 'principal', probar, UI.ICON.play),
        h('button.btn-txt', { type: 'button', on: { click: function () { var g = celdas(reto).map(function (f) { return f.map(function (c) { return c === 'G' ? 'G' : '.'; }); }); reto.mapa = aMapa(g); reto.referencia = null; render(); panelRender(); } } }, 'Vaciar el tablero')));
      panel.appendChild(h('p.nota', reto.referencia ? '✔ Este reto tiene una solución comprobada.' : 'Para guardar el reto tienes que resolverlo tú: así sabemos que se puede.'));
    }

    function probar() {
      var g = reto.mapa.join('');
      if (g.indexOf('G') < 0) { App.toast('Falta la meta.'); return; }
      var nivel = R().retoANivel(Object.assign({}, reto, { nombre: reto.nombre || 'Mi reto', referencia: [{ t: 'avanzar' }] }));
      nivel.referencia = [{ t: 'avanzar' }];
      nivel.objetivo = g.indexOf('o') >= 0 ? 'Recoge todo y llega a la meta.' : 'Lleva a Lumo hasta la meta.';
      nivel.titulo = 'Comprueba tu reto'; nivel.sinSolucion = true;
      delete nivel.estrellas;
      if (nivel.etapa !== 'infantil') nivel.estrellas = { s2max: 99, s3: { tipo: 'max-tarjetas', valor: 0 } };
      else nivel.huecos = 8;
      // Hasta que se resuelva, Lumo no ofrece «te lo enseña»: la referencia es un marcador.
      App.jugarObjeto(nivel, {
        alSalir: function () { App.ir('lab-editor'); },
        alResolver: function (info) { reto.referencia = info.programa; reto.creado = Date.now(); guardarReto(); }
      });
    }

    function guardarReto() {
      var inp = h('input.campo', { type: 'text', maxlength: '30', placeholder: 'Nombre del reto (sin nombres de personas)', value: reto.nombre || '', 'aria-label': 'Nombre del reto' });
      var msg = h('div.msg-error', { role: 'alert' });
      var m = modal('¡Tu reto tiene solución!', h('div', { style: { display: 'contents' } }, h('p', 'Ponle un nombre para guardarlo.'), inp, msg));
      m.caja.appendChild(h('div.res-acciones',
        h('button.btn-grande.sec', { type: 'button', on: { click: function () { m.cerrar(); App.ir('lab-editor'); } } }, h('span', 'Seguir editando')),
        h('button.btn-grande.principal', { type: 'button', on: { click: function () {
          reto.nombre = inp.value.trim() || 'Reto de ' + p.nombre;
          var v = R().validar(Object.assign({}, reto, { autor: p.nombre }));
          if (!v.ok) { msg.textContent = R().MENSAJES[v.motivo] || 'No se puede guardar.'; return; }
          var i = -1; p.retos.forEach(function (r, k) { if (r.id === reto.id) i = k; });
          if (i >= 0) p.retos[i] = v.reto; else p.retos.push(v.reto);
          var nuevos = root.RumboProgreso.evaluarLogros(p); App.guardar(); m.cerrar(); borrador = null;
          UI.Sonido.sfx('desbloqueo'); App.toast(nuevos.indexOf('creador') >= 0 ? '¡Reto guardado y nueva insignia: Creador de retos!' : '¡Reto guardado!'); App.ir('laboratorio');
        } } }, h('span', 'Guardar'))));
      setTimeout(function () { inp.focus(); }, 60);
    }

    render(); panelRender();
  });
})(typeof self !== 'undefined' ? self : this);


/* ===== src/ui/main.js ===== */
;/* RUMBO — punto de entrada. */
(function (root) {
  'use strict';
  function arrancar() {
    var UI = root.RumboUI;
    try { UI.App.iniciar(document.getElementById('app')); }
    catch (e) {
      console.error(e);
      document.getElementById('app').innerHTML = '<div style="padding:24px;font:700 18px sans-serif">No se ha podido iniciar RUMBO. Usa una versión actualizada de Google Chrome.<br><small>' + String(e && e.message || e) + '</small></div>';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
  // Service worker (PWA): solo con HTTPS o localhost.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})(typeof self !== 'undefined' ? self : this);

