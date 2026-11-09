/*
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
