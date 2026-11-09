/*
 * RUMBO — Validador de niveles (puro).
 *
 * validarNivel(nivel) → { ok, errores: [texto, ...] }
 *
 * Un nivel solo es válido si su SOLUCIÓN DE REFERENCIA lo supera y, en Primaria,
 * consigue las tres estrellas. Así ningún nivel publicado es imposible.
 *
 * El currículo se declara en dos listas separadas:
 *   curriculo.oficial   → referencias a los decretos 196/2022 o 211/2022
 *   curriculo.extension → propuestas didácticas del juego (no oficiales)
 */
(function (root, factory) {
  var api;
  if (typeof module === 'object' && module.exports) {
    api = factory(require('./interprete.js'), require('./estrellas.js'));
    module.exports = api;
  } else {
    root.RumboValidador = factory(root.RumboInterprete, root.RumboEstrellas);
  }
})(typeof self !== 'undefined' ? self : this, function (I, E) {
  'use strict';

  var ETAPAS = ['infantil', 'primaria-1c', 'primaria-2c', 'primaria-3c'];
  var DECRETOS = ['196/2022', '211/2022'];

  function esEntero(v) { return typeof v === 'number' && v === Math.floor(v); }
  function esTexto(v) { return typeof v === 'string' && v.trim().length > 0; }

  function validarNivel(nivel) {
    var errores = [];
    function error(t) { errores.push(t); }

    if (!nivel || typeof nivel !== 'object') return { ok: false, errores: ['el nivel no es un objeto'] };

    if (typeof nivel.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,40}$/.test(nivel.id)) {
      error('id no válido (minúsculas, números y guiones, de 3 a 41 caracteres)');
    }
    if (ETAPAS.indexOf(nivel.etapa) < 0) error('etapa no válida: ' + nivel.etapa);

    // ---- mapa ----
    var mapaOk = false;
    if (!Array.isArray(nivel.mapa) || nivel.mapa.length === 0 || nivel.mapa.some(function (f) { return typeof f !== 'string'; })) {
      error('mapa debe ser una lista de cadenas');
    } else {
      var ancho = nivel.mapa[0].length;
      var metas = 0;
      mapaOk = ancho > 0;
      nivel.mapa.forEach(function (fila, y) {
        if (fila.length !== ancho) { error('la fila ' + y + ' del mapa tiene longitud distinta'); mapaOk = false; }
        for (var x = 0; x < fila.length; x++) {
          var c = fila.charAt(x);
          if (I.CELDAS.indexOf(c) < 0) { error('carácter de mapa no válido "' + c + '" en (' + x + ',' + y + ')'); mapaOk = false; }
          if (c === 'G') metas++;
        }
      });
      if (metas !== 1) { error('el mapa debe tener exactamente una meta (G), tiene ' + metas); mapaOk = false; }
    }

    // ---- inicio ----
    var inicioOk = false;
    var ini = nivel.inicio;
    if (!ini || !esEntero(ini.x) || !esEntero(ini.y) || I.DIRS.indexOf(ini.dir) < 0) {
      error('inicio debe tener x, y enteros y dir N/E/S/O');
    } else if (mapaOk) {
      var fila0 = nivel.mapa[ini.y];
      if (fila0 === undefined || ini.x < 0 || ini.x >= fila0.length) {
        error('la posición de inicio está fuera del mapa');
      } else if ('#~bd'.indexOf(fila0.charAt(ini.x)) >= 0) {
        error('Lumo no puede empezar en una pared, agua, barrera o puerta');
      } else {
        inicioOk = true;
      }
    }

    // ---- tarjetas ----
    var disponibles = null;
    if (!nivel.cartas || !Array.isArray(nivel.cartas.disponibles) || nivel.cartas.disponibles.length === 0) {
      error('cartas.disponibles debe ser una lista no vacía');
    } else {
      disponibles = nivel.cartas.disponibles;
      var vistas = {};
      disponibles.forEach(function (t) {
        if (I.TARJETAS.indexOf(t) < 0) error('tarjeta desconocida: ' + t);
        if (vistas[t]) error('tarjeta repetida en disponibles: ' + t);
        vistas[t] = true;
      });
      var lim = nivel.cartas.limites;
      if (lim !== undefined) {
        Object.keys(lim).forEach(function (t) {
          if (disponibles.indexOf(t) < 0) error('limite para una tarjeta no disponible: ' + t);
          if (!esEntero(lim[t]) || lim[t] < 1) error('limite no válido para ' + t);
        });
      }
    }

    // ---- solución de referencia ----
    if (!nivel.referencia) {
      error('falta la solución de referencia');
    } else if (mapaOk && inicioOk) {
      var res = I.ejecutar(nivel, nivel.referencia);
      if (!res.ok) {
        error('la solución de referencia no supera el nivel (' + res.motivo + ')');
      }
      if (disponibles) {
        var porTipo = I.contarPorTipo(nivel.referencia);
        Object.keys(porTipo).forEach(function (t) {
          if (disponibles.indexOf(t) < 0) error('la referencia usa una tarjeta no disponible: ' + t);
          var lim2 = nivel.cartas && nivel.cartas.limites;
          if (lim2 && lim2[t] !== undefined && porTipo[t] > lim2[t]) {
            error('la referencia supera el límite de ' + t);
          }
        });
      }
      if (nivel.etapa !== 'infantil' && res.ok) {
        var e = nivel.estrellas;
        if (!e || !esEntero(e.s2max) || e.s2max < 1 || !e.s3) {
          error('en Primaria hay que definir estrellas.s2max y estrellas.s3');
        } else if (E.calcularEstrellas(nivel, nivel.referencia, res) !== 3) {
          error('la solución de referencia no consigue las tres estrellas');
        }
      }
    }

    // ---- programa inicial (niveles de depuración u optimización) ----
    if (nivel.programaInicial !== undefined) {
      var pi = nivel.programaInicial;
      var piOk = Array.isArray(pi) || (pi && typeof pi === 'object' && Array.isArray(pi.principal));
      if (!piOk) {
        error('programaInicial no tiene un formato válido');
      } else if (mapaOk && inicioOk) {
        var tipos = I.contarPorTipo(pi);
        Object.keys(tipos).forEach(function (t) {
          if (disponibles && disponibles.indexOf(t) < 0) error('programaInicial usa una tarjeta no disponible: ' + t);
        });
        var rp = I.ejecutar(nivel, pi);
        if (nivel.tipo === 'optimizar') {
          if (!rp.ok) error('en un nivel de optimización el programa inicial debe funcionar');
        } else if (rp.ok) {
          error('el programa inicial ya resuelve el nivel: no hay nada que depurar');
        }
      }
    }

    // ---- pistas ----
    if (nivel.etapa !== 'infantil') {
      if (!Array.isArray(nivel.pistas) || nivel.pistas.length !== 3 || !nivel.pistas.every(esTexto)) {
        error('en Primaria hacen falta exactamente 3 pistas con texto');
      }
    } else if (nivel.pistas !== undefined && !Array.isArray(nivel.pistas)) {
      error('pistas debe ser una lista');
    }

    // ---- currículo ----
    var cur = nivel.curriculo;
    if (!cur || !Array.isArray(cur.oficial) || !Array.isArray(cur.extension)) {
      error('curriculo debe tener las listas "oficial" y "extension"');
    } else {
      if (cur.oficial.length === 0 && cur.extension.length === 0) {
        error('el nivel debe declarar al menos un aprendizaje (oficial o extensión)');
      }
      cur.oficial.forEach(function (o, i) {
        if (!o || DECRETOS.indexOf(o.decreto) < 0) error('curriculo.oficial[' + i + '].decreto debe ser 196/2022 o 211/2022');
        if (!o || !esTexto(o.area)) error('curriculo.oficial[' + i + '].area es obligatoria');
        if (!o || !esTexto(o.criterio)) error('curriculo.oficial[' + i + '].criterio es obligatorio');
      });
      cur.extension.forEach(function (t, i) {
        if (!esTexto(t)) error('curriculo.extension[' + i + '] debe ser texto');
      });
    }

    return { ok: errores.length === 0, errores: errores };
  }

  return { validarNivel: validarNivel, ETAPAS: ETAPAS };
});
